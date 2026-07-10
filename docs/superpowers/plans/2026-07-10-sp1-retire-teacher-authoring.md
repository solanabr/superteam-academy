# SP1 — Retire Teacher-Authoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Rev 2 — post tri-audit.** Three independent auditors (ground-truth, alignment, security) invalidated rev 1 on: the purge guard (GROQ null vs undefined), unaccounted `profiles.role` consumers (auth-provider — app-wide logout on migration), a PR-1 delete/keep contradiction (teacher-mutations), the missed `teach/layout.tsx` role gate, and the spoofable wallet auth (#408). All fixed below.

**Goal:** Delete every UI-authoring-era surface and replace /teach with a read-only wallet-keyed analytics viewer, closing #408 in the same migration.

**Architecture:** PR-1 "cut the writers" (admin panels + API routes + validate.ts + gated migration + purge script). PR-2 "replace the reader" (/teach viewer, stats rewire, header/auth-provider role removal, teacher libs deletion, dead-code sweep). Migration applies only after PR-2 deploys.

**Tech Stack:** Next.js 14 App Router, next-intl, Sanity GROQ, Supabase SSR, vitest.

**Spec:** `docs/superpowers/specs/2026-07-10-sp1-retire-teacher-authoring-design.md` (rev 2) — its Owner decisions + Security decision bind this plan.

## Global Constraints

- TypeScript strict, **zero `any`**; all NEW strings via next-intl, en/pt-BR/es parity (`apps/web/src/messages/`). The 4 admin panels have no i18n (hardcoded English) — nothing to prune in PR-1; the `teacher.*` namespace is pruned in PR-2 ONLY.
- PR-1 is **SENSITIVE** (migration file): both gates + independent adversarial review + owner sign-off. **Merge ≠ apply.** Application gate: **PR-2 deployed to prod + Supabase stability confirmed** (auth-provider still selects `role` until PR-2 — applying earlier logs out the whole app).
- Purge script: dry-run default, token REQUIRED in both modes, `perspective: "raw"` pinned, `--live --expect N` count assertion, refuses `sync.source != null` docs.
- Tests: `pnpm --filter @superteam-lms/web test` (354 baseline) + `typecheck`. Node: `export PATH="/Users/thomgabriel/.nvm/versions/node/v22.17.1/bin:$PATH"`.
- Branches `loop/sp1-pr1-cut-writers-<DD-MM-YYYY>`, `loop/sp1-pr2-teach-viewer-<DD-MM-YYYY>`; conventional commits.

---

## PR-1 — "Cut the writers"

### Task 1: Remove the 4 obsolete panels + their residue

**Files:**
- Modify: `apps/web/src/app/[locale]/admin/admin-client.tsx`
- Modify: `apps/web/src/app/api/admin/status/route.ts` (drop `pendingReviews`)
- Delete: `apps/web/src/components/admin/course-review-queue.tsx`, `course-tags-panel.tsx`, `learning-paths-panel.tsx`, `teacher-roles-panel.tsx` (no colocated tests exist — verified)
- Modify: `apps/web/src/lib/sanity/queries.ts` (delete `getPendingReviewCourses`) and `apps/web/src/lib/sanity/admin-mutations.ts` (delete `approveCourse`, `rejectCourse` + their tests — their only caller is the deleted review route/queue)

**Steps:**
- [ ] In `admin-client.tsx` remove: imports + JSX of `CourseReviewQueue`, `CourseTagsPanel`, `LearningPathsPanel`, `TeacherRolesPanel` (imports at lines 6-14); the `PendingReviewCourse` type import (line 7); `AdminStatus.pendingReviews` (line 68); `const pendingReviews = status.pendingReviews ?? []` (line 125); the "Review Queue" section header/refresh chrome (lines 154-178). Line numbers are rev-time — re-locate by symbol.
- [ ] In `api/admin/status/route.ts` remove the `pendingReviews` field and its `getPendingReviewCourses` call (lines 14, 45-49, 201 rev-time). Delete `getPendingReviewCourses` from queries.ts and `approveCourse`/`rejectCourse` from admin-mutations.ts + their test blocks.
- [ ] `git rm` the 4 component files.
- [ ] `pnpm --filter @superteam-lms/web typecheck && pnpm --filter @superteam-lms/web test` → green.
- [ ] Commit: `refactor(admin): remove review-queue/tags/learning-paths/teacher-roles panels + dead pendingReviews stat`

