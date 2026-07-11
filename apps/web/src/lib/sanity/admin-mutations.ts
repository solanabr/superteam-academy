import "server-only";
import { createClient } from "next-sanity";
import { env } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";
import type { SanityDoc } from "@/lib/content-sync/types";
import { MANAGED_TYPES } from "@/lib/content-sync/types";

const sanityAdmin = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  token: serverEnv.SANITY_ADMIN_TOKEN,
  useCdn: false,
  apiVersion: "2024-01-01",
});

/** The shared server-only write client (spec §10.4 — one SANITY_ADMIN_TOKEN
 *  client, held only by the sync job and admin-mutations). */
export function getSanityAdminClient(): typeof sanityAdmin {
  return sanityAdmin;
}

// ---------------------------------------------------------------------------
// CS-9 content sync — batched managed-doc read/write/delete + asset upload.
// The gateway (lib/content-sync/gateway.ts) is the only caller; each function is
// a thin wrapper over the shared write client so the orchestrator's guards are
// unit-tested against an in-memory double, never a live Sanity.
// ---------------------------------------------------------------------------

/**
 * Read every managed document (with onChainStatus + sync marker) for the sync.
 * Pinned to the `published` perspective: with a token and no perspective the
 * client reads raw, returning `drafts.*` documents too. Those would inflate the
 * blast-radius denominator and — since a draft `_id` (`drafts.course-x`) is
 * absent from the projected tree — be pruned on every sync, silently deleting an
 * editor's in-progress draft. Published-only keeps the sync operating solely on
 * the published dataset it owns.
 */
export async function readManagedDocuments(): Promise<SanityDoc[]> {
  const query = `*[_type in $types]{ ..., onChainStatus, sync }`;
  return sanityAdmin.fetch<SanityDoc[]>(
    query,
    { types: [...MANAGED_TYPES] },
    { perspective: "published" }
  );
}

/**
 * createOrReplace a batch of documents in one transaction. Committed with
 * `visibility:"sync"` so the write is query-visible before the call resolves —
 * the sync's downstream steps (and any re-sync) get read-your-writes and never
 * race an async-propagating write.
 */
export async function writeDocuments(docs: SanityDoc[]): Promise<void> {
  if (docs.length === 0) return;
  let tx = sanityAdmin.transaction();
  for (const doc of docs) {
    tx = tx.createOrReplace(doc as unknown as { _id: string; _type: string });
  }
  await tx.commit({ visibility: "sync" });
}

/** Delete a batch of documents by id in one transaction (post-prune). */
export async function deleteDocuments(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  let tx = sanityAdmin.transaction();
  for (const id of ids) tx = tx.delete(id);
  await tx.commit({ visibility: "sync" });
}

/** Write the contentSync singleton LAST (spec §9.4 — never matches the prune). */
export async function writeContentSyncSingleton(
  sha: string,
  counts: Record<string, number>
): Promise<void> {
  await sanityAdmin.createOrReplace({
    _id: "contentSync",
    _type: "contentSync",
    sha,
    syncedAt: new Date().toISOString(),
    counts,
  });
}

/** Read the contentSync singleton's sha (the last-synced commit), or null. */
export async function readContentSyncSingleton(): Promise<{
  sha: string;
} | null> {
  const found = await sanityAdmin.fetch<{ sha?: string } | null>(
    `*[_id == "contentSync"][0]{ sha }`
  );
  return found?.sha ? { sha: found.sha } : null;
}

/** True if an image asset with this content-derived id already exists (§9.6). */
export async function assetExists(assetId: string): Promise<boolean> {
  const found = await sanityAdmin.fetch<string | null>(`*[_id == $id][0]._id`, {
    id: assetId,
  });
  return found !== null;
}

/** Upload image bytes; returns the asset _id (content-derived, so idempotent). */
export async function uploadImageAsset(
  bytes: Uint8Array,
  filename: string
): Promise<string> {
  const asset = await sanityAdmin.assets.upload("image", Buffer.from(bytes), {
    filename,
  });
  return asset._id;
}

/**
 * SP2-B Task 6: the four on-chain status writers moved to the Supabase write
 * seam (`@/lib/content/deployment-writes`) — they now upsert the
 * `onchain_deployments` table instead of patching Sanity's frozen
 * `onChainStatus` overlay. Their SIGNATURES are unchanged, and they are
 * re-exported here so `@/lib/sanity/admin-mutations` importers (the sync +
 * deactivate/reactivate + achievements routes) stay valid. SP2-C repoints those
 * imports at `@/lib/content/deployment-writes` and deletes this re-export.
 */
export {
  writeCourseOnChainStatus,
  writeCourseActive,
  writeCourseTrackCollection,
  writeAchievementOnChainStatus,
} from "@/lib/content/deployment-writes";
