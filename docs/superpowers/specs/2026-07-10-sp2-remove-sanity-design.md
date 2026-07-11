# SP2 — Remove Sanity (Design)

**Date:** 2026-07-10 · **Rev 2:** 2026-07-11 (post tri-audit + independent second-session validation — 1 critical, 6 high findings folded in; three owner decisions locked)
**Status:** Rev 2 pending owner sign-off before plan execution.
**Epic context:** Second of three sub-projects (SP1 retire teacher-authoring ✅ → **SP2 remove Sanity** → SP3 admin panel v2). Git (`solanabr/courses-academy`) is already the source of truth; Sanity is now only a rebuildable projection + a home for mutable on-chain status. SP2 deletes the projection and relocates the mutable state, making git→build the entire content path.

## Goal

Remove Sanity entirely. Content (including images) compiles from `courses-academy` into a typed, committed bundle; the mutable on-chain deploy status moves to Supabase; the app reads content from the bundle and status from Supabase. Delete the Studio, the sync layer, and every Sanity dependency.

## Owner decisions (locked, rev 2)

1. **Read layer = compiled bundle, COMMITTED to the app repo.** `scripts/compile-content.ts` fetches `courses-academy` at the `content.lock` SHA, re-validates with `@superteam-lms/content-schema` (fail-closed at compile time, not deploy time), and emits typed JSON + static assets that are **checked in**. Publishing = one PR that bumps `content.lock` and regenerates the committed bundle — the content diff is reviewable in the PR. Consequences: deploys never depend on GitHub availability or content validity (a last-good bundle is always present — closes the "bad content blocks urgent hotfixes" failure); CI/typecheck/dev/preview all consume the committed bundle with no extra build step; builds are reproducible by construction.
2. **Images live in `courses-academy` git.** Today thumbnails are Studio-authored (git-unsourced — a hole in "only onChainStatus is mutable") and all images serve from `cdn.sanity.io` via the projector's asset pipeline (`lib/content-sync/assets.ts`). Fix: add `thumbnail` to the content schema, migrate the 6 Studio thumbnails into the repo (prerequisite content PR), and have the compiler copy `assets/**` into `apps/web/public/content-assets/` and rewrite markdown/thumbnail paths. Zero external image host; images version with content.
3. **onChainStatus migration = one-cut, not dual-write.** A single SENSITIVE PR creates the Supabase table, **backfills every existing synced doc's status from Sanity**, and flips reads/writes to Supabase. Dual-write is dropped: it added a non-atomic, silently-divergent write path (the existing status write is already best-effort `console.error`) and still required the backfill anyway. The backfill is mandatory regardless — without it the 6 live courses have no Supabase row and the read flip empties the catalog **and breaks credential minting / achievement awards** (the reward paths resolve courses through the same gated queries: `certificates/mint/route.ts`, `helius/event-handlers.ts`, `onchain-queue.ts`).

## Ground truth (measured on main 6923587; re-measure at plan time with the stated commands)

