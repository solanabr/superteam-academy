# SP1 — Retire the Teacher-Authoring Era (Design)

**Date:** 2026-07-10
**Status:** Approved by owner (in-session)
**Epic context:** First of three sub-projects (SP1 retire teacher-authoring → SP2 remove Sanity → SP3 admin panel v2) following the content-standard epic (#359). Git (`solanabr/courses-academy`) is the source of truth for all course content, tags, learning paths, instructors, and achievements; instructor identity is the on-curve `instructor.wallet` (#399).

## Goal

Delete every UI-authoring-era surface whose job moved to git PRs, and reduce `/teach` to a read-only, wallet-keyed analytics viewer. After SP1, nothing writes course structure outside the git→Sanity sync, and the "teacher role" concept no longer exists — an instructor IS a wallet declared in content.

## Owner decisions (locked)

1. **Admin analytics access**: deleted with the role override. Admin-facing analytics is an SP3 screen. No interim hack.
2. **Viewer scope**: reuse the existing stats route data as-is (per-course enrollments/completions). No new analytics work in SP1.
3. **Orphan purge**: one-time scripted deletion of legacy non-sync-marked Sanity docs (Solana 101 `aD45H1NEbb1bqELwloGCqI`, `xcvxcv` `ops2aYkxIM6NMo1gE18U1o`, their 3 UUID lessons, old `module` documents). On-chain accounts untouched (CS-4's job).
4. **Approach**: two staged PRs + one script (Approach B). No feature flags.
5. **What is NOT touched**: content-sync panel, course-sync-table, achievement-sync-table, flags-panel (moderation), data-resync, sync-diff, status, mismatch-warning — all admin sync/moderation capability survives SP1 unchanged and gets its UX rebuild in SP3.

## Judgment calls (documented, not user-gated)

- `publicAuthoringGate` / `authoringStatus` GROQ gates stay untouched — SP2 deletes them with Sanity wholesale; touching 8 queries now is churn with zero user-visible change. (Live data: 0 pending-review courses, 0 drafts — the gates are inert.)
- `profiles.role` is consumed ONLY by the teacher routes being deleted (verified by grep; admin panel auth is the separate HMAC `admin_session` cookie). Safe to drop with the surface.

## PR-1 — "Cut the writers"

**Delete (components, out of `/admin` page + files):**
- `components/admin/course-review-queue.tsx` (submissions are now PRs on courses-academy: CODEOWNERS + validate-content CI are the review queue)
- `components/admin/course-tags-panel.tsx` (tags come from `course.yaml`)
- `components/admin/learning-paths-panel.tsx` (paths come from `paths/*.yaml`)
- `components/admin/teacher-roles-panel.tsx` (role concept deleted)

**Delete (API routes):**
- `api/admin/tags`, `api/admin/learning-paths`, `api/admin/teachers`, `api/admin/courses/review`
- `api/teacher/courses` (CRUD + `[id]` + `[id]/structure` + `[id]/thumbnail`), `api/teacher/upload-image`

**Delete (libs):**
- `lib/sanity/teacher-mutations.ts`, `lib/sanity/teacher-structure.ts` (verify no other importers), `lib/teacher/authorize.ts`

**Migration (file in PR, application HUMAN-GATED):**
- Drop `profiles.role` column, the `trg_enforce_profile_role_write` trigger on `profiles` (verified against the live DB) + its function, and any role-referencing policies.
- Applied via the dbd5cdaf Supabase MCP only after the David-Supabase migration situation is verified stable (rollback to `obqlljsagzslxarwphxv` confirmed + advisors clean). Merge of PR-1 does NOT imply application.

**Ships in PR-1:** `scripts/purge-legacy-sanity-docs.ts` — dry-run by default (`--live` to execute), deletes the enumerated orphan docs + any `_type == "module"` documents; prints exactly what it will delete and refuses if a doc carries `sync.source`.

## PR-2 — "Replace the reader"

**Delete:** the 5 `/teach` pages (`teach/page`, `teach/courses`, `teach/courses/new`, `teach/courses/[id]`, `teach/courses/[id]/edit`) and their client components.

**Add:** one read-only `/[locale]/(platform)/teach/page.tsx`:
- Server component. SIWS session wallet → GROQ `*[_type == "instructor" && wallet == $wallet]` → courses via `course.instructor->wallet` match.
- Renders course cards with per-course expandable stats (existing stats payload). No separate detail pages.
- States: no wallet session → sign-in prompt; wallet matches no instructor → empty state ("no courses assigned to this wallet — instructors are defined in courses-academy").
- All strings next-intl, en/pt-BR/es parity.

**Rewire:** the stats route's auth from `role`/`course.author` to wallet-match (`course.instructor->wallet == caller wallet`). Non-matching wallet → 403. The dead `course.author` dependency goes with it.

## Sequencing & gates

1. PR-1 → both review gates → merge (SAFE lane unless migration content triggers SENSITIVE — the migration FILE makes it `supabase/**`-adjacent, so treat PR-1 as SENSITIVE: adversarial review + owner sign-off).
2. PR-2 → both gates → merge (SAFE lane).
3. Migration application: separate human-gated step, only after Supabase stability is verified.
4. Purge script: dry-run → owner eyeballs the list → `--live` run → verify with a Sanity count query.

Between PR-1 and PR-2 the old /teach pages render but cannot write — acceptable interim on a mock-content platform.

## Testing & verification

- Suites minus deleted surfaces stay green; `tsc` clean; i18n keys for deleted screens pruned from all 3 locale files (parity check).
- New tests: viewer wallet-match query, both empty states, stats-route wallet auth (matching wallet 200, non-matching 403, no session 401).
- End-to-end: viewer rendered against live data with the owner wallet `B7o8NfV81HzjuZFWQTTx3Xdvh77Dqoajwib3kWEnvzJF` (owns all 4 mock instructors — every course should appear).

## Explicitly out of scope

- Admin panel restructure/nav (SP3). Sanity removal, `authoringStatus` gate cleanup, onChainStatus relocation (SP2). CS-4 devnet cutover and #400/#401/#402 (tracked separately; #400 resolves in SP3). Any mainnet action.

## Issue remapping

- #263/#264/#265 (teacher-courses epic): superseded by SP1 — close with pointers to this spec on PR-2 merge.
- #398 (creator attribution): already resolved by #399; verify closed.
- #400 → SP3. #401/#402 → pre-CS-4 checklist. #404/#405/#406: independent, already handled.
