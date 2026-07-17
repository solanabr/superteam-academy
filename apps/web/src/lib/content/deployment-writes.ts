import "server-only";

import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";
import type { Database } from "@/lib/supabase/types";

/**
 * On-chain deployment WRITE seam (SP2-B Task 6).
 *
 * The four writer sites that used to patch a managed doc's frozen
 * `onChainStatus` overlay in Sanity now upsert the Supabase
 * `onchain_deployments` table (the read side lives in
 * {@link file://./deployments.ts}). These functions KEEP THEIR ORIGINAL
 * SIGNATURES so their call sites (courses/sync, achievements/sync,
 * courses/{deactivate,reactivate}) are untouched; SP2-C repointed those
 * imports here and deleted the `lib/sanity/admin-mutations.ts` re-export.
 *
 * All writes go through the service-role client (RLS-bypassing; the base table
 * has RLS on with no policies — service_role only, house pattern). Each upsert
 * is keyed on the `content_id` PK and sets ONLY the columns that writer owns —
 * matching the old `.patch().set()` merge semantics: an `ON CONFLICT DO UPDATE`
 * touches only the supplied columns, leaving the rest of the row intact.
 */

/**
 * The upsert payload: `content_id` + `kind` are always set (both NOT NULL on the
 * table); every other column is optional and set per-writer — so an
 * `ON CONFLICT DO UPDATE` touches only the columns that writer owns.
 */
type DeploymentUpsert = {
  content_id: string;
  kind: "course" | "achievement";
  status?: string | null;
  course_pda?: string | null;
  tx_signature?: string | null;
  collection_address?: string | null;
  track_collection_address?: string | null;
  achievement_pda?: string | null;
  is_active?: boolean | null;
  last_synced?: string | null;
  updated_at?: string | null;
  in_maintenance?: boolean;
};

/**
 * Service-role client typed for this seam (mirrors `lib/supabase/admin.ts`). The
 * `onchain_deployments` relation now lives in the generated `Database` type, so
 * the local schema augmentation and the `{ [K in keyof T]: T[K] }` index-
 * signature workaround are gone — the generated Row is an object-literal type
 * that `.upsert()`/`.select()` already accept (#438).
 */
function createServiceClient() {
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY
  );
}

/** Upsert the columns a single writer owns, keyed on the `content_id` PK. */
async function upsertDeployment(row: DeploymentUpsert): Promise<void> {
  const { error } = await createServiceClient()
    .from("onchain_deployments")
    .upsert(
      { ...row, updated_at: new Date().toISOString() },
      { onConflict: "content_id" }
    );
  if (error) {
    throw new Error(
      `onchain_deployments upsert failed for ${row.content_id}: ${error.message}`
    );
  }
}

/**
 * F1(a) — the ONLY reachable recovery path for a maintenance gate stuck open
 * by a failed/interrupted recreate (`lib/admin/recreate-course.ts`). A course
 * that is `synced` is, by definition, not mid-recreate — the Course PDA
 * exists and is correct — so every write that marks a course `synced` also
 * clears `in_maintenance` in the SAME upsert. This makes re-running the
 * ordinary Deploy/sync path on a stuck `not_deployed` course the documented
 * recovery: once the deploy lands and this function is called with
 * `"synced"`, the gate comes off even if `recreateCourse`'s own clear was
 * skipped by an earlier throw.
 */
export async function writeCourseOnChainStatus(
  contentId: string,
  status: string,
  coursePda: string,
  txSignature: string
): Promise<void> {
  await upsertDeployment({
    content_id: contentId,
    kind: "course",
    status,
    course_pda: coursePda,
    tx_signature: txSignature,
    last_synced: new Date().toISOString(),
    ...(status === "synced" ? { in_maintenance: false } : {}),
  });
}

/**
 * Mirror a course's on-chain `is_active` flag into Supabase so the public
 * catalog can hide a deactivated course (issue #321). The catalog gate reads
 * `is_active`; the on-chain tx alone doesn't touch the deployment row, so the
 * deactivate/reactivate routes call this after the tx succeeds.
 */
export async function writeCourseActive(
  contentId: string,
  isActive: boolean
): Promise<void> {
  await upsertDeployment({
    content_id: contentId,
    kind: "course",
    is_active: isActive,
  });
}