- ~50–56 files import `@/lib/sanity` / `@sanity/*` / `next-sanity` (52 under apps/web by `git grep -l -E "from ['\"](@/lib/sanity|@sanity/|next-sanity)"`; earlier "59" was over-counted).
- 21 exported query functions in `apps/web/src/lib/sanity/queries.ts` — includes SP1's `getInstructorCourses` / `isInstructorWallet`. Plus **one inline `sanityFetch` outside queries.ts**: the teacher stats route (`api/teacher/courses/[id]/stats/route.ts`) resolves `instructor->wallet` — migrate it explicitly.
- `onChainStatus` in 15 files under `apps/web/src` (11 non-test + 4 tests).
- The public visibility gate is **three clauses**, not two: `onChainStatus.status == "synced" && coalesce(onChainStatus.isActive, true) && (authoringStatus == "approved" || !defined(authoringStatus))` (queries.ts:15,23,122 and 9 more sites).
- **Status writers are ≥4 sites, not 2**: the two sync routes, `admin/courses/{deactivate,reactivate}` (write `isActive`), and `lib/solana/admin-signer.ts` (writes `trackCollectionAddress`).
- The deploy/drift path fetches `slots.lock.json` from **live GitHub at request time** (tarball at the content-sync singleton's SHA — `courses/sync/route.ts:56-83`, `admin/content/drift/route.ts`); the synced-SHA source of truth is a Sanity singleton (`readContentSyncSingleton`).
- `lib/content-sync/github.ts` is `server-only` + imports `env.server` (throws without unrelated secrets) — the compile script reuses `extractTarball` but re-implements the ~10-line fetch.
- Bundle types come from `packages/types` (content-schema lacks `thumbnail`; `onChainStatus`/`authoringStatus` are deliberately absent from the bundle).
- Current caching to reproduce: public catalog reads = ISR 3600 tagged `COURSES_CACHE_TAG="courses"`, purged via `revalidateTag` on sync; admin/grading reads = revalidate 0.

## Architecture — four data planes, one home each

| Plane                                                                                                                                                                                                                                | After SP2                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Content** (courses, modules, lessons/blocks, instructors, achievements, paths)                                                                                                                                                     | compiled typed JSON, **committed** at `apps/web/src/content/generated/`; read via a typed **`server-only`** `lib/content/*` API with the SAME function names + return types (from `packages/types`) as today's `queries.ts`                                                                                                                                                                                                                                                                                                                                                           |
| **Images** (thumbnails, avatars, in-lesson markdown assets)                                                                                                                                                                          | files in `courses-academy` git → compiler copies into `apps/web/public/content-assets/` + rewrites paths. `cdn.sanity.io` exits `next.config.mjs` remotePatterns/CSP at SP2-D                                                                                                                                                                                                                                                                                                                                                                                                         |
| **On-chain status** (`status`, `coursePda`, `txSignature`, `collectionAddress`, **`trackCollectionAddress`** (credential-mint pointer — was missing from rev 1's column list), `achievementPda`, `isActive`, `lastSynced`) — mutable | Supabase table **`onchain_deployments`** (keyed by content id `course-*` / `achievement-*`; distinct from the existing `deployed_programs`, which is per-learner practice deploys), written by the deploy/deactivate/reactivate routes; public read surface via a **view** of non-sensitive columns (house `public_user_xp` pattern — Supabase RLS is row-level, not column-level); writes service_role-only                                                                                                                                                                          |
| **Visibility gate**                                                                                                                                                                                                                  | content (bundle) + one cached `getActiveDeployments()` **map** per request (no per-course N+1) from Supabase via a **cookieless** client (the house `server.ts` client uses `cookies()` and would force catalog + all lesson pages dynamic), wrapped in `unstable_cache` tagged `"courses"` / 1h, purged by `revalidateTag` on every status write. Outage behavior: serve the cached map; only a cold cache + Supabase outage fails closed (hidden > leaked). **`authoringStatus` is declared dead** — all live courses are `approved`; the clause is dropped, not silently defaulted |

**Answer-key boundary (unchanged but now explicit):** the bundle contains quiz `correct` flags and code `solution`/hidden tests — already world-readable in the public `courses-academy` repo (accepted decision D4), so committing it adds no exposure, **but it must never ship in client JS**: `lib/content/*` is `server-only`; the client components that touch the content layer today import **types only** and must stay that way.

## The compile pipeline

- `scripts/compile-content.ts` — standalone script (own minimal GitHub fetch + reuse `lib/content-sync/tarball.ts` `extractTarball`); validates fail-closed with `@superteam-lms/content-schema`; emits one typed JSON module per content type + copies assets; **includes each course's `slots.lock.json`** so the deploy path derives the active-lessons mask from the bundle — removing the runtime GitHub tarball fetch and retiring the Sanity synced-SHA singleton (`content.lock` replaces it).
- `content.lock` = `{ "repo": "solanabr/courses-academy", "sha": "<40-hex>" }`. **Note the repo name exactly** — two CLAUDE.md files still say `academy-courses`; code says `courses-academy` (correct). Fix the docs in SP2-D.
- CI (added in SP2-A, ordered **before** typecheck):
  1. **Freshness check** — recompiling at the `content.lock` SHA must reproduce the committed bundle byte-for-byte (blocks hand-edits and lock/bundle drift).
  2. **Parity anchor** — canonicalized diff of the bundle vs Sanity's projection at the content-sync singleton SHA: projected-fields-only, `onChainStatus`/`authoringStatus`/Sanity metadata stripped, asset URLs normalized to the rewritten form. (A literal byte-diff vs live mutable Sanity can never go green and is flaky by construction.) This anchor is deleted with Sanity at SP2-C/D and replaced by golden-snapshot tests.

## Staged PRs (dependency chain; each shippable)

**SP2-A — Compiler + committed bundle (additive, SAFE).**
Prereq content PR in `courses-academy`: `thumbnail` in schema + the 6 thumbnails committed. Then: `compile-content.ts`, `content.lock`, the committed bundle + assets, the typed `server-only` `lib/content/*` API — NO consumer switches. CI freshness check + canonicalized parity anchor green = proof the two sources are equivalent before anything flips.

**SP2-B — Relocate onChainStatus + flip the reads (SENSITIVE — migration, one-cut).**
`onchain_deployments` migration (+ public view) + **one-time backfill of every synced Sanity doc** (parity assertion: Supabase row count == synced Sanity docs, field-by-field including `isActive` and `trackCollectionAddress`) + the flip: all 21 query fns + the stats route read content from the bundle and status from the cached Supabase map; **all four writer sites** (2 sync routes, deactivate/reactivate, admin-signer) write Supabase only; deploy/drift derive `slots.lock` from the bundle. Sanity's `onChainStatus` is frozen (kept intact as the rollback path until SP2-C — a revert of this PR fully restores the old world). **Migration + backfill are applied to the DB and parity-verified BEFORE the code PR merges** (main auto-deploys; same triple gate as SP1: owner go + David's-Supabase-clear + dry-run). Full independent adversarial review. **#387 note:** verified non-blocking — course PDA seeds are byte-identical across Anchor/Pinocchio and new fields reuse reserved bytes; only if CS-4 changes how a deploy records status does this slice coordinate with it.

**SP2-C — Delete the Sanity code (SAFE, deletion).**
Delete `sanity/` Studio, `lib/sanity/*`, `lib/content-sync/*` (minus what the compiler kept), the content-sync admin panel + drift/sync-diff Sanity halves, `@sanity/*`/`next-sanity` deps. Grep proves zero surviving Sanity imports.

**SP2-D — Config/env/docs sweep (SAFE).**
`next.config.mjs`: cdn.sanity.io remotePatterns, CSP img/style/connect/frame-src entries, `transpilePackages` Sanity entry; the `/studio/*` middleware exclusion; env vars (`NEXT_PUBLIC_SANITY_*`, `SANITY_ADMIN_TOKEN`, `SANITY_API_TOKEN`); CMS_GUIDE.md deletion; the `academy-courses` doc-name fixes; golden-snapshot tests replacing the parity anchor; prod smoke.

## Verification

- SP2-A: freshness check + canonicalized parity anchor green in CI; bundle renders locally.
- SP2-B: backfill parity assertion (counts + field-by-field); the gate hides a synthetic non-synced row; deactivate → course disappears within one tag-purge; credential mint + achievement award paths resolve a backfilled course end-to-end on devnet; migration advisors clean; view exposes only non-sensitive columns; catalog/lesson pages remain static/ISR (no `cookies()` in the status read path).
- SP2-C: full suite green post-deletion; grep-zero for `@/lib/sanity` / `@sanity` / `next-sanity`.
- SP2-D: prod smoke (all lessons + courses 200, images load from `/content-assets/`, catalog 200); CSP has no sanity.io entries.

## Out of scope

- Admin panel restructure (SP3 — builds on this final shape).
- On-chain program changes (#387/CS-4) — SP2-B coordinates with but does not perform them.
- Any change to what content EXISTS (except relocating the 6 thumbnails into git — a faithful move, not an edit).
- Mainnet.

## Gates & sequencing

- SP2-A/C/D SAFE-lane; SP2-B SENSITIVE (migration + read flip) → adversarial review + owner sign-off; migration application human-gated (triple gate), applied before merge.
- Order fixed: A → B → C → D. **Only A is fully independent; C/D are downstream of B's human gate.** Nothing waits on the #387 decision itself (see SP2-B note).

## Issue remapping (corrected in rev 2)

- **#363 DROPPED** from this epic — it's the claude-review CI stub, unrelated to content-sync.
- **#371 SPLIT** — only the CMS_GUIDE half dies at SP2-D; the DEPLOYMENT.md host fixes are independent.
- **#327 PARTIAL** — only the Sanity-env removal lands at SP2-D; the serverEnv refactor keeps its #326 dependency.
- **#400** — pull the creator-diff check ahead of any CS-4 recreate work (it was sequenced after; it must land before).
