# Content Sync Route + Drift UI (CS-9) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the server-side `POST /api/admin/content/sync` route that fetches the `academy-courses` repo tarball at a SHA, re-validates it with `@superteam-lms/content-schema`, writes an idempotent, PRESERVE-safe, prune-guarded projection into Sanity, commits the git SHA into each `Course.content_tx_id` on-chain (§11.0), and powers a three-way drift panel in the admin dashboard.

**Architecture:** The route is a thin `ADMIN_SECRET`-gated handler over a pure, injectable orchestrator (`runContentSync`). The orchestrator talks to two seams — a `GitHubClient` (tarball + HEAD + Checks API, `GITHUB_TOKEN`) and a `SanityGateway` (read managed docs / write / delete / upload asset / write singleton) — so every guard (idempotency, PRESERVE reattach, prune blast-radius, red-CI refusal, content-derived asset dedupe, `content_tx_id` commitment) is a pure function tested with in-memory fakes. Sanity stays the derived projection; provenance is GitHub itself (no content bundle). Content sync (repo → Sanity) is one machine, fully reconciling; chain sync (Sanity → devnet) stays the existing human-gated path, now carrying the SHA in `content_tx_id`.

**Tech Stack:** Next.js 14 App Router route handlers; `@sanity/client` / `next-sanity` write client (existing `admin-mutations.ts`); `fetch` for the GitHub REST API (no new SDK — the three calls we need are trivial); `yaml` v2 + `@superteam-lms/content-schema` (CS-1) for parse+revalidate; `@coral-xyz/anchor` via the existing `admin-signer.ts` for the `content_tx_id` write; vitest 4.

**Spec:** `docs/superpowers/specs/2026-07-09-course-content-standard-design.md` — this plan implements §9 (the sync pipeline: §9.2 tarball-at-SHA + `GITHUB_TOKEN`, §9.3 PRESERVE, §9.4 prune guards, §9.5 weak refs, §9.6 assets, §9.7 scale), §11 (drift model: §11.0 `content_tx_id` commitment, §11.1 the two drift gaps, §11.2 deletion ordering), and §6.2a (server-side executor gate at sync time). It is Phase 7 of the §15.4 migration.

## Global Constraints

- **`ADMIN_SECRET` gate.** The sync and drift routes call `requireAdminAuth(req)` from `@/lib/admin/auth` (HMAC-signed `admin_session` cookie + same-origin CSRF check), exactly like every other `/api/admin/*` route. Catch `AdminAuthError` → `adminUnauthorizedResponse()` (401).
- **Server-only secrets, never client.** `GITHUB_TOKEN` and `SANITY_ADMIN_TOKEN` are read only through `@/lib/env.server` (which imports `server-only`). Never a `NEXT_PUBLIC_` prefix; never referenced from a `"use client"` module.
- **New env var:** `GITHUB_TOKEN` — a fine-grained **read** token for `solanabr/academy-courses`. Needed for the tarball fetch, HEAD polling in the drift UI, and the Checks API that powers the `blocked` state. Unauthenticated GitHub is 60 req/hr per IP and flakes on Vercel's shared egress, so it is not optional for the feature (the app still boots without it; the routes 503). Document it in `apps/web/CLAUDE.md` (Environment Variables) and `docs/DEPLOYMENT.md`.
- **Repo constants** (copied verbatim, do not re-derive): repo = `solanabr/academy-courses`, default branch = `main`, tarball endpoint = `GET /repos/solanabr/academy-courses/tarball/<sha>`, sync marker `source` = `"academy-courses"`, `_template/` is excluded from sync.
- **PRESERVE list** (§9.3): `PRESERVE = { course: ["onChainStatus"], achievement: ["onChainStatus"] }`. Every field of a managed doc is either a pure function of the repo, the `sync` marker, or in PRESERVE. Nothing else exists.
- **Managed doc types** (carry the `sync` marker, are pruned): `course`, `lesson`, `instructor`, `learningPath`, `achievement`, `quest`.
- **Prune is fail-safe** (§9.4): marker-scoped query (`sync.source == "academy-courses" && sync.rev != $sha`); write-verify-count-**then**-prune; abort if the prune set exceeds **20%** of managed docs; the `contentSync` singleton is written **last** (never matches the prune query); weak refs (from CS-5) so prune never deadlocks; delete-by-query 10k cap noted (we have ~115 docs).
- **Idempotency contract:** re-running the sync at the **same SHA** produces **zero** write and zero delete mutations. Achieved by diffing each projected doc against the existing doc (deep-equal, PRESERVE and system fields excluded) and skipping unchanged ones; `sync.rev == sha` makes an unchanged doc byte-identical on the second run.
- **`content_tx_id` is 32 bytes** (`Course.content_tx_id`, `[u8; 32]`). A git SHA-1 is 20 bytes (40 hex chars); it is **left-padded** to 32 (12 leading zero bytes). Written via `update_course`'s `new_content_tx_id`, which bumps `Course.version` (§11.0).
- **Field names may not start with `_`** (§9.4) — the marker is `sync`, never `_syncRev`. `block.key` maps to the Sanity array item `_key`.
- Test command throughout: `pnpm --filter web test <path>` (unit) and `pnpm --filter web typecheck` (types). Web app package: `@superteam-lms/web`; `web` is a valid pnpm filter shorthand. Vitest config: `apps/web/vitest.config.ts` (node env, globals, `@` alias → `src`).
- TDD: every task writes the failing test first, runs it to see it fail, writes real TypeScript (no placeholders), runs it to pass, commits. Conventional commits.

## Prerequisites

These land before CS-9 and are consumed here. CS-9 does **not** re-implement them.

- **CS-1 `@superteam-lms/content-schema`** (`docs/superpowers/plans/2026-07-09-content-schema-package.md`) — the Zod source of truth the sync re-validates the tarball against: `Course`, `Lesson`, `Block` union, `BLOCK_REGISTRY`, `Slots` (`slots.lock.json`), `Achievement`, `Quest`, `LearningPath`, `Instructor`, and constants (`MAX_LESSON_SLOTS = 256`). Import path `@superteam-lms/content-schema`.
- **CS-5 Sanity schema v2** (`docs/superpowers/plans/2026-07-09-sanity-schema-v2.md`) — the target shapes the sync writes: the eight block object types (Amendment A) with content-bearing fields the sync **resolves** paths into (`prose.src` → markdown text, `code.starter`/`solution` → code text, `code.tests` → `testCase[]`, `program-explorer.idl` → IDL JSON string), inline `courseModule`, weak refs (`modules[].lessons[]`, `instructor`, `prerequisiteCourse`, `learningPath.courses`), the `sync: { source, rev }` marker on all six managed docs, and the untouched `onChainStatus` (PRESERVE target).
- **CS-8 extraction / the `academy-courses` repo** (spec §15.4 Phase 1) — a validated repo tree exists at some SHA with per-course `slots.lock.json`, so the tarball fetch has something to fetch and the mask assertion has a lockfile to derive from.
- **Program v2 — `Course.active_lessons` mask** (spec §5.2, CS-3) — `update_course` accepts `new_active_lessons: Option<[u64; 4]>` and `new_content_tx_id`. Required by the §11.0 mask-vs-lockfile assertion (Task 8) and the chain-sync wiring (Task 12). Until it lands, Task 8's `deriveActiveMask` is pure and testable, but Task 12's on-chain write is gated on the v2 IDL.

## File Structure

```
apps/web/src/
├── lib/
│   ├── env.server.ts                         mod  — add GITHUB_TOKEN (optStr)
│   ├── sanity/
│   │   └── admin-mutations.ts                mod  — export sanityAdmin factory; add readManaged/write/delete/uploadAsset/assetExists/writeSingleton
│   ├── solana/
│   │   └── admin-signer.ts                   mod  — write content_tx_id (SHA-padded) + assert mask == lockfile before signing
│   └── content-sync/
│       ├── types.ts                          new  — RepoTree, SanityDoc, ManagedType, ChecksState, SyncResult, error classes
│       ├── github.ts                         new  — GitHubClient: tarball + HEAD + Checks API (GITHUB_TOKEN)
│       ├── tarball.ts                        new  — gunzip+untar → RepoTree map; exclude _template
│       ├── validate.ts                       new  — parseAndValidateTree (Zod) + executor gate (§6.2a)
│       ├── executor-gate.ts                  new  — solution-passes / starter-fails, tiered by language/buildType
│       ├── projector.ts                      new  — validated content → SanityDoc[] + AssetUpload[]; deterministic _id, blocks[], _key
│       ├── preserve.ts                       new  — PRESERVE, PROJECTED_FIELDS, reattachPreserved, assertSchemaFieldsCovered
│       ├── prune.ts                          new  — selectPrunable, assertBlastRadius, prunableQuery, selectChangedDocs
│       ├── assets.ts                         new  — content-derived _id (sha1), skip-if-exists, rewrite md image paths → CDN
│       ├── content-commit.ts                 new  — padContentTxId, contentTxIdMatchesHead, deriveActiveMask, assertMaskMatchesLockfile
│       ├── drift.ts                          new  — computeContentDrift, computeChainDrift, assertCommitSyncable
│       ├── gateway.ts                        new  — SanityGateway interface + live impl over admin-mutations
│       ├── sync.ts                           new  — runContentSync orchestrator (injectable seams)
│       └── __tests__/
│           ├── tarball.test.ts               new
│           ├── github.test.ts                new
│           ├── executor-gate.test.ts         new
│           ├── projector.test.ts             new
│           ├── preserve.test.ts              new
│           ├── prune.test.ts                 new
│           ├── assets.test.ts                new
│           ├── content-commit.test.ts        new
│           ├── drift.test.ts                 new
│           └── sync.test.ts                  new  — idempotency, red-CI refusal, blast-radius abort
├── app/api/admin/content/
│   ├── sync/route.ts                         new  — POST { sha }, ADMIN_SECRET
│   └── drift/route.ts                        new  — GET, ADMIN_SECRET → three-way drift
└── components/admin/
    └── content-sync-panel.tsx                new  — three-way drift panel; blocked disables the button
```

Route handlers stay thin; all logic is in `lib/content-sync/*` pure/injectable modules so the guards are unit-tested without a live Sanity, GitHub, or RPC.

---

### Task 1: Shared types + `GITHUB_TOKEN` env var

**Files:**
- Create: `apps/web/src/lib/content-sync/types.ts`
- Modify: `apps/web/src/lib/env.server.ts`
- Test: `apps/web/src/lib/content-sync/__tests__/types.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `RepoTree` (= `Map<string, Uint8Array>`), `SanityDoc`, `ManagedType`, `MANAGED_TYPES`, `ChecksState`, `SyncResult`, and the error classes `BlockedCommitError`, `BlastRadiusError`, `ContentValidationError`, `GitHubUnavailableError`, `MaskMismatchError`. `serverEnv.GITHUB_TOKEN: string | undefined`.

- [ ] **Step 1: Write the failing test**

`apps/web/src/lib/content-sync/__tests__/types.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  MANAGED_TYPES,
  BlockedCommitError,
  BlastRadiusError,
  ContentValidationError,
} from "../types";

