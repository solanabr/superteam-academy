# SP1 — Retire Teacher-Authoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete every UI-authoring-era surface (teacher CRUD, role machinery, 4 obsolete admin panels) and replace /teach with a read-only wallet-keyed analytics viewer.

**Architecture:** Two staged PRs. PR-1 "cut the writers" removes all write paths (admin panels, teacher API routes, teacher libs) and ships the human-gated role-drop migration + orphan purge script. PR-2 "replace the reader" deletes the /teach CRUD pages and adds one read-only viewer whose identity key is `instructor.wallet` (SIWS wallet ↔ Sanity `instructor->wallet`).

**Tech Stack:** Next.js 14 App Router, next-intl, Sanity GROQ, Supabase SSR, vitest.

**Spec:** `docs/superpowers/specs/2026-07-10-sp1-retire-teacher-authoring-design.md` — read it first; its "Owner decisions" bind this plan.

## Global Constraints

- TypeScript strict, **zero `any`**; all strings via next-intl with **en/pt-BR/es parity** (`apps/web/src/messages/{en,pt-BR,es}.json`).
- PR-1 is **SENSITIVE** (carries a `supabase/migrations/**` file): both review gates + independent adversarial review + owner sign-off. **Merging PR-1 must NOT apply the migration** — application is a separate human-gated step.
- The purge script defaults to **dry-run**; `--live` required to mutate; it must refuse to delete any doc carrying `sync.source`.
- Tests: `pnpm --filter @superteam-lms/web test` (354 passing baseline) and `pnpm --filter @superteam-lms/web typecheck`. Node: `export PATH="/Users/thomgabriel/.nvm/versions/node/v22.17.1/bin:$PATH"`.
- Branches: `loop/sp1-pr1-cut-writers-<DD-MM-YYYY>` and `loop/sp1-pr2-teach-viewer-<DD-MM-YYYY>`. Conventional commits.
- **Plan deviation from spec (intentional):** `lib/teacher/authorize.ts` and `lib/teacher/stats.ts` are deleted/kept per PR-2, NOT PR-1 — the surviving stats route imports them until its PR-2 rewire. The spec listed authorize.ts under PR-1; that would break the interim build.

---

## PR-1 — "Cut the writers"

### Task 1: Remove the 4 obsolete panels from the admin page

**Files:**
- Modify: `apps/web/src/app/[locale]/admin/admin-client.tsx` (remove imports + JSX for the 4 panels)
- Delete: `apps/web/src/components/admin/course-review-queue.tsx`, `course-tags-panel.tsx`, `learning-paths-panel.tsx`, `teacher-roles-panel.tsx`
- Delete tests colocated with those components (`grep -rl "course-review-queue\|course-tags-panel\|learning-paths-panel\|teacher-roles-panel" apps/web/src --include="*.test.*"`)

