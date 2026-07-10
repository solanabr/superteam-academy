import { imageSize } from "image-size";
import { revalidateTag } from "next/cache";
import type { GitHubClient } from "./github";
import type { SanityGateway } from "./gateway";
import type { GraderSet } from "./executor-gate";
import type { SanityDoc, SyncResult } from "./types";
import { MANAGED_TYPES } from "./types";
import { extractTarball } from "./tarball";
import { parseAndValidateTree } from "./validate";
import { projectContent, type AssetUpload } from "./projector";
import { reattachPreserved } from "./preserve";
import { selectChangedDocs, selectPrunable, assertBlastRadius } from "./prune";
import { assertCommitSyncable } from "./drift";
import { computeAssetId, cdnUrl } from "./assets";
import { COURSES_CACHE_TAG } from "@/lib/sanity/queries";

export interface SyncDeps {
  sha: string;
  github: GitHubClient;
  gateway: SanityGateway;
  graders: GraderSet;
  projectId: string;
  dataset: string;
}

/** Probe the real image dimensions. Sanity computes width/height on upload and
 *  bakes them into the asset _id, so `computeAssetId` and `cdnUrl` must use the
 *  same values — otherwise `assetExists` never matches (every sync re-uploads)
 *  and the rewritten markdown points at a URL Sanity does not serve. */
function probeDims(bytes: Uint8Array): { width: number; height: number } {
  const { width, height } = imageSize(bytes);
  if (!width || !height) {
    throw new Error("could not probe image dimensions");
  }
  return { width, height };
}
function formatOf(path: string): string {
  const m = /\.(\w+)$/.exec(path);
  return (m?.[1] ?? "png").toLowerCase();
}

/** Upload new assets (skip existing by content-derived id) and return a
 *  repo-path → CDN-url map for the markdown rewrite. */
async function syncAssets(
  assets: AssetUpload[],
  deps: SyncDeps
): Promise<{ urlByPath: Map<string, string>; uploaded: number }> {
  const urlByPath = new Map<string, string>();
  let uploaded = 0;
  for (const a of assets) {
    const id = computeAssetId(a.bytes, probeDims(a.bytes), formatOf(a.path));
    if (!(await deps.gateway.assetExists(id))) {
      await deps.gateway.uploadAsset(
        a.bytes,
        a.path.split("/").pop() ?? "asset"
      );
      uploaded += 1;
    }
    urlByPath.set(a.path, cdnUrl(id, deps.projectId, deps.dataset));
  }
  return { urlByPath, uploaded };
}

/**
 * The repo → Sanity content sync (§9.2). Every guard is applied in order; a
 * partial write can never trigger a prune, a red-CI commit is refused, and a
 * same-sha re-run is a no-op.
 */
export async function runContentSync(deps: SyncDeps): Promise<SyncResult> {
  // 1. Refuse a red / unfinished commit (§11.1 blocked).
  const checks = await deps.github.fetchChecksState(deps.sha);
  assertCommitSyncable(checks, deps.sha);

  // 2. Fetch + extract the tree at the SHA.
  const tree = await extractTarball(await deps.github.fetchTarball(deps.sha));

  // 3. Authoritative re-validation (Zod + executor gate).
  const validated = await parseAndValidateTree(tree, deps.graders);

  // 4. Assets: upload new, resolve CDN urls for the markdown rewrite.
  const { urlByPath, uploaded } = await syncAssets(
    [...validated.assets.entries()].map(([path, bytes]) => ({ path, bytes })),
    deps
  );

  // 5. Project (resolving prose/code/idl + rewriting image paths via the map).
  const resolveTests = (dir: string, rel: string): unknown[] => {
    const raw = tree.get(`${dir}/${rel}`);
    return raw ? (JSON.parse(new TextDecoder().decode(raw)) as unknown[]) : [];
  };
  // resolveAsset returns the plain CDN url string (an `AssetResolver`) — the
  // markdown rewrite needs a url, not a Sanity image reference. syncAssets already
  // ran the async pipeline per asset (computeAssetId → assetExists/upload → cdnUrl)
  // into urlByPath, so this stays a synchronous lookup (rewriteMarkdownAssetPaths
  // runs inside String.replace and can't await). The content-derived id yields the
  // same url whether the asset already existed or was just uploaded.
  const resolveAsset = (repoPath: string): string | null =>
    urlByPath.get(repoPath) ?? null;
  const { docs: projected } = projectContent(
    validated,
    deps.sha,
    resolveAsset,
    resolveTests
  );

  // 6. Reattach PRESERVE from existing docs.
  const existing = await deps.gateway.readManaged();
  const existingById = new Map(existing.map((d) => [d._id, d]));
  const merged = projected.map((p) =>
    reattachPreserved(p, existingById.get(p._id))
  );

  // 7. Idempotent change set.
  const changed = selectChangedDocs(existing, merged);

  // 8. Write everything first, then verify the count (§9.4 guard 3).
  await deps.gateway.writeDocs(changed);
  const afterWrite = await deps.gateway.readManaged();
  const managed = (d: SanityDoc): boolean =>
    (MANAGED_TYPES as readonly string[]).includes(d._type);
  const managedNow = afterWrite.filter(managed);
  const projectedManaged = merged.filter(managed);
  if (managedNow.length < projectedManaged.length) {
    throw new Error(
      `write-verify failed: ${managedNow.length} managed docs present, expected >= ${projectedManaged.length}`
    );
  }

  // 9. Prune stale docs — marker-scoped, blast-radius guarded (§9.4).
  const prunable = selectPrunable(afterWrite, deps.sha);
  assertBlastRadius(prunable.length, afterWrite.length);
  await deps.gateway.deleteDocs(prunable.map((d) => d._id));

  // 10. Write the contentSync singleton LAST (never matches the prune query).
  const counts = countByType(projectedManaged);
  await deps.gateway.writeSingleton(deps.sha, counts);

  // 11. Purge the catalog cache.
  revalidateTag(COURSES_CACHE_TAG);

  return {
    sha: deps.sha,
    written: changed.length,
    skipped: merged.length - changed.length,
    pruned: prunable.length,
    assetsUploaded: uploaded,
    pendingChainDeltas: [], // computed by the chain-sync path (§11.2), reported in the drift route
  };
}

function countByType(docs: SanityDoc[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const d of docs) out[d._type] = (out[d._type] ?? 0) + 1;
  return out;
}
