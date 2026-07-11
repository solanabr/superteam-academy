# SP2 — Remove Sanity (Design)

**Date:** 2026-07-10
**Status:** Approved by owner (in-session). Pending tri-audit before plan execution.
**Epic context:** Second of three sub-projects (SP1 retire teacher-authoring ✅ → **SP2 remove Sanity** → SP3 admin panel v2). Git (`solanabr/courses-academy`) is already the source of truth; Sanity is now only a rebuildable projection + a home for mutable on-chain status. SP2 deletes the projection and relocates the mutable state, making git→build the entire content path.

## Goal

Remove Sanity entirely. Content compiles from `courses-academy` into a typed JSON bundle at build time; the mutable on-chain deploy status moves to Supabase; the app reads content from the bundle and status from Supabase. Delete the Studio, the sync layer, and every Sanity dependency.

## Owner decisions (locked)

1. **Read layer = build-time compile.** On deploy, a prebuild step fetches `courses-academy` at a pinned SHA, re-validates with `@superteam-lms/content-schema` (fail-closed), and emits typed JSON into the app bundle. The 21 query functions become in-memory lookups. No content DB, no runtime content fetch, no sync.
2. **Keep the on-chain visibility gate.** A course is publicly visible only when its on-chain deploy status is `synced && isActive`. Public pages read content from the bundle + a light, cacheable `onChainStatus` lookup from Supabase.
3. **Publish trigger = pinned SHA.** `content.lock` in the app repo holds the courses-academy SHA. Bumping it (admin action or one-line PR) is the deliberate "make new content live" control that replaces today's admin "Sync" button. Reproducible builds fall out for free.

## Ground truth (measured on main 6923587)

- 59 files import from `@/lib/sanity` / `@sanity/*` / `next-sanity`.
- 21 exported query functions in `apps/web/src/lib/sanity/queries.ts`.
- `onChainStatus` referenced in 15 files (public gate reads + admin deploy-sync writes + content-sync preserve/prune).
- Studio workspace at `sanity/` (schemas, seed, config, typegen).

## Architecture — three data planes, one home each

| Plane | After SP2 |
|---|---|
| **Content** (courses, inline modules, lessons/blocks, instructors, achievements, paths) | compiled typed JSON in `apps/web/src/content/generated/` (git-ignored, rebuilt each deploy); read via a typed `lib/content/*` API with the SAME function names + return types as today's `lib/sanity/queries.ts` (minimizes churn across the 59 importers) |
| **On-chain status** (`status`, `coursePda`, `txSignature`, `collectionAddress`, `achievementPda`, `isActive`, `lastSynced`) — mutable | Supabase table `onchain_deployments` (keyed by content id: `course-*` / `achievement-*`), written by the deploy routes, RLS: public SELECT of non-sensitive columns, service_role write |
| **Visibility gate** | page reads content (bundle) + `onchain_deployments` row (Supabase); a course/achievement with no synced+active row is hidden, exactly as the GROQ gate does today |

## The compile pipeline

- `scripts/compile-content.ts` — fetches `courses-academy` tarball at `content.lock` SHA (reuses the existing `lib/content-sync/github.ts` tarball fetch + `@superteam-lms/content-schema` validation), emits one typed JSON module per content type into `apps/web/src/content/generated/`. Fail-closed: any schema violation aborts the build.
- Wired as Vercel `prebuild` (runs before `next build`). Local dev: a committed dev snapshot or an on-demand compile via `pnpm compile-content`.
- `content.lock` = `{ "repo": "solanabr/courses-academy", "sha": "<40-hex>" }`. Bumping the sha is the publish action.
- Types: the bundle is typed by `@superteam-lms/content-schema`'s inferred types; `sanity typegen` + `lib/sanity/types.ts` are retired.

## Staged PRs (dependency chain; each shippable)

**SP2-A — Compiler + bundle (additive, SAFE).**
Build `compile-content.ts`, `content.lock`, the prebuild hook, and the typed `lib/content/*` API — but NO consumer switches yet. CI **compiles the bundle and diffs it against live Sanity's current output**; mismatch fails CI. This is the correctness anchor: proves the two sources are byte-equivalent before anything flips.

**SP2-B — Relocate onChainStatus to Supabase (SENSITIVE — migration).**
New `onchain_deployments` table + migration; the deploy-sync routes (`admin/courses/sync`, `admin/achievements/sync`) **dual-write** Sanity + Supabase; the public gate still reads Sanity. Behavior-identical, additive. Full gate + independent adversarial review + owner sign-off. **Lockstep with #387 on the deploy write-path only** — if Pinocchio changes how a deploy records status, this slice coordinates with CS-4. DB migration applied human-gated (same triple gate as SP1: PR deployed + owner go).

**SP2-C — Swap the read layer (SAFE, large).**
Repoint the 21 query functions: content from the bundle, status from Supabase. Public pages stop touching Sanity. Same function signatures → the 59 importers change minimally. Every query fn's test retargets at the bundle; E2E proves all 76 lessons + 6 courses render identically.

**SP2-D — Delete Sanity (SAFE, deletion).**
Delete `sanity/` Studio, `lib/sanity/*`, `lib/content-sync/*`, the content-sync admin panel + drift/sync routes, the dual-write, `@sanity/*`/`next-sanity` deps, and the Sanity env vars (`NEXT_PUBLIC_SANITY_*`, `SANITY_ADMIN_TOKEN`, `SANITY_API_TOKEN`). Sanity is gone.

## Verification

- SP2-A: bundle-vs-Sanity byte-diff green in CI (the safety anchor).
- SP2-B: dual-write parity tests (Sanity row == Supabase row per deploy); migration advisors clean; RLS proven (public reads non-sensitive columns, writes service_role-only).
- SP2-C: per-query golden tests against the bundle; E2E render parity for all live content; the visibility gate still hides non-deployed courses (test with a synthetic non-synced row).
- SP2-D: full suite green post-deletion; grep proves zero surviving `@/lib/sanity` / `@sanity` / `next-sanity` imports; prod smoke (76 lessons + 6 courses 200, catalog 200).

## Out of scope

- Admin panel restructure (SP3 — builds on this final shape).
- On-chain program changes (#387/CS-4) — SP2-B coordinates with but does not perform them.
- Any change to what content EXISTS (SP2 changes where it's read from, not the content itself).
- Mainnet.

## Gates & sequencing

- SP2-A/C/D are SAFE-lane. SP2-B is SENSITIVE (migration) → adversarial review + owner sign-off; migration application human-gated.
- SP2-B's deploy-write slice coordinates with the #387 decision; the rest of SP2 (A/C/D) is independent of #387 and can proceed regardless.
- Order is fixed: A → B → C → D (B before C so the gate's status source exists in Supabase before the read flips).

## Issue remapping

- Retires the content-sync machinery that #363 (review-stub) and the sync route touched — note on those issues at SP2-D.
- #371 (stale prod host docs) + CMS_GUIDE.md: fold the doc deletions into SP2-D (CMS_GUIDE describes Sanity Studio, which no longer exists).
- Env-hygiene #327: the Sanity env removal in SP2-D is a natural checkpoint.
