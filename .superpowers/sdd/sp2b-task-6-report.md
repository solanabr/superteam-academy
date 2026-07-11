# SP2-B Task 6 — Flip the 4 status writers + retire runtime tarball/singleton

**Branch:** `feat/sp2b-task6-writers-11-07-2026` (off `feat/sp2b-flip-11-07-2026`)
**Status:** COMPLETE. tsc clean (0 errors), lint clean (only import-order warnings on test files, matching pre-existing tests), `pnpm --filter web test` = 62 files / 453 tests green.

## What changed

### 1. Writer fns → Supabase-only (signatures preserved)
- **New module `apps/web/src/lib/content/deployment-writes.ts`** — the 4 writers
  (`writeCourseOnChainStatus`, `writeCourseActive`, `writeCourseTrackCollection`,
  `writeAchievementOnChainStatus`) now service-role **upsert** into
  `onchain_deployments` (keyed on `content_id` PK, `onConflict: "content_id"`),
  setting only the columns each writer owns — matching the old `.patch().set()`
  merge semantics. Column mapping per the migration (`content_id` = doc `_id`,
  `kind`, plus the writer's fields; `last_synced`/`updated_at` = now()). Throws on
  upsert error so the routes' existing best-effort `try/catch` + `console.error`
  fire exactly where they did before.
- **`apps/web/src/lib/sanity/admin-mutations.ts`** — the 4 Sanity-patch bodies
  deleted; module now **re-exports** the 4 fns from `deployment-writes`. All Sanity
  content-sync fns (readManagedDocuments/write/delete/singleton) untouched.

**Writers-location decision:** MOVED to `lib/content/deployment-writes.ts` with
`admin-mutations.ts` re-exporting (the plan's preferred option; mirrors the Task-5
barrel strategy). Call sites (courses/sync, achievements/sync,
courses/{deactivate,reactivate}) are 100% untouched — they still import from
`@/lib/sanity/admin-mutations`. SP2-C deletes the re-export and repoints imports.

### 2. Runtime tarball + singleton retired
- **New `apps/web/src/lib/content/meta.ts`** — exposes `SYNCED_SHA` from
  `content/generated/meta.json` (the ESLint-sanctioned way to reach the pinned SHA
  from outside `lib/content/**`).
- **`admin/courses/sync/route.ts` `readCourseSlotsLock`** — now reads
  `slotsByCourseId.get(courseId)` + `SYNCED_SHA`; deleted `readContentSyncSingleton`
  + `createGitHubClient().fetchTarball()` + `extractTarball()` + the YAML walk. Fn
  is now synchronous; dropped the now-unreachable `GitHubUnavailableError`→503 branch
  (its only source, the GitHub fetch, is gone). `MaskMismatchError`→409 branch kept.
  On-chain/deploy/auth/request logic untouched.
- **`admin/content/drift/route.ts`** — `syncedSha` now = `SYNCED_SHA`; masks derive
  from `slotsByCourseId` via `deriveActiveMask` (new `maskByCourseFromBundle`),
  replacing the pinned-tarball fetch + `maskByCourseFromTree`. **HEAD-drift behavior
  kept intact**: still fetches GitHub `fetchHeadSha`/`fetchChecksState` and the
  `contentUpToDate` ordering interlock for mask actionability.

### 3. Teacher stats route
- **`teacher/courses/[id]/stats/route.ts`** — inline `sanityFetch(instructor->wallet)`
  replaced with store lookups: `coursesById.get(id)` → `_ref` → `instructorsById` →
  `wallet`. 401 (no session) / 403 (no course, no instructor, no wallet, mismatch)
  semantics identical; `dynamic = "force-dynamic"` + Supabase own-row wallet read
  unchanged.

## Changed/added tests (each scrutinized — no assertion weakened)
- **`lib/content/__tests__/deployment-writes.test.ts` (NEW, 5 tests):** mocks
  `@supabase/supabase-js` `createClient`; asserts each writer upserts
  `onchain_deployments` with `onConflict: content_id`, the exact column mapping,
  `kind` course/achievement, that only the owned columns are set (no status churn on
  reactivate), and that an upsert error throws (so callers' best-effort catch fires).
  This is the direct "Supabase upserts, not Sanity patches" assertion (the 4 writer
  routes have no route tests of their own).
- **`admin/content/drift/__tests__/route.test.ts` (UPDATED):** dropped the
  `readContentSyncSingleton` Sanity mock; mocks `@/lib/content/meta` (`SYNCED_SHA`) +
  `@/lib/content/store` (`slotsByCourseId`). Test 1 keeps the original assertion
  (bundle SHA `a…` behind HEAD `b…`, CI green → `behind`/`canSync`) and adds
  `syncedSha` = bundle SHA. Test 2 (NEW) is a STRENGTHENING: a bundle-at-HEAD course
  with a slots entry → `activeLessons` derived from the bundle = `["1","0","0","0"]`,
  proving bundle-derived slots.
- **`teacher/courses/[id]/stats/__tests__/route.test.ts` (UPDATED):** swapped the
  `@/lib/sanity/client` `sanityFetch` mock for a `@/lib/content/store` mock
  (`coursesById`/`instructorsById`). Kept 401 / wallet-match-200 / wallet-mismatch-403
  / no-instructor-wallet-403 / no-session-wallet-403; ADDED course-absent-from-bundle
  → 403. Retained the session-wallet mechanism assertions (from/select/eq on
  `profiles`). Removed only the now-obsolete Sanity-query-shape assertions (the query
  no longer exists).

## Notes / concerns
- **Plan §50 lists `lib/solana/admin-signer.ts` as a `writeCourseTrackCollection`
  writer site — it is NOT.** admin-signer only has a doc-comment mentioning the fn;
  the sole real callers are in `courses/sync/route.ts`. No writer flip needed there.
- **supabase-js typing gotcha (documented in the module):** the generated `Database`
  type lacks `onchain_deployments`, so the write client pins a local `WriteSchema`
  (like the read seam). `.upsert()` requires each relation's `Row`/`Insert` be
  `Record<string, unknown>`-assignable, which an `interface` is NOT — it collapsed the
  value type to `never`. Fixed by re-mapping the read seam's interfaces through
  `{ [K in keyof T]: T[K] }` (index-signature-compatible), keeping zero `any`.
- `readContentSyncSingleton` remains defined in `admin-mutations.ts` (now unused by
  app code) — left in place for revert-cleanliness; the `contentSync` singleton is
  still WRITTEN by the CS-9 content-sync route (out of Task 6 scope).
- Did not touch `lib/content/queries.ts` or `lib/sanity/queries.ts` (Task 5 owner).
- `pnpm --filter web build` not run (Task 5 covers it; changes are route-internal).
