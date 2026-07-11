# SP2-B — Relocate onChainStatus + Flip the Reads (Implementation Plan)

**Date:** 2026-07-11 · **Spec:** `docs/superpowers/specs/2026-07-10-sp2-remove-sanity-design.md` (rev 2.1), SP2-B section
**Lane:** SENSITIVE (Supabase migration + one-cut read/write flip; main auto-deploys)
**Prereqs:** SP2-A merged (compiler, committed bundle at `src/content/generated/`, `lib/content/store.ts` + `build-store.ts` + `types.ts`, `content.lock`, CI freshness/parity anchors).
**Rollback property to preserve:** Sanity's `onChainStatus` is frozen but left intact until SP2-C — a straight revert of this PR must fully restore the old world. Keep the flip mechanical and reversible.

## Ambiguities resolved (read before executing)

1. **Instructor avatar source.** Spec decision 2: avatars come from `profiles.avatar_url` keyed by `instructor.wallet`; the bundle carries no avatar. Live content has zero instructor avatars (measured), so the observable production value is already null. **Controller-reviewed resolution: project `avatar: null` in SP2-B.** Do NOT wire a `profiles` read here — the anon cookieless client can't read other users' profiles under own-row RLS, and exposing avatars-by-wallet publicly is an RLS design decision that must not ride inside a SENSITIVE flip PR. Wiring real profile avatars is a follow-up issue (needs a deliberate public exposure surface, e.g. a view).
2. **Where the flipped query fns live.** 33 files import `@/lib/sanity/queries`; `COURSES_CACHE_TAG` has 5 importers. **Resolution:** re-implement the fns in `lib/content/queries.ts` (server-only, over the bundle store + Supabase seam) and turn `lib/sanity/queries.ts` into a thin **re-export barrel** (`export * from "@/lib/content/queries"` plus `COURSES_CACHE_TAG`). Zero import-site churn in the sensitive PR; SP2-C repoints imports and deletes the barrel. Revert stays clean.
3. **Return-type contract.** Each query fn PRESERVES its exact current return type (`Course`, `Lesson`, `LearningPath`, `CourseSummary`, `RecommendedCourse`, `DeployedAchievement`, `AdminCourse`, `QuestData`, … from `@/lib/sanity/types`). The GROQ projection (slug→string flatten, `thumbnail.asset->url`, `instructor->` deref, `modules[].lessons[]->` deref, `blocks[]` shape, `award{...}`) moves verbatim into TS projector functions. No consumer changes shape.
4. **`authoringStatus` is dead.** All live courses are `approved`; the clause is dropped (not defaulted). Gate becomes exactly `synced && coalesce(isActive, true)`, sourced from Supabase.
5. **Client split (controller-reviewed):** public/gated reads use the anon cookieless client against the **public view**; admin + reward-path reads that need the full row (e.g. `track_collection_address`) use `createAdminClient()` (service_role) in server-only routes — the public view stays minimal.

## Data-plane split this PR lands
- **Content** → the committed bundle (`lib/content/store.ts` maps).
- **On-chain status** → new Supabase `onchain_deployments` table (keyed by content id `course-*` / `achievement-*`), read via a cached map, written by the 4 writer sites.
- **slots.lock + synced-SHA** → the bundle (`slotsByCourseId`, `meta.json.sha` / `content.lock`), retiring the runtime GitHub tarball fetch and the `contentSync` singleton.

## Consumer inventory (shape preserved for every one)

| Fn | Return type | Gate today | Flip |
|---|---|---|---|
| `getAllCourses` | `Course[]` | synced+active+auth | bundle + status map, gated |
| `getCourseBySlug` | `Course \| null` | synced+active+auth | bundle + status map, gated |
| `getLessonBySlug` | `Lesson \| null` | synced+active+auth | bundle (server-only; carries `solution`/`tests`) + status map, gated |
| `getLessonByIdForGrading` | `Lesson \| null` | ungated, revalidate 0 | bundle only, uncached |
| `getAllLearningPaths` | `LearningPath[]` | nested course gate | bundle paths + course status map, gated |
| `getCourseById` | `Course \| null` (+`trackCollectionAddress`) | ungated | bundle + deployment-by-id (admin client), uncached (reward path) |
| `getCourseIdBySlug` | `{_id,xpPerLesson}\|null` | synced+active+auth | bundle + status map, gated |
| `getCourseLessons` | `Pick<Lesson,…>[]` | synced+active+auth | bundle + status map, gated |
| `getCoursesByIds` | `CourseSummary[]` | synced+active+auth | bundle + status map, gated |
| `getLessonsByIds` | `LessonSummary[]` | ungated | bundle only |
| `getRecommendedCourses` | `RecommendedCourse[]` | synced+active+auth | bundle + status map, gated |
| `getAllCourseTags` | `{…}[]` | synced+active+auth | bundle + status map, gated |
| `getAllCourseLessonCounts` | `{…}[]` | synced+active+auth | bundle + status map, gated |
| `getDeployedAchievements` | `DeployedAchievement[]` | `defined(achievementPda)` | bundle + deployment join (has PDA) |
| `getAllAchievements` | `DeployedAchievement[]` | all | bundle only |
| `getAllQuests` | `QuestData` | `active==true`, code-block lessons, module→lesson map | bundle only |
| `getAllCoursesAdmin` | `AdminCourse[]` | admin, revalidate 0 | bundle + full deployment row (admin client), uncached |
| `getLearningPathsForAdmin` | `AdminLearningPath[]` | admin, revalidate 0 | bundle only, uncached |
| `getAllAchievementsAdmin` | `AdminAchievement[]` | admin, revalidate 0 | bundle + deployment row (admin client), uncached |
| `getInstructorCourses` | `InstructorCourseSummary[]` | synced only, by wallet | bundle + deployment status |
| `isInstructorWallet` | `boolean` | instructor-by-wallet | bundle only |
| inline `teacher/courses/[id]/stats` | `{wallet}` | `instructor->wallet` | bundle instructor deref |

