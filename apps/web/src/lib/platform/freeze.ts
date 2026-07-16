import "server-only";

import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";

/**
 * GLOBAL deploy-window freeze (reset wave B2).
 *
 * A single-row platform-wide flag (`public.platform_freeze`, migration
 * `20260715120000_platform_freeze.sql`). When frozen, EVERY server-side on-chain
 * WRITE path refuses/queues instead of sending a tx:
 *
 *   - the login drainer (`lib/solana/onchain-queue.ts`) defers all Pass-2 cases;
 *   - `POST /api/lessons/complete` + `POST /api/certificates/mint` return 503;
 *   - the Helius webhook cascade (`lib/helius/event-handlers.ts`) queues the
 *     finalize / credential / achievement on-chain writes instead of sending;
 *   - the admin on-chain-mutation routes (courses/{sync,deactivate,reactivate},
 *     achievements/sync) return 503.
 *
 * SEPARATE from the per-course `onchain_deployments.in_maintenance` gate (#502),
 * which `recreateCourse` ACQUIRES per-course around each recreate — a pre-set
 * global value keyed by course would collide with that conditional acquire. The
 * reset operation itself (`lib/admin/recreate-course.ts` + the recreate routes)
 * is EXEMPT: it runs DURING the freeze and never reads this flag.
 *
 * FAIL-MODE — STALE-ON-ERROR (NOT hard fail-closed, NOT silent fail-open).
 * {@link isPlatformFrozen} caches the flag for a short TTL and, on a read error,
 * returns the LAST successfully-read value (never throws). Rationale: after the
 * v-next program deploys, writes to not-yet-reset (v1) courses fail at the
 * PROGRAM level, so this freeze is maintenance-window HYGIENE, not the sole
 * orphan guard. Hard fail-closed would freeze prod on any transient DB blip;
 * stale-on-error keeps a warm instance honoring the last known state. Cold-start
 * default (a read error before ANY successful read) is `false` (not frozen) —
 * the accepted tradeoff, since the program-level failure is the real guard.
 *
 * All access is server-only via the service-role client (the table has RLS on
 * with no policies — service_role only, matching the `onchain_deployments`
 * house pattern).
 */

/** The one true row's primary key (singleton table; see the migration). */
const FREEZE_ROW_ID = true;

/**
 * Cache TTL for {@link isPlatformFrozen}. Short so setting/clearing the freeze
 * propagates to every warm serverless instance within seconds, while collapsing
 * the per-request reads of a single drain/route into one DB hit.
 */
const CACHE_TTL_MS = 5_000;

interface PlatformFreezeRow {
  id: boolean;
  frozen: boolean;
  reason: string | null;
  updated_at: string | null;
}

type FreezeInsert = {
  id?: boolean;
  frozen: boolean;
  reason?: string | null;
  updated_at?: string | null;
};

/**
 * supabase-js's typed client requires each relation's `Row`/`Insert` to be
 * assignable to `Record<string, unknown>`. An `interface` is NOT (interfaces
 * carry no implicit index signature), which collapses the query builder's value
 * types to `never`. Re-mapping the interface through `{ [K in keyof T]: T[K] }`
 * yields an equivalent object-literal alias that IS index-signature compatible —
 * the same trick `lib/content/deployment-writes.ts` uses. Keeps zero `any`.
 */
type FreezeRowLiteral = {
  [K in keyof PlatformFreezeRow]: PlatformFreezeRow[K];
};

/**
 * Minimal Supabase schema for this seam. The generated `Database` type does not
 * carry `platform_freeze` (this migration adds it; types regenerate in a
 * follow-up), so — like the `onchain_deployments` seams — we pin exactly the one
 * relation this module touches. Keeps the client fully typed with zero `any`.
 */
interface FreezeSchema {
  public: {
    Tables: {
      platform_freeze: {
        Row: FreezeRowLiteral;
        Insert: FreezeInsert;
        Update: Partial<FreezeInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

/** Service-role client typed for this seam (mirrors `lib/supabase/admin.ts`). */
function createServiceClient() {
  return createClient<FreezeSchema>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY
  );
}

interface CacheEntry {
  value: boolean;
  expiresAt: number;
}

// Module-level, per-instance cache. `lastKnown` is the last SUCCESSFULLY-read
// value and is the fallback returned on a read error (stale-on-error). It starts
// `false` (not frozen) so a cold instance that errors before its first
// successful read defaults to open — see the fail-mode note above.
let cache: CacheEntry | null = null;
let lastKnown = false;

/** One raw read of the flag. Throws on a Supabase error (caller decides policy). */
async function readFreezeFlag(): Promise<boolean> {
  const { data, error } = await createServiceClient()
    .from("platform_freeze")
    .select("frozen")
    .eq("id", FREEZE_ROW_ID)
    .maybeSingle();
  if (error) {
    throw new Error(`platform_freeze read failed: ${error.message}`);
  }
  // No row (migration applied but unseeded) → not frozen.
  return data?.frozen === true;
}

/**
 * Is the platform globally frozen? Cached ({@link CACHE_TTL_MS}); on a read
 * error returns the LAST successfully-read value and never throws (stale-on-error
 * — see the module docstring). Every on-chain write path gates on this.
 */
export async function isPlatformFrozen(): Promise<boolean> {
  const now = Date.now();
  if (cache && now < cache.expiresAt) return cache.value;

  try {
    const value = await readFreezeFlag();
    lastKnown = value;
    cache = { value, expiresAt: now + CACHE_TTL_MS };
    return value;
  } catch (err) {
    logError({
      errorId: ERROR_IDS.PLATFORM_FREEZE_CHECK_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
      context: {
        note: `isPlatformFrozen stale-on-error → last-known=${lastKnown}`,
      },
    });
    // STALE-ON-ERROR: do NOT hard fail-closed (would freeze prod on a blip) and
    // do NOT silently fail-open — return the last confirmed value.
    return lastKnown;
  }
}

/**
 * Set or clear the global freeze (admin-only: called from `POST /api/admin/freeze`
 * and usable from an operator script). Writes the singleton row and refreshes
 * this instance's cache immediately; other instances converge within the TTL.
 */
export async function setPlatformFrozen(
  frozen: boolean,
  reason?: string
): Promise<void> {
  const { error } = await createServiceClient()
    .from("platform_freeze")
    .upsert(
      {
        id: FREEZE_ROW_ID,
        frozen,
        reason: reason ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
  if (error) {
    throw new Error(`platform_freeze write failed: ${error.message}`);
  }
  // Reflect immediately on the writing instance.
  lastKnown = frozen;
  cache = { value: frozen, expiresAt: Date.now() + CACHE_TTL_MS };
}

/** Full freeze state, uncached — for the admin control route's GET/response. */
export async function getPlatformFreezeState(): Promise<{
  frozen: boolean;
  reason: string | null;
  updatedAt: string | null;
}> {
  const { data, error } = await createServiceClient()
    .from("platform_freeze")
    .select("frozen, reason, updated_at")
    .eq("id", FREEZE_ROW_ID)
    .maybeSingle();
  if (error) {
    throw new Error(`platform_freeze read failed: ${error.message}`);
  }
  return {
    frozen: data?.frozen === true,
    reason: data?.reason ?? null,
    updatedAt: data?.updated_at ?? null,
  };
}

/**
 * Test-only: reset the module cache AND the last-known fallback to their
 * cold-start defaults. Called from `beforeEach` so cache/last-known never leak
 * across cases. Not part of the runtime contract.
 */
export function __resetPlatformFreezeCacheForTests(): void {
  cache = null;
  lastKnown = false;
}
