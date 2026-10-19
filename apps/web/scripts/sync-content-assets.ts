#!/usr/bin/env tsx
/**
 * sync-content-assets.ts — upload the images the committed content bundle
 * references to the content Blob store. Runs before `next build` and is the
 * store's only writer.
 *
 * One paginated `list()` of the store is diffed against
 * `src/content/generated/assets.json`. Each missing image is fetched from the
 * content repo at the content.lock SHA, checked against its manifest sha256,
 * and uploaded under its content-addressed key. Keys are never overwritten or
 * deleted, so an older bundle (a rollback) keeps resolving.
 *
 * On Vercel (`VERCEL` set) the sync is mandatory: a missing token, a GitHub
 * error, a hash mismatch or a blob url that differs from the one the compiler
 * wrote fails the build. Anywhere else (local, CI) it skips.
 *
 *   Run from apps/web:  pnpm tsx scripts/sync-content-assets.ts
 */
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { BlobError, list, put } from "@vercel/blob";
import {
  contentImagePathname,
  contentImageUrl,
  type AssetManifestEntry,
} from "../src/lib/content/compile/assets";

/** Parallel GitHub fetch + upload pairs. */
const CONCURRENCY = 8;
/** Content-addressed bytes never change under their key. */
const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

export interface SyncInput {
  manifest: AssetManifestEntry[];
  lock: { repo: string; sha: string };
  env: Record<string, string | undefined>;
  log?: (message: string) => void;
}

export interface SyncResult {
  skipped: boolean;
  present: number;
  uploaded: number;
}

/** Same url, compared the way a browser resolves it (the host is case-insensitive). */
const sameUrl = (a: string, b: string): boolean =>
  new URL(a).href === new URL(b).href;

async function fetchRepoFile(
  lock: SyncInput["lock"],
  repoPath: string,
  githubToken: string | undefined
): Promise<Uint8Array> {
  const encoded = repoPath.split("/").map(encodeURIComponent).join("/");
  const url = `https://raw.githubusercontent.com/${lock.repo}/${lock.sha}/${encoded}`;
  const headers: Record<string, string> = githubToken
    ? { Authorization: `Bearer ${githubToken}` }
    : {};
  const at = `${repoPath}@${lock.sha.slice(0, 7)}`;
  // Retry only what can be transient: a network error or a 5xx. A 4xx is a
  // fact about this commit and fails at once.
  for (let attempt = 1; ; attempt++) {
    let res: Response | null = null;
    try {
      res = await fetch(url, { headers });
    } catch (e) {
      if (attempt >= 3)
        throw new Error(`GitHub fetch of ${at} failed: ${String(e)}`);
    }
    if (res?.ok) return new Uint8Array(await res.arrayBuffer());
    if (res && (res.status < 500 || attempt >= 3)) {
      throw new Error(`GitHub returned ${res.status} for ${at}`);
    }
    await new Promise((r) => setTimeout(r, 500 * attempt));
  }
}

export async function syncContentAssets({
  manifest,
  lock,
  env,
  log = console.log,
}: SyncInput): Promise<SyncResult> {
  if (!env.VERCEL) {
    log("Content assets: not a Vercel build, skipping the Blob sync.");
    return { skipped: true, present: 0, uploaded: 0 };
  }
  const token = env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is not set: connect the academy-content-assets Blob store to this environment."
    );
  }

  const listed = new Map<string, string>(); // pathname → url
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: "content/", limit: 1000, cursor, token });
    for (const blob of page.blobs) listed.set(blob.pathname, blob.url);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  const missing: AssetManifestEntry[] = [];
  for (const entry of manifest) {
    const pathname = contentImagePathname(entry.sha256, entry.ext);
    const url = listed.get(pathname);
    if (url === undefined) {
      missing.push(entry);
    } else if (!sameUrl(url, contentImageUrl(entry.sha256, entry.ext))) {
      // Checked for blobs already present too, so a wrong base url cannot pass
      // just because an earlier build uploaded everything.
      throw new Error(
        `${pathname} is served at ${url}, but the bundle points at ${contentImageUrl(entry.sha256, entry.ext)}: CONTENT_BLOB_BASE_URL is wrong`
      );
    }
  }

  const upload = async (entry: AssetManifestEntry): Promise<void> => {
    const bytes = await fetchRepoFile(lock, entry.path, env.GITHUB_TOKEN);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    if (sha256 !== entry.sha256) {
      throw new Error(
        `${entry.path}@${lock.sha.slice(0, 7)} hashes to ${sha256}, but assets.json says ${entry.sha256}`
      );
    }
    const pathname = contentImagePathname(entry.sha256, entry.ext);
    const expected = contentImageUrl(entry.sha256, entry.ext);
    let url: string;
    try {
      ({ url } = await put(pathname, Buffer.from(bytes), {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: false,
        cacheControlMaxAge: ONE_YEAR_SECONDS,
        contentType: entry.contentType,
        token,
      }));
    } catch (e) {
      // A concurrent build uploaded this key after our list(). Same key, same
      // bytes, so there is nothing left to do.
      if (e instanceof BlobError && /already exists/i.test(e.message)) return;
      throw e;
    }
    if (!sameUrl(url, expected)) {
      throw new Error(
        `put(${pathname}) returned ${url}, but the bundle points at ${expected}: CONTENT_BLOB_BASE_URL is wrong`
      );
    }
  };

  let next = 0;
  let failed = false;
  const worker = async (): Promise<void> => {
    while (!failed && next < missing.length) {
      const entry = missing[next++]!;
      try {
        await upload(entry);
      } catch (e) {
        failed = true;
        throw e;
      }
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, missing.length) }, worker)
  );

  const present = manifest.length - missing.length;
  log(
    `Content assets: ${manifest.length} in assets.json, ${present} already in the store, ${missing.length} uploaded.`
  );
  return { skipped: false, present, uploaded: missing.length };
}

async function main(): Promise<void> {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const read = <T>(rel: string): T =>
    JSON.parse(fs.readFileSync(path.resolve(here, rel), "utf8")) as T;
  await syncContentAssets({
    manifest: read<AssetManifestEntry[]>(
      "../src/content/generated/assets.json"
    ),
    lock: read<SyncInput["lock"]>("../content.lock"),
    env: process.env,
  });
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