### Task 2: Delete manual-management + teacher CRUD API routes

**Files:**
- Delete dirs: `apps/web/src/app/api/admin/tags/`, `api/admin/learning-paths/`, `api/admin/teachers/`, `api/admin/courses/review/`
- Delete: `api/teacher/courses/route.ts`, `api/teacher/courses/[id]/route.ts`, `[id]/structure/route.ts`, `[id]/thumbnail/route.ts` + `thumbnail/__tests__/route.test.ts`, `api/teacher/upload-image/`
- Delete: `apps/web/src/lib/teacher/validate.ts` (importers = exactly the 3 routes above — verified)
- **KEEP until PR-2**: `api/teacher/courses/[id]/stats/route.ts`, `lib/teacher/authorize.ts`, `lib/teacher/stats.ts`, `lib/sanity/teacher-mutations.ts`, `lib/sanity/teacher-structure.ts` (stats route imports `getCourseAuthorship` from teacher-mutations at line 5; /teach pages import both libs)

**Steps:**
- [ ] `git rm -r` the listed routes + validate.ts; delete their test files.
- [ ] Re-verify keeps: `grep -rln "teacher-mutations\|teacher-structure" apps/web/src --include="*.ts*"` → hits must be only the stats route + /teach pages (all die in PR-2).
- [ ] `typecheck + test` → green. Commit: `refactor(api): delete teacher CRUD + manual tags/paths/teachers/review routes`

### Task 3: Migration — drop role machinery, add wallet_address write-lock (#408)

**Files:**
- Create: `supabase/migrations/20260710120000_drop_teacher_role.sql`

**Steps:**
- [ ] Write:
```sql
-- SP1: retire the teacher-role concept (instructor identity = on-curve
-- instructor.wallet in courses-academy) AND close #408 by locking
-- profiles.wallet_address writes to service_role — the same self-escalation
-- class the role trigger closed, on the column that now carries identity.
-- IRREVERSIBLE BY DESIGN: role values are destroyed (concept retired).
-- Live-verified 2026-07-10: zero RLS policies reference profiles.role.

DROP TRIGGER IF EXISTS trg_enforce_profile_role_write ON public.profiles;
DROP FUNCTION IF EXISTS public.enforce_profile_role_write();
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- #408: wallet_address may only be set by service_role (SIWS link routes).
CREATE OR REPLACE FUNCTION public.enforce_profile_wallet_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.wallet_address IS DISTINCT FROM OLD.wallet_address
     AND current_setting('request.jwt.claims', true)::jsonb->>'role' IS DISTINCT FROM 'service_role'
  THEN
    RAISE EXCEPTION 'wallet_address may only be changed via the wallet-link flow';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_profile_wallet_write ON public.profiles;
CREATE TRIGGER trg_enforce_profile_wallet_write
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_wallet_write();
```
- [ ] Mirror-check the guard style against the OLD role trigger (`supabase/migrations/20260703130652*`, function `enforce_profile_role_write`) — if it detects service_role differently (e.g. `auth.role()` or `current_user`), use ITS mechanism verbatim so behavior is proven, and note the substitution in the PR body.
- [ ] PR body must include: "MIGRATION FILE ONLY — apply after PR-2 deploys + Supabase stability confirmed" + the pre-apply snapshot query `SELECT id, role FROM public.profiles WHERE role IS DISTINCT FROM 'learner';`
- [ ] Commit: `feat(db): drop teacher role machinery; lock wallet_address writes to service_role (Closes #408 on apply)`

### Task 4: Orphan purge script (dry-run default, audit-hardened)

**Files:**
- Create: `scripts/purge-legacy-sanity-docs.ts`

