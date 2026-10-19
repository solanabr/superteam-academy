import { createHash, type Hash } from "node:crypto";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";
import { isExcludedContentPath } from "@superteam-lms/content-schema";
import type { RepoTree } from "@/lib/github/types";
import { IMAGE_PATH_RE, type ImageRef } from "./assets";

/**
 * Decompression bounds against a malicious or corrupt tarball. Images stream
 * through (hashed or measured) and are never kept, so two byte caps guard two
 * different things:
 *
 * - Retained bytes: the non-image files the compile holds in memory. 30 MB
 *   today (9 courses), and the compile peaks at roughly 12x what it retains.
 *   128 MiB is ~4x today, where a preview compile would peak near 1.6 GB:
 *   the cap trips before a 2 GB function runs out of memory.
 * - Streamed bytes: everything gunzip inflates, images included. This is the
 *   gzip-bomb guard. 140 MB today; 1 GiB is ~7x that and still bounds the
 *   inflate to a few seconds of CPU.
 *
 * The entry cap stops a pathological archive packed with millions of tiny
 * headers. All three are overridable for tests.
 */
const DEFAULT_MAX_RETAINED_BYTES = 128 * 1024 * 1024; // 128 MiB
const DEFAULT_MAX_STREAMED_BYTES = 1024 * 1024 * 1024; // 1 GiB
const DEFAULT_MAX_ENTRIES = 20_000;

export interface ExtractOpts {
  /** Max bytes of non-image files kept in memory. */
  maxRetainedBytes?: number;
  /** Max bytes gunzip may inflate in total, images included. */
  maxStreamedBytes?: number;
  /** Max number of tar entries (headers) processed before aborting. */
  maxEntries?: number;
  /** sha256 every image (the published compile). Off: size only (the preview). */
  hashImages?: boolean;
}

