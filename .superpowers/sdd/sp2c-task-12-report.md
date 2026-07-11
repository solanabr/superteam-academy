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
