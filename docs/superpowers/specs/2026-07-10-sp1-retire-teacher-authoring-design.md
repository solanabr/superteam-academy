# SP1 — Retire the Teacher-Authoring Era (Design)

**Date:** 2026-07-10 (rev 2 — post tri-audit)
**Status:** Approved by owner (in-session); revised after a 3-agent audit (ground-truth / alignment / security). Audit deltas are marked **[AUDIT]**.
**Epic context:** First of three sub-projects (SP1 retire teacher-authoring → SP2 remove Sanity → SP3 admin panel v2) following the content-standard epic (#359). Git (`solanabr/courses-academy`) is the source of truth for all course content, tags, learning paths, instructors, and achievements; instructor identity is the on-curve `instructor.wallet` (#399). **[AUDIT] Epic gate: #387 (Pinocchio) must be decided before SP2's spec freezes** — recorded here as the epic's sequencing note.

## Goal

Delete every UI-authoring-era surface whose job moved to git PRs, and reduce `/teach` to a read-only, wallet-keyed analytics viewer. After SP1, nothing writes course structure outside the git→Sanity sync, and the "teacher role" concept no longer exists — an instructor IS a wallet declared in content.

## Owner decisions (locked)

1. **Admin analytics access**: deleted with the role override. Admin-facing analytics is an SP3 screen. No interim hack.
2. **Viewer scope**: reuse the existing stats route data as-is (per-course enrollments/completions). No new analytics work in SP1.
3. **Orphan purge**: one-time scripted deletion of legacy non-sync-marked Sanity docs. **[AUDIT]** Verified live: exactly 25 docs (2 legacy courses `aD45H1NEbb1bqELwloGCqI`/`ops2aYkxIM6NMo1gE18U1o`, their 3 UUID lessons, 20 `module` docs) — plus manual-era `courseTag` docs and any `learningPath` without `sync.source` (the deleted panels wrote them; the sync never writes `courseTag`). On-chain accounts untouched (CS-4's job).
4. **Approach**: two staged PRs + one script. No feature flags.
5. **What is NOT touched**: content-sync panel, course-sync-table, achievement-sync-table, flags-panel (moderation), data-resync, sync-diff, status, mismatch-warning — all admin sync/moderation capability survives SP1 unchanged and gets its UX rebuild in SP3. **[AUDIT]** One trim: the status route's dead `pendingReviews` stat goes with the review queue.
6. **[AUDIT] Teach nav visibility**: the header "Teach" item shows only when the signed-in wallet matches an `instructor->wallet` (one cached query) — git-keyed replacement for the old role gate.

## Security decision **[AUDIT — from #408]**

`profiles.wallet_address` is self-writable via the open own-row UPDATE policy, which would make wallet-match auth spoofable (and already lets an attacker capture Helius XP events today — filed as **#408, P0**). The SP1 migration therefore **replaces** the role write-lock with a `wallet_address` write-lock of identical shape: only `service_role` (the SIWS link routes) may change it. One migration, one concept swapped.

## Corrected findings of record **[AUDIT]**

- `profiles.role` is NOT consumed only by deleted surfaces (rev-1 claim was false). Live consumers: `lib/auth/auth-provider.tsx:35` (`PROFILE_COLUMNS` — selected on **every session**; dropping the column without fixing this logs out the entire app), `components/layout/header.tsx:179` (`canTeach`), `app/[locale]/(platform)/teach/layout.tsx:38-47` (role gate that would brick the new viewer), `lib/supabase/types.ts` (generated types), `supabase/schema.sql` (canonical snapshot). All are now explicit plan tasks; **migration application is additionally gated on PR-2 being deployed**.
- The 4 admin panels contain **zero i18n** (hardcoded English) — there are no keys to prune in PR-1. The `teacher.*` namespace belongs to the /teach pages and is pruned only in PR-2.
- There is **no existing i18n parity test**; PR-2 adds a deep-parity test as part of the viewer work.
- No sign-in-prompt state: `/teach` stays in the middleware `protectedPaths` (unauthenticated → landing redirect, existing behavior). The viewer needs only the two authenticated states (courses list / empty state).

## PR-1 — "Cut the writers"

- Remove the 4 obsolete panels (`course-review-queue`, `course-tags-panel`, `learning-paths-panel`, `teacher-roles-panel`) from `admin-client.tsx` **including their orphaned residue** (the `PendingReviewCourse` import, `AdminStatus.pendingReviews`, the Review Queue section chrome) and the `pendingReviews` computation + `getPendingReviewCourses` in the status route/queries.
- Delete API routes: `admin/tags`, `admin/learning-paths`, `admin/teachers`, `admin/courses/review`, `teacher/courses` CRUD + `structure` + `thumbnail` + `upload-image`.
- Delete `lib/teacher/validate.ts` (importers verified: only the routes above). **`lib/sanity/teacher-mutations.ts` and `teacher-structure.ts` are PR-2 deletions** — the surviving stats route and /teach pages import them.
- Migration `supabase/migrations/20260710120000_drop_teacher_role.sql` (14-digit convention): drop `trg_enforce_profile_role_write` + `public.enforce_profile_role_write()` + `profiles.role` (live-verified: zero role-referencing policies), **and create the `wallet_address` write-lock trigger** (#408). Irreversible by design (comment says so); pre-apply snapshot of non-learner roles goes in the PR body. **Application human-gated on: PR-2 deployed + Supabase stability confirmed.**
- Purge script `scripts/purge-legacy-sanity-docs.ts`, dry-run default. **[AUDIT fixes]**: guard uses `!= null` (GROQ returns `null`, never `undefined` — the rev-1 guard refused everything); client pins `perspective: "raw"` in BOTH modes with the token required even for dry-run (tokenless dry-run vs tokened live see different draft sets); deletes `drafts.<id>` counterparts; adds `courseTag` + unsynced-`learningPath` clauses; `--live` asserts its target count equals the dry-run count passed via `--expect N`.

## PR-2 — "Replace the reader"

- Delete the `/teach/courses/` tree **and `components/teacher/`** (course-form, course-structure-editor, markdown-field, thumbnail-picker — they live outside the tree and would be stranded), **and `teach/layout.tsx`** (its role gate would brick the viewer; the platform layout provides chrome).
- New read-only `/teach` page: SIWS session wallet → `getInstructorCourses(wallet)` (live-verified: returns exactly the 6 courses for the owner wallet) → course cards with expandable stats. Two states: courses / empty. i18n en/pt-BR/es + **new deep-parity test** (recursive key-structure comparison across the 3 files).
- Stats route rewire: session wallet vs `instructor->wallet` (revalidate 0), 401 no session / 403 mismatch / no fallback. Then delete `authorize.ts`, `teacher-mutations.ts`, `teacher-structure.ts`, `getCourseAuthorship`.
- Header: `canTeach` = cached instructor-wallet lookup (decision 6). `PROFILE_COLUMNS` drops `role`.
- Dead-code sweep: `getManagedCourseTags`, admin-mutations orphans (`createCourseTag`, `deleteCourseTag`, `setLearningPathCourses`, `approveCourse`, `rejectCourse`) + tests, `packages/types` `UserRole`/`UserProfile.role`/course `author`+teacher-feedback fields, `lib/supabase/types.ts` role entries (hand-edit the generated file; regen against the post-migration DB later).

## Sequencing & gates

1. PR-1 (SENSITIVE — migration file): both gates + independent adversarial review + owner sign-off. Merge ≠ apply.
2. PR-2 (SAFE): both gates. Deletes every remaining `role` read.
3. **Migration application** (human-gated): only after PR-2 is deployed to prod AND Supabase stability is confirmed (rollback to `obqlljsagzslxarwphxv` verified + advisors clean). Verify link-wallet flow still works post-trigger (SIWS routes are service-role — live-verified all 11 profiles carry wallet_address).
4. Purge: tokened dry-run → owner eyeballs the list (expect the 25 legacy docs + any courseTag/stray-path docs) → `--live --expect N` → verify counts relative to pre-purge (no hardcoded absolutes).

## Testing & verification

- Suites minus deleted surfaces green; `tsc` clean; new tests: viewer query, both viewer states, stats auth (200/403/401), i18n deep parity.
- E2E after everything: owner wallet `B7o8NfV81HzjuZFWQTTx3Xdvh77Dqoajwib3kWEnvzJF` signs in → header shows Teach → all 6 courses with stats; a non-instructor wallet → no Teach item; direct /teach → empty state.

## Explicitly out of scope

Admin panel restructure/nav (SP3). Sanity removal, `authoringStatus` gate cleanup, onChainStatus relocation (SP2). CS-4 and #400/#401/#402 (#400 → SP3; #401/#402 → pre-CS-4). Any mainnet action. Helius-side hardening beyond the #408 trigger (the trigger closes the write path; event-handler defense-in-depth can ride SP2/SP3).

## Issue remapping **[AUDIT-corrected]**

- #263/#264/#265: already CLOSED — post spec pointers on PR-2 merge, no state change.
- #398: fixed by #399 (verified in code) — close it now.
- #408 (NEW, P0): wallet_address write-lock — fixed by this migration.
- #400 → SP3. #401/#402 → pre-CS-4 checklist.