**Reward/grading consumers this PR must not break** (all resolve via the fns above): `app/api/certificates/mint/route.ts`, `lib/helius/event-handlers.ts`, `lib/solana/onchain-queue.ts`, `app/api/lessons/complete/route.ts`, `app/api/admin/resync/route.ts`.

**Writer sites (4)** — flip to Supabase-only, keep `revalidateTag("courses")`: `admin/courses/sync` (`writeCourseOnChainStatus` + `writeCourseTrackCollection`), `admin/achievements/sync` (`writeAchievementOnChainStatus`), `admin/courses/{deactivate,reactivate}` (`writeCourseActive`), `lib/solana/admin-signer.ts` (`writeCourseTrackCollection`).

**Runtime tarball / singleton retirement:** `admin/courses/sync/route.ts::readCourseSlotsLock` and `admin/content/drift/route.ts` derive `slots.lock` from `slotsByCourseId` and the synced SHA from `content.lock` / `meta.json` — no request-time GitHub fetch, no `readContentSyncSingleton`.

---

## Tasks

### Task 1 — Migration: `onchain_deployments` table + public view (HUMAN-GATED, applied before merge)
**File:** `supabase/migrations/<ts>_onchain_deployments.sql`
- Table `onchain_deployments`, PK `content_id TEXT` (`course-*` / `achievement-*` — distinct from `deployed_programs`, which is per-learner practice deploys). Columns mirror the frozen `onChainStatus` union: `status`, `course_pda`, `tx_signature`, `collection_address`, `track_collection_address`, `achievement_pda`, `is_active BOOLEAN`, `last_synced TIMESTAMPTZ`, plus `kind TEXT CHECK (kind IN ('course','achievement'))` and `updated_at`. Index on `kind`.
- `ENABLE ROW LEVEL SECURITY`; no public policies — writes service_role only (house pattern).
- **Public view** `public_onchain_deployments` exposing only what the gate + public reads need (`content_id`, `kind`, `status`, `is_active`, `achievement_pda`); `REVOKE ALL FROM PUBLIC, anon, authenticated; GRANT SELECT TO anon, authenticated;` (study `public_user_xp`).
- Header doc block in the style of `20260703130652_add_profiles_role_and_lock_role_writes.sql`.

**Gate:** applied to David's Supabase under the SP1 triple gate BEFORE the code PR merges. Advisors clean.
**Verify:** table+view exist; anon SELECT on view works; authenticated INSERT rejected; advisors clean.

### Task 2 — One-time backfill from Sanity + parity assertion (HUMAN-GATED, before merge)
**File:** `scripts/backfill-onchain-deployments.ts` (standalone tsx; not shipped in the app).
- Read every managed doc's `onChainStatus` from prod Sanity, **including `isActive` and `trackCollectionAddress`**; upsert one row per synced course + per achievement with a PDA.
- **Parity assertion (fail-closed):** row count == synced Sanity docs; field-by-field equality per `content_id`; divergence → non-zero exit.

**Verify:** dry-run first; real run's parity output (counts + zero field diffs) captured in the PR description. 6 live courses + all synced achievements have rows.

