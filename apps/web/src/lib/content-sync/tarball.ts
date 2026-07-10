import { gunzipSync } from "node:zlib";
import type { RepoTree } from "./types";

/** Repo path prefix that is excluded from sync (spec §4.1, §12). */
const EXCLUDED = "courses/_template/";

/**
 * Decompression bounds against a malicious/corrupt tarball (a gzip bomb inflates
 * to gigabytes; a pathological archive packs millions of tiny headers). The
 * courses-academy repo is text + optimised images — well under these — so the
 * caps only ever fire on abuse. Both are overridable for tests.
 */
const DEFAULT_MAX_DECOMPRESSED_BYTES = 128 * 1024 * 1024; // 128 MiB
const DEFAULT_MAX_ENTRIES = 20_000;

export interface ExtractOpts {
  /** Max bytes the gunzip may inflate to before aborting. */
  maxDecompressedBytes?: number;
  /** Max number of tar entries (headers) processed before aborting. */
  maxEntries?: number;
}

/** Raised when a tarball breaches a decompression bound (§ defensive extraction). */
export class TarballTooLargeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TarballTooLargeError";
  }
}

function decodeStr(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes).replace(/\0.*$/, "");
}

function parseOctal(bytes: Uint8Array): number {
  const s = decodeStr(bytes).trim();
  return s === "" ? 0 : parseInt(s, 8);
}

/**
 * Read the `path=` override from a pax extended header's records. Records are
 * `"<len> <key>=<value>\n"`; git archive emits one for a path that cannot be
 * split across the ustar name/prefix fields.
 */
function parsePaxPath(data: Uint8Array): string | null {
  const m = /\d+ path=([^\n]*)\n/.exec(new TextDecoder().decode(data));
  return m ? m[1]! : null;
}

/**
 * Gunzip + untar a GitHub tarball into a repo-relative path → bytes map.
 * GitHub wraps every entry under one generated dir (`owner-repo-<sha>/`); we
 * strip the first path segment so keys match the repo layout. Directory entries
 * (typeflag '5', trailing slash) and `courses/_template/**` are dropped.
 *
 * Long paths (repo paths routinely exceed the 100-byte tar `name` field once the
 * generated top dir is prepended) are reconstructed from the ustar `prefix`
 * field (offset 345) and from pax extended headers ('x' typeflag) — the two
 * mechanisms `git archive` uses. Ignoring them would silently drop deep files.
 */
export async function extractTarball(
  gzipped: Uint8Array,
  opts: ExtractOpts = {}
): Promise<RepoTree> {
  const maxBytes = opts.maxDecompressedBytes ?? DEFAULT_MAX_DECOMPRESSED_BYTES;
  const maxEntries = opts.maxEntries ?? DEFAULT_MAX_ENTRIES;

  let inflated: Buffer;
  try {
    inflated = gunzipSync(Buffer.from(gzipped), { maxOutputLength: maxBytes });
  } catch (e) {
    // zlib throws (ERR_BUFFER_TOO_LARGE) once the output would exceed
    // maxOutputLength; a corrupt stream throws here too. Fail with a clear error.
    throw new TarballTooLargeError(
      `content tarball could not be decompressed within the ${maxBytes}-byte cap: ${
        e instanceof Error ? e.message : String(e)
      }`
    );
  }
  const buf = new Uint8Array(inflated);
  const tree: RepoTree = new Map();
  let offset = 0;
  let entries = 0;
  let paxPath: string | null = null; // path override from a preceding 'x' header
  while (offset + 512 <= buf.length) {
    const header = buf.subarray(offset, offset + 512);
    // Two consecutive zero blocks terminate the archive.
    if (header.every((b) => b === 0)) break;

    if (++entries > maxEntries) {
      throw new TarballTooLargeError(
        `content tarball exceeds the ${maxEntries}-entry cap`
      );
    }

    const name = decodeStr(header.subarray(0, 100));
    const size = parseOctal(header.subarray(124, 136));
    const typeflag = String.fromCharCode(header[156] || 0);
    const prefix = decodeStr(header.subarray(345, 500));
    offset += 512;

    const dataLen = Math.ceil(size / 512) * 512;
    const data = buf.subarray(offset, offset + size);
    offset += dataLen;

    // pax extended header — its records carry `path=` for the NEXT entry.
    if (typeflag === "x" || typeflag === "g") {
      const p = parsePaxPath(data);
      if (typeflag === "x" && p) paxPath = p;
      continue;
    }

    if (typeflag !== "0" && typeflag !== "\0") {
      paxPath = null;
      continue; // only regular files
    }

    const fullName = paxPath ?? (prefix ? `${prefix}/${name}` : name);
    paxPath = null;

    if (fullName.endsWith("/")) continue;

    // Strip the generated top-level directory (`owner-repo-<sha>/`).
    const slash = fullName.indexOf("/");
    if (slash === -1) continue;
    const relPath = fullName.slice(slash + 1);
    if (relPath === "" || relPath.startsWith(EXCLUDED)) continue;

    tree.set(relPath, new Uint8Array(data));
  }
  return tree;
}
