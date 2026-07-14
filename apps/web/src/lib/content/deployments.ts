import "server-only";

import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { env } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";
import { COURSES_CACHE_TAG } from "@/lib/content/queries";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";

/**
 * On-chain deployment read seam (SP2-B Task 3).
 *
 * The frozen `onChainStatus` overlay that used to live on Sanity docs now lives
 * in the Supabase `onchain_deployments` table, keyed by content id
 * (`course-*` / `achievement-*`). This module is the ONE place that reads it:
 *
 *  - Public / catalog / lesson reads go through {@link getActiveDeployments} — a
 *    cookieless anon client against the minimal `public_onchain_deployments`
 *    view, wrapped in `unstable_cache` so catalog + lesson routes stay static/ISR
 *    (a `cookies()`-bound client would force them dynamic). Cache is tagged
 *    `"courses"` and revalidated hourly; a course sync purges it via
 *    `revalidateTag(COURSES_CACHE_TAG)`.
 *  - Reward-path + admin reads that need the full row (e.g.
 *    `track_collection_address`) go through {@link getDeploymentById} — the
 *    service-role admin client, uncached, server-only routes only.
 *
 * {@link isSynced} is the entire public-visibility gate, in one place.
 */

/** The gate-relevant columns exposed by the `public_onchain_deployments` view. */
export interface DeploymentStatus {
  content_id: string;
  kind: "course" | "achievement";
  status: string | null;
  is_active: boolean | null;
  achievement_pda: string | null;
}

/** The full `onchain_deployments` row (service-role only). */
export interface OnchainDeploymentRow {
  content_id: string;
  kind: "course" | "achievement";
  status: string | null;
  course_pda: string | null;
  tx_signature: string | null;
  collection_address: string | null;
  track_collection_address: string | null;
  achievement_pda: string | null;
  is_active: boolean | null;
  last_synced: string | null;
  updated_at: string | null;
}

const VIEW_COLUMNS = "content_id, kind, status, is_active, achievement_pda";

/**
 * Minimal Supabase schema for this seam. The generated `Database` type does not
 * yet carry `onchain_deployments` / `public_onchain_deployments` (the SP2-B
 * migration adds them; the generated types regenerate in a follow-up), so we
 * pin exactly the two relations this module touches. Keeps the client fully
 * typed with zero `any` and self-documents the expected columns.
 */