**Steps:**
- [ ] Write:
```ts
/**
 * One-time purge of legacy (pre-content-standard) Sanity docs + manual-era
 * courseTag / unsynced learningPath docs. DRY-RUN by default; --live to
 * mutate, and --live REQUIRES --expect N where N is the dry-run count.
 * SANITY_ADMIN_TOKEN is required in BOTH modes (raw perspective must see
 * drafts identically in dry-run and live — a tokenless dry-run would show
 * a different doc set than the tokened live run).
 * Run: npx tsx scripts/purge-legacy-sanity-docs.ts [--live --expect N]
 */
import { createClient } from "@sanity/client";

const LEGACY_COURSE_IDS = ["aD45H1NEbb1bqELwloGCqI", "ops2aYkxIM6NMo1gE18U1o"];

async function main(): Promise<void> {
  const live = process.argv.includes("--live");
  const expectIdx = process.argv.indexOf("--expect");
  const expected = expectIdx === -1 ? null : Number(process.argv[expectIdx + 1]);
  if (live && (expected === null || Number.isNaN(expected))) {
    throw new Error("--live requires --expect N (the dry-run count)");
  }
  const token = process.env.SANITY_ADMIN_TOKEN;
  if (!token) throw new Error("SANITY_ADMIN_TOKEN is required (both modes)");
  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "4e3i2wwc",
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
    apiVersion: "2024-01-01",
    token,
    useCdn: false,
    perspective: "raw",
  });
  const targets = await client.fetch<{ _id: string; _type: string; sync: string | null }[]>(
    `*[((_id in $courses || _id in $draftCourses)
       || _type == "module"
       || _type == "courseTag"
       || (_type == "learningPath" && !defined(sync.source))
       || (_type == "lesson" && !defined(sync.source) && !defined(blocks)))]
       { _id, _type, "sync": sync.source }`,
    {
      courses: LEGACY_COURSE_IDS,
      draftCourses: LEGACY_COURSE_IDS.map((id) => `drafts.${id}`),
    }
  );
  // Belt + suspenders: GROQ returns null (not undefined) for absent fields.
  const guarded = targets.filter((d) => d.sync != null);
  if (guarded.length > 0) {
    throw new Error(
      `refusing: ${guarded.length} target(s) carry sync.source: ${guarded.map((d) => d._id).join(", ")}`
    );
  }
  for (const d of targets) console.log(`${live ? "DELETE" : "would delete"} ${d._type} ${d._id}`);
  if (!live) {
    console.log(`dry-run: ${targets.length} docs. Re-run with --live --expect ${targets.length} to execute.`);
    return;
  }
  if (targets.length !== expected) {
    throw new Error(`aborting: target count ${targets.length} != --expect ${expected} (dataset changed since dry-run)`);
  }
  const tx = targets.reduce((t, d) => t.delete(d._id), client.transaction());
  await tx.commit();
  console.log(`deleted ${targets.length} docs`);
}
main().catch((e) => { console.error(e); process.exit(1); });
```
- [ ] Tokened dry-run against prod: expect the verified 25 legacy docs (2 courses + 3 UUID lessons + 20 modules) plus any courseTag / unsynced-learningPath docs; ZERO sync-marked entries; count printed.
- [ ] Commit: `feat(scripts): legacy Sanity purge (raw perspective, count-asserted live mode)`
- [ ] Open PR-1: `Refs #359 #408`, spec link, SENSITIVE flag → both gates + adversarial review + owner sign-off.

---

## PR-2 — "Replace the reader" (branch from main AFTER PR-1 merges)

### Task 5: Delete CRUD pages, teacher components, and the role-gate layout

**Files:**
- Delete: `apps/web/src/app/[locale]/(platform)/teach/courses/` (entire tree), **`teach/layout.tsx`** (role gate — would redirect everyone off the new viewer post-migration), `apps/web/src/components/teacher/` (course-form, course-structure-editor, markdown-field, thumbnail-picker — outside the teach tree, stranded otherwise)
- Strip `teach/page.tsx` to a minimal placeholder Task 6 replaces.

**Steps:**
- [ ] `git rm -r` the three targets + colocated tests; placeholder page; `typecheck` green (fix dead imports).
- [ ] Commit: `refactor(teach): delete CRUD pages, teacher components, role-gate layout`

### Task 6: Read-only wallet-keyed viewer + header/auth-provider role removal

**Files:**
- Rewrite: `teach/page.tsx` (server) + create `teach/instructor-courses.tsx` (client stats expansion)
- Add to `lib/sanity/queries.ts`: `getInstructorCourses`, `isInstructorWallet`
- Modify: `components/layout/header.tsx` (`canTeach` → instructor-wallet check), `lib/auth/auth-provider.tsx` (drop `role` from `PROFILE_COLUMNS` line 35)
- i18n: replace `teacher.*` namespace with `teach.*` viewer keys in en/pt-BR/es; create `apps/web/src/messages/__tests__/parity.test.ts`
- Tests: `lib/sanity/__tests__/instructor-courses.test.ts`, viewer state tests

