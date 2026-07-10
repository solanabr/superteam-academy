import { gunzipSync } from "node:zlib";
import type { RepoTree } from "./types";

/** Repo path prefix that is excluded from sync (spec §4.1, §12). */
const EXCLUDED = "courses/_template/";

function parseOctal(bytes: Uint8Array): number {
  const s = new TextDecoder().decode(bytes).replace(/\0.*$/, "").trim();
  return s === "" ? 0 : parseInt(s, 8);
}

/**
 * Gunzip + untar a GitHub tarball into a repo-relative path → bytes map.
 * GitHub wraps every entry under one generated dir (`owner-repo-<sha>/`); we
 * strip the first path segment so keys match the repo layout. Directory entries
 * (typeflag '5', trailing slash) and `courses/_template/**` are dropped.
 */
export async function extractTarball(gzipped: Uint8Array): Promise<RepoTree> {
  const buf = new Uint8Array(gunzipSync(Buffer.from(gzipped)));
  const tree: RepoTree = new Map();
  let offset = 0;
  while (offset + 512 <= buf.length) {
    const header = buf.subarray(offset, offset + 512);
    // Two consecutive zero blocks terminate the archive.
    if (header.every((b) => b === 0)) break;

    const rawName = new TextDecoder()
      .decode(header.subarray(0, 100))
      .replace(/\0.*$/, "");
    const size = parseOctal(header.subarray(124, 136));
    const typeflag = String.fromCharCode(header[156] || 0);
    offset += 512;

    const dataLen = Math.ceil(size / 512) * 512;
    const data = buf.subarray(offset, offset + size);
    offset += dataLen;

    if (typeflag !== "0" && typeflag !== "\0") continue; // only regular files
    if (rawName.endsWith("/")) continue;

    // Strip the generated top-level directory (`owner-repo-<sha>/`).
    const slash = rawName.indexOf("/");
    if (slash === -1) continue;
    const relPath = rawName.slice(slash + 1);
    if (relPath === "" || relPath.startsWith(EXCLUDED)) continue;

    tree.set(relPath, new Uint8Array(data));
  }
  return tree;
}
