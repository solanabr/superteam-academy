# SP2-C Tasks 1 & 2 — Relocations Report

**Branch:** `feat/sp2c-relocations-11-07-2026` (off origin/main @ 45de629, the SP2-B flip merge #425)
**Status:** COMPLETE — both tasks committed, not pushed.

## Commits

- `71e045d` — Task 1: relocate GitHub-drift subtree → `lib/github/`
- `f49c443` — Task 2: relocate compiler subtree → `lib/content/compile/` + rename SanityDoc→BundleDoc

Both files moved via `git mv` (history follows: status shows R/RM).

## Task 1 — lib/github/ (group B)

Moved (source + tests): `github.ts`, `publish-pin.ts`, `drift.ts`, `content-commit.ts`.
Created `lib/github/types.ts` with `ChecksState`, `GitHubUnavailableError`, `BlockedCommitError`, `MaskMismatchError`, `RepoTree` (RepoTree homed here per plan ambiguity 3 — github is the fetch origin; the compiler imports it from here).

**Importers repointed (~13 files):**
content/drift/route.ts (+its test), content/sync/route.ts (+test), courses/sync/route.ts, publish/pin/route.ts (+test), publish/publish-pin-client.tsx, lib/solana/admin-signer.ts, content-sync/sync.ts, content-sync/tarball.ts, content-sync/validate.ts, scripts/compile-content.ts (+test), plus group-C tests signer-commit/sync/types.test.ts.

**Gate:** `git grep "content-sync/(github|publish-pin|drift|content-commit)"` → **0**; tsc green.

## Task 2 — lib/content/compile/ (group A) + SanityDoc→BundleDoc

Moved (source + tests + `_fixtures.ts`): `tarball.ts`, `projector.ts`, `validate.ts`, `assets.ts`, `prune.ts`, `executor-gate.ts`.
Created `lib/content/compile/types.ts` with `BundleDoc` (renamed from SanityDoc), `ContentValidationError`, `BlastRadiusError`.
`content-sync/types.ts` remnant now holds only `MANAGED_TYPES`/`ManagedType`/`SyncResult` (group C — Task 3 deletes).

SanityDoc→BundleDoc renamed repo-wide (0 SanityDoc left). Consumers touched: projector.ts, prune.ts, lib/content/types.ts, lib/content/project.ts (comment), content-sync group-C files (sync/gateway/graders/preserve), lib/sanity/admin-mutations.ts, scripts/compile-content.ts (+test), content/sync route (+test), scripts/parity-check.ts + root scripts backfill/cs8 comments, and the moved/staying tests.

**Importers repointed (compile modules, ~13 files):** scripts/compile-content.ts + parity-check.ts, content-sync/{sync,graders}.ts, content/sync/route.ts (+test), content-sync group-C tests, plus the SanityDoc→BundleDoc path splits above.

**Gates:**

- `git grep content-sync scripts/` → **0**
- `pnpm --filter web compile-content` reproduces the bundle **BYTE-FOR-BYTE**: `git status --porcelain apps/web/src/content/generated apps/web/public/content-assets` → **empty (0 changed)**. The rename/moves did not alter compiler output.

## Final verification (both tasks, post-commit)

- `pnpm tsc --noEmit` → clean (exit 0)
- `pnpm --filter web test` → **65 files / 524 tests pass**
- `pnpm lint` → passes (warnings only: pre-existing import/order style)
- Working tree clean.

## Constraints honored

- Pure relocation + rename only; no behavior change.
- Group-C files (sync/gateway/graders/preserve + types.ts remnant) LEFT in `lib/content-sync/` for Task 3; their imports of moved files were repointed so they still compile.
- lint-staged (husky) auto-reordered some imports on commit (eslint --fix) — cosmetic, still pure relocation.

## Concerns / notes for Task 3+ and reviewers

- Remaining `content-sync/` refs are exactly the group-C set + `admin-mutations.ts`'s `MANAGED_TYPES` import + one comment — all Task 3/4 targets, none load-bearing beyond group C.
- Pre-existing import/order lint warnings on admin-signer.ts / onchain-queue.ts / supabase clients are unchanged by these tasks (same line positions; only module path strings changed).
- `RepoTree` intentionally lives in `lib/github/types.ts` (not compile) per plan ambiguity 3; the compiler imports it cross-module. If a reviewer expected it in compile/types, that's the deliberate resolution.

---

# SP2-C Tasks 3, 4, 5 — Deletions (appended; this file is now the branch report)

**Status:** COMPLETE — all three committed on `feat/sp2c-relocations-11-07-2026`, not pushed.

## Commits

- `e73e08b` — Task 3: delete the dead Sanity write engine (group C)
- `6ec2e9a` — Task 4: repoint Sanity importers, delete lib/sanity barrels + Studio embed
- `a07b8bd` — Task 5: delete the sanity/ workspace

## Task 3 — group C + route + panel

Deleted: `lib/content-sync/` entirely ({sync,gateway,graders,preserve}.ts + the types.ts remnant + tests), `app/api/admin/content/sync/` (route + tests), `components/admin/content-sync-panel.tsx`.

**Adjudications:**

- **Publish page shape:** `/admin/publish` KEEPS the SP3-B `PublishPinClient` card (the surviving publish UI — publishing is a human PR) and drops only the dead panel; heading + nav entry unchanged (the screen survives, so no nav change was needed). Docstring rewritten; smoke test updated (panel mock + assertion removed).
- **`signer-commit.test.ts` rescued** — it lived in content-sync/**tests** but tests LIVE code (`buildCourseCommit` in admin-signer); relocated to `lib/github/__tests__/` instead of dying with the dir.
- **`sync-diff-view.tsx` SURVIVES** — imported by `course-sync-table.tsx` on the deploy screen (verified).
- `MANAGED_TYPES` temporarily inlined into admin-mutations.ts (file deleted next task) so Task 3 compiles standalone.
- Stale docs trimmed: the route's row in `app/api/CLAUDE.md`, the `env.server.ts` GITHUB_TOKEN comment.

Verify: tsc + lint clean; suite 60 files / 503 tests.

## Task 4 — repoints + barrel deletion

Re-derived importer set at HEAD: **31× `@/lib/sanity/queries` → `@/lib/content/queries`**, **15× `@/lib/sanity/types` → `@superteam-lms/types`**, **4× `@/lib/sanity/admin-mutations` → `@/lib/content/deployment-writes`**.

**Ambiguity-4 verification:** admin-mutations post-SP2-B = (a) the four writers as pure re-exports from `@/lib/content/deployment-writes` (already folded there by SP2-B Task 6 — no new fold needed, just repoints) + (b) a Sanity write client whose ONLY caller was the group-C gateway deleted in Task 3 → dead. Its test file covered only that dead half. Both deleted.

**Additional deletion (gate-forced):** `app/studio/[[...tool]]/` + `app/studio/layout.tsx` + `apps/web/sanity.config.ts` — the NextStudio embed imports `next-sanity/studio`, `sanity`, `@sanity/vision`, `@superteam-lms/sanity`; unusable post-SP2-C and inside the gate's scope.

**GATE:** `git grep -lE "from ['\"](@/lib/sanity|@sanity/|next-sanity)" apps/web/src` → **ZERO** (only historical comments remain). **`next build` green** (75/75 pages; .env.local copied from the main tree, not committed — gitignored). Suite 59 files / 499 tests; tsc + lint clean.

## Task 5 — workspace deletion

Deleted `sanity/` (git rm); dropped `"@superteam-lms/sanity": "workspace:*"` from apps/web/package.json, the `"sanity"` glob from pnpm-workspace.yaml, `@superteam-lms/sanity` from `transpilePackages` (a deleted workspace package can't stay there — the REST of the Sanity CSP/deps sweep stays Task 6), and the stale `.vercelignore` sanity/dist block. Lockfile regenerated and committed.

**Verify:** `pnpm install` clean; `pnpm ls -r` shows no sanity workspace; `next build` green post-transpilePackages change; tsc + lint clean; suite 59/499.

## Final freshness gate (end of all tasks)

`pnpm --filter web compile-content` → `git status --porcelain` on generated + content-assets = **empty (byte-identical)**.

## Left for SP2-D (Tasks 6–8), deliberately untouched

- next.config.mjs: `/studio` middleware exclusion + static-CSP block, sanity.io CSP hosts, `cdn.sanity.io` remotePatterns.
- package.json deps: `sanity`, `next-sanity`, `@sanity/vision`.
- env vars `NEXT_PUBLIC_SANITY_*` / `SANITY_ADMIN_TOKEN` (env.server.ts still declares them as optional).
- parity-check.ts + docs (CMS_GUIDE, CLAUDE.md references, apps/web/CLAUDE.md env section).
