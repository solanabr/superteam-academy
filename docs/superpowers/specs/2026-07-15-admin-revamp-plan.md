# Admin-panel revamp — execution plan (WS-A/B/C/D)

**Status:** ✅ SHIPPED 2026-07-15 — WS-A `#517` (closes #512, #448) · WS-C `#519` (closes #513) · compileBundle prep `#515`. Built via worktree subagents; SAFE lanes gate-verified.

**WS-B (one-click publish) — REVERTED (owner decision 2026-07-15).** Built + merged (`#520`) dark behind an opt-in `GITHUB_PUBLISH_TOKEN`, then removed. A token-free rebuild (WS-B v2 design) proved the only token-free form is "generate the content bundle at build instead of committing it" (Level 2), which would couple **every** prod deploy to `courses-academy`'s availability + immutability (an outage or force-push of the pinned SHA blocks all deploys, incl. hotfixes) and hide the content diff from app-repo PRs. Owner chose to keep the **manual, token-free, hermetic** publish flow (bump `content.lock` → `pnpm compile-content` → commit → PR). #514 closed as not-planned. Kept from the #520 work (they stand alone): the `ci.yml` freshness check now also diffs `content.lock`, `sanitizeReason`'s GitHub-cred redaction, and #515's `compile-bundle.ts` move.
**Sequencing (owner decision 2026-07-15):** `#509 merges → WS-A → (WS-C ∥ WS-B)`. Sequential, conflict-free.
**Freeze:** recreate-course.ts + the recreate/preflight routes' **logic** are FROZEN. Only presentation/copy may change downstream.

## Prerequisites (not code — gate progress)
1. **#509 merges** — dry-run green; needs the gate's re-pass (fixes at `c0a25d8`) + owner sign-off. Linchpin: WS-A items 1–2 and WS-D live in files #509 rewrites/creates (`course-sync-table.tsx`, `recreate-course-flow.tsx`, `sanitize-reason.ts`).
2. **Branch protection on `main`** — owner/repo-admin only. Verified 2026-07-15: `main` is UNPROTECTED (GitHub 404). WS-B's "never push to main" rail depends on it (a `contents:write` PAT is not branch-confined). Enable: require PR + the CI byte-check as a required status check + block force-push. Also closes the current push-to-prod exposure (main auto-deploys).

---

## WS-A — UI lighten + formatting (SAFE) + WS-D copy
One PR on post-#509 `main`. Establishes the extracted shared primitives WS-C/WS-B consume. Use the frontend-design skill; dark-first; keep every ARIA/i18n rule; **preserve the `shadow-push` tactile button-press convention.**

1. **Courses table alignment** — `components/admin/course-sync-table.tsx:174-286`. Add `align-top` to all `<td>` (tall mismatch rows currently drag siblings' Status/Action cells to vertical-center, breaking the eyeline). Give Status a `min-w` wrapper so badge wrapping stops rippling. Make Action a fixed-width `text-right` column, `flex justify-end gap-2`, one consistent size + one primary + one neutral-outline variant (no mixed paddings).
2. **Mismatch card collapse** — the in-row `ImmutableMismatchWarning` (`course-sync-table.tsx:221-226`, post-#509 this region renders `RecreateCourseFlow`'s at-a-glance card) renders full-expanded inline, exploding the row. Collapse to a one-line danger pill ("Immutable mismatch — N field(s)") behind a disclosure that reveals the **same** card unchanged. Pure composition/presentation — the diff computation, preflight/execute calls, and refusal reasons are FROZEN logic, untouched.
3. **Legend** — `courses/deploy-legend.tsx` (rendered unconditionally at `courses/page.tsx:72`, no collapse state exists). Wrap in a disclosure defaulting **collapsed** (`<details>` or controlled `aria-expanded`). Popover-per-badge rejected — `StatusBadge` has no tooltip infra.
4. **"Prepare publish PR" card** — `courses/publish-pin-client.tsx:209,214-300`. The manual 3-step block renders unconditionally on drift; put it behind a default-collapsed disclosure. Once WS-B ships, it becomes the fallback tucked under the one-click button.
5. **Visual heaviness / severity colors** — flatten nested bordered sub-cards (worst: the #509 confirm modal stacks 5 bordered boxes in a bordered dialog in a bordered row) to dividers; full bordered-card only inside disclosures/modals. Fix the "three reds": `danger` (coral) is overloaded for persistent mismatch / transient fetch-error / destructive-action. Reserve `danger` for blocking/destructive only; move transient errors to a distinct neutral/`streak` treatment. Extract the de-facto "admin card" chrome (`rounded-lg border border-border bg-card p-4 shadow-card`) and the table shell as shared primitives (WS-C reuses them). Tokens: `tailwind.config.ts:17-150`.
6. **WS-D copy fix** (needs #509 — same file) — `recreate-course-flow.tsx:388-398`, i18n `admin.deployScreen.recreate.modal.*`. The two adjacent modal strings contradict a reader: `.resetCounters` ("counters reset to 0 … unrecoverable") vs `.preserveList` ("enrollments, progress, certificates all preserved"). Rewrite to the approved copy — *"On-chain counters (total completions/enrollments shown on the course) reset to 0 — unrecoverable. Learner records in the database — enrollments, lesson progress, certificates — are untouched."* — en/es/pt-BR. Also align the reinforcing keys `.result.lostCounters` and `.refusalReason.noImmutableDiff` for consistency.

**Gate:** SAFE-lane (bot + CI + gate verify).

---

## WS-C — content tabs: Quests, Achievements, Paths (SAFE)
One PR after WS-A's primitives land. **One "Content" tab with three sub-views** (not three top-level nav entries — none has Courses-scale write surface). Read-only bundle views except the existing achievement sync. Reuse WS-A's table shell / badge / disclosure / admin-card primitives. i18n ×3.

- **Nav** — `admin/admin-nav.tsx:11` flat `SECTIONS` array; append `"content"` + `admin.nav.content` i18n + a new route folder. No structural nav change.
- **Achievements** — extract the existing `components/admin/achievement-sync-table.tsx` + `/api/admin/achievements/sync` out of its buried spot (`courses/deploy-client.tsx:76`) into the Content tab. Data already in `useAdminStatus()` (`achievements` alongside `courses`). Optionally surface `award.course`/`award.path` (plain string ids — direct `coursesById.get`, no `refId()`), not shown today.
- **Quests** (read-only, ZERO on-chain — do not invent sync) — `getAllQuests()` (`lib/content/queries.ts:450`). Show reward config per `SanityQuest`: `type` (lesson|lesson_batch|challenge|login_streak|module), `xpReward`, `targetValue`, `resetType`, `icon`.
- **Paths** (read-only, ZERO on-chain) — `getLearningPathsForAdmin()` (`queries.ts:593`) → `{_id, title, courseIds[]}`; sequence = doc `courses[]` weak refs via `pathCourseRefIds()`. Show the resolved course sequence.
- **Dangling-ref detection (NET-NEW — build it)** — no generic "resolve ref → flag dangling" helper exists; current sites (`courseLessonDocs`, `pathCourseRefIds`) SILENTLY DROP unresolvable refs. Add an explicit `coursesById.has(id)`/`lessonsById.has(id)` check after extraction and surface dangling refs **loudly** in the Paths/Quests views.
- **Pin/drift** — inherit the existing publish-pin card verdict (one bundle SHA, shared across all content types for free); no new endpoint.

**Gate:** SAFE-lane.

---

## WS-B — one-click publish (SENSITIVE — GitHub repo-write token)
One PR after WS-A (reuses the publish-card slot). **Architecture: recompile inside the Next.js route (Option 1), NOT a GitHub Action.**

**Why in-route:** the compile is light — `compileBundle(tree, {sha, compiledAt})` is a PURE in-memory fn (~370 KB output, 0 asset bytes today), single-digit seconds; the "serverless budget tight" premise is false. **The Action path is unsafe:** GitHub suppresses workflow runs from `GITHUB_TOKEN` pushes → if the Action committed with the default token, the CI byte-check (`ci.yml` "Content bundle freshness", `push: ["**"]`) would NOT run → the PR-only rail fails open. In-route + a dedicated write PAT fires the `push` event (PAT-attributed) → byte-check runs on the bot branch pre-merge.

**Route contract:**
```
POST /api/admin/publish/pin/open   (sibling of the GET pin route)
Auth:  requireAdminAuth(req) → 401 (same as pin); POST → isSameOriginRequest CSRF check
Body:  { headSha }   // server RE-VALIDATES == courses-academy HEAD and CI==success (don't trust client)
200:   { pr:{url,number,branch}, pinnedFrom, pinnedTo }
501 {unavailable:true} when the write token is unset → client keeps today's manual PreparePr card
502/503 {error} on GitHub write failure (generic; never echo token/tokened URL)
```
Server flow: re-verify headSha == HEAD & checks green → `fetchTarball` → `extractTarball` → `compileBundle` → build a tree mirroring `writeBundle`'s rebuild-from-scratch (drop stale generated/asset paths, don't overlay `base_tree`) → create `chore/content-pin-<sha>` ref off main → one commit (`content.lock` bump + regenerated `src/content/generated/**` + `public/content-assets/**`) → open PR vs main → return handle.

**Prep:** move `compileBundle` from `apps/web/scripts/compile-content.ts` into `src/lib/content/compile/` so route + script share one impl (a divergent copy drifts from what CI recompiles). Extend the GitHub client (`lib/github/github.ts`, read-only + content-repo-pinned today) with app-repo, write-scoped branch/blob/tree/commit/PR ops.

**Rails → enforcement:**
- PR-only: route only creates `chore/content-pin-<sha>` refs + PRs; **main branch protection** is the real backstop; CI byte-check is the correctness enforcement (fires because the ref is PAT-created).
- admin-auth + CSRF: `requireAdminAuth` (POST → same-origin + cookie).
- Opt-in degrade: gate on a NEW optional `GITHUB_PUBLISH_TOKEN` (`optStr` in `env.server.ts`). **Do NOT reuse `GITHUB_TOKEN`** (read-scoped on the content repo).
- No leak: wrap every outbound error in `sanitizeReason`; **extend it** to redact `x-access-token:`/`Bearer`/GitHub-URL creds (codeload 302 + ref/PR bodies carry them).

**Adversarial-pass focus (7 risks):** (1) CI-trigger trap — prove the bot branch push actually fires the byte-check; (2) tree fidelity vs `writeBundle` (orphaned stale files → byte-check red); (3) token branch confinement rests on main protection — verify on; (4) red-HEAD race — server re-validate headSha at open; (5) credential leakage surfaces (tarball 302, ref/PR/rate-limit bodies); (6) idempotency — pre-existing `chore/content-pin-<sha>` → 409-degrade, not 500/force-push; (7) module boundary — don't import `compileBundle` from `scripts/`.

**Gate:** SENSITIVE — my independent adversarial pass + owner sign-off before merge. Blocked on the branch-protection prerequisite.
