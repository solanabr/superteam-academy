#!/usr/bin/env tsx
/**
 * compile-content.ts — compile the academy-courses content repo (pinned in
 * content.lock) into a committed, typed JSON bundle under src/content/generated.
 *
 * Pipeline: fetch tarball at the locked SHA → extract → delegate to the pure
 * `compileBundle` (src/lib/content/compile/compile-bundle.ts — Zod-validate every
 * doc fail-closed, project via the SAME projector the content sync uses, emit
 * deterministic JSON) → write the result to disk. CI recompiles and `git diff
 * --exit-code`s the result, so `compileBundle`'s output MUST be a pure function
 * of the input tree: stable key order, no wall-clock timestamps (meta.compiledAt
 * is the locked commit's own date).
 *
 * Images are streamed, hashed and dropped: the bundle points at their
 * content-addressed blob urls and `assets.json` lists them. Nothing here needs
 * a storage token — `sync-content-assets.ts` uploads them during the Vercel
 * build.
 *
 * The executor gate (§6.2a: solution passes / starter fails) is NOT re-run here.
 * It requires the live QuickJS/rust/build runners, was already enforced by the
 * academy-courses CI gate that made this SHA mergeable, and the sync itself
 * defers rust/buildable. Compile is a projection step, not a re-certification.
 *
 *   Run from apps/web:  pnpm compile-content   (or: pnpm tsx scripts/compile-content.ts)
 *   Optional GITHUB_TOKEN raises the GitHub rate limit.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  compileBundle,
  compileContent,
  GENERATED_README,
} from "../src/lib/content/compile/compile-bundle";
import { extractTarball } from "../src/lib/content/compile/tarball";
import { ContentValidationError } from "../src/lib/content/compile/types";

export { compileBundle, compileContent };

// ── GitHub fetch (local, no server-only deps) ────────────────────────────────

interface Lock {
  repo: string;
  sha: string;
}

function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "User-Agent": "superteam-academy-compile-content",
    Accept: "application/vnd.github+json",
  };
  if (process.env.GITHUB_TOKEN)
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return headers;
}

/** Small retry — the local DNS here is flaky; a commit SHA's bytes never change. */
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  attempts = 4
): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, init);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return res;
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1)
        await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw new Error(
    `GitHub request failed after ${attempts} attempts (${url}): ${String(lastErr)}`
  );
}

/** The tarball as a stream, so its image bytes never sit in memory. */
async function fetchTarball(lock: Lock): Promise<Readable> {
  const url = `https://api.github.com/repos/${lock.repo}/tarball/${lock.sha}`;
  const res = await fetchWithRetry(url, {
    headers: githubHeaders(),
    redirect: "follow",
  });
  if (!res.body) throw new Error(`empty tarball response (${url})`);
  return Readable.fromWeb(res.body as NodeReadableStream<Uint8Array>);
}

/** The locked commit's own committer date — deterministic per SHA, never wall-clock. */
async function fetchCommitDate(lock: Lock): Promise<string> {
  const url = `https://api.github.com/repos/${lock.repo}/commits/${lock.sha}`;
  const res = await fetchWithRetry(url, { headers: githubHeaders() });
  const body = (await res.json()) as {
    commit?: { committer?: { date?: string } };
  };
  const date = body.commit?.committer?.date;
  if (!date) throw new Error(`commit ${lock.sha} has no committer date`);
  return date;
}

// ── CLI ──────────────────────────────────────────────────────────────────────

/**
 * Write the compiled modules to disk, rebuilding the generated dir from scratch
 * so a stray committed file (a removed module) never survives a recompile —
 * that would leave `git status` clean while the tree no longer matches the
 * compiler output, punching a hole in the CI freshness guarantee. Safe because
 * the compiler always emits every module + README.
 */
export function writeBundle(outDir: string, files: Map<string, string>): void {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "README.md"), GENERATED_README);
  for (const [name, contents] of files) {
    fs.writeFileSync(path.join(outDir, name), contents);
  }
}

async function main(): Promise<void> {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const lockPath = path.resolve(here, "../content.lock");
  const outDir = path.resolve(here, "../src/content/generated");

  const lock = JSON.parse(fs.readFileSync(lockPath, "utf8")) as Lock;
  console.log(`Compiling ${lock.repo}@${lock.sha}`);

  const [tarball, compiledAt] = await Promise.all([
    fetchTarball(lock),
    fetchCommitDate(lock),
  ]);
  const tree = await extractTarball(tarball, { hashImages: true });
  const { files, imagePaths } = compileBundle(tree, {
    sha: lock.sha,
    compiledAt,
  });

  writeBundle(outDir, files);

  const counts = (
    JSON.parse(files.get("meta.json")!) as { counts: Record<string, number> }
  ).counts;
  console.log(
    `Emitted ${files.size} modules to ${path.relative(process.cwd(), outDir)}`
  );
  console.log(`Counts: ${JSON.stringify(counts)}`);
  const blobs = (JSON.parse(files.get("assets.json")!) as unknown[]).length;
  console.log(
    `Images: ${imagePaths.length} referenced, ${blobs} unique blob(s) in assets.json`
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((err: unknown) => {
    if (err instanceof ContentValidationError) {
      console.error(
        `Content validation failed (${err.issues.length} issue(s)):`
      );
      for (const issue of err.issues) console.error(issue);
    } else {
      console.error(err);
    }
    process.exit(1);
  });
}