/**
 * Set/clear the per-course maintenance gate (WS-2 #453 rail 3). On-chain
 * write paths for this course (`isCourseInMaintenance`,
 * `lib/content/deployments.ts`) refuse/queue rather than racing the window
 * where the Course PDA briefly does not exist while `in_maintenance` is true.
 *
 * `recreateCourse` (`lib/admin/recreate-course.ts`) only ever calls this with
 * `false` — the CLEAR half. The SET/acquire half is
 * {@link acquireCourseMaintenanceGate}: an unconditional overwrite here would
 * defeat that function's mutual exclusion (F2), since turning the gate ON
 * must be a conditional acquire, not a last-writer-wins upsert, or a second
 * concurrent recreate could silently re-open a window the first recreate is
 * still relying on. Clearing has no such hazard — by the time either caller
 * reaches a clear, ordering already guarantees it is the gate's own acquirer
 * (see the call sites in `recreateCourse`), and clearing an already-clear gate
 * is a no-op. The `boolean` parameter (rather than a `false` literal) is kept
 * so this remains usable as a general manual override (e.g. an operator
 * script) independent of the acquire/release protocol.
 */
export async function writeCourseMaintenanceFlag(
  contentId: string,
  inMaintenance: boolean
): Promise<void> {
  await upsertDeployment({
    content_id: contentId,
    kind: "course",
    in_maintenance: inMaintenance,
  });
}

/**
 * Conditionally ACQUIRE the per-course maintenance gate (F2 — mutual
 * exclusion). Returns `true` iff THIS call flipped the gate from
 * unset/`false` to `true`; `false` means another recreate already holds it.
 * Never silently overwrites an existing lock — that is what makes this an
 * acquire rather than a last-writer-wins `SET`.
 *
 * Two steps because the row keyed on `content_id` may not exist yet (a
 * course whose deploy predates this gate, or one never mirrored into
 * `onchain_deployments`):
 *
 *   1. Try to flip an EXISTING, unlocked row:
 *      `UPDATE ... SET in_maintenance = true WHERE content_id = ? AND
 *      in_maintenance = false`. If this touches a row, we hold the gate.
 *   2. Zero rows touched means either "no row yet" or "row exists and is
 *      already locked" — a plain `INSERT` distinguishes them: it fails on
 *      the `content_id` primary-key conflict if a row already exists (locked
 *      or not — either way we did NOT acquire it), and succeeds (meaning we
 *      just created the row, gate held) if none existed. A unique-violation
 *      (`23505`) therefore maps to `false`, not a thrown error; any OTHER
 *      Postgres error still throws, matching this module's other writers.
 *
 * Both steps are individually atomic in Postgres, so two concurrent callers
 * can never both observe "acquired" for the same course.
 */
export async function acquireCourseMaintenanceGate(
  courseId: string
): Promise<boolean> {
  const client = createServiceClient();
  const nowIso = new Date().toISOString();

  const { data: flipped, error: updateErr } = await client
    .from("onchain_deployments")
    .update({ in_maintenance: true, updated_at: nowIso })
    .eq("content_id", courseId)
    .eq("in_maintenance", false)
    .select("content_id");
  if (updateErr) {
    throw new Error(
      `maintenance gate acquire (update) failed for ${courseId}: ${updateErr.message}`
    );
  }
  if (flipped && flipped.length > 0) {
    return true;
  }

  const { error: insertErr } = await client.from("onchain_deployments").insert({
    content_id: courseId,
    kind: "course",
    in_maintenance: true,
    updated_at: nowIso,
  });
  if (!insertErr) {
    return true;
  }
  if (insertErr.code === "23505") {
    // PK conflict — a concurrent acquirer (or an already-locked existing row)
    // won the race between our UPDATE and this INSERT. Not our lock.
    return false;
  }
  throw new Error(
    `maintenance gate acquire (insert) failed for ${courseId}: ${insertErr.message}`
  );
}

export async function writeCourseTrackCollection(
  contentId: string,
  trackCollectionAddress: string
): Promise<void> {
  await upsertDeployment({
    content_id: contentId,
    kind: "course",
    track_collection_address: trackCollectionAddress,
  });
}

export async function writeAchievementOnChainStatus(
  contentId: string,
  achievementPda: string,
  collectionAddress: string
): Promise<void> {
  await upsertDeployment({
    content_id: contentId,
    kind: "achievement",
    status: "synced",
    achievement_pda: achievementPda,
    collection_address: collectionAddress,
    last_synced: new Date().toISOString(),
  });
}
