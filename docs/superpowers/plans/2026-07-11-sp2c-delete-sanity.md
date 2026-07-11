# SP2-C — Delete the Sanity code + SP2-D config/env sweep (Implementation Plan)

**Date:** 2026-07-11 · **Spec:** `docs/superpowers/specs/2026-07-10-sp2-remove-sanity-design.md` (rev 2.1), SP2-C + SP2-D sections
**Lane:** SAFE (deletion + relocation; no behavior change) — but two seams are risky (see below) and get adversarial review.
**Prereqs:** SP2-B merged (bundle is the read layer; `onchain_deployments` live; `lib/sanity/queries.ts` is a re-export barrel; the 4 writers + drift/slots retired the Sanity singleton). SP3-B (PR #422 publish-pin card) merged — it OWNS the surviving GitHub-drift carve-out, so SP2-C must run AFTER it. ✅ (merged 2026-07-11)

## Ambiguities resolved (read before executing)

1. **The carve-out is 3 concerns, not "a few files" (BINDING correction).** A full importer trace of `lib/content-sync/*` on the post-SP2-B/SP3-B tree shows content-sync splits into THREE groups, and only the third is deletable:
   - **(A) Compiler subtree — SURVIVES** (consumed by `scripts/compile-content.ts` + `scripts/parity-check.ts`, i.e. the CI freshness/parity anchors, which are NOT Sanity code): `tarball.ts`, `projector.ts`, `validate.ts`, `assets.ts`, `prune.ts`, `executor-gate.ts`.
   - **(B) Publish/deploy-drift subtree — SURVIVES** (consumed by SP3-B publish card + SP3-C deploy screen + admin-signer): `github.ts`, `publish-pin.ts`, `drift.ts`, `content-commit.ts`.
   - **(C) Dead Sanity write engine — DELETE**: `sync.ts`, `gateway.ts`, `graders.ts`, `preserve.ts`. Their ONLY importers are the Sanity content-sync route (`app/api/admin/content/sync/route.ts`) and `lib/sanity/admin-mutations.ts`, both also deleted here. (`executor-gate.ts` is shared by dead `graders.ts` AND live `validate.ts` → survives via the compiler.)
     So "delete lib/content-sync minus carve-outs" would delete files the compiler and admin still import. The plan RELOCATES A and B to honest homes and deletes only C + the residual dir.

2. **`content-sync/types.ts` splits three ways** (shared leaf — no imports; everything imports it):
   - Compiler home: `RepoTree`, `ContentValidationError`, `BlastRadiusError`, and `SanityDoc` (rename → `BundleDoc`; it's the projector's output = bundle-doc shape, imported by `projector.ts` + `lib/content/types.ts`, NOT Sanity-specific).
   - GitHub home: `ChecksState`, `GitHubUnavailableError`, `BlockedCommitError`, `MaskMismatchError`.
   - Dead: `MANAGED_TYPES`, `ManagedType`, `SyncResult` (Sanity-write-only).

3. **Relocation homes.** (A) → `lib/content/compile/` (sits with the bundle store it feeds; keeps `scripts/compile-content.ts` imports short). (B) → `lib/github/` (a read-only GitHub-drift + publish-checks module, no Sanity). `RepoTree` is shared by both (tarball + github fetch) → put it in `lib/github/types.ts` and have the compiler import it (github is the fetch origin). Delete `lib/content-sync/` entirely once both move.

4. **`lib/sanity/admin-mutations.ts`.** SP2-B Task 6 rewrites its writer bodies to service_role `onchain_deployments` upserts (no more Sanity gateway). Post-SP2-B it's misnamed, not dead. RESOLUTION: fold its writer fns into `lib/content/deployments.ts` (where the read seam already lives) and delete the file — verify at execution time that Task 6 fully de-Sanity'd it (if any gateway import remains, that's a Task-6 miss to fix first).

5. **`admin/content/sync/route.ts` (Sanity doc-sync) vs `admin/courses/sync/route.ts` (on-chain PDA deploy).** DIFFERENT routes. `content/sync` writes Sanity docs (dead — the publish flow is now a human PR, SP3-B replaced its panel). `courses/sync` deploys a Course PDA (SURVIVES — SP3-C's deploy button calls it). Delete only `content/sync`. Confirm SP3-B didn't already delete it.

6. **`admin/content/drift/route.ts` SURVIVES** — it's the repo-HEAD drift API for the SP3-B publish card + SP3-C deploy change-preview. SP2-B Task 6 already retired its runtime tarball fetch (derives synced SHA from `content.lock`/`meta.json`). It repoints to `lib/github/{drift,github,content-commit}`. Nothing about it is Sanity anymore.

## Deletion inventory (measured; re-grep at execution)

**Sanity read/write client + barrels (`lib/sanity/`):** `client.ts` (`createClient`/`sanityFetch`), `queries.ts` (re-export barrel — delete AFTER repointing its ~33 importers to `@/lib/content/queries`), `types.ts` (pure re-export barrel of `@superteam-lms/types` — delete AFTER repointing importers straight to `@superteam-lms/types`), `admin-mutations.ts` (per ambiguity 4), `__tests__/`.
**Sanity Studio workspace:** the entire `sanity/` dir (the `@superteam-lms/sanity` workspace package).
**Dead content-sync (group C):** `sync.ts`, `gateway.ts`, `graders.ts`, `preserve.ts` + the residual `lib/content-sync/` dir after A/B relocate.
**Admin route + panel:** `app/api/admin/content/sync/route.ts` + the `content-sync-panel.tsx` / `sync-diff-view` Sanity halves not already retired by SP3-B (verify).
**~50 Sanity importers** (`git grep -lE "from ['\"](@/lib/sanity|@sanity/|next-sanity)" apps/web/src` → 50 on main; will shrink after SP2-B). Each repoints: `@/lib/sanity/queries`→`@/lib/content/queries`; `@/lib/sanity/types`→`@superteam-lms/types`; `@/lib/sanity/client` importers are all in the dead set.

## Tasks

### Task 1 — Relocate the GitHub-drift subtree → `lib/github/` (group B)

**Files:** move `github.ts`, `publish-pin.ts`, `drift.ts`, `content-commit.ts` into `apps/web/src/lib/github/`; create `lib/github/types.ts` with `ChecksState`, `GitHubUnavailableError`, `BlockedCommitError`, `MaskMismatchError`, `RepoTree`. Repoint importers: `app/api/admin/content/drift/route.ts`, `app/api/admin/courses/sync/route.ts` (github HEAD sha), `admin/publish/publish-pin-client.tsx` + `api/admin/publish/pin/route.ts` (SP3-B), `lib/solana/admin-signer.ts` (`content-commit`), `lib/admin/sync-diff.ts` (verify its ChecksState relationship).
**Verify:** `git grep "content-sync/\(github\|publish-pin\|drift\|content-commit\)"` → zero; typecheck green; publish card + drift route render unchanged.

### Task 2 — Relocate the compiler subtree → `lib/content/compile/` (group A) + rename `SanityDoc`→`BundleDoc`

**Files:** move `tarball.ts`, `projector.ts`, `validate.ts`, `assets.ts`, `prune.ts`, `executor-gate.ts` into `apps/web/src/lib/content/compile/`; rename `SanityDoc` → `BundleDoc` (update `projector.ts`, `lib/content/types.ts`). Repoint `scripts/compile-content.ts` + `scripts/parity-check.ts` imports.
**Verify:** `pnpm --filter web compile-content` reproduces the committed bundle byte-for-byte (freshness check still green); `git grep content-sync scripts/` → zero.

### Task 3 — Delete the dead Sanity write engine (group C) + content-sync route

**Files:** delete `lib/content-sync/{sync,gateway,graders,preserve}.ts` + the now-empty `lib/content-sync/` dir (with its `types.ts` remnant `MANAGED_TYPES`/`SyncResult`); delete `app/api/admin/content/sync/route.ts` + its tests; delete any residual `content-sync-panel.tsx` not removed by SP3-B.
**Verify:** typecheck + full suite green; deploy/publish/drift admin surfaces still function (they now depend only on `lib/github/*` + `lib/content/*`).

### Task 4 — Repoint the ~33 query importers + delete the `lib/sanity/` barrels

**Files:** repoint every `@/lib/sanity/queries` importer → `@/lib/content/queries` and every `@/lib/sanity/types` importer → `@superteam-lms/types` (`COURSES_CACHE_TAG` moves to `lib/content/queries` if not already there per SP2-B); fold `admin-mutations.ts` writers into `lib/content/deployments.ts`; delete `lib/sanity/{client,queries,types,admin-mutations}.ts` + `lib/sanity/__tests__/`.
**Verify (the grep-zero gate):** `git grep -lE "from ['\"](@/lib/sanity|@sanity/|next-sanity)" apps/web/src` → **zero**. `next build` green. Prod-smoke locally: catalog + all lessons render from the bundle.

### Task 5 — Delete the Sanity Studio workspace

**Files:** remove the `sanity/` dir; drop `"@superteam-lms/sanity": "workspace:*"` from `apps/web/package.json` (or fold into Task 6's single deps commit).
**Verify:** `pnpm install` clean; no workspace resolves to `sanity/`.

--- SP2-D (config/env/docs sweep) ---

### Task 6 (SP2-D) — `next.config.mjs` + deps + env

**`next.config.mjs`:** remove the `/studio/*` middleware exclusion + the `/studio/:path*` static-CSP header block; from CSP delete `cdn.sanity.io`/`media.sanity.io`/`*.api.sanity.io`/`*.apicdn.sanity.io` from `style-src`/`img-src`/`connect-src`/`frame-src`; drop `@superteam-lms/sanity` from `transpilePackages` (keep `@superteam-lms/types`); drop the `cdn.sanity.io` `remotePatterns` entry. **DO NOT touch `worker-src`/`script-src` `cdn.jsdelivr.net`** — that's Monaco's language workers (CSP-broke-Monaco regression, #170), unrelated to Sanity.
**`package.json`:** drop `@sanity/vision`, `sanity`, `next-sanity` (+ the workspace dep if not done in Task 5).
**env (`lib/env.ts` + `lib/env.server.ts`):** drop `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_ADMIN_TOKEN` (+ wiring). Coordinate with #326/#327 — only the Sanity-env removal lands here.
**Verify:** `next build`; CSP header on a prod route has zero `sanity.io`; Monaco still loads (open a code lesson); no missing-env throws.

### Task 7 (SP2-D) — Golden suite replaces the parity anchor + docs

**Files:** delete `scripts/parity-check.ts` + its CI step (spec: replaced by golden-snapshot tests — the SP2-B Task 4 projector goldens; confirm coverage before removing the anchor); delete `docs/CMS_GUIDE.md` + its `CLAUDE.md` reference; fix any residual `academy-courses` doc drift.
**Verify:** CI green without the parity step; golden suite is the sole content-equivalence gate.

### Task 8 (SP2-D, OWNER-GATED) — Purge legacy Sanity docs

`scripts/purge-legacy-sanity-docs.ts --live` — deletes the 25 stale Sanity docs incl. the 2 owner-DROPPED legacy achievements. Mutates David's prod Sanity dataset (4e3i2wwc/production). **Human-gated: owner go + dry-run diff captured before `--live`.** Not required for the app to function (nothing reads Sanity post-SP2-C) — hygiene; can trail the code merge.

## Risky seams (flag to reviewers)

- **Task 4 grep-zero + the 33 repoints** — a missed importer that still resolves `@/lib/sanity/queries` after the barrel is deleted is a build break; run the grep-zero gate BEFORE deleting the barrel.
- **Task 2 `SanityDoc`→`BundleDoc` rename** touches the compiler's output contract — the freshness check (byte-identical bundle) is the guard.
- **admin-mutations fold (Task 4 / ambiguity 4)** — verify SP2-B Task 6 left it Sanity-free first.

## Out of scope

Profile-avatar wiring (SP2-B follow-up); the SP3 admin UX rebuild; #387/CS-4; mainnet.

## Review gates

Per-task reviewer (deletion completeness via grep-zero + build); whole-branch adversarial review before the PR (the trust question: "did we delete something still load-bearing" — the importer traces above are the checklist). SAFE-lane merge; Task 8 owner-gated separately.