### Task 3 — Supabase deployment read seam (cookieless client + cached map + by-id)
**File:** `apps/web/src/lib/content/deployments.ts` (`import "server-only"`).
- **Cookieless** anon client (NOT `lib/supabase/server.ts` — `cookies()` would force catalog/lesson pages dynamic) against the public view.
- `getActiveDeployments()` → one query → one `ReadonlyMap<content_id, DeploymentStatus>`, wrapped in `unstable_cache` tagged `"courses"` / 3600s. Outage: serve cached; cold-cache + outage fails closed (hidden > leaked).
- `getDeploymentById(contentId)` → uncached, **admin client** (service_role), full row incl. `track_collection_address` — for reward paths + admin reads (server-only routes).
- `isSynced(dep)` = `dep?.status === "synced" && (dep.is_active ?? true)` — the entire gate, one place.

**TDD:** `isSynced` truth table; map-shaping against a stubbed client. No live Supabase in unit tests.
**Verify:** `next build` — catalog + lesson routes stay static/ISR (no `cookies()` in the trace).

### Task 4 — Content projectors: raw bundle doc → GROQ-projected shape
**File:** `apps/web/src/lib/content/project.ts` (`import "server-only"`; pure fns over store maps).
- One projector per output type, field-exact: `projectCourse` (slug flatten, thumbnail path, instructor deref → `{name, avatar: null, bio, socialLinks}`, modules with lesson derefs + drop-nulls), `projectLesson` (full `blocks[]` projection), `projectCourseSummary`, `projectRecommended`, `projectAchievement` (reuse `parseAward` verbatim), `projectQuestData`.
- GROQ `(...)[defined(_id)]` → explicit `.filter()` after deref (#405 hardening). **Never count via flattened traversals** — `totalLessons` = per-course sum of `modules[].lessons.length` (memory: GROQ flatten null-counting).

**TDD:** golden tests — bundle fixtures through each projector deep-equal a snapshot of the current GROQ output (captured from live `queries.ts` against prod BEFORE the flip). Cover: multi-module course, module-less course, code-block lesson (solution/tests), achievement with/without award, quest set. This is the correctness anchor of the PR.

### Task 5 — Flip the query fns
**File:** `apps/web/src/lib/content/queries.ts` (new, server-only); `lib/sanity/queries.ts` becomes the re-export barrel (keeps `COURSES_CACHE_TAG`).
- Gated fns: filter store courses through `isSynced(map.get(course._id))`, then project; `order(title asc)` → `.sort()`.
- Ungated/grading/reward fns per the inventory table (uncached where revalidate 0 today; `getCourseById` + admin fns via `getDeploymentById`).

**TDD:** per-fn tests over fixture store + stubbed deployment map: gated fn hides not-synced/inactive and admits synced+active; grading fn resolves a lesson in a deactivated course; `getCourseById` returns `trackCollectionAddress` from the stub.
**Verify:** typecheck green — return types unchanged means the 33 importers compile untouched.

### Task 6 — Flip the 4 writer sites + retire tarball/singleton in deploy+drift
**Files:** the 4 writer routes/modules + `admin-mutations.ts` writer fns + `courses/sync/route.ts` + `content/drift/route.ts` + the teacher-stats inline query.
- Writer fns keep their signatures; bodies become service_role upserts into `onchain_deployments` (`createAdminClient()`); keep `revalidateTag("courses")` semantics (deactivate/reactivate must purge).
- `readCourseSlotsLock` + drift: bundle `slotsByCourseId` + `content.lock`/`meta.json` SHA; delete the runtime tarball fetch.
- Teacher stats route: resolve `instructor.wallet` via store (`coursesById` → `instructorsById`); 401/403 semantics identical.

**TDD:** update existing route tests — assert Supabase upserts (not Sanity patches), bundle-derived slots, tag purge still fires.

### Task 7 — E2E verification (devnet + render parity) — the SENSITIVE evidence pack
- Render parity: pre-flip GROQ vs post-flip projector output for all 6 courses + 76 lessons, byte-identical.
- Gate: synthetic non-synced row hidden everywhere; `is_active=false` disappears within one tag purge.
- Reward path on devnet: backfilled course resolves through certificates/mint + an achievement award; `getCourseById` returns `track_collection_address`; mint succeeds.
- `next build`: catalog + lesson routes still static/ISR. Public view exposes only the whitelisted columns.
- All captured in the PR description.

## Ordering & gates
1 → 2 human-gated (DB applied + parity-verified BEFORE the code PR merges; triple gate). 3 → 7 sequential code. **Full independent adversarial re-exploit review before the PR opens** (memory: single claude[bot] gate insufficient for trust-boundary flips). Revert-clean: Sanity `onChainStatus` frozen intact until SP2-C.

## Out of scope (SP2-C/D)
Deleting `lib/sanity/*` / `lib/content-sync/*` / Studio; repointing the 33 imports off the barrel; `@sanity/*` deps; `next.config.mjs` cdn/CSP/`/studio` cleanup; env removal; golden snapshots replacing the parity anchor; CMS_GUIDE deletion; profile-avatar wiring (follow-up issue); #387/CS-4.