**Steps:**
- [ ] In `admin-client.tsx`, delete the import lines and JSX usages of `CourseReviewQueue`, `CourseTagsPanel`, `LearningPathsPanel`, `TeacherRolesPanel` (exact component names per the file's imports — read it first).
- [ ] `git rm` the four component files and their test files.
- [ ] Remove now-unused i18n keys: in each of the 3 message files, delete the sub-objects under whichever namespaces those four panels used (find with `grep -o "t(\"[^\"]*\"" <component>` BEFORE deleting the files; the shared `teacher` namespace keys used only by these panels go too; keys shared with surviving code stay). Run the parity check test if one exists; otherwise verify with `python3 -c "import json;a=json.load(open('apps/web/src/messages/en.json'));b=json.load(open('apps/web/src/messages/pt-BR.json'));c=json.load(open('apps/web/src/messages/es.json'));import sys;sys.exit(0 if a.keys()==b.keys()==c.keys() else 1)"` (deep parity is enforced by existing i18n tests).
- [ ] Run: `pnpm --filter @superteam-lms/web typecheck && pnpm --filter @superteam-lms/web test` — expect green (test count drops by the deleted suites).
- [ ] Commit: `refactor(admin): remove review-queue/tags/learning-paths/teacher-roles panels (git-sourced now)`

### Task 2: Delete the manual-management + teacher CRUD API routes

**Files:**
- Delete directories: `apps/web/src/app/api/admin/tags/`, `apps/web/src/app/api/admin/learning-paths/`, `apps/web/src/app/api/admin/teachers/`, `apps/web/src/app/api/admin/courses/review/`
- Delete: `apps/web/src/app/api/teacher/courses/route.ts`, `apps/web/src/app/api/teacher/courses/[id]/route.ts`, `[id]/structure/route.ts`, `[id]/thumbnail/route.ts` (+ its `__tests__/route.test.ts`), `apps/web/src/app/api/teacher/upload-image/`
- **KEEP**: `apps/web/src/app/api/teacher/courses/[id]/stats/route.ts` (rewired in PR-2), `lib/teacher/authorize.ts`, `lib/teacher/stats.ts`
- Delete: `apps/web/src/lib/sanity/teacher-mutations.ts`, `apps/web/src/lib/sanity/teacher-structure.ts`, `apps/web/src/lib/teacher/validate.ts`

**Steps:**
- [ ] Before deleting, verify importers: `grep -rln "teacher-mutations\|teacher-structure\|teacher/validate" apps/web/src --include="*.ts*"` — every hit must be a file this task deletes or a /teach page PR-2 deletes. If a /teach page imports them, the page keeps building until PR-2 — so ONLY proceed if hits are the API routes; otherwise defer the lib deletion to PR-2 and note it in the PR body.
- [ ] `git rm -r` the listed routes/libs. Delete their test files.
- [ ] `pnpm --filter @superteam-lms/web typecheck && pnpm --filter @superteam-lms/web test` — green. If a /teach CRUD page fails typecheck due to a deleted lib, defer that lib to PR-2 (see step 1) rather than stubbing.
- [ ] Commit: `refactor(api): delete teacher CRUD + manual tags/paths/teachers/review routes`

### Task 3: Role-drop migration file (application human-gated)

**Files:**
- Create: `supabase/migrations/20260710T00_drop_teacher_role.sql`

**Steps:**
- [ ] Verify the trigger's function name on the live DB (dbd5cdaf MCP, project `obqlljsagzslxarwphxv`): `SELECT tgfoid::regproc AS fn FROM pg_trigger WHERE tgname='trg_enforce_profile_role_write';` — substitute the result below if it differs.
- [ ] Write the migration:
```sql
-- SP1: the teacher-role concept is retired; instructor identity = on-curve
-- instructor.wallet in courses-academy (spec 2026-07-10-sp1). Admin panel auth
-- is the HMAC admin_session cookie and never used profiles.role.
DROP TRIGGER IF EXISTS trg_enforce_profile_role_write ON public.profiles;
DROP FUNCTION IF EXISTS public.enforce_profile_role_write();
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;
```
- [ ] Search for role-referencing policies before finalizing: `SELECT polname, polrelid::regclass FROM pg_policy WHERE pg_get_expr(polqual, polrelid) ILIKE '%role%';` — if any reference `profiles.role`, add `DROP POLICY`/`CREATE POLICY` lines reproducing the policy without the role clause, and paste the before/after into the PR body.
- [ ] Do NOT apply. PR body must carry: "MIGRATION FILE ONLY — application is a separate human-gated step pending Supabase stability verification."
- [ ] Commit: `feat(db): migration to drop profiles.role + escalation-lock trigger (application gated)`

### Task 4: Orphan purge script (dry-run default)

**Files:**
- Create: `scripts/purge-legacy-sanity-docs.ts`

**Steps:**
- [ ] Write the script:
```ts
/**
 * One-time purge of legacy (pre-content-standard) Sanity docs.
 * DRY-RUN by default; pass --live to mutate. Refuses to touch any doc
 * carrying sync.source (those are owned by the content sync).
 * Env: SANITY_ADMIN_TOKEN (write), NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET.
 * Run: npx tsx scripts/purge-legacy-sanity-docs.ts [--live]
 */
import { createClient } from "@sanity/client";

const LEGACY_COURSE_IDS = ["aD45H1NEbb1bqELwloGCqI", "ops2aYkxIM6NMo1gE18U1o"];

async function main(): Promise<void> {
  const live = process.argv.includes("--live");
  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "",
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
    apiVersion: "2024-01-01",
    token: process.env.SANITY_ADMIN_TOKEN,
    useCdn: false,
  });
  // Legacy courses, their lessons (UUID ids, never sync-marked), and ALL
  // module documents (type deleted from the schema in CS-5).
  const targets = await client.fetch<{ _id: string; _type: string }[]>(
    `*[(_id in $courses)
       || (_type == "module")
       || (_type == "lesson" && !defined(sync.source) && !defined(blocks))]
       { _id, _type, "sync": sync.source }`,
    { courses: LEGACY_COURSE_IDS }
  );
  const guarded = targets.filter(
    (d) => (d as { sync?: string }).sync !== undefined
  );
  if (guarded.length > 0) {
    throw new Error(
      `refusing: ${guarded.length} target(s) carry sync.source: ${guarded.map((d) => d._id).join(", ")}`
    );
  }
  for (const d of targets) console.log(`${live ? "DELETE" : "would delete"} ${d._type} ${d._id}`);
  if (!live) {
    console.log(`dry-run: ${targets.length} docs. Re-run with --live to execute.`);
    return;
  }
  const tx = targets.reduce((t, d) => t.delete(d._id), client.transaction());
  await tx.commit();
  console.log(`deleted ${targets.length} docs`);
}
main().catch((e) => { console.error(e); process.exit(1); });
```
- [ ] Dry-run against prod (read needs no token): expect exactly the 2 legacy courses + 3 UUID lessons + N module docs, zero sync-marked entries.
- [ ] Commit: `feat(scripts): one-time legacy Sanity doc purge (dry-run default)`
- [ ] Open PR-1 with `Refs #359` + the spec link; flag SENSITIVE in the body; go through both gates + adversarial review + owner sign-off.

---

## PR-2 — "Replace the reader" (branch from main AFTER PR-1 merges)

### Task 5: Delete the /teach CRUD pages

**Files:**
- Delete: `apps/web/src/app/[locale]/(platform)/teach/courses/` (entire tree: `page.tsx`, `new/page.tsx`, `[id]/page.tsx`, `[id]/edit/page.tsx`, client components)
- Keep for rewrite: `apps/web/src/app/[locale]/(platform)/teach/page.tsx`
- Delete any lib deferred from Task 2 (see its PR body).

**Steps:**
- [ ] `git rm -r` the tree; delete colocated tests; `typecheck` — the remaining `teach/page.tsx` may now have dead imports; strip it to a placeholder that Task 6 replaces.
- [ ] Commit: `refactor(teach): delete CRUD authoring pages`

### Task 6: Read-only wallet-keyed viewer

**Files:**
- Rewrite: `apps/web/src/app/[locale]/(platform)/teach/page.tsx` (server component)
- Create: `apps/web/src/app/[locale]/(platform)/teach/instructor-courses.tsx` (client, stats expansion)
- Add query to `apps/web/src/lib/sanity/queries.ts`
- i18n: replace the `teacher` namespace in all 3 message files with viewer keys (`teach.title`, `teach.signInPrompt`, `teach.emptyState`, `teach.courseCard.*`, `teach.stats.*`)

**Interfaces:**
- Produces: `getInstructorCourses(wallet: string): Promise<{ _id: string; title: string; slug: string }[]>` in queries.ts — GROQ:
```groq
*[_type == "course" && instructor->wallet == $wallet && onChainStatus.status == "synced"]{ _id, title, "slug": slug.current }
```
(unfiltered by active/authoring gates on purpose — an instructor sees their deactivated courses too; note this in a comment.)
- Consumes: caller wallet from the Supabase SSR session — follow the exact pattern used by `apps/web/src/app/api/teacher/courses/[id]/stats/route.ts` (via `lib/teacher/authorize.ts`) to resolve the session profile's `wallet_address`; reuse `getCourseStats(courseId)` from `lib/teacher/stats.ts` for the per-course payload.

**Steps:**
- [ ] Write failing tests first (`apps/web/src/lib/sanity/__tests__/instructor-courses.test.ts`): `getInstructorCourses` builds the exact GROQ above (mock `sanityFetch`, assert query text + params like sibling query tests do).
- [ ] Implement query; page: no session → `teach.signInPrompt`; wallet matches nothing → `teach.emptyState`; else course cards with expandable stats via a small client component fetching the stats route.
- [ ] i18n keys in en, pt-BR, es (translate properly, not machine-echo).
- [ ] `typecheck + test` green. Commit: `feat(teach): read-only wallet-keyed instructor viewer`

### Task 7: Rewire stats-route auth to wallet-match, delete authorize.ts

**Files:**
- Modify: `apps/web/src/app/api/teacher/courses/[id]/stats/route.ts`
- Delete: `apps/web/src/lib/teacher/authorize.ts` (fold what stats needs inline or into `lib/teacher/stats.ts`)
- Test: colocated route test

**Steps:**
- [ ] Failing tests: session wallet == `instructor->wallet` of the course → 200; different wallet → 403; no session → 401; course without instructor → 403 (no fallback).
- [ ] Replace the `auth.caller.role !== "admin" && course.author !== auth.caller.userId` block: resolve session profile wallet (Supabase SSR), fetch `*[_type=="course" && _id==$id][0]{ "wallet": instructor->wallet }` (revalidate 0), compare. Delete `getCourseAuthorship` if now unused. NO admin override (owner decision #1), NO platform-authority fallback.
- [ ] `typecheck + test` green. Commit: `refactor(api): stats auth = instructor wallet match; drop role/author machinery`
- [ ] Open PR-2 (`Refs #359`, SAFE lane), both gates, merge.

---

## Post-merge (human-gated, NOT part of any PR)

- [ ] Migration application via dbd5cdaf MCP **only after** owner confirms Supabase stability; then `get_advisors` both types + verify with `SELECT column_name FROM information_schema.columns WHERE table_name='profiles' AND column_name='role';` → empty.
- [ ] Purge script `--live` run after owner eyeballs the dry-run list; verify: `count(*[_type=="module"]) == 0`, both legacy course ids gone, lesson count == 76.
- [ ] E2E: owner wallet `B7o8NfV81HzjuZFWQTTx3Xdvh77Dqoajwib3kWEnvzJF` signs into /teach → all 6 courses appear with stats.
- [ ] Close #263/#264/#265 with pointers to the spec; verify #398 closed.