/** A repo snapshot as the compiler reads it: files with their bytes, images by reference only. */
export interface ContentTree {
  files: RepoTree;
  images: Map<string, ImageRef>;
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

/** Where the current entry's body goes. */
type Sink =
  | { kind: "skip" }
  | { kind: "pax"; global: boolean; data: Uint8Array; at: number }
  | { kind: "file"; path: string; data: Uint8Array; at: number }
  | { kind: "image"; path: string; size: number; hash: Hash | null };

/**
 * Stream-extract a GitHub tarball into a {@link ContentTree}, keyed by
 * repo-relative path. GitHub wraps every entry under one generated dir
 * (`owner-repo-<sha>/`); we strip the first path segment so keys match the repo
 * layout. Directory entries and every excluded path (`courses/_template/**`,
 * anything under a `_draft/` dir — see content-schema's `repo-paths.ts`) are
 * dropped.
 *
 * Image bytes are never held: each one is hashed chunk by chunk (or only
 * measured) and discarded, so memory scales with the text in the repo, not its
 * figures. Pass the response body stream to keep the gzipped download out of
 * memory too.
 *
 * Long paths (repo paths routinely exceed the 100-byte tar `name` field once the
 * generated top dir is prepended) are reconstructed from the ustar `prefix`
 * field (offset 345) and from pax extended headers ('x' typeflag) — the two
 * mechanisms `git archive` uses. Ignoring them would silently drop deep files.
 */
export async function extractTarball(
  source: Uint8Array | Readable,
  opts: ExtractOpts = {}
): Promise<ContentTree> {
  const maxRetained = opts.maxRetainedBytes ?? DEFAULT_MAX_RETAINED_BYTES;
  const maxStreamed = opts.maxStreamedBytes ?? DEFAULT_MAX_STREAMED_BYTES;
  const maxEntries = opts.maxEntries ?? DEFAULT_MAX_ENTRIES;

  const files: RepoTree = new Map();
  const images = new Map<string, ImageRef>();
  let streamed = 0;
  let retained = 0;
  let entries = 0;
  let paxPath: string | null = null; // path override from a preceding 'x' header
  let ended = false;

  const header = new Uint8Array(512);
  let headerFill = 0;
  let sink: Sink = { kind: "skip" };
  let bodyLeft = 0;
  let padLeft = 0;

  const retain = (size: number): void => {
    retained += size;
    if (retained > maxRetained) {
      throw new TarballTooLargeError(
        `content tarball keeps more than the ${maxRetained}-byte cap of non-image files`
      );
    }
  };

  const finishEntry = (): void => {
    if (sink.kind === "pax") {
      const p = parsePaxPath(sink.data);
      if (!sink.global && p) paxPath = p;
    } else if (sink.kind === "file") {
      files.set(sink.path, sink.data);
    } else if (sink.kind === "image") {
      images.set(sink.path, {
        size: sink.size,
        sha256: sink.hash ? sink.hash.digest("hex") : null,
      });
    }
    sink = { kind: "skip" };
  };

  const onHeader = (): void => {
    // A zero block terminates the archive.
    if (header.every((b) => b === 0)) {
      ended = true;
      return;
    }
    if (++entries > maxEntries) {
      throw new TarballTooLargeError(
        `content tarball exceeds the ${maxEntries}-entry cap`
      );
    }

    const name = decodeStr(header.subarray(0, 100));
    const size = parseOctal(header.subarray(124, 136));
    const typeflag = String.fromCharCode(header[156] || 0);
    const prefix = decodeStr(header.subarray(345, 500));
    if (!Number.isSafeInteger(size) || size < 0) {
      throw new Error(`content tarball has a corrupt header (size "${size}")`);
    }
    bodyLeft = size;
    padLeft = (512 - (size % 512)) % 512;
    sink = { kind: "skip" };

    if (typeflag === "x" || typeflag === "g") {
      // pax extended header — its records carry `path=` for the NEXT entry.
      retain(size);
      sink = {
        kind: "pax",
        global: typeflag === "g",
        data: new Uint8Array(size),
        at: 0,
      };
    } else if (typeflag !== "0" && typeflag !== "\0") {
      paxPath = null; // only regular files
    } else {
      const fullName = paxPath ?? (prefix ? `${prefix}/${name}` : name);
      paxPath = null;
      // Strip the generated top-level directory (`owner-repo-<sha>/`).
      const slash = fullName.indexOf("/");
      const relPath = slash === -1 ? "" : fullName.slice(slash + 1);
      if (
        relPath !== "" &&
        !relPath.endsWith("/") &&
        !isExcludedContentPath(relPath)
      ) {
        if (IMAGE_PATH_RE.test(relPath)) {
          sink = {
            kind: "image",
            path: relPath,
            size,
            hash: opts.hashImages ? createHash("sha256") : null,
          };
        } else {
          retain(size);
          sink = {
            kind: "file",
            path: relPath,
            data: new Uint8Array(size),
            at: 0,
          };
        }
      }
    }
    if (bodyLeft === 0) finishEntry();
  };

  const write = (chunk: Uint8Array): void => {
    let off = 0;
    while (off < chunk.length && !ended) {
      if (bodyLeft > 0) {
        const n = Math.min(bodyLeft, chunk.length - off);
        const part = chunk.subarray(off, off + n);
        if (sink.kind === "file" || sink.kind === "pax") {
          sink.data.set(part, sink.at);
          sink.at += n;
        } else if (sink.kind === "image") {
          sink.hash?.update(part);
        }
        off += n;
        bodyLeft -= n;
        if (bodyLeft === 0) finishEntry();
      } else if (padLeft > 0) {
        const n = Math.min(padLeft, chunk.length - off);
        off += n;
        padLeft -= n;
      } else {
        const n = Math.min(512 - headerFill, chunk.length - off);
        header.set(chunk.subarray(off, off + n), headerFill);
        headerFill += n;
        off += n;
        if (headerFill === 512) {
          headerFill = 0;
          onHeader();
        }
      }
    }
  };

  const input =
    source instanceof Uint8Array
      ? Readable.from([
          Buffer.from(source.buffer, source.byteOffset, source.byteLength),
        ])
      : source;
  await pipeline(
    input,
    createGunzip(),
    async (inflated: AsyncIterable<Buffer>): Promise<void> => {
      for await (const chunk of inflated) {
        streamed += chunk.length;
        if (streamed > maxStreamed) {
          throw new TarballTooLargeError(
            `content tarball inflates past the ${maxStreamed}-byte cap`
          );
        }
        // Keep draining after the end-of-archive block: git pads the archive
        // and gunzip must still see the gzip trailer.
        write(chunk);
      }
    }
  );
  if (bodyLeft > 0) throw new Error("content tarball ends inside an entry");
  return { files, images };
}

/**
 * Split an in-memory tree (tests, the admin validator) the way
 * {@link extractTarball} splits a stream: images become hashed references,
 * every other file keeps its bytes.
 */
export function splitRepoTree(tree: RepoTree): ContentTree {
  const files: RepoTree = new Map();
  const images = new Map<string, ImageRef>();
  for (const [path, bytes] of tree) {
    if (IMAGE_PATH_RE.test(path)) {
      images.set(path, {
        size: bytes.byteLength,
        sha256: createHash("sha256").update(bytes).digest("hex"),
      });
    } else {
      files.set(path, bytes);
    }
  }
  return { files, images };
}