**Interfaces (produced):**
```ts
// queries.ts — unfiltered by active/authoring gates on purpose: instructors see their deactivated courses too.
export async function getInstructorCourses(wallet: string): Promise<{ _id: string; title: string; slug: string }[]> // GROQ: *[_type=="course" && instructor->wallet == $wallet && onChainStatus.status=="synced"]{_id,title,"slug":slug.current}
export async function isInstructorWallet(wallet: string): Promise<boolean> // GROQ: count(*[_type=="instructor" && wallet == $wallet]) > 0, catalogFetch (1h cache fine)
```
**Consumes:** session profile `wallet_address` resolved the same way `authorizeTeacher()` does today (Supabase SSR own-profile read — copy that mechanism, minus role); `getCourseStats(courseId)` from `lib/teacher/stats.ts` unchanged.

**Steps:**
- [ ] Failing tests first: query-builder tests for both new functions (mock `sanityFetch`, assert query text + params, matching sibling test style); viewer renders courses list when `getInstructorCourses` returns items and the empty state (`teach.emptyState`) when `[]`.
- [ ] Deep i18n parity test: recursively compare key structures of the 3 message files (fails on missing nested keys) — this is NEW; no parity test exists today.
- [ ] Implement query functions, page (two states only — middleware already redirects unauthenticated users), client stats expansion, header `canTeach` via `isInstructorWallet(profile.wallet_address)`, PROFILE_COLUMNS without `role`.
- [ ] All new strings in en + properly translated pt-BR/es.
- [ ] `typecheck + test` green. Commit: `feat(teach): wallet-keyed read-only viewer; header/auth off role`

### Task 7: Stats-route wallet auth + teacher libs deletion + dead-code sweep

**Files:**
- Modify: `api/teacher/courses/[id]/stats/route.ts`
- Delete: `lib/teacher/authorize.ts`, `lib/sanity/teacher-mutations.ts`, `lib/sanity/teacher-structure.ts`
- Sweep: `getManagedCourseTags` (queries.ts), `createCourseTag`/`deleteCourseTag`/`setLearningPathCourses` (admin-mutations.ts) + tests, `packages/types/src/user.ts` `UserRole` + `UserProfile.role`, `packages/types/src/course.ts` `author` + teacher-feedback fields, `lib/supabase/types.ts` role entries (hand-edit; regen post-migration)
- Test: colocated stats route test

**Steps:**
- [ ] Failing tests: matching wallet → 200; different wallet → 403; no session → 401; course without instructor → 403 (NO fallback, no admin override — owner decision 1).
- [ ] Rewire: session wallet (same mechanism as Task 6) vs `sanityFetch('*[_type=="course" && _id==$id][0]{"wallet": instructor->wallet}', {id}, 0)`. Delete the role/author block and `getCourseAuthorship`.
- [ ] Run the sweep; verify each symbol has zero remaining importers before deleting (`grep -rn <symbol> apps/web/src packages/`).
- [ ] `typecheck + test` green across web AND `pnpm --filter @superteam-lms/types build` if types package builds separately.
- [ ] Commit: `refactor(api): stats auth = instructor wallet; delete teacher libs + dead types`
- [ ] Open PR-2 (`Refs #359`, SAFE lane) → both gates → merge.

---

## Post-merge (human-gated, NOT part of any PR)

- [ ] **Order matters:** PR-2 deployed to prod FIRST (removes every `role` read), THEN migration application via dbd5cdaf MCP after owner confirms Supabase stability → `get_advisors` (both types) → verify: role column gone; `trg_enforce_profile_wallet_write` present; **link-wallet flow still works** (SIWS route is service-role); a non-service-role `wallet_address` UPDATE is rejected.
- [ ] Purge: tokened dry-run → owner eyeballs list → `--live --expect N` → verify counts RELATIVE to pre-purge (modules → 0, legacy course ids gone, lesson delta == the UUID-lesson count from the dry-run list; no hardcoded absolutes).
- [ ] Regenerate `lib/supabase/types.ts` + `supabase/schema.sql` snapshot against the post-migration DB; commit as a docs/chore PR.
- [ ] E2E: owner wallet `B7o8NfV81HzjuZFWQTTx3Xdvh77Dqoajwib3kWEnvzJF` → header shows Teach → all 6 courses + stats; non-instructor wallet → no Teach item, /teach shows empty state.
- [ ] Issues: close #398 (fixed by #399 — verified); post spec pointers on the closed #263/#264/#265; #408 closes with the migration application.