interface DeploymentsSchema {
  public: {
    Tables: {
      onchain_deployments: {
        Row: OnchainDeploymentRow;
        Insert: OnchainDeploymentRow;
        Update: Partial<OnchainDeploymentRow>;
        Relationships: [];
      };
    };
    Views: {
      public_onchain_deployments: {
        Row: DeploymentStatus;
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

/**
 * Cookieless anon client. NOT `lib/supabase/server.ts` — that reads `cookies()`,
 * which would opt catalog/lesson pages out of static rendering. Sessions are
 * disabled: this is a pure read over a world-readable view.
 */
function createCookielessClient() {
  return createClient<DeploymentsSchema>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

/**
 * Service-role client typed for this seam. Mirrors `lib/supabase/admin.ts` but
 * carries {@link DeploymentsSchema} so `onchain_deployments` is typed until the
 * generated `Database` regenerates with the SP2-B migration's relations.
 */
function createServiceClient() {
  return createClient<DeploymentsSchema>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY
  );
}

/** Shape the flat rows into the content-id-keyed lookup the gate consumes. */
export function toDeploymentMap(
  rows: readonly DeploymentStatus[]
): ReadonlyMap<string, DeploymentStatus> {
  return new Map(rows.map((r) => [r.content_id, r]));
}

/**
 * The public-visibility gate, one place. A content id is visible iff its
 * deployment is `synced` AND active. `is_active` is coalesced to `true` so a
 * legacy row that predates the flag (or a null) stays visible — deactivation is
 * opt-in, matching the pre-flip `coalesce(onChainStatus.isActive, true)`.
 *
 * A missing deployment (`undefined`) is NOT synced: unknown content stays
 * hidden (fail-closed — hidden > leaked).
 */
export function isSynced(dep: DeploymentStatus | undefined): boolean {
  return dep?.status === "synced" && (dep?.is_active ?? true);
}

/**
 * Fetch the active deployment rows, cached. Wrapped in `unstable_cache` (tag
 * `"courses"`, 3600s) so catalog/lesson routes serve statically and an admin
 * sync purges the group via `revalidateTag`. We cache the plain row array (not
 * the Map — `unstable_cache` cannot round-trip a `Map`) and build the Map per
 * call; construction is O(n) over a handful of rows.
 *
 * Outage behaviour: a warm cache keeps serving the last-good rows. A cold
 * cache during an outage throws — nothing is written to the cache on a
 * throw, so the next request retries rather than getting stuck on a stale
 * failure. {@link getActiveDeployments} catches that throw and degrades to an
 * empty map ("nothing synced") so the catalog renders empty rather than
 * leaking unsynced content or 500ing.
 */
async function loadActiveDeploymentRows(): Promise<DeploymentStatus[]> {
  const client = createCookielessClient();
  const { data, error } = await client
    .from("public_onchain_deployments")
    .select(VIEW_COLUMNS);
  if (error) {
    throw new Error(`Failed to load onchain deployments: ${error.message}`);
  }
  return data ?? [];
}

/**
 * The `unstable_cache` wrapper, created lazily on first use. `COURSES_CACHE_TAG`
 * now lives in `@/lib/content/queries`, which value-imports this module — reading
 * the tag at module-eval time would touch it inside the import cycle before it is
 * initialized (TDZ). Deferring to first call sidesteps the cycle; `unstable_cache`
 * memoizes by key, so building the wrapper once is equivalent to a module const.
 */
let cachedFetch: (() => Promise<DeploymentStatus[]>) | null = null;

function fetchActiveDeploymentRows(): Promise<DeploymentStatus[]> {
  cachedFetch ??= unstable_cache(
    loadActiveDeploymentRows,
    ["onchain-deployments-active"],
    { tags: [COURSES_CACHE_TAG], revalidate: 3600 }
  );
  return cachedFetch();
}

/**
 * One query → one content-id-keyed `ReadonlyMap` of deployment status.
 *
 * Degrades to an empty map on a read failure (logged, not thrown) — see the
 * "Outage behaviour" note on {@link loadActiveDeploymentRows}. Every public
 * caller (`isSynced` gate) treats a missing entry as "not synced", so an
 * empty map is equivalent to "nothing is visible right now", not corrupt data.
 */
export async function getActiveDeployments(): Promise<
  ReadonlyMap<string, DeploymentStatus>
> {
  try {
    return toDeploymentMap(await fetchActiveDeploymentRows());
  } catch (err) {
    logError({
      errorId: ERROR_IDS.ACTIVE_DEPLOYMENTS_LOAD_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
      context: { note: "getActiveDeployments degraded to empty map" },
    });
    return new Map();
  }
}

/**
 * Full deployment row by content id, uncached, via the service-role client.
 * For reward paths + admin reads that need columns the public view withholds
 * (e.g. `track_collection_address`). Server-only routes only. `null` when no
 * row exists.
 */
export async function getDeploymentById(
  contentId: string
): Promise<OnchainDeploymentRow | null> {
  const client = createServiceClient();
  const { data, error } = await client
    .from("onchain_deployments")
    .select("*")
    .eq("content_id", contentId)
    .maybeSingle();
  if (error) {
    throw new Error(
      `Failed to load onchain deployment ${contentId}: ${error.message}`
    );
  }
  return data ?? null;
}

/**
 * Same as {@link getDeploymentById}, but never throws (#436) — a Supabase
 * outage degrades to `{ row: null, failed: true }` instead of propagating.
 * For display-only admin reads (the `/api/admin/status` route) where a DB
 * blip should surface as a distinct "can't tell" state rather than 500ing
 * the whole screen. Mutating routes (course/achievement sync) keep calling
 * {@link getDeploymentById} directly — fail-closed is correct before writing
 * on-chain.
 */
export async function getDeploymentByIdSafe(
  contentId: string
): Promise<{ row: OnchainDeploymentRow | null; failed: boolean }> {
  try {
    return { row: await getDeploymentById(contentId), failed: false };
  } catch (err) {
    logError({
      errorId: ERROR_IDS.DEPLOYMENT_READ_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
      context: { contentId, note: "getDeploymentByIdSafe degraded to null" },
    });
    return { row: null, failed: true };
  }
}