describe("content-sync types", () => {
  it("lists exactly the six managed document types", () => {
    expect([...MANAGED_TYPES].sort()).toEqual(
      ["achievement", "course", "instructor", "learningPath", "lesson", "quest"].sort(),
    );
  });

  it("error classes carry a stable name and message", () => {
    expect(new BlockedCommitError("abc").name).toBe("BlockedCommitError");
    expect(new BlastRadiusError(30, 100).message).toContain("30");
    expect(new ContentValidationError(["bad"]).issues).toEqual(["bad"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test src/lib/content-sync/__tests__/types.test.ts`
Expected: FAIL — `Cannot find module '../types'`.

- [ ] **Step 3: Implement `src/lib/content-sync/types.ts`**

```ts
/** A repo tarball flattened to POSIX paths (relative to the repo root) → file bytes. */
export type RepoTree = Map<string, Uint8Array>;

export const MANAGED_TYPES = [
  "course",
  "lesson",
  "instructor",
  "learningPath",
  "achievement",
  "quest",
] as const;
export type ManagedType = (typeof MANAGED_TYPES)[number];

/** A minimal Sanity document. `sync`/`onChainStatus` are optional overlays. */
export interface SanityDoc {
  _id: string;
  _type: string;
  sync?: { source: string; rev: string };
  onChainStatus?: Record<string, unknown>;
  [field: string]: unknown;
}

/** GitHub combined check state for a commit (Checks API `conclusion` folded). */
export type ChecksState = "success" | "failure" | "pending" | "unknown";

export interface SyncResult {
  sha: string;
  written: number;
  skipped: number;
  pruned: number;
  assetsUploaded: number;
  pendingChainDeltas: string[]; // course ids whose active_lessons mask changed
}

/** HEAD's CI is red — refuse to sync (§11.1 `blocked`). */
export class BlockedCommitError extends Error {
  constructor(public readonly sha: string) {
    super(`Refusing to sync ${sha}: its CI checks are not passing`);
    this.name = "BlockedCommitError";
  }
}

/** The prune set exceeds the 20% blast-radius guard (§9.4). */
export class BlastRadiusError extends Error {
  constructor(
    public readonly pruneCount: number,
    public readonly managedTotal: number,
  ) {
    super(
      `Prune of ${pruneCount}/${managedTotal} managed docs exceeds the 20% blast radius; aborting`,
    );
    this.name = "BlastRadiusError";
  }
}

/** Zod / executor re-validation rejected the tree (§9.2 step 2, §6.2a). */
export class ContentValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Content re-validation failed: ${issues.length} issue(s)`);
    this.name = "ContentValidationError";
  }
}

/** GitHub API unreachable / unauthenticated (missing GITHUB_TOKEN, rate limit). */
export class GitHubUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GitHubUnavailableError";
  }
}

/** The active_lessons mask does not match the committed slots.lock.json (§11.0). */
export class MaskMismatchError extends Error {
  constructor(public readonly courseId: string) {
    super(`active_lessons mask for ${courseId} does not match its slots.lock.json`);
    this.name = "MaskMismatchError";
  }
}
```

- [ ] **Step 4: Add `GITHUB_TOKEN` to `env.server.ts`**

In `apps/web/src/lib/env.server.ts`, add to `serverEnvSchema` (after `SANITY_ADMIN_TOKEN`):

```ts
  // Fine-grained READ token for solanabr/academy-courses. Server-only. Needed by
  // POST /api/admin/content/sync (tarball fetch), the drift UI (HEAD polling),
  // and the Checks API (blocked state). Optional at boot; the content routes 503
  // when unset. Unauthenticated GitHub is 60 req/hr per IP and flakes on Vercel.
  GITHUB_TOKEN: optStr,
```

and to the `safeParse({...})` object:

```ts
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter web test src/lib/content-sync/__tests__/types.test.ts && pnpm --filter web typecheck`
Expected: PASS — 2 tests; `tsc` exits 0.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/content-sync/types.ts \
        apps/web/src/lib/content-sync/__tests__/types.test.ts \
        apps/web/src/lib/env.server.ts
git commit -m "feat(sync): content-sync shared types + server-only GITHUB_TOKEN"
```

---

### Task 2: Tarball extraction → `RepoTree`

**Files:**
- Create: `apps/web/src/lib/content-sync/tarball.ts`
- Test: `apps/web/src/lib/content-sync/__tests__/tarball.test.ts`

**Interfaces:**
- Consumes: `RepoTree` from `./types`.
- Produces: `extractTarball(gzipped: Uint8Array): Promise<RepoTree>` — gunzips, untars, strips GitHub's top-level `owner-repo-<sha>/` prefix, drops directory entries and anything under `courses/_template/`, keys by repo-relative POSIX path.

GitHub's `tarball` endpoint returns a gzipped tar whose entries are all under a single generated top directory (`solanabr-academy-courses-<sha>/`). We strip that prefix so paths match the repo layout (`courses/<slug>/course.yaml`).

- [ ] **Step 1: Write the failing test**

`apps/web/src/lib/content-sync/__tests__/tarball.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { gzipSync } from "node:zlib";
import { extractTarball } from "../tarball";

/** Build a minimal, spec-compliant POSIX tar (512-byte records) in-memory. */
function makeTar(files: Record<string, string>): Uint8Array {
  const enc = new TextEncoder();
  const blocks: Uint8Array[] = [];
  const pad = (b: Uint8Array) => {
    const rem = b.length % 512;
    return rem === 0 ? b : new Uint8Array([...b, ...new Uint8Array(512 - rem)]);
  };
  for (const [name, body] of Object.entries(files)) {
    const header = new Uint8Array(512);
    header.set(enc.encode(name), 0); // name (100)
    header.set(enc.encode("0000644"), 100); // mode
    header.set(enc.encode("0000000"), 108); // uid
    header.set(enc.encode("0000000"), 116); // gid
    const size = enc.encode(body).length.toString(8).padStart(11, "0");
    header.set(enc.encode(size), 124); // size (octal, 12)
    header.set(enc.encode("00000000000"), 136); // mtime
    header[156] = "0".charCodeAt(0); // typeflag: regular file
    header.set(enc.encode("ustar\0"), 257);
    header.set(enc.encode("00"), 263);
    // checksum: sum of bytes with the checksum field treated as spaces
    header.fill(32, 148, 156);
    let sum = 0;
    for (const byte of header) sum += byte;
    header.set(enc.encode(sum.toString(8).padStart(6, "0") + "\0 "), 148);
    blocks.push(header, pad(enc.encode(body)));
  }
  blocks.push(new Uint8Array(1024)); // two zero blocks = end of archive
  const total = blocks.reduce((n, b) => n + b.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const b of blocks) {
    out.set(b, off);
    off += b.length;
  }
  return out;
}

describe("extractTarball", () => {
  it("strips the generated top dir and keys by repo-relative path", async () => {
    const tar = makeTar({
      "solanabr-academy-courses-abc123/courses/solana-fundamentals/course.yaml": "id: course-solana-fundamentals\n",
      "solanabr-academy-courses-abc123/courses/solana-fundamentals/lessons/accounts/intro.md": "# Accounts\n",
    });
    const tree = await extractTarball(gzipSync(Buffer.from(tar)));
    expect([...tree.keys()].sort()).toEqual([
      "courses/solana-fundamentals/course.yaml",
      "courses/solana-fundamentals/lessons/accounts/intro.md",
    ]);
    expect(new TextDecoder().decode(tree.get("courses/solana-fundamentals/course.yaml"))).toContain(
      "course-solana-fundamentals",
    );
  });

  it("excludes courses/_template/", async () => {
    const tar = makeTar({
      "r-abc/courses/_template/course.yaml": "id: course-template\n",
      "r-abc/courses/real/course.yaml": "id: course-real\n",
    });
    const tree = await extractTarball(gzipSync(Buffer.from(tar)));
    expect([...tree.keys()]).toEqual(["courses/real/course.yaml"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test src/lib/content-sync/__tests__/tarball.test.ts`
Expected: FAIL — `Cannot find module '../tarball'`.

- [ ] **Step 3: Implement `src/lib/content-sync/tarball.ts`**

```ts
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

    const rawName = new TextDecoder().decode(header.subarray(0, 100)).replace(/\0.*$/, "");
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test src/lib/content-sync/__tests__/tarball.test.ts`
Expected: PASS — 2 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/content-sync/tarball.ts \
        apps/web/src/lib/content-sync/__tests__/tarball.test.ts
git commit -m "feat(sync): extract GitHub tarball to a repo-relative tree (exclude _template)"
```

---

### Task 3: `GitHubClient` — tarball, HEAD, Checks API

**Files:**
- Create: `apps/web/src/lib/content-sync/github.ts`
- Test: `apps/web/src/lib/content-sync/__tests__/github.test.ts`

**Interfaces:**
- Consumes: `ChecksState`, `GitHubUnavailableError` from `./types`.
- Produces: `interface GitHubClient { fetchTarball(sha): Promise<Uint8Array>; fetchHeadSha(): Promise<string>; fetchChecksState(sha): Promise<ChecksState> }`; `createGitHubClient(opts?: { token?: string; fetchImpl?: typeof fetch }): GitHubClient`. `fetchImpl` is injectable for tests; `token` defaults to `serverEnv.GITHUB_TOKEN`.

Uses only three REST calls. `fetchChecksState` folds the Checks API `check_runs[].conclusion` into one `ChecksState`: any `failure`/`timed_out`/`cancelled` → `failure`; any still `in_progress`/`queued` → `pending`; all `success`/`neutral`/`skipped` → `success`; empty → `unknown`.

- [ ] **Step 1: Write the failing test**

`apps/web/src/lib/content-sync/__tests__/github.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { createGitHubClient } from "../github";
import { GitHubUnavailableError } from "../types";

const okJson = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });

describe("GitHubClient", () => {
  it("authenticates the tarball request and follows to bytes", async () => {
    const fetchImpl = vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), { status: 200 }));
    const client = createGitHubClient({ token: "ghp_x", fetchImpl: fetchImpl as unknown as typeof fetch });
    const bytes = await client.fetchTarball("abc123");
    expect(Array.from(bytes)).toEqual([1, 2, 3]);
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe("https://api.github.com/repos/solanabr/academy-courses/tarball/abc123");
    expect((init as RequestInit).headers).toMatchObject({ Authorization: "Bearer ghp_x" });
  });

  it("reads HEAD sha from the branch ref", async () => {
    const fetchImpl = vi.fn(async () => okJson({ sha: "headsha999" }));
    const client = createGitHubClient({ token: "t", fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(await client.fetchHeadSha()).toBe("headsha999");
    expect(fetchImpl.mock.calls[0]![0]).toContain("/commits/main");
  });

  it("folds check-runs into a single state", async () => {
    const client = createGitHubClient({
      token: "t",
      fetchImpl: (async () =>
        okJson({ check_runs: [{ conclusion: "success" }, { conclusion: "failure" }] })) as unknown as typeof fetch,
    });
    expect(await client.fetchChecksState("s")).toBe("failure");
  });

  it("reports pending when a run is still in progress", async () => {
    const client = createGitHubClient({
      token: "t",
      fetchImpl: (async () =>
        okJson({ check_runs: [{ conclusion: "success" }, { status: "in_progress", conclusion: null }] })) as unknown as typeof fetch,
    });
    expect(await client.fetchChecksState("s")).toBe("pending");
  });

  it("throws GitHubUnavailableError without a token", async () => {
    const client = createGitHubClient({ token: undefined, fetchImpl: (async () => new Response()) as unknown as typeof fetch });
    await expect(client.fetchHeadSha()).rejects.toBeInstanceOf(GitHubUnavailableError);
  });

  it("throws GitHubUnavailableError on a non-2xx", async () => {
    const client = createGitHubClient({
      token: "t",
      fetchImpl: (async () => new Response("rate limited", { status: 403 })) as unknown as typeof fetch,
    });
    await expect(client.fetchHeadSha()).rejects.toBeInstanceOf(GitHubUnavailableError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test src/lib/content-sync/__tests__/github.test.ts`
Expected: FAIL — `Cannot find module '../github'`.

- [ ] **Step 3: Implement `src/lib/content-sync/github.ts`**

```ts
import "server-only";
import { serverEnv } from "@/lib/env.server";
import { type ChecksState, GitHubUnavailableError } from "./types";

const REPO = "solanabr/academy-courses";
const BRANCH = "main";
const API = "https://api.github.com";

export interface GitHubClient {
  fetchTarball(sha: string): Promise<Uint8Array>;
  fetchHeadSha(): Promise<string>;
  fetchChecksState(sha: string): Promise<ChecksState>;
}

interface Opts {
  token?: string;
  fetchImpl?: typeof fetch;
}

export function createGitHubClient(opts: Opts = {}): GitHubClient {
  const token = "token" in opts ? opts.token : serverEnv.GITHUB_TOKEN;
  const doFetch = opts.fetchImpl ?? fetch;

  async function call(path: string, accept: string): Promise<Response> {
    if (!token) {
      throw new GitHubUnavailableError("GITHUB_TOKEN is not configured");
    }
    let res: Response;
    try {
      res = await doFetch(`${API}${path}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: accept,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });
    } catch (e) {
      throw new GitHubUnavailableError(e instanceof Error ? e.message : String(e));
    }
    if (!res.ok) {
      throw new GitHubUnavailableError(`GitHub ${path} → ${res.status}`);
    }
    return res;
  }

  return {
    async fetchTarball(sha) {
      // `tarball/<sha>` 302-redirects to codeload; fetch follows redirects by default.
      const res = await call(`/repos/${REPO}/tarball/${sha}`, "application/vnd.github+json");
      return new Uint8Array(await res.arrayBuffer());
    },

    async fetchHeadSha() {
      const res = await call(`/repos/${REPO}/commits/${BRANCH}`, "application/vnd.github+json");
      const body = (await res.json()) as { sha?: string };
      if (!body.sha) throw new GitHubUnavailableError("HEAD commit response missing sha");
      return body.sha;
    },

    async fetchChecksState(sha) {
      const res = await call(`/repos/${REPO}/commits/${sha}/check-runs`, "application/vnd.github+json");
      const body = (await res.json()) as {
        check_runs?: { status?: string; conclusion?: string | null }[];
      };
      const runs = body.check_runs ?? [];
      if (runs.length === 0) return "unknown";
      const failed = new Set(["failure", "timed_out", "cancelled", "action_required", "stale"]);
      const done = new Set(["success", "neutral", "skipped"]);
      if (runs.some((r) => r.conclusion && failed.has(r.conclusion))) return "failure";
      if (runs.some((r) => !r.conclusion || !done.has(r.conclusion))) return "pending";
      return "success";
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test src/lib/content-sync/__tests__/github.test.ts && pnpm --filter web typecheck`
Expected: PASS — 6 tests; `tsc` exits 0.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/content-sync/github.ts \
        apps/web/src/lib/content-sync/__tests__/github.test.ts
git commit -m "feat(sync): GitHubClient — tarball, HEAD, Checks API (GITHUB_TOKEN)"
```

---

### Task 4: The server-side executor gate (§6.2a)

**Files:**
- Create: `apps/web/src/lib/content-sync/executor-gate.ts`
- Test: `apps/web/src/lib/content-sync/__tests__/executor-gate.test.ts`

**Interfaces:**
- Consumes: `runJsSubmission` (`@/lib/challenge/executor`), `runRustSubmission` (`@/lib/challenge/rust-executor`), and the buildable executor. These are injected via a `GraderSet` so tests use fakes.
- Produces: `gateCodeBlock(block, files, graders): Promise<string[]>` — returns a (possibly empty) list of issue strings; asserts the two-sided gate (solution passes ALL tests, starter fails at least one), tiered by `language`/`buildType`.

This is the check the content-repo CI cannot run for fork PRs (secrets, shared Playground) — it runs server-side at sync time, using the **same** oracle that grades learners (spec §6.2a). Inherited weakness noted in the spec (`Function`-poisoning in the JS executor) is out of scope; this gate does not claim more integrity than the oracle has.

- [ ] **Step 1: Write the failing test**

`apps/web/src/lib/content-sync/__tests__/executor-gate.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { gateCodeBlock, type GraderSet } from "../executor-gate";

const tests = [{ id: "t1", description: "d", input: "", expectedOutput: "42" }];

// Fake graders: a submission "passes" iff it equals the string "SOLUTION".
const graders: GraderSet = {
  js: async (code) => ({ passed: code.trim() === "SOLUTION", failures: [] }),
  rust: async (code) => ({ passed: code.trim() === "SOLUTION", failures: [] }),
  buildable: async (code) => ({ passed: code.trim() === "SOLUTION", failures: [] }),
};

const files = (starter: string, solution: string) => ({ starter, solution, tests });

describe("gateCodeBlock", () => {
  it("passes when the solution passes and the starter fails", async () => {
    const block = { key: "ex", type: "code", language: "typescript", buildType: "standard" };
    const issues = await gateCodeBlock(block, files("STARTER", "SOLUTION"), graders);
    expect(issues).toEqual([]);
  });

  it("rejects when the reference solution does NOT pass its own tests", async () => {
    const block = { key: "ex", type: "code", language: "typescript", buildType: "standard" };
    const issues = await gateCodeBlock(block, files("STARTER", "BROKEN"), graders);
    expect(issues.join(" ")).toContain("solution does not pass");
  });

  it("rejects when the starter already passes (nothing to solve)", async () => {
    const block = { key: "ex", type: "code", language: "typescript", buildType: "standard" };
    const issues = await gateCodeBlock(block, files("SOLUTION", "SOLUTION"), graders);
    expect(issues.join(" ")).toContain("starter already passes");
  });

  it("routes a rust standard block to the rust grader", async () => {
    let used = "";
    const spy: GraderSet = { ...graders, rust: async (c) => ((used = "rust"), { passed: c.trim() === "SOLUTION", failures: [] }) };
    const block = { key: "ex", type: "code", language: "rust", buildType: "standard" };
    await gateCodeBlock(block, files("STARTER", "SOLUTION"), spy);
    expect(used).toBe("rust");
  });

  it("routes a buildable block to the buildable grader", async () => {
    let used = "";
    const spy: GraderSet = { ...graders, buildable: async (c) => ((used = "buildable"), { passed: c.trim() === "SOLUTION", failures: [] }) };
    const block = { key: "ex", type: "code", language: "rust", buildType: "buildable" };
    await gateCodeBlock(block, files("STARTER", "SOLUTION"), spy);
    expect(used).toBe("buildable");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test src/lib/content-sync/__tests__/executor-gate.test.ts`
Expected: FAIL — `Cannot find module '../executor-gate'`.

- [ ] **Step 3: Implement `src/lib/content-sync/executor-gate.ts`**

```ts
interface GradeResult {
  passed: boolean;
  failures: string[];
}
type Grader = (code: string, tests: unknown[]) => Promise<GradeResult>;

/** The three execution tiers of §6.2a, injectable so the orchestrator wires the
 *  real executors and tests wire fakes. */
export interface GraderSet {
  js: Grader; // QuickJS-in-WASM (runJsSubmission), pure Node
  rust: Grader; // rustc/cargo on the runner (or Playground fallback)
  buildable: Grader; // cargo build-sbf / Anchor build server
}

interface CodeBlockLike {
  key: string;
  type: string;
  language: "typescript" | "rust";
  buildType: "standard" | "buildable";
}

interface CodeFiles {
  starter: string;
  solution: string;
  tests: unknown[];
}

function pickGrader(block: CodeBlockLike, graders: GraderSet): Grader {
  if (block.buildType === "buildable") return graders.buildable;
  return block.language === "rust" ? graders.rust : graders.js;
}

/**
 * Two-sided gate (spec §3, §6.2 gate 6): the reference solution must pass every
 * test and the starter must fail at least one. Returns human-readable issue
 * strings prefixed with the block key; empty means the block is well-formed.
 */
export async function gateCodeBlock(
  block: CodeBlockLike,
  files: CodeFiles,
  graders: GraderSet,
): Promise<string[]> {
  const issues: string[] = [];
  const grader = pickGrader(block, graders);

  const sol = await grader(files.solution, files.tests);
  if (!sol.passed) {
    issues.push(`block "${block.key}": solution does not pass its own tests (${sol.failures.join("; ")})`);
  }

  const starter = await grader(files.starter, files.tests);
  if (starter.passed) {
    issues.push(`block "${block.key}": starter already passes — there is nothing to solve`);
  }

  return issues;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test src/lib/content-sync/__tests__/executor-gate.test.ts`
Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/content-sync/executor-gate.ts \
        apps/web/src/lib/content-sync/__tests__/executor-gate.test.ts
git commit -m "feat(sync): two-sided executor gate at sync time (§6.2a), tiered by language/buildType"
```

---

### Task 5: `parseAndValidateTree` — Zod re-validation of the whole tree

**Files:**
- Create: `apps/web/src/lib/content-sync/validate.ts`
- Test: `apps/web/src/lib/content-sync/__tests__/validate.test.ts`

**Interfaces:**
- Consumes: `RepoTree`, `ContentValidationError` from `./types`; the Zod schemas from `@superteam-lms/content-schema`; `gateCodeBlock` + `GraderSet`; `yaml` v2.
- Produces: `parseAndValidateTree(tree, graders): Promise<ValidatedContent>` where `ValidatedContent = { courses, lessons, achievements, quests, paths, instructors, slots, prose, code, idl, assets }` — every YAML/JSON re-parsed and Zod-validated, prose/code/idl bodies loaded from the tree, and every `code` block passed through the executor gate. On any failure it throws `ContentValidationError` with the accumulated issues.

Step 2 of §9.2 is the **authoritative** validation; the PR check is only an early warning that may not have run against this exact tree. Never trust the check ran.

- [ ] **Step 1: Write the failing test**

`apps/web/src/lib/content-sync/__tests__/validate.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parseAndValidateTree } from "../validate";
import { ContentValidationError } from "../types";
import type { GraderSet } from "../executor-gate";
import { stringify } from "yaml";

const passGraders: GraderSet = {
  js: async (code) => ({ passed: code.includes("solve"), failures: ["fail"] }),
  rust: async (code) => ({ passed: code.includes("solve"), failures: ["fail"] }),
  buildable: async (code) => ({ passed: code.includes("solve"), failures: ["fail"] }),
};

function tree(files: Record<string, string>): Map<string, Uint8Array> {
  const m = new Map<string, Uint8Array>();
  const enc = new TextEncoder();
  for (const [k, v] of Object.entries(files)) m.set(k, enc.encode(v));
  return m;
}

const courseYaml = stringify({
  id: "course-demo",
  slug: "demo",
  title: "Demo",
  description: "d",
  difficulty: "beginner",
  duration: 1,
  xpPerLesson: 10,
  xpReward: 100,
  creator: { githubId: "1" },
  modules: [{ key: "m", title: "M", lessons: ["lesson-accounts"] }],
});
const lessonYaml = stringify({
  id: "lesson-accounts",
  slug: "accounts",
  title: "Accounts",
  blocks: [{ key: "intro", type: "prose", src: "intro.md" }],
});

describe("parseAndValidateTree", () => {
  it("validates a well-formed single-course tree", async () => {
    const t = tree({
      "courses/demo/course.yaml": courseYaml,
      "courses/demo/slots.lock.json": JSON.stringify({ version: 1, slots: { "lesson-accounts": 0 }, retired: [], next: 1 }),
      "courses/demo/lessons/accounts/lesson.yaml": lessonYaml,
      "courses/demo/lessons/accounts/intro.md": "# Accounts",
    });
    const v = await parseAndValidateTree(t, passGraders);
    expect(v.courses.map((c) => c.id)).toEqual(["course-demo"]);
    expect(v.prose.get("courses/demo/lessons/accounts/intro.md")).toContain("# Accounts");
  });

  it("throws with the Zod issue when a course is malformed", async () => {
    const t = tree({ "courses/demo/course.yaml": stringify({ id: "NOT-a-course-id" }) });
    await expect(parseAndValidateTree(t, passGraders)).rejects.toBeInstanceOf(ContentValidationError);
  });

  it("throws when a code block's solution fails the executor gate", async () => {
    const withCode = stringify({
      id: "lesson-ex",
      slug: "ex",
      title: "Ex",
      blocks: [
        {
          key: "ex",
          type: "code",
          language: "typescript",
          starter: "exercise/starter.ts",
          solution: "exercise/solution.ts",
          tests: "exercise/tests.json",
        },
      ],
    });
    const t = tree({
      "courses/demo/course.yaml": stringify({ ...JSON.parse(JSON.stringify({})), ...{} }) || courseYaml,
      "courses/demo/lessons/ex/lesson.yaml": withCode,
      "courses/demo/lessons/ex/exercise/starter.ts": "// nope",
      "courses/demo/lessons/ex/exercise/solution.ts": "// also nope (no 'solve')",
      "courses/demo/lessons/ex/exercise/tests.json": JSON.stringify([{ id: "t", description: "d", input: "", expectedOutput: "1" }]),
    });
    // course.yaml above is a valid course; the executor gate rejects on the solution.
    t.set("courses/demo/course.yaml", new TextEncoder().encode(courseYaml));
    await expect(parseAndValidateTree(t, passGraders)).rejects.toBeInstanceOf(ContentValidationError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test src/lib/content-sync/__tests__/validate.test.ts`
Expected: FAIL — `Cannot find module '../validate'`.

- [ ] **Step 3: Implement `src/lib/content-sync/validate.ts`**

```ts
import { parse as parseYaml } from "yaml";
import {
  Course,
  Lesson,
  Slots,
  Achievement,
  Quest,
  LearningPath,
  Instructor,
  type CourseT,
  type LessonT,
} from "@superteam-lms/content-schema";
import type { RepoTree } from "./types";
import { ContentValidationError } from "./types";
import { gateCodeBlock, type GraderSet } from "./executor-gate";

export interface ValidatedContent {
  courses: CourseT[];
  lessons: { dir: string; lesson: LessonT }[];
  achievements: unknown[];
  quests: unknown[];
  paths: unknown[];
  instructors: unknown[];
  slots: Map<string, ReturnType<typeof Slots.parse>>; // course dir → lockfile
  prose: Map<string, string>; // md path → body
  code: Map<string, string>; // ts/rs path → body
  idl: Map<string, string>; // idl path → json
  assets: Map<string, Uint8Array>; // image path → bytes
}

const text = (bytes: Uint8Array) => new TextDecoder().decode(bytes);
const dirOf = (path: string) => path.slice(0, path.lastIndexOf("/"));

/**
 * Re-parse and Zod-validate every YAML/JSON in the tree, load prose/code/idl/
 * asset bodies, and run the two-sided executor gate on every `code` block. This
 * is the authoritative validation (§9.2 step 2) — the repo's PR check may not
 * have run against this exact SHA. Accumulates all issues, then throws once.
 */
export async function parseAndValidateTree(
  tree: RepoTree,
  graders: GraderSet,
): Promise<ValidatedContent> {
  const issues: string[] = [];
  const v: ValidatedContent = {
    courses: [],
    lessons: [],
    achievements: [],
    quests: [],
    paths: [],
    instructors: [],
    slots: new Map(),
    prose: new Map(),
    code: new Map(),
    idl: new Map(),
    assets: new Map(),
  };

  const zod = <T>(schema: { parse: (x: unknown) => T }, raw: unknown, where: string): T | null => {
    try {
      return schema.parse(raw);
    } catch (e) {
      issues.push(`${where}: ${e instanceof Error ? e.message : String(e)}`);
      return null;
    }
  };

  for (const [path, bytes] of tree) {
    if (path.endsWith("/course.yaml")) {
      const c = zod(Course, parseYaml(text(bytes)), path);
      if (c) v.courses.push(c);
    } else if (path.endsWith("/slots.lock.json")) {
      const s = zod(Slots, JSON.parse(text(bytes)), path);
      if (s) v.slots.set(dirOf(path), s);
    } else if (path.endsWith("/lesson.yaml")) {
      const l = zod(Lesson, parseYaml(text(bytes)), path);
      if (l) v.lessons.push({ dir: dirOf(path), lesson: l });
    } else if (path.startsWith("achievements/") && path.endsWith(".yaml")) {
      const a = zod(Achievement, parseYaml(text(bytes)), path);
      if (a) v.achievements.push(a);
    } else if (path.startsWith("quests/") && path.endsWith(".yaml")) {
      const q = zod(Quest, parseYaml(text(bytes)), path);
      if (q) v.quests.push(q);
    } else if (path.startsWith("paths/") && path.endsWith(".yaml")) {
      const p = zod(LearningPath, parseYaml(text(bytes)), path);
      if (p) v.paths.push(p);
    } else if (path.startsWith("instructors/") && path.endsWith(".yaml")) {
      const i = zod(Instructor, parseYaml(text(bytes)), path);
      if (i) v.instructors.push(i);
    } else if (path.endsWith(".md")) {
      v.prose.set(path, text(bytes));
    } else if (path.endsWith(".ts") || path.endsWith(".rs")) {
      v.code.set(path, text(bytes));
    } else if (path.endsWith(".idl.json")) {
      v.idl.set(path, text(bytes));
    } else if (/\.(png|jpe?g|gif|webp|svg)$/i.test(path)) {
      v.assets.set(path, bytes);
    }
  }

  // Executor gate on every code block, resolving its files from the tree.
  for (const { dir, lesson } of v.lessons) {
    for (const block of lesson.blocks) {
      if (block.type !== "code") continue;
      const starter = v.code.get(`${dir}/${block.starter}`);
      const solution = v.code.get(`${dir}/${block.solution}`);
      const testsRaw = tree.get(`${dir}/${block.tests}`);
      if (!starter || !solution || !testsRaw) {
        issues.push(`lesson ${lesson.id} block ${block.key}: missing starter/solution/tests file`);
        continue;
      }
      const tests = JSON.parse(text(testsRaw)) as unknown[];
      const blockIssues = await gateCodeBlock(
        { key: block.key, type: "code", language: block.language, buildType: block.buildType },
        { starter, solution, tests },
        graders,
      );
      issues.push(...blockIssues);
    }
  }

  if (issues.length > 0) throw new ContentValidationError(issues);
  return v;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test src/lib/content-sync/__tests__/validate.test.ts && pnpm --filter web typecheck`
Expected: PASS — 3 tests; `tsc` exits 0. (If CS-1 exports names differ, align the imports to the actual `@superteam-lms/content-schema` barrel — the field-level shapes are identical.)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/content-sync/validate.ts \
        apps/web/src/lib/content-sync/__tests__/validate.test.ts
git commit -m "feat(sync): authoritative Zod re-validation + executor gate over the whole tree"
```

---

### Task 6: The projector — validated content → `SanityDoc[]`

**Files:**
- Create: `apps/web/src/lib/content-sync/projector.ts`
- Test: `apps/web/src/lib/content-sync/__tests__/projector.test.ts`

**Interfaces:**
- Consumes: `ValidatedContent` from `./validate`; `SanityDoc` from `./types`.
- Produces: `projectContent(v: ValidatedContent, sha: string, resolveAssetRef): { docs: SanityDoc[]; assets: AssetUpload[] }`. Deterministic `_id` (= content id), inline `courseModule` with weak lesson refs, `blocks[]` with `_key = block.key`, prose/code/idl **resolved** (path → body), `code.tests` resolved to a `testCase[]`, and `sync: { source: "academy-courses", rev: sha }` on every managed doc. `resolveAssetRef(mdPath)` maps a relative image path to a Sanity asset ref (from Task 7).

Every field is a pure function of the repo or the `sync` marker. `lesson.xpReward` is deliberately never emitted (§4.3). Modules are inline objects, not documents (§10.1).

- [ ] **Step 1: Write the failing test**

`apps/web/src/lib/content-sync/__tests__/projector.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { projectContent } from "../projector";
import type { ValidatedContent } from "../validate";

function fixture(): ValidatedContent {
  return {
    courses: [
      {
        id: "course-demo",
        slug: "demo",
        title: "Demo",
        description: "d",
        difficulty: "beginner",
        duration: 1,
        xpPerLesson: 10,
        xpReward: 100,
        creator: { githubId: "1" },
        modules: [{ key: "m", title: "M", lessons: ["lesson-accounts"] }],
      } as never,
    ],
    lessons: [
      {
        dir: "courses/demo/lessons/accounts",
        lesson: {
          id: "lesson-accounts",
          slug: "accounts",
          title: "Accounts",
          blocks: [
            { key: "intro", type: "prose", src: "intro.md" },
            {
              key: "ex",
              type: "code",
              language: "typescript",
              buildType: "standard",
              deployable: false,
              starter: "exercise/starter.ts",
              solution: "exercise/solution.ts",
              tests: "exercise/tests.json",
              hints: [],
            },
          ],
        } as never,
      },
    ],
    achievements: [],
    quests: [],
    paths: [],
    instructors: [],
    slots: new Map(),
    prose: new Map([["courses/demo/lessons/accounts/intro.md", "# Accounts"]]),
    code: new Map([
      ["courses/demo/lessons/accounts/exercise/starter.ts", "// starter"],
      ["courses/demo/lessons/accounts/exercise/solution.ts", "// solution"],
    ]),
    idl: new Map(),
    assets: new Map(),
  } as ValidatedContent;
}

// tests.json content is read straight from the tree by the projector via a getter;
// for the unit test we pass a resolver that returns a fixed testCase array.
const noAsset = () => null;

describe("projectContent", () => {
  it("gives each managed doc a deterministic _id equal to its content id", () => {
    const { docs } = projectContent(fixture(), "sha1", noAsset, () => [
      { id: "t", description: "d", input: "", expectedOutput: "1" },
    ]);
    const course = docs.find((d) => d._type === "course")!;
    const lesson = docs.find((d) => d._type === "lesson")!;
    expect(course._id).toBe("course-demo");
    expect(lesson._id).toBe("lesson-accounts");
  });

  it("stamps the sync marker with the sha on every managed doc", () => {
    const { docs } = projectContent(fixture(), "sha1", noAsset, () => []);
    for (const d of docs) {
      expect(d.sync).toEqual({ source: "academy-courses", rev: "sha1" });
    }
  });

  it("resolves prose src → markdown body and uses block.key as _key", () => {
    const { docs } = projectContent(fixture(), "sha1", noAsset, () => []);
    const lesson = docs.find((d) => d._type === "lesson") as { blocks: { _key: string; _type: string; src?: string }[] };
    const intro = lesson.blocks.find((b) => b._key === "intro")!;
    expect(intro._type).toBe("prose");
    expect(intro.src).toBe("# Accounts");
  });

  it("resolves code.tests → a testCase[] array", () => {
    const { docs } = projectContent(fixture(), "sha1", noAsset, () => [
      { id: "t1", description: "d", input: "", expectedOutput: "1" },
    ]);
    const lesson = docs.find((d) => d._type === "lesson") as { blocks: { _key: string; tests?: { id: string }[] }[] };
    const ex = lesson.blocks.find((b) => b._key === "ex")!;
    expect(ex.tests).toEqual([{ id: "t1", description: "d", input: "", expectedOutput: "1" }]);
  });

  it("never emits lesson.xpReward and inlines modules with weak lesson refs", () => {
    const { docs } = projectContent(fixture(), "sha1", noAsset, () => []);
    const lesson = docs.find((d) => d._type === "lesson")!;
    expect("xpReward" in lesson).toBe(false);
    const course = docs.find((d) => d._type === "course") as { modules: { lessons: { _ref: string; _weak: boolean }[] }[] };
    expect(course.modules[0]!.lessons[0]).toMatchObject({ _ref: "lesson-accounts", _weak: true });
  });

  it("is deterministic — same input yields deep-equal output", () => {
    const a = projectContent(fixture(), "sha1", noAsset, () => []);
    const b = projectContent(fixture(), "sha1", noAsset, () => []);
    expect(a.docs).toEqual(b.docs);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test src/lib/content-sync/__tests__/projector.test.ts`
Expected: FAIL — `Cannot find module '../projector'`.

- [ ] **Step 3: Implement `src/lib/content-sync/projector.ts`**

```ts
import type { ValidatedContent } from "./validate";
import type { SanityDoc } from "./types";

export interface AssetUpload {
  path: string; // repo-relative image path
  bytes: Uint8Array;
}

/** Maps a lesson-relative image path to a Sanity image ref, or null if none. */
export type AssetResolver = (repoPath: string) => { _type: "image"; asset: { _ref: string } } | null;

/** Reads a code block's resolved tests.json array for a given lesson dir + path. */
export type TestsResolver = (dir: string, testsRelPath: string) => unknown[];

const weakRef = (ref: string) => ({ _type: "reference", _ref: ref, _weak: true, _key: ref });

function projectBlock(
  block: Record<string, unknown> & { key: string; type: string },
  dir: string,
  v: ValidatedContent,
  resolveAsset: AssetResolver,
  resolveTests: TestsResolver,
): Record<string, unknown> {
  const { key, ...rest } = block;
  const out: Record<string, unknown> = { _key: key, _type: block.type };
  for (const [k, val] of Object.entries(rest)) {
    if (k === "type") continue;
    out[k] = val;
  }
  // Resolve repo paths → content (spec §9.6, §10.2).
  if (block.type === "prose") {
    out.src = v.prose.get(`${dir}/${String(block.src)}`) ?? "";
  }
  if (block.type === "code") {
    out.starter = v.code.get(`${dir}/${String(block.starter)}`) ?? "";
    out.solution = v.code.get(`${dir}/${String(block.solution)}`) ?? "";
    out.tests = resolveTests(dir, String(block.tests));
  }
  if (block.type === "program-explorer") {
    out.idl = v.idl.get(`${dir}/${String(block.idl)}`) ?? "";
  }
  return out;
}

/**
 * Project validated repo content into managed Sanity documents. Deterministic:
 * `_id` = content id, `_key` = block key, module refs weak (§9.5). Every field
 * is a pure function of the repo or the `sync` marker (§9.3 invariant).
 */
export function projectContent(
  v: ValidatedContent,
  sha: string,
  resolveAsset: AssetResolver,
  resolveTests: TestsResolver,
): { docs: SanityDoc[]; assets: AssetUpload[] } {
  const marker = { source: "academy-courses", rev: sha } as const;
  const docs: SanityDoc[] = [];
  const assets: AssetUpload[] = [...v.assets.entries()].map(([path, bytes]) => ({ path, bytes }));

  const dirByLessonId = new Map(v.lessons.map((l) => [l.lesson.id, l.dir]));

  for (const c of v.courses) {
    docs.push({
      _id: c.id,
      _type: "course",
      title: c.title,
      slug: { _type: "slug", current: c.slug },
      description: c.description,
      difficulty: c.difficulty,
      duration: c.duration,
      xpPerLesson: c.xpPerLesson,
      xpReward: c.xpReward,
      trackId: c.trackId ?? 0,
      trackLevel: c.trackLevel ?? 0,
      creatorRewardXp: c.creatorRewardXp ?? 0,
      minCompletionsForReward: c.minCompletionsForReward ?? 0,
      tags: c.tags ?? [],
      creator: { githubId: c.creator.githubId },
      instructor: c.instructor ? weakRef(c.instructor) : undefined,
      prerequisiteCourse: c.prerequisiteCourse ? weakRef(c.prerequisiteCourse) : undefined,
      modules: c.modules.map((m) => ({
        _type: "courseModule",
        _key: m.key,
        key: m.key,
        title: m.title,
        description: m.description,
        lessons: m.lessons.map(weakRef),
      })),
      sync: marker,
    });
  }

  for (const { dir, lesson } of v.lessons) {
    docs.push({
      _id: lesson.id,
      _type: "lesson",
      title: lesson.title,
      slug: { _type: "slug", current: lesson.slug },
      blocks: lesson.blocks.map((b) =>
        projectBlock(b as never, dir, v, resolveAsset, resolveTests),
      ),
      sync: marker,
    });
  }

  for (const i of v.instructors as { id: string; [k: string]: unknown }[]) {
    docs.push({ _id: i.id, _type: "instructor", ...stripId(i), sync: marker });
  }
  for (const p of v.paths as { id: string; courses?: string[]; [k: string]: unknown }[]) {
    docs.push({
      _id: p.id,
      _type: "learningPath",
      ...stripId(p, ["courses"]),
      courses: (p.courses ?? []).map(weakRef),
      sync: marker,
    });
  }
  for (const a of v.achievements as { id: string; [k: string]: unknown }[]) {
    docs.push({ _id: a.id, _type: "achievement", ...stripId(a), sync: marker });
  }
  for (const q of v.quests as { id: string; [k: string]: unknown }[]) {
    docs.push({ _id: q.id, _type: "quest", ...stripId(q), sync: marker });
  }

  void dirByLessonId;
  return { docs, assets };
}

function stripId(obj: Record<string, unknown>, alsoDrop: string[] = []): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(obj)) {
    if (k === "id" || alsoDrop.includes(k)) continue;
    out[k] = val;
  }
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test src/lib/content-sync/__tests__/projector.test.ts && pnpm --filter web typecheck`
Expected: PASS — 6 tests; `tsc` exits 0.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/content-sync/projector.ts \
        apps/web/src/lib/content-sync/__tests__/projector.test.ts
git commit -m "feat(sync): projector — deterministic managed docs, resolved blocks, weak refs"
```

---

### Task 7: Assets — content-derived `_id`, skip-if-exists, path rewrite

**Files:**
- Create: `apps/web/src/lib/content-sync/assets.ts`
- Test: `apps/web/src/lib/content-sync/__tests__/assets.test.ts`

**Interfaces:**
- Consumes: `node:crypto` (`createHash`); the Sanity CDN base (`cdn.sanity.io`).
- Produces: `computeAssetId(bytes, dims, format): string` (`image-<sha1>-<w>x<h>-<format>`); `rewriteMarkdownAssetPaths(md, resolve): string`; `cdnUrl(assetId, projectId, dataset): string`. Uploading itself is a `SanityGateway` method (Task 9); this module supplies the dedupe key and the markdown rewrite.

Sanity gives an uploaded asset a content-derived `_id` and dedupes by it — the same bytes never create a second asset (§9.6). So the sync computes the id from the file's SHA-1 and skips the upload when it already exists; asset sync is free on re-runs.

- [ ] **Step 1: Write the failing test**

`apps/web/src/lib/content-sync/__tests__/assets.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { computeAssetId, rewriteMarkdownAssetPaths, cdnUrl } from "../assets";

describe("computeAssetId", () => {
  it("derives image-<sha1>-<dims>-<format> from the bytes", () => {
    const bytes = new Uint8Array([1, 2, 3, 4]);
    const sha1 = createHash("sha1").update(Buffer.from(bytes)).digest("hex");
    expect(computeAssetId(bytes, { width: 640, height: 480 }, "png")).toBe(
      `image-${sha1}-640x480-png`,
    );
  });

  it("is stable — same bytes yield the same id (dedupe key)", () => {
    const b = new Uint8Array([9, 9, 9]);
    expect(computeAssetId(b, { width: 1, height: 1 }, "png")).toBe(
      computeAssetId(b, { width: 1, height: 1 }, "png"),
    );
  });
});

describe("rewriteMarkdownAssetPaths", () => {
  it("rewrites a relative image path to its resolved CDN url", () => {
    const md = "See ![accounts](assets/accounts.png) here.";
    const out = rewriteMarkdownAssetPaths(md, (rel) =>
      rel === "assets/accounts.png" ? "https://cdn.sanity.io/images/p/d/x-1x1.png" : null,
    );
    expect(out).toBe("See ![accounts](https://cdn.sanity.io/images/p/d/x-1x1.png) here.");
  });

  it("leaves absolute/remote urls untouched", () => {
    const md = "![x](https://example.com/x.png)";
    expect(rewriteMarkdownAssetPaths(md, () => "SHOULD_NOT_BE_USED")).toBe(md);
  });
});

describe("cdnUrl", () => {
  it("builds the Sanity CDN url for an asset id", () => {
    expect(cdnUrl("image-abc-640x480-png", "proj", "production")).toBe(
      "https://cdn.sanity.io/images/proj/production/abc-640x480.png",
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test src/lib/content-sync/__tests__/assets.test.ts`
Expected: FAIL — `Cannot find module '../assets'`.

- [ ] **Step 3: Implement `src/lib/content-sync/assets.ts`**

```ts
import { createHash } from "node:crypto";

export interface Dimensions {
  width: number;
  height: number;
}

/**
 * Sanity's content-derived asset id: `image-<sha1>-<w>x<h>-<format>`. Uploading
 * the same bytes twice yields one asset (spec §9.6), so this id is our dedupe
 * key: compute it, skip the upload if it already exists.
 */
export function computeAssetId(bytes: Uint8Array, dims: Dimensions, format: string): string {
  const sha1 = createHash("sha1").update(Buffer.from(bytes)).digest("hex");
  return `image-${sha1}-${dims.width}x${dims.height}-${format}`;
}

/** Build the public CDN url for an asset id (`image-<hash>-<dims>-<fmt>`). */
export function cdnUrl(assetId: string, projectId: string, dataset: string): string {
  const m = /^image-([0-9a-f]+)-(\d+x\d+)-(\w+)$/.exec(assetId);
  if (!m) return "";
  const [, hash, dims, fmt] = m;
  return `https://cdn.sanity.io/images/${projectId}/${dataset}/${hash}-${dims}.${fmt}`;
}

const IMG = /!\[([^\]]*)\]\(([^)]+)\)/g;
const isRemote = (u: string) => /^(https?:)?\/\//.test(u) || u.startsWith("/");

/**
 * Rewrite relative markdown image paths to resolved CDN urls (spec §9.6).
 * Absolute or remote urls are left untouched. `resolve` returns null when the
 * path has no uploaded asset (leave as-is so the failure is visible).
 */
export function rewriteMarkdownAssetPaths(
  markdown: string,
  resolve: (relPath: string) => string | null,
): string {
  return markdown.replace(IMG, (whole, alt: string, url: string) => {
    if (isRemote(url)) return whole;
    const resolved = resolve(url);
    return resolved ? `![${alt}](${resolved})` : whole;
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test src/lib/content-sync/__tests__/assets.test.ts`
Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/content-sync/assets.ts \
        apps/web/src/lib/content-sync/__tests__/assets.test.ts
git commit -m "feat(sync): content-derived asset ids, dedupe skip, markdown CDN path rewrite"
```

---

### Task 8: PRESERVE + the CI field-equality assertion; prune guards

**Files:**
- Create: `apps/web/src/lib/content-sync/preserve.ts`
- Create: `apps/web/src/lib/content-sync/prune.ts`
- Test: `apps/web/src/lib/content-sync/__tests__/preserve.test.ts`
- Test: `apps/web/src/lib/content-sync/__tests__/prune.test.ts`

**Interfaces:**
- Consumes: `SanityDoc`, `ManagedType`, `BlastRadiusError` from `./types`.
- Produces (preserve): `PRESERVE`, `PROJECTED_FIELDS`, `reattachPreserved(projected, existing?)`, `assertSchemaFieldsCovered(type, sanityFields)`.
- Produces (prune): `selectChangedDocs(existing, projected)`, `selectPrunable(existing, sha)`, `assertBlastRadius(pruneCount, managedTotal)`, `prunableQuery()`.

`createOrReplace` replaces the whole document, but `onChainStatus` is Sanity-owned state the repo knows nothing about (§9.3). The sync reads existing `onChainStatus`, reattaches it, then writes. The CI assertion `sanitySchemaFields == repoProjectedFields ∪ PRESERVE ∪ {sync}` fails the build if a Sanity-owned field is added without registering it.

- [ ] **Step 1: Write the failing preserve test**

`apps/web/src/lib/content-sync/__tests__/preserve.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { PRESERVE, PROJECTED_FIELDS, reattachPreserved, assertSchemaFieldsCovered } from "../preserve";
import type { SanityDoc } from "../types";

describe("reattachPreserved", () => {
  it("carries onChainStatus from the existing course onto the projected one", () => {
    const projected: SanityDoc = { _id: "course-x", _type: "course", title: "X", sync: { source: "academy-courses", rev: "s" } };
    const existing: SanityDoc = { _id: "course-x", _type: "course", title: "OLD", onChainStatus: { coursePda: "PDA", isActive: true } };
    const merged = reattachPreserved(projected, existing);
    expect(merged.onChainStatus).toEqual({ coursePda: "PDA", isActive: true });
    expect(merged.title).toBe("X"); // repo wins for projected fields
  });

  it("is a no-op when there is no existing doc", () => {
    const projected: SanityDoc = { _id: "course-x", _type: "course", title: "X" };
    expect(reattachPreserved(projected, undefined).onChainStatus).toBeUndefined();
  });

  it("does not preserve onChainStatus for a lesson (not in PRESERVE)", () => {
    const projected: SanityDoc = { _id: "lesson-x", _type: "lesson" };
    const existing: SanityDoc = { _id: "lesson-x", _type: "lesson", onChainStatus: { foo: 1 } };
    expect(reattachPreserved(projected, existing).onChainStatus).toBeUndefined();
  });
});

describe("assertSchemaFieldsCovered", () => {
  it("passes when sanity fields == projected ∪ PRESERVE ∪ sync", () => {
    const fields = [...PROJECTED_FIELDS.course, ...PRESERVE.course, "sync"];
    expect(() => assertSchemaFieldsCovered("course", fields)).not.toThrow();
  });

  it("throws when Sanity has an unregistered field (would be wiped on sync)", () => {
    const fields = [...PROJECTED_FIELDS.course, ...PRESERVE.course, "sync", "editorNote"];
    expect(() => assertSchemaFieldsCovered("course", fields)).toThrow(/editorNote/);
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm --filter web test src/lib/content-sync/__tests__/preserve.test.ts`
Expected: FAIL — `Cannot find module '../preserve'`.

- [ ] **Step 3: Implement `src/lib/content-sync/preserve.ts`**

```ts
import type { ManagedType, SanityDoc } from "./types";

/** Sanity-owned fields that survive a re-sync (spec §9.3). */
export const PRESERVE: Record<ManagedType, string[]> = {
  course: ["onChainStatus"],
  achievement: ["onChainStatus"],
  lesson: [],
  instructor: [],
  learningPath: [],
  quest: [],
};

/**
 * Fields the projector writes per type (Task 6). Kept in lockstep with
 * projector.ts; the CI equality below fails the build if the two diverge from
 * the Sanity schema.
 */
export const PROJECTED_FIELDS: Record<ManagedType, string[]> = {
  course: [
    "title", "slug", "description", "difficulty", "duration", "xpPerLesson",
    "xpReward", "trackId", "trackLevel", "creatorRewardXp", "minCompletionsForReward",
    "tags", "creator", "instructor", "prerequisiteCourse", "modules", "thumbnail",
  ],
  lesson: ["title", "slug", "blocks"],
  instructor: ["name", "avatar", "bio", "socialLinks"],
  learningPath: ["title", "slug", "description", "tag", "order", "difficulty", "courses"],
  achievement: ["name", "description", "icon", "category", "xpReward", "maxSupply", "award"],
  quest: ["name", "description", "type", "targetValue", "xpReward", "resetType", "active"],
};

/** System fields Sanity always adds; excluded from the equality check. */
const SYSTEM_FIELDS = new Set(["_id", "_type", "_rev", "_createdAt", "_updatedAt", "_key"]);

/**
 * Copy PRESERVE fields from the existing doc onto the projected doc, so a
 * whole-document `createOrReplace` does not erase Sanity-owned state (§9.3).
 */
export function reattachPreserved(projected: SanityDoc, existing: SanityDoc | undefined): SanityDoc {
  if (!existing) return projected;
  const keep = PRESERVE[projected._type as ManagedType] ?? [];
  const out: SanityDoc = { ...projected };
  for (const field of keep) {
    if (existing[field] !== undefined) out[field] = existing[field];
  }
  return out;
}

/**
 * Build-time invariant (spec §9.3): every Sanity field is projected, preserved,
 * the sync marker, or a system field. A Sanity-owned field added without adding
 * it to PRESERVE throws here — it would otherwise be silently wiped on sync.
 */
export function assertSchemaFieldsCovered(type: ManagedType, sanityFields: string[]): void {
  const allowed = new Set([...PROJECTED_FIELDS[type], ...PRESERVE[type], "sync"]);
  const orphans = sanityFields.filter((f) => !SYSTEM_FIELDS.has(f) && !allowed.has(f));
  if (orphans.length > 0) {
    throw new Error(
      `Sanity ${type} has unregistered field(s) [${orphans.join(", ")}]: add to PROJECTED_FIELDS or PRESERVE`,
    );
  }
}
```

- [ ] **Step 4: Write the failing prune test**

`apps/web/src/lib/content-sync/__tests__/prune.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { selectChangedDocs, selectPrunable, assertBlastRadius, prunableQuery } from "../prune";
import { BlastRadiusError, type SanityDoc } from "../types";

const doc = (id: string, extra: Partial<SanityDoc> = {}): SanityDoc => ({ _id: id, _type: "lesson", ...extra });
const marked = (id: string, rev: string): SanityDoc =>
  doc(id, { sync: { source: "academy-courses", rev } });

describe("selectPrunable", () => {
  it("selects marked docs whose rev != current sha", () => {
    const existing = [marked("a", "old"), marked("b", "new"), doc("c")];
    const prunable = selectPrunable(existing, "new");
    expect(prunable.map((d) => d._id)).toEqual(["a"]);
  });

  it("NEVER selects an unmarked doc (no sync marker)", () => {
    const existing = [doc("imageAsset"), doc("handCreated"), marked("x", "old")];
    const prunable = selectPrunable(existing, "new");
    expect(prunable.map((d) => d._id)).toEqual(["x"]);
    expect(prunable.some((d) => d._id === "imageAsset")).toBe(false);
  });

  it("never selects a doc from a different source", () => {
    const foreign = doc("f", { sync: { source: "other-repo", rev: "old" } });
    expect(selectPrunable([foreign], "new")).toEqual([]);
  });
});

describe("assertBlastRadius", () => {
  it("aborts when the prune set exceeds 20% of managed docs", () => {
    expect(() => assertBlastRadius(25, 100)).toThrow(BlastRadiusError);
  });

  it("allows a prune at exactly the 20% line", () => {
    expect(() => assertBlastRadius(20, 100)).not.toThrow();
  });
});

describe("selectChangedDocs (idempotency)", () => {
  it("returns nothing when projected deep-equals existing (same sha re-run)", () => {
    const existing = [marked("a", "s1"), marked("b", "s1")];
    const projected = [marked("a", "s1"), marked("b", "s1")];
    expect(selectChangedDocs(existing, projected)).toEqual([]);
  });

  it("returns only the docs whose projected value changed", () => {
    const existing = [marked("a", "s1"), doc("b", { title: "old", sync: { source: "academy-courses", rev: "s1" } })];
    const projected = [marked("a", "s1"), doc("b", { title: "new", sync: { source: "academy-courses", rev: "s2" } })];
    expect(selectChangedDocs(existing, projected).map((d) => d._id)).toEqual(["b"]);
  });

  it("preserves PRESERVE fields in the comparison (onChainStatus difference is ignored)", () => {
    const existing = [doc("a", { _type: "course", onChainStatus: { pda: "X" }, sync: { source: "academy-courses", rev: "s1" } })];
    const projected = [doc("a", { _type: "course", onChainStatus: { pda: "X" }, sync: { source: "academy-courses", rev: "s1" } })];
    expect(selectChangedDocs(existing, projected)).toEqual([]);
  });
});

describe("prunableQuery", () => {
  it("is marker-scoped and sha-parameterised", () => {
    expect(prunableQuery()).toBe('*[sync.source == "academy-courses" && sync.rev != $sha]._id');
  });
});
```

- [ ] **Step 5: Run it to see it fail**

Run: `pnpm --filter web test src/lib/content-sync/__tests__/prune.test.ts`
Expected: FAIL — `Cannot find module '../prune'`.

- [ ] **Step 6: Implement `src/lib/content-sync/prune.ts`**

```ts
import { BlastRadiusError, type SanityDoc } from "./types";

const SOURCE = "academy-courses";

/** GROQ that selects prunable ids: our marker, a stale rev. Parameterised by $sha. */
export function prunableQuery(): string {
  return '*[sync.source == "academy-courses" && sync.rev != $sha]._id';
}

/**
 * Docs to delete after a full write: ours (matching `sync.source`) and NOT at
 * the current sha. Documents without the marker — image assets, anything
 * hand-created — are untouchable (spec §9.4 guard 2).
 */
export function selectPrunable(existing: SanityDoc[], sha: string): SanityDoc[] {
  return existing.filter((d) => d.sync?.source === SOURCE && d.sync.rev !== sha);
}

/** Blast-radius guard (spec §9.4 guard 4): abort if prune > 20% of managed docs. */
export function assertBlastRadius(pruneCount: number, managedTotal: number): void {
  if (managedTotal > 0 && pruneCount > managedTotal * 0.2) {
    throw new BlastRadiusError(pruneCount, managedTotal);
  }
}

const stable = (d: SanityDoc): string => {
  const { _rev, _createdAt, _updatedAt, ...rest } = d as Record<string, unknown>;
  void _rev;
  void _createdAt;
  void _updatedAt;
  return JSON.stringify(sortKeys(rest));
};

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, sortKeys(v)]),
    );
  }
  return value;
}

/**
 * Idempotency core (Global Constraints): only the docs whose projected value
 * differs from the existing doc. Re-running at the same sha yields [] because
 * `sync.rev` is identical and every projected field is a pure function of the
 * repo. PRESERVE fields must already be reattached onto `projected` (Task 6/8)
 * so an unchanged onChainStatus does not register as a diff.
 */
export function selectChangedDocs(existing: SanityDoc[], projected: SanityDoc[]): SanityDoc[] {
  const byId = new Map(existing.map((d) => [d._id, d]));
  return projected.filter((p) => {
    const cur = byId.get(p._id);
    return !cur || stable(cur) !== stable(p);
  });
}
```

- [ ] **Step 7: Run both to verify they pass**

Run: `pnpm --filter web test src/lib/content-sync/__tests__/preserve.test.ts src/lib/content-sync/__tests__/prune.test.ts && pnpm --filter web typecheck`
Expected: PASS — 5 + 9 tests; `tsc` exits 0.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/lib/content-sync/preserve.ts apps/web/src/lib/content-sync/prune.ts \
        apps/web/src/lib/content-sync/__tests__/preserve.test.ts \
        apps/web/src/lib/content-sync/__tests__/prune.test.ts
git commit -m "feat(sync): PRESERVE reattach + CI field-equality; prune guards + idempotent diff"
```

---

### Task 9: `content_tx_id` commitment + mask-from-lockfile assertion (§11.0)

**Files:**
- Create: `apps/web/src/lib/content-sync/content-commit.ts`
- Test: `apps/web/src/lib/content-sync/__tests__/content-commit.test.ts`

**Interfaces:**
- Consumes: `MaskMismatchError` from `./types`; `Slots` shape from `@superteam-lms/content-schema`.
- Produces: `padContentTxId(sha): number[]` (32 bytes); `contentTxIdMatchesHead(onChain, headSha): boolean`; `deriveActiveMask(slots): [bigint, bigint, bigint, bigint]`; `assertMaskMatchesLockfile(courseId, maskToSend, slots)`.

`Course.content_tx_id` is a 32-byte field, `Array(32).fill(0)` on every live course today (`admin-signer.ts:267`). §11.0 repurposes it: at chain sync, write the 20-byte git SHA left-padded to 32. Chain drift then becomes a provable `content_tx_id == HEAD` equality. And because the mask moves in the same `update_course` call, the sync asserts `active_lessons == mask(slots.lock.json)` right before signing — `update_course` trusts the authority blindly, so this is where the "slots never reused" invariant is enforced.

- [ ] **Step 1: Write the failing test**

`apps/web/src/lib/content-sync/__tests__/content-commit.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  padContentTxId,
  contentTxIdMatchesHead,
  deriveActiveMask,
  assertMaskMatchesLockfile,
} from "../content-commit";
import { MaskMismatchError } from "../types";

const sha = "a".repeat(40); // 20 bytes of 0xaa

describe("padContentTxId", () => {
  it("left-pads the 20-byte sha into 32 bytes (12 leading zeros)", () => {
    const bytes = padContentTxId(sha);
    expect(bytes).toHaveLength(32);
    expect(bytes.slice(0, 12)).toEqual(Array(12).fill(0));
    expect(bytes.slice(12)).toEqual(Array(20).fill(0xaa));
  });

  it("rejects a non-40-hex sha", () => {
    expect(() => padContentTxId("abc")).toThrow();
  });
});

describe("contentTxIdMatchesHead", () => {
  it("is true when the on-chain bytes equal the padded head sha", () => {
    expect(contentTxIdMatchesHead(padContentTxId(sha), sha)).toBe(true);
  });
  it("is false for the all-zero legacy value", () => {
    expect(contentTxIdMatchesHead(Array(32).fill(0), sha)).toBe(false);
  });
  it("accepts a Uint8Array as well as number[]", () => {
    expect(contentTxIdMatchesHead(new Uint8Array(padContentTxId(sha)), sha)).toBe(true);
  });
});

describe("deriveActiveMask", () => {
  it("sets a bit per live slot and clears retired ones", () => {
    // slots 0 and 2 live, slot 1 retired → mask low word = 0b101 = 5
    const mask = deriveActiveMask({ version: 1, slots: { a: 0, b: 1, c: 2 }, retired: [1], next: 3 });
    expect(mask[0]).toBe(5n);
    expect(mask.slice(1)).toEqual([0n, 0n, 0n]);
  });

  it("places a high slot in the correct u64 word", () => {
    const mask = deriveActiveMask({ version: 1, slots: { x: 64 }, retired: [], next: 65 });
    expect(mask[0]).toBe(0n);
    expect(mask[1]).toBe(1n);
  });
});

describe("assertMaskMatchesLockfile", () => {
  const slots = { version: 1, slots: { a: 0, c: 2 }, retired: [], next: 3 };
  it("passes when the mask to send equals the lockfile-derived mask", () => {
    expect(() => assertMaskMatchesLockfile("course-x", [5n, 0n, 0n, 0n], slots)).not.toThrow();
  });
  it("throws MaskMismatchError when the panel would set an arbitrary bit", () => {
    expect(() => assertMaskMatchesLockfile("course-x", [7n, 0n, 0n, 0n], slots)).toThrow(MaskMismatchError);
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm --filter web test src/lib/content-sync/__tests__/content-commit.test.ts`
Expected: FAIL — `Cannot find module '../content-commit'`.

- [ ] **Step 3: Implement `src/lib/content-sync/content-commit.ts`**

```ts
import { MaskMismatchError } from "./types";

interface SlotsLock {
  version: number;
  slots: Record<string, number>;
  retired: number[];
  next: number;
}

type Mask = [bigint, bigint, bigint, bigint];

/**
 * A git SHA-1 (40 hex = 20 bytes) left-padded into the 32-byte
 * `Course.content_tx_id` (§11.0): 12 leading zero bytes, then the sha.
 */
export function padContentTxId(sha: string): number[] {
  if (!/^[0-9a-f]{40}$/i.test(sha)) {
    throw new Error(`expected a 40-hex git sha, got "${sha}"`);
  }
  const shaBytes: number[] = [];
  for (let i = 0; i < 40; i += 2) shaBytes.push(parseInt(sha.slice(i, i + 2), 16));
  return [...Array(12).fill(0), ...shaBytes];
}

/** Chain-current test (§11.0): on-chain content_tx_id equals the padded HEAD sha. */
export function contentTxIdMatchesHead(onChain: number[] | Uint8Array, headSha: string): boolean {
  const want = padContentTxId(headSha);
  const got = Array.from(onChain);
  return got.length === 32 && want.every((b, i) => b === got[i]);
}

/**
 * Derive the 256-bit `active_lessons` mask (`[u64; 4]`) from a course's
 * slots.lock.json: one bit set per live (non-retired) slot. This is the only
 * invariant carrier for "slots are never reused" — the chain cannot know it.
 */
export function deriveActiveMask(slots: SlotsLock): Mask {
  const retired = new Set(slots.retired);
  const mask: Mask = [0n, 0n, 0n, 0n];
  for (const slot of Object.values(slots.slots)) {
    if (retired.has(slot)) continue;
    const word = Math.floor(slot / 64);
    const bit = BigInt(slot % 64);
    mask[word] |= 1n << bit;
  }
  return mask;
}

/**
 * Guard for §11.0: `update_course(new_active_lessons)` trusts the authority
 * blindly, so a panel bug could set arbitrary bits. Assert the mask about to be
 * signed equals the mask derived from the committed lockfile, right before
 * signing.
 */
export function assertMaskMatchesLockfile(courseId: string, maskToSend: Mask, slots: SlotsLock): void {
  const expected = deriveActiveMask(slots);
  if (!expected.every((w, i) => w === maskToSend[i])) {
    throw new MaskMismatchError(courseId);
  }
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm --filter web test src/lib/content-sync/__tests__/content-commit.test.ts`
Expected: PASS — 9 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/content-sync/content-commit.ts \
        apps/web/src/lib/content-sync/__tests__/content-commit.test.ts
git commit -m "feat(sync): content_tx_id SHA commitment + active_lessons mask-vs-lockfile assertion (§11.0)"
```

---

### Task 10: The drift model (§11)

**Files:**
- Create: `apps/web/src/lib/content-sync/drift.ts`
- Test: `apps/web/src/lib/content-sync/__tests__/drift.test.ts`

**Interfaces:**
- Consumes: `ChecksState`, `BlockedCommitError` from `./types`; `contentTxIdMatchesHead` from `./content-commit`; `SyncStatus`/`diffCourse` from `@/lib/admin/sync-diff`.
- Produces: `computeContentDrift({ syncedSha, headSha, checks }): { state: ContentDriftState; canSync: boolean }`; `computeChainDrift({ onChainContentTxId, headSha, diffStatus, contentUpToDate }): ChainDriftState`; `assertCommitSyncable(checks, sha)`.

Two drift gaps (§11.1): **content drift** (`contentSync.sha` vs GitHub HEAD → `up_to_date`/`behind`/`never_synced`/`blocked`) and **chain drift** (`content_tx_id == HEAD` equality, plus the surviving `diffCourse` states `not_deployed`/`missing_fields`; `draft` is unreachable in a `createOrReplace`-written dataset). The panel must refuse to sync a red-CI commit, and content sync must land before chain sync (the panel enforces ordering).

- [ ] **Step 1: Write the failing test**

`apps/web/src/lib/content-sync/__tests__/drift.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { computeContentDrift, computeChainDrift, assertCommitSyncable } from "../drift";
import { padContentTxId } from "../content-commit";
import { BlockedCommitError } from "../types";

const HEAD = "b".repeat(40);

describe("computeContentDrift", () => {
  it("never_synced when there is no contentSync doc", () => {
    expect(computeContentDrift({ syncedSha: null, headSha: HEAD, checks: "success" })).toEqual({
      state: "never_synced",
      canSync: true,
    });
  });

  it("up_to_date when synced sha equals HEAD", () => {
    expect(computeContentDrift({ syncedSha: HEAD, headSha: HEAD, checks: "success" })).toEqual({
      state: "up_to_date",
      canSync: false,
    });
  });

  it("blocked (cannot sync) when HEAD's CI is failing", () => {
    expect(computeContentDrift({ syncedSha: "old", headSha: HEAD, checks: "failure" })).toEqual({
      state: "blocked",
      canSync: false,
    });
  });

  it("behind when HEAD is ahead and CI is green", () => {
    expect(computeContentDrift({ syncedSha: "old", headSha: HEAD, checks: "success" })).toEqual({
      state: "behind",
      canSync: true,
    });
  });

  it("blocked overrides never_synced when HEAD is red", () => {
    expect(computeContentDrift({ syncedSha: null, headSha: HEAD, checks: "failure" }).canSync).toBe(false);
  });
});

describe("computeChainDrift", () => {
  it("content_current when content_tx_id equals the padded HEAD sha", () => {
    expect(
      computeChainDrift({ onChainContentTxId: padContentTxId(HEAD), headSha: HEAD, diffStatus: "synced", contentUpToDate: true }),
    ).toBe("content_current");
  });

  it("content_stale when the tx id is the legacy zeros", () => {
    expect(
      computeChainDrift({ onChainContentTxId: Array(32).fill(0), headSha: HEAD, diffStatus: "synced", contentUpToDate: true }),
    ).toBe("content_stale");
  });

  it("passes through not_deployed from diffCourse", () => {
    expect(
      computeChainDrift({ onChainContentTxId: null, headSha: HEAD, diffStatus: "not_deployed", contentUpToDate: true }),
    ).toBe("not_deployed");
  });

  it("blocks the chain-drift verdict until content sync has landed (ordering interlock)", () => {
    expect(
      computeChainDrift({ onChainContentTxId: null, headSha: HEAD, diffStatus: "synced", contentUpToDate: false }),
    ).toBe("awaiting_content_sync");
  });
});

describe("assertCommitSyncable", () => {
  it("throws BlockedCommitError on red CI", () => {
    expect(() => assertCommitSyncable("failure", "sha")).toThrow(BlockedCommitError);
  });
  it("throws on pending CI (do not sync an unfinished commit)", () => {
    expect(() => assertCommitSyncable("pending", "sha")).toThrow(BlockedCommitError);
  });
  it("passes on green CI", () => {
    expect(() => assertCommitSyncable("success", "sha")).not.toThrow();
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm --filter web test src/lib/content-sync/__tests__/drift.test.ts`
Expected: FAIL — `Cannot find module '../drift'`.

- [ ] **Step 3: Implement `src/lib/content-sync/drift.ts`**

```ts
import { type ChecksState, BlockedCommitError } from "./types";
import { contentTxIdMatchesHead } from "./content-commit";
import type { SyncStatus } from "@/lib/admin/sync-diff";

export type ContentDriftState = "up_to_date" | "behind" | "never_synced" | "blocked";

/**
 * Content drift (§11.1): the cached contentSync.sha vs GitHub HEAD. `blocked`
 * means HEAD's CI is red — the panel must refuse to sync it, or a human could
 * click invalid content past the Zod gate. `canSync` folds the CI gate in.
 */
export function computeContentDrift(input: {
  syncedSha: string | null;
  headSha: string;
  checks: ChecksState;
}): { state: ContentDriftState; canSync: boolean } {
  const ciGreen = input.checks === "success";
  if (input.syncedSha === input.headSha) return { state: "up_to_date", canSync: false };
  if (!ciGreen) return { state: input.syncedSha ? "blocked" : "never_synced", canSync: false };
  if (!input.syncedSha) return { state: "never_synced", canSync: true };
  return { state: "behind", canSync: true };
}

export type ChainDriftState =
  | "content_current" // content_tx_id == HEAD (§11.0)
  | "content_stale" // deployed, but content_tx_id != HEAD
  | "not_deployed" // no PDA yet (diffCourse)
  | "missing_fields" // diffCourse
  | "awaiting_content_sync"; // content sync must land first (ordering interlock)

/**
 * Chain drift (§11.0/§11.1). The `content_tx_id == HEAD` equality replaces the
 * field-by-field `diffCourse` heuristic for "is this course current"; the
 * surviving diffCourse states pass through. Content sync must precede chain
 * sync, so a course whose Sanity is not yet at HEAD reports
 * `awaiting_content_sync`.
 */
export function computeChainDrift(input: {
  onChainContentTxId: number[] | Uint8Array | null;
  headSha: string;
  diffStatus: SyncStatus;
  contentUpToDate: boolean;
}): ChainDriftState {
  if (input.diffStatus === "not_deployed") return "not_deployed";
  if (input.diffStatus === "missing_fields") return "missing_fields";
  if (!input.contentUpToDate) return "awaiting_content_sync";
  if (input.onChainContentTxId && contentTxIdMatchesHead(input.onChainContentTxId, input.headSha)) {
    return "content_current";
  }
  return "content_stale";
}

/**
 * Sync-time gate (§11.1 `blocked`): refuse a commit whose CI is not green. Only
 * `success` is syncable — `pending` means the two-sided executor / Zod gate may
 * not have finished, `failure` means it rejected.
 */
export function assertCommitSyncable(checks: ChecksState, sha: string): void {
  if (checks !== "success") throw new BlockedCommitError(sha);
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm --filter web test src/lib/content-sync/__tests__/drift.test.ts && pnpm --filter web typecheck`
Expected: PASS — 12 tests; `tsc` exits 0.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/content-sync/drift.ts \
        apps/web/src/lib/content-sync/__tests__/drift.test.ts
git commit -m "feat(sync): three-way drift model — content drift, chain drift, red-CI refusal"
```

---

### Task 11: The `SanityGateway` seam over `admin-mutations`

**Files:**
- Modify: `apps/web/src/lib/sanity/admin-mutations.ts`
- Create: `apps/web/src/lib/content-sync/gateway.ts`
- Test: `apps/web/src/lib/content-sync/__tests__/gateway.test.ts` (interface conformance via an in-memory fake)

**Interfaces:**
- Consumes: the module-private `sanityAdmin` client in `admin-mutations.ts`; `SanityDoc`, `ManagedType` from `./types`.
- Produces (admin-mutations): `getSanityAdminClient()` (exports the shared write client so the gateway reuses it — no second `SANITY_ADMIN_TOKEN` client); `readManagedDocuments()`, `writeDocuments(docs)`, `deleteDocuments(ids)`, `writeContentSyncSingleton(sha, counts)`, `assetExists(id)`, `uploadImageAsset(bytes, filename)`.
- Produces (gateway): `interface SanityGateway { readManaged(): Promise<SanityDoc[]>; writeDocs(docs): Promise<void>; deleteDocs(ids): Promise<void>; assetExists(id): Promise<boolean>; uploadAsset(bytes, filename): Promise<string>; writeSingleton(sha, counts): Promise<void> }`; `createLiveGateway(): SanityGateway`; `InMemoryGateway` (a test double the orchestrator test uses).

Extract a factory for the existing write client so the gateway does not construct a second one (spec §10.4: one shared `SANITY_ADMIN_TOKEN` client). The gateway batches writes/deletes into `@sanity/client` transactions (§9.7: 25 mutate req/s, 100 concurrent — two orders of magnitude of headroom for ~115 docs).

- [ ] **Step 1: Extract the shared client in `admin-mutations.ts`**

Add near the top (keep the existing `sanityAdmin` usage working):

```ts
/** The shared server-only write client (spec §10.4 — one SANITY_ADMIN_TOKEN
 *  client, held only by the sync job and admin-mutations). */
export function getSanityAdminClient() {
  return sanityAdmin;
}
```

Then append the batch helpers the gateway needs:

```ts
import type { SanityDoc } from "@/lib/content-sync/types";
import { MANAGED_TYPES } from "@/lib/content-sync/types";

/** Read every managed document (with onChainStatus + sync marker) for the sync. */
export async function readManagedDocuments(): Promise<SanityDoc[]> {
  const query = `*[_type in $types]{ ..., onChainStatus, sync }`;
  return sanityAdmin.fetch<SanityDoc[]>(query, { types: [...MANAGED_TYPES] });
}

/** createOrReplace a batch of documents in one transaction. */
export async function writeDocuments(docs: SanityDoc[]): Promise<void> {
  if (docs.length === 0) return;
  let tx = sanityAdmin.transaction();
  for (const doc of docs) tx = tx.createOrReplace(doc as unknown as { _id: string; _type: string });
  await tx.commit({ visibility: "async" });
}

/** Delete a batch of documents by id in one transaction (post write-verify). */
export async function deleteDocuments(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  let tx = sanityAdmin.transaction();
  for (const id of ids) tx = tx.delete(id);
  await tx.commit({ visibility: "async" });
}

/** Write the contentSync singleton LAST (spec §9.4 — never matches the prune). */
export async function writeContentSyncSingleton(
  sha: string,
  counts: Record<string, number>,
): Promise<void> {
  await sanityAdmin.createOrReplace({
    _id: "contentSync",
    _type: "contentSync",
    sha,
    syncedAt: new Date().toISOString(),
    counts,
  });
}

/** True if an image asset with this content-derived id already exists (§9.6). */
export async function assetExists(assetId: string): Promise<boolean> {
  const found = await sanityAdmin.fetch<string | null>(`*[_id == $id][0]._id`, { id: assetId });
  return found !== null;
}

/** Upload image bytes; returns the asset _id (content-derived, so idempotent). */
export async function uploadImageAsset(bytes: Uint8Array, filename: string): Promise<string> {
  const asset = await sanityAdmin.assets.upload("image", Buffer.from(bytes), { filename });
  return asset._id;
}
```

- [ ] **Step 2: Write the failing gateway test**

`apps/web/src/lib/content-sync/__tests__/gateway.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { InMemoryGateway } from "../gateway";
import type { SanityDoc } from "../types";

describe("InMemoryGateway (test double)", () => {
  it("records writes, deletes, asset uploads and the singleton", async () => {
    const gw = new InMemoryGateway([{ _id: "lesson-a", _type: "lesson" }]);
    expect((await gw.readManaged()).map((d) => d._id)).toEqual(["lesson-a"]);

    await gw.writeDocs([{ _id: "lesson-b", _type: "lesson" } as SanityDoc]);
    await gw.deleteDocs(["lesson-a"]);
    const id = await gw.uploadAsset(new Uint8Array([1]), "x.png");
    await gw.writeSingleton("sha1", { lesson: 1 });

    expect(gw.written.map((d) => d._id)).toEqual(["lesson-b"]);
    expect(gw.deleted).toEqual(["lesson-a"]);
    expect(await gw.assetExists(id)).toBe(true);
    expect(gw.singleton).toEqual({ sha: "sha1", counts: { lesson: 1 } });
  });
});
```

- [ ] **Step 3: Run it to see it fail**

Run: `pnpm --filter web test src/lib/content-sync/__tests__/gateway.test.ts`
Expected: FAIL — `Cannot find module '../gateway'`.

- [ ] **Step 4: Implement `src/lib/content-sync/gateway.ts`**

```ts
import type { SanityDoc } from "./types";

export interface SanityGateway {
  readManaged(): Promise<SanityDoc[]>;
  writeDocs(docs: SanityDoc[]): Promise<void>;
  deleteDocs(ids: string[]): Promise<void>;
  assetExists(assetId: string): Promise<boolean>;
  uploadAsset(bytes: Uint8Array, filename: string): Promise<string>;
  writeSingleton(sha: string, counts: Record<string, number>): Promise<void>;
}

/** Live gateway over the shared admin write client (server-only). */
export function createLiveGateway(): SanityGateway {
  // Imported lazily so unit tests never pull `server-only`/env at module load.
  return {
    async readManaged() {
      const { readManagedDocuments } = await import("@/lib/sanity/admin-mutations");
      return readManagedDocuments();
    },
    async writeDocs(docs) {
      const { writeDocuments } = await import("@/lib/sanity/admin-mutations");
      return writeDocuments(docs);
    },
    async deleteDocs(ids) {
      const { deleteDocuments } = await import("@/lib/sanity/admin-mutations");
      return deleteDocuments(ids);
    },
    async assetExists(assetId) {
      const { assetExists } = await import("@/lib/sanity/admin-mutations");
      return assetExists(assetId);
    },
    async uploadAsset(bytes, filename) {
      const { uploadImageAsset } = await import("@/lib/sanity/admin-mutations");
      return uploadImageAsset(bytes, filename);
    },
    async writeSingleton(sha, counts) {
      const { writeContentSyncSingleton } = await import("@/lib/sanity/admin-mutations");
      return writeContentSyncSingleton(sha, counts);
    },
  };
}

/** In-memory double for the orchestrator test — records every mutation. */
export class InMemoryGateway implements SanityGateway {
  written: SanityDoc[] = [];
  deleted: string[] = [];
  assets = new Set<string>();
  singleton: { sha: string; counts: Record<string, number> } | null = null;

  constructor(private existing: SanityDoc[] = []) {}

  async readManaged() {
    return this.existing;
  }
  async writeDocs(docs: SanityDoc[]) {
    this.written.push(...docs);
    // Reflect writes so a same-sha re-run sees them as existing.
    const byId = new Map(this.existing.map((d) => [d._id, d]));
    for (const d of docs) byId.set(d._id, d);
    this.existing = [...byId.values()];
  }
  async deleteDocs(ids: string[]) {
    this.deleted.push(...ids);
    this.existing = this.existing.filter((d) => !ids.includes(d._id));
  }
  async assetExists(assetId: string) {
    return this.assets.has(assetId);
  }
  async uploadAsset(_bytes: Uint8Array, filename: string) {
    const id = `image-${filename}`;
    this.assets.add(id);
    return id;
  }
  async writeSingleton(sha: string, counts: Record<string, number>) {
    this.singleton = { sha, counts };
  }
}
```

- [ ] **Step 5: Run it to verify it passes**

Run: `pnpm --filter web test src/lib/content-sync/__tests__/gateway.test.ts && pnpm --filter web typecheck`
Expected: PASS — 1 test; `tsc` exits 0.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/sanity/admin-mutations.ts \
        apps/web/src/lib/content-sync/gateway.ts \
        apps/web/src/lib/content-sync/__tests__/gateway.test.ts
git commit -m "feat(sync): shared Sanity write client factory + batched gateway seam"
```

---

### Task 12: The `runContentSync` orchestrator — idempotency, red-CI refusal, blast-radius, ordering

**Files:**
- Create: `apps/web/src/lib/content-sync/sync.ts`
- Test: `apps/web/src/lib/content-sync/__tests__/sync.test.ts`

**Interfaces:**
- Consumes: `GitHubClient`, `SanityGateway`, `parseAndValidateTree`, `projectContent`, `reattachPreserved`, `selectChangedDocs`, `selectPrunable`, `assertBlastRadius`, `assertCommitSyncable`, `computeAssetId`/`cdnUrl`, the `GraderSet`.
- Produces: `runContentSync(deps: { sha, github, gateway, graders, projectId, dataset }): Promise<SyncResult>` — the full §9.2 flow with every guard, injectable so the test drives it with fakes.

Order (§9.2, §9.4): (1) refuse red-CI; (2) fetch tarball + extract; (3) authoritative Zod + executor re-validate; (4) upload new assets (skip existing by content-derived id), rewrite prose CDN paths; (5) project; (6) reattach PRESERVE from existing; (7) `selectChangedDocs`; (8) write changed docs, verify the written managed count equals the projected count; (9) `selectPrunable` + `assertBlastRadius` + delete; (10) write the `contentSync` singleton **last**; (11) `revalidateTag("courses")`. Chain deltas (a changed active-lessons mask) are reported, not applied — chain sync is the separate human-gated path (§11.2).

- [ ] **Step 1: Write the failing test**

`apps/web/src/lib/content-sync/__tests__/sync.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { gzipSync } from "node:zlib";
import { stringify } from "yaml";
import { runContentSync } from "../sync";
import { InMemoryGateway } from "../gateway";
import { BlockedCommitError, BlastRadiusError, type SanityDoc } from "../types";
import type { GitHubClient } from "../github";
import type { GraderSet } from "../executor-gate";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

const graders: GraderSet = {
  js: async () => ({ passed: true, failures: [] }),
  rust: async () => ({ passed: true, failures: [] }),
  buildable: async () => ({ passed: true, failures: [] }),
};

// A one-course, one-lesson tarball (reuses the Task 2 tar builder — import it in
// the real suite from a shared fixture; inlined here for brevity).
import { makeCourseTarball } from "./_fixtures";

function github(sha: string, checks: "success" | "failure", tarball: Uint8Array): GitHubClient {
  return {
    fetchTarball: async () => tarball,
    fetchHeadSha: async () => sha,
    fetchChecksState: async () => checks,
  };
}

const deps = (over: Partial<Parameters<typeof runContentSync>[0]> = {}) => ({
  sha: "a".repeat(40),
  github: github("a".repeat(40), "success", makeCourseTarball("a".repeat(40))),
  gateway: new InMemoryGateway([]),
  graders,
  projectId: "p",
  dataset: "production",
  ...over,
});

describe("runContentSync", () => {
  it("refuses to sync a commit whose CI is red (§11.1 blocked)", async () => {
    const d = deps({ github: github("a".repeat(40), "failure", makeCourseTarball("a".repeat(40))) });
    await expect(runContentSync(d)).rejects.toBeInstanceOf(BlockedCommitError);
    expect((d.gateway as InMemoryGateway).written).toEqual([]); // nothing written
  });

  it("writes the projected docs on a first sync and the singleton last", async () => {
    const d = deps();
    const result = await runContentSync(d);
    const gw = d.gateway as InMemoryGateway;
    expect(result.written).toBeGreaterThan(0);
    expect(gw.singleton?.sha).toBe(d.sha);
    // singleton is not part of the managed write batch
    expect(gw.written.some((x) => x._id === "contentSync")).toBe(false);
  });

  it("is idempotent — a second run at the same sha writes and deletes nothing", async () => {
    const gw = new InMemoryGateway([]);
    const sha = "a".repeat(40);
    await runContentSync(deps({ gateway: gw }));
    const writesAfterFirst = gw.written.length;
    const deletesAfterFirst = gw.deleted.length;
    await runContentSync(deps({ gateway: gw, github: github(sha, "success", makeCourseTarball(sha)) }));
    expect(gw.written.length).toBe(writesAfterFirst); // zero additional writes
    expect(gw.deleted.length).toBe(deletesAfterFirst); // zero additional deletes
  });

  it("aborts before any delete when the prune set exceeds 20%", async () => {
    // Seed the gateway with many stale managed docs from an old sha; the new
    // tree has one course, so nearly all would prune.
    const stale: SanityDoc[] = Array.from({ length: 50 }, (_v, i) => ({
      _id: `lesson-old-${i}`,
      _type: "lesson",
      sync: { source: "academy-courses", rev: "oldsha" },
    }));
    const gw = new InMemoryGateway(stale);
    await expect(runContentSync(deps({ gateway: gw }))).rejects.toBeInstanceOf(BlastRadiusError);
    expect(gw.deleted).toEqual([]); // never deleted anything
  });

  it("prunes a small stale set and reports the count", async () => {
    // 9 current-ish + 1 stale → prune 1 of 10 managed (< 20%).
    const current: SanityDoc[] = Array.from({ length: 9 }, (_v, i) => ({
      _id: `lesson-keep-${i}`,
      _type: "lesson",
      sync: { source: "academy-courses", rev: "a".repeat(40) },
    }));
    const stale: SanityDoc = { _id: "lesson-gone", _type: "lesson", sync: { source: "academy-courses", rev: "oldsha" } };
    const gw = new InMemoryGateway([...current, stale]);
    const result = await runContentSync(deps({ gateway: gw }));
    expect(gw.deleted).toContain("lesson-gone");
    expect(result.pruned).toBe(1);
  });
});
```

Also create the shared fixture `apps/web/src/lib/content-sync/__tests__/_fixtures.ts` exporting `makeCourseTarball(sha)` — it reuses the `makeTar` helper from Task 2 and `gzipSync` to build a valid one-course, one-lesson tree (`course.yaml`, `slots.lock.json`, `lesson.yaml`, `intro.md`) so `parseAndValidateTree` accepts it.

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm --filter web test src/lib/content-sync/__tests__/sync.test.ts`
Expected: FAIL — `Cannot find module '../sync'`.

- [ ] **Step 3: Implement `src/lib/content-sync/sync.ts`**

```ts
import { revalidateTag } from "next/cache";
import { COURSES_CACHE_TAG } from "@/lib/sanity/queries";
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

export interface SyncDeps {
  sha: string;
  github: GitHubClient;
  gateway: SanityGateway;
  graders: GraderSet;
  projectId: string;
  dataset: string;
}

/** Image dimensions are needed for the content-derived id; a tiny probe keeps
 *  this dependency-free (real impl may swap in `image-size`). Placeholder dims
 *  are acceptable because the SHA-1 is the dedupe key; dims only shape the url. */
function probeDims(_bytes: Uint8Array): { width: number; height: number } {
  return { width: 0, height: 0 };
}
function formatOf(path: string): string {
  const m = /\.(\w+)$/.exec(path);
  return (m?.[1] ?? "png").toLowerCase();
}

/** Upload new assets (skip existing by content-derived id) and return a
 *  repo-path → CDN-url map for the markdown rewrite. */
async function syncAssets(
  assets: AssetUpload[],
  deps: SyncDeps,
): Promise<{ urlByPath: Map<string, string>; uploaded: number }> {
  const urlByPath = new Map<string, string>();
  let uploaded = 0;
  for (const a of assets) {
    const id = computeAssetId(a.bytes, probeDims(a.bytes), formatOf(a.path));
    if (!(await deps.gateway.assetExists(id))) {
      await deps.gateway.uploadAsset(a.bytes, a.path.split("/").pop() ?? "asset");
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
    deps,
  );

  // 5. Project (resolving prose/code/idl + rewriting image paths via the map).
  const resolveTests = (dir: string, rel: string): unknown[] => {
    const raw = tree.get(`${dir}/${rel}`);
    return raw ? (JSON.parse(new TextDecoder().decode(raw)) as unknown[]) : [];
  };
  const resolveAsset = (repoPath: string) => {
    const url = urlByPath.get(repoPath);
    return url ? { _type: "image" as const, asset: { _ref: url } } : null;
  };
  const { docs: projected } = projectContent(validated, deps.sha, resolveAsset, resolveTests);

  // 6. Reattach PRESERVE from existing docs.
  const existing = await deps.gateway.readManaged();
  const existingById = new Map(existing.map((d) => [d._id, d]));
  const merged = projected.map((p) => reattachPreserved(p, existingById.get(p._id)));

  // 7. Idempotent change set.
  const changed = selectChangedDocs(existing, merged);

  // 8. Write everything first, then verify the count (§9.4 guard 3).
  await deps.gateway.writeDocs(changed);
  const afterWrite = await deps.gateway.readManaged();
  const managedNow = afterWrite.filter((d) => (MANAGED_TYPES as readonly string[]).includes(d._type));
  const projectedManaged = merged.filter((d) => (MANAGED_TYPES as readonly string[]).includes(d._type));
  if (managedNow.length < projectedManaged.length) {
    throw new Error(
      `write-verify failed: ${managedNow.length} managed docs present, expected >= ${projectedManaged.length}`,
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
```

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm --filter web test src/lib/content-sync/__tests__/sync.test.ts && pnpm --filter web typecheck`
Expected: PASS — 5 tests; `tsc` exits 0.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/content-sync/sync.ts \
        apps/web/src/lib/content-sync/__tests__/sync.test.ts \
        apps/web/src/lib/content-sync/__tests__/_fixtures.ts
git commit -m "feat(sync): runContentSync orchestrator — guards, idempotency, ordering (§9.2/§9.4)"
```

---

### Task 13: `content_tx_id` + mask wired into the chain-sync signer (§11.0)

**Files:**
- Modify: `apps/web/src/lib/solana/admin-signer.ts`
- Modify: `apps/web/src/app/api/admin/courses/sync/route.ts`
- Test: `apps/web/src/lib/content-sync/__tests__/signer-commit.test.ts`

**Interfaces:**
- Consumes: `padContentTxId`, `deriveActiveMask`, `assertMaskMatchesLockfile` from `@/lib/content-sync/content-commit`; program v2's `new_content_tx_id` + `new_active_lessons` (prerequisite).
- Produces: `deployCoursePda`/`updateCoursePda` accept `contentSha` + `slotsLock`, write `content_tx_id = padContentTxId(sha)`, and set/verify `active_lessons`; a pure helper `buildCourseCommit({ contentSha, slotsLock }): { contentTxId: number[]; activeLessons: [bigint,bigint,bigint,bigint] }` that the route calls and the test drives.

This is the chain half of §11.0: the git SHA lands in `content_tx_id` (in the same `update_course` call that sets the mask, so provenance and structure can never disagree). The route derives the mask from the committed lockfile and the signer asserts equality **right before signing**.

- [ ] **Step 1: Write the failing test**

`apps/web/src/lib/content-sync/__tests__/signer-commit.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildCourseCommit } from "@/lib/solana/admin-signer";
import { MaskMismatchError } from "../types";

const sha = "c".repeat(40);
const slots = { version: 1, slots: { a: 0, b: 1 }, retired: [], next: 2 };

describe("buildCourseCommit", () => {
  it("packs the sha into 32 bytes and derives the mask from the lockfile", () => {
    const commit = buildCourseCommit({ contentSha: sha, slotsLock: slots });
    expect(commit.contentTxId).toHaveLength(32);
    expect(commit.activeLessons[0]).toBe(3n); // bits 0 and 1 set
  });

  it("throws if a caller-supplied mask disagrees with the lockfile", () => {
    expect(() =>
      buildCourseCommit({ contentSha: sha, slotsLock: slots, assertMask: [1n, 0n, 0n, 0n] }),
    ).toThrow(MaskMismatchError);
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm --filter web test src/lib/content-sync/__tests__/signer-commit.test.ts`
Expected: FAIL — `buildCourseCommit` is not exported.

- [ ] **Step 3: Add `buildCourseCommit` to `admin-signer.ts`**

```ts
import {
  padContentTxId,
  deriveActiveMask,
  assertMaskMatchesLockfile,
} from "@/lib/content-sync/content-commit";

interface SlotsLock {
  version: number;
  slots: Record<string, number>;
  retired: number[];
  next: number;
}

/**
 * Build the on-chain content commitment for a course (§11.0): the 32-byte
 * content_tx_id (git sha left-padded) and the active_lessons mask derived from
 * the committed slots.lock.json. If `assertMask` is supplied (the mask the panel
 * intends to send), verify it matches the lockfile before returning — the guard
 * that stops a panel bug setting arbitrary bits, since update_course trusts the
 * authority blindly.
 */
export function buildCourseCommit(input: {
  contentSha: string;
  slotsLock: SlotsLock;
  assertMask?: [bigint, bigint, bigint, bigint];
}): { contentTxId: number[]; activeLessons: [bigint, bigint, bigint, bigint] } {
  const activeLessons = deriveActiveMask(input.slotsLock);
  if (input.assertMask) {
    assertMaskMatchesLockfile(input.contentSha.slice(0, 8), input.assertMask, input.slotsLock);
  }
  return { contentTxId: padContentTxId(input.contentSha), activeLessons };
}
```

Then thread `contentTxId`/`activeLessons` into the on-chain params. In `deployCoursePda`, replace `contentTxId: Array(32).fill(0)` with the passed commit; in `updateCoursePda`, set `newContentTxId` and `newActiveLessons` (program v2) from the commit instead of `null`. Convert each `bigint` mask word to the `BN`/`u64` the IDL expects. Add `contentSha` + `slotsLock` to `CreateCourseAdminParams`/`UpdateCourseAdminParams`. Gate the on-chain write on program v2 being deployed (the IDL exposing `new_active_lessons`); until then keep the legacy zero write behind a feature check so this task's pure helper + test land independently.

- [ ] **Step 4: Call it from the chain-sync route**

In `apps/web/src/app/api/admin/courses/sync/route.ts`, before signing, load the course's committed `slots.lock.json` sha + lockfile (from the drift/sync context — the `contentSync` singleton's sha is HEAD, and the lockfile comes from the last synced tree) and pass `buildCourseCommit({ contentSha, slotsLock })` into `deployCoursePda`/`updateCoursePda`. Enforce the ordering interlock: refuse chain sync (400) when content drift is not `up_to_date` for that course (the mask/commitment cannot be computed from a Sanity that has not ingested the new lesson — §11.1).

- [ ] **Step 5: Run it to verify it passes**

Run: `pnpm --filter web test src/lib/content-sync/__tests__/signer-commit.test.ts && pnpm --filter web typecheck`
Expected: PASS — 2 tests; `tsc` exits 0.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/solana/admin-signer.ts \
        apps/web/src/app/api/admin/courses/sync/route.ts \
        apps/web/src/lib/content-sync/__tests__/signer-commit.test.ts
git commit -m "feat(sync): write content_tx_id (sha) + assert active_lessons mask at chain sync (§11.0)"
```

---

### Task 14: `POST /api/admin/content/sync` route

**Files:**
- Create: `apps/web/src/app/api/admin/content/sync/route.ts`
- Test: `apps/web/src/app/api/admin/content/sync/__tests__/route.test.ts`

**Interfaces:**
- Consumes: `requireAdminAuth`/`adminUnauthorizedResponse`/`AdminAuthError`; `runContentSync`; `createGitHubClient`; `createLiveGateway`; the real `GraderSet` (wired from `@/lib/challenge/executor` + `rust-executor` + buildable executor); the error classes.
- Produces: `POST(req)` → `{ sha }` in, `SyncResult` out; maps `BlockedCommitError`→409, `ContentValidationError`→422 (with issues), `BlastRadiusError`→409 (with an `override` hint), `GitHubUnavailableError`→503, `MaskMismatchError`→409, else 500. 401 without a valid admin cookie.

Thin handler: auth, parse+guard the body, build the real deps, delegate, map errors to status codes. HEAD sha is not accepted from the client — the client sends the exact `sha` it saw in the drift panel, and the route re-checks its CI.

- [ ] **Step 1: Write the failing test**

`apps/web/src/app/api/admin/content/sync/__tests__/route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/admin/auth", () => ({
  AdminAuthError: class AdminAuthError extends Error {},
  adminUnauthorizedResponse: () =>
    new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
  requireAdminAuth: vi.fn(),
}));
const runContentSync = vi.fn();
vi.mock("@/lib/content-sync/sync", () => ({ runContentSync: (...a: unknown[]) => runContentSync(...a) }));
vi.mock("@/lib/content-sync/github", () => ({ createGitHubClient: () => ({}) }));
vi.mock("@/lib/content-sync/gateway", () => ({ createLiveGateway: () => ({}) }));
vi.mock("@/lib/content-sync/graders", () => ({ createLiveGraders: () => ({}) }));

import { POST } from "../route";
import { requireAdminAuth } from "@/lib/admin/auth";
import { BlockedCommitError, ContentValidationError } from "@/lib/content-sync/types";

const post = (body: unknown) =>
  POST(new Request("https://x/api/admin/content/sync", { method: "POST", body: JSON.stringify(body) }));

beforeEach(() => {
  runContentSync.mockReset();
  (requireAdminAuth as unknown as ReturnType<typeof vi.fn>).mockReset();
});

describe("POST /api/admin/content/sync", () => {
  it("401 when the admin cookie is missing", async () => {
    const { AdminAuthError } = (await import("@/lib/admin/auth")) as unknown as { AdminAuthError: new () => Error };
    (requireAdminAuth as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new AdminAuthError();
    });
    expect((await post({ sha: "a".repeat(40) })).status).toBe(401);
  });

  it("400 when sha is missing or malformed", async () => {
    expect((await post({})).status).toBe(400);
    expect((await post({ sha: "nope" })).status).toBe(400);
  });

  it("returns the SyncResult on success", async () => {
    runContentSync.mockResolvedValue({ sha: "a".repeat(40), written: 3, skipped: 0, pruned: 0, assetsUploaded: 0, pendingChainDeltas: [] });
    const res = await post({ sha: "a".repeat(40) });
    expect(res.status).toBe(200);
    expect((await res.json()).written).toBe(3);
  });

  it("409 on a blocked commit", async () => {
    runContentSync.mockRejectedValue(new BlockedCommitError("a".repeat(40)));
    expect((await post({ sha: "a".repeat(40) })).status).toBe(409);
  });

  it("422 with issues on a validation failure", async () => {
    runContentSync.mockRejectedValue(new ContentValidationError(["bad course id"]));
    const res = await post({ sha: "a".repeat(40) });
    expect(res.status).toBe(422);
    expect((await res.json()).issues).toEqual(["bad course id"]);
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm --filter web test src/app/api/admin/content/sync/__tests__/route.test.ts`
Expected: FAIL — `Cannot find module '../route'`.

- [ ] **Step 3: Implement the route**

First add `apps/web/src/lib/content-sync/graders.ts` — `createLiveGraders(): GraderSet` wiring the real executors (`runJsSubmission` → `js`; `runRustSubmission` → `rust`; the buildable executor → `buildable`), each adapting `(code, tests) → { passed, failures }`.

`apps/web/src/app/api/admin/content/sync/route.ts`:

```ts
import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth, adminUnauthorizedResponse, AdminAuthError } from "@/lib/admin/auth";
import { env } from "@/lib/env";
import { runContentSync } from "@/lib/content-sync/sync";
import { createGitHubClient } from "@/lib/content-sync/github";
import { createLiveGateway } from "@/lib/content-sync/gateway";
import { createLiveGraders } from "@/lib/content-sync/graders";
import {
  BlockedCommitError,
  ContentValidationError,
  BlastRadiusError,
  GitHubUnavailableError,
  MaskMismatchError,
} from "@/lib/content-sync/types";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    requireAdminAuth(req);
  } catch (e) {
    if (e instanceof AdminAuthError) return adminUnauthorizedResponse();
    throw e;
  }

  let sha: string;
  try {
    const body = (await req.json()) as { sha?: unknown };
    if (typeof body.sha !== "string" || !/^[0-9a-f]{40}$/i.test(body.sha)) {
      return NextResponse.json({ error: "a 40-hex commit sha is required" }, { status: 400 });
    }
    sha = body.sha;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const result = await runContentSync({
      sha,
      github: createGitHubClient(),
      gateway: createLiveGateway(),
      graders: createLiveGraders(),
      projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      dataset: env.NEXT_PUBLIC_SANITY_DATASET,
    });
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof BlockedCommitError) return NextResponse.json({ error: e.message }, { status: 409 });
    if (e instanceof MaskMismatchError) return NextResponse.json({ error: e.message }, { status: 409 });
    if (e instanceof BlastRadiusError) {
      return NextResponse.json({ error: e.message, override: "explicit admin override required" }, { status: 409 });
    }
    if (e instanceof ContentValidationError) {
      return NextResponse.json({ error: e.message, issues: e.issues }, { status: 422 });
    }
    if (e instanceof GitHubUnavailableError) {
      return NextResponse.json({ error: e.message }, { status: 503 });
    }
    console.error("[admin/content/sync]", e);
    return NextResponse.json({ error: "Content sync failed" }, { status: 500 });
  }
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm --filter web test src/app/api/admin/content/sync/__tests__/route.test.ts && pnpm --filter web typecheck`
Expected: PASS — 5 tests; `tsc` exits 0.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/api/admin/content/sync/route.ts \
        apps/web/src/lib/content-sync/graders.ts \
        apps/web/src/app/api/admin/content/sync/__tests__/route.test.ts
git commit -m "feat(sync): POST /api/admin/content/sync (ADMIN_SECRET) with error→status mapping"
```

---

### Task 15: `GET /api/admin/content/drift` + the three-way drift panel

**Files:**
- Create: `apps/web/src/app/api/admin/content/drift/route.ts`
- Create: `apps/web/src/components/admin/content-sync-panel.tsx`
- Test: `apps/web/src/app/api/admin/content/drift/__tests__/route.test.ts`

**Interfaces:**
- Consumes: `requireAdminAuth`; `createGitHubClient`; `computeContentDrift`/`computeChainDrift`; `diffCourse`; `readManagedDocuments`; the `contentSync` singleton; per-course on-chain `content_tx_id` via `fetchCourse`.
- Produces: `GET(req)` → `{ content: { state, canSync, syncedSha, headSha, checks }, courses: [{ id, chainDrift }] }`; a `<ContentSyncPanel>` client component that renders the three states and disables the Sync button on `blocked`/`up_to_date`, and disables per-course chain sync until content is `up_to_date` (ordering interlock).

The panel is the §11.1 surface: content drift (green / "Sync content (N behind)" / first-run banner / red-blocked) and chain drift (`content_current` / `content_stale` / `not_deployed` / `awaiting_content_sync`). It wires into the existing admin dashboard alongside the course/achievement sync tables.

- [ ] **Step 1: Write the failing route test**

`apps/web/src/app/api/admin/content/drift/__tests__/route.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/admin/auth", () => ({
  AdminAuthError: class extends Error {},
  adminUnauthorizedResponse: () => new Response("{}", { status: 401 }),
  requireAdminAuth: vi.fn(),
}));
vi.mock("@/lib/content-sync/github", () => ({
  createGitHubClient: () => ({
    fetchHeadSha: async () => "b".repeat(40),
    fetchChecksState: async () => "success",
    fetchTarball: async () => new Uint8Array(),
  }),
}));
vi.mock("@/lib/sanity/admin-mutations", () => ({
  readManagedDocuments: async () => [],
  readContentSyncSingleton: async () => ({ sha: "a".repeat(40) }),
}));
vi.mock("@/lib/sanity/queries", () => ({ getAllCoursesAdmin: async () => [], COURSES_CACHE_TAG: "courses" }));

import { GET } from "../route";

describe("GET /api/admin/content/drift", () => {
  it("returns content drift computed from HEAD vs the singleton", async () => {
    const res = await GET(new Request("https://x/api/admin/content/drift"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { content: { state: string; canSync: boolean } };
    expect(body.content.state).toBe("behind"); // synced=a…, head=b…, ci green
    expect(body.content.canSync).toBe(true);
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm --filter web test src/app/api/admin/content/drift/__tests__/route.test.ts`
Expected: FAIL — `Cannot find module '../route'`.

- [ ] **Step 3: Implement the drift route**

`apps/web/src/app/api/admin/content/drift/route.ts` — a `GET` handler that: auths; reads the `contentSync` singleton sha (add `readContentSyncSingleton()` to `admin-mutations.ts`) and GitHub HEAD + checks; computes `computeContentDrift`; then for each course reads its on-chain `content_tx_id` (via `fetchCourse`) + `diffCourse` status and computes `computeChainDrift` (passing `contentUpToDate = contentDrift.state === "up_to_date"` for the ordering interlock); returns the combined shape. Wrap GitHub failure as a 503 so the panel shows "drift unavailable" rather than crashing.

- [ ] **Step 4: Implement `content-sync-panel.tsx`**

A `"use client"` component fetching `/api/admin/content/drift`, rendering:
- `never_synced` → first-run banner + enabled "Sync content" button;
- `up_to_date` → green check, button disabled;
- `behind` → "Sync content (N commits behind)" + enabled button that `POST`s `{ sha: headSha }` to `/api/admin/content/sync`;
- `blocked` → red "HEAD CI is failing — cannot sync", button disabled.
Per-course rows show chain drift; the chain-sync action is disabled unless content is `up_to_date`. All strings via `next-intl` (`useTranslations`), accessible (button `aria-disabled`, focus-visible ring), matching the existing admin table styling. No new secret touches the client — the panel only calls the two admin routes.

- [ ] **Step 5: Run it to verify it passes**

Run: `pnpm --filter web test src/app/api/admin/content/drift/__tests__/route.test.ts && pnpm --filter web typecheck`
Expected: PASS — 1 test; `tsc` exits 0.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/api/admin/content/drift/route.ts \
        apps/web/src/components/admin/content-sync-panel.tsx \
        apps/web/src/lib/sanity/admin-mutations.ts \
        apps/web/src/app/api/admin/content/drift/__tests__/route.test.ts
git commit -m "feat(sync): drift route + three-way content-sync admin panel (blocked disables sync)"
```

---

### Task 16: Docs — `GITHUB_TOKEN`, the sync trigger, the drift UI

**Files:**
- Modify: `apps/web/CLAUDE.md` (Environment Variables + API routes table)
- Modify: `docs/DEPLOYMENT.md` (env var; public dataset; no `SANITY_ADMIN_TOKEN` in Actions)
- Modify: `docs/ADMIN.md` (content-sync trigger; three-way drift UI; the `blocked` state)

**Interfaces:**
- Consumes: the routes + env var from Tasks 1–15.
- Produces: documentation matching the shipped behaviour (spec §16.4 Phase 7 docs gate; §9.2 says the token has no existing doc and must be added).

Docs are a per-phase gate, not a final phase (§16.4) — this task lands with the routes, not after.

- [ ] **Step 1: Document `GITHUB_TOKEN` in `apps/web/CLAUDE.md`**

In the Environment Variables block, under the Admin/Backend section, add:

```bash
# Fine-grained READ token for solanabr/academy-courses (server-only, never
# NEXT_PUBLIC_). Powers POST /api/admin/content/sync (tarball fetch), the drift
# UI (HEAD polling), and the Checks API (blocked state). Unauthenticated GitHub
# is 60 req/hr per IP and flakes on Vercel's shared egress. Unset → the two
# /api/admin/content/* routes return 503.
GITHUB_TOKEN=
```

Add the two new routes to the Admin API routes table:

```markdown
| `/api/admin/content/sync`  | POST | ADMIN_SECRET | Sync academy-courses@sha → Sanity (re-validate, PRESERVE, prune, content_tx_id) |
| `/api/admin/content/drift` | GET  | ADMIN_SECRET | Three-way drift: content (repo→Sanity) + chain (Sanity→devnet) |
```

- [ ] **Step 2: Document it in `docs/DEPLOYMENT.md`**

Add `GITHUB_TOKEN` to the server-only env var list with the same rationale, and note (spec §10.4 / §13) that the Sanity dataset is public, the read path uses no browser token, and `SANITY_ADMIN_TOKEN` is held only by the sync job + `admin-mutations.ts` — never in GitHub Actions.

- [ ] **Step 3: Document the trigger + drift UI in `docs/ADMIN.md`**

Describe: content sync is admin-triggered from the panel (never automatic, §D8); the three content states (`up_to_date`/`behind`/`never_synced`/`blocked`) and that a red-CI HEAD is un-syncable; the chain-drift states and the ordering interlock (content sync must land before chain sync); and the blast-radius override.

- [ ] **Step 4: Verify docs reference reality**

Run: `grep -n "GITHUB_TOKEN" apps/web/CLAUDE.md docs/DEPLOYMENT.md`
Expected: matches in both files.

- [ ] **Step 5: Commit**

```bash
git add apps/web/CLAUDE.md docs/DEPLOYMENT.md docs/ADMIN.md
git commit -m "docs(sync): GITHUB_TOKEN, content-sync trigger, three-way drift UI"
```

---

## Verification

Run the full content-sync suite and the type check:

```bash
pnpm --filter web test src/lib/content-sync
pnpm --filter web test src/app/api/admin/content
pnpm --filter web typecheck
```

Expected: all content-sync unit tests pass; both route suites pass; `tsc` exits 0.

The load-bearing guarantees, each proven by a named test:

- **Idempotency** — `sync.test.ts` "is idempotent — a second run at the same sha writes and deletes nothing" (`selectChangedDocs` returns `[]`, `selectPrunable` returns `[]`).
- **Prune safety** — `prune.test.ts` "NEVER selects an unmarked doc" + `sync.test.ts` "aborts before any delete when the prune set exceeds 20%" (`assertBlastRadius` throws before `deleteDocs`).
- **PRESERVE** — `preserve.test.ts` "carries onChainStatus across a re-sync" + the CI equality "throws when Sanity has an unregistered field".
- **Red-CI refusal** — `drift.test.ts` "throws BlockedCommitError on red CI" + `sync.test.ts` "refuses to sync a commit whose CI is red" (nothing written).
- **content_tx_id + mask** — `content-commit.test.ts` (20→32 pad, HEAD equality, mask derivation) + `signer-commit.test.ts` (mask-vs-lockfile assertion).

## Self-Review — spec coverage (the 7 required items)

1. **`POST /api/admin/content/sync` (ADMIN_SECRET), §9.2 flow** — Tasks 3 (tarball fetch + `GITHUB_TOKEN`), 5 (re-validate with `@superteam-lms/content-schema`), 6 (write Sanity docs), 12 (orchestrator ties it together + `revalidateTag("courses")`), 13 (`content_tx_id` commitment), 14 (the route). `GITHUB_TOKEN` documented in Task 1 + Task 16.
2. **Idempotent write + PRESERVE** — Task 6 (deterministic `_id`, `createOrReplace`-shaped docs), Task 8 (`reattachPreserved`, `readManagedDocuments` one-GROQ read via Task 11, the `sanitySchemaFields == projected ∪ PRESERVE` CI assertion), Task 12 (`selectChangedDocs` → zero mutations on same sha).
3. **Prune guards (§9.4)** — Task 6 (`sync:{source,rev}`, non-`_` field), Task 8 (`prunableQuery`, `selectPrunable` never selects unmarked, `assertBlastRadius` 20%), Task 12 (write-verify-count-then-prune, singleton written last), weak refs from CS-5 prerequisite; 10k delete cap noted in Global Constraints.
4. **Assets (§9.6)** — Task 7 (`computeAssetId` from SHA-1, skip-if-exists via `assetExists`, `rewriteMarkdownAssetPaths` → CDN), Task 12 (`syncAssets`).
5. **content_tx_id commitment (§11.0)** — Task 9 (`padContentTxId` 20→32, `deriveActiveMask`, `assertMaskMatchesLockfile`), Task 13 (`buildCourseCommit` wired into `deployCoursePda`/`updateCoursePda` via `new_content_tx_id` + the mask assertion right before signing).
6. **Drift UI (§11)** — Task 10 (`computeContentDrift` → up_to_date/behind/never_synced/blocked; `computeChainDrift` → `content_tx_id == HEAD` + surviving `diffCourse` states; `assertCommitSyncable` refuses red CI), Task 15 (drift route + three-way panel; blocked disables sync; content-before-chain ordering interlock).
7. **Server-side executor gate at sync time (§6.2a)** — Task 4 (`gateCodeBlock`, tiered JS/Rust/buildable, two-sided), Task 5 (runs it during re-validation), Task 14 (`createLiveGraders` wires the real executors).

**Cross-plan consistency:** managed doc `_id`s, the `sync` marker shape, `onChainStatus` PRESERVE, weak refs, and the block field names all mirror the CS-5 Sanity schema; the Zod schema names mirror CS-1; the mask + `new_content_tx_id` mirror the program-v2 (CS-3) IDL. Type names are consistent across tasks (`SanityDoc`, `RepoTree`, `GraderSet`, `SanityGateway`, `SyncResult`, `ContentDriftState`, `ChainDriftState`).

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-07-09-content-sync-route.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration. REQUIRED SUB-SKILL: `superpowers:subagent-driven-development`.

**2. Inline Execution** — execute tasks in this session using `superpowers:executing-plans`, batch execution with checkpoints.

Prerequisites (CS-1, CS-5, CS-8 extraction, program v2) must be merged before Task 5 (schema import), Task 9/13 (mask + `new_content_tx_id`), and Task 12 (fixture validation) can pass.
