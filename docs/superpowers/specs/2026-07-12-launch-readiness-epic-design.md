# Launch-Readiness Epic (Design)

**Date:** 2026-07-12 · **Rev 2:** 2026-07-12 (tri-audit folded in — ground-truth / alignment / architecture-risk)
**Status:** Rev 2, owner decisions locked. Tri-audit verdict: design **sound and not over-engineered**; one BLOCKING execution-sequencing gap (now fixed by the length-aware decoder + maintenance-window runbook in WS-1). WS-1 promoted to its own sub-spec before execution.
**Origin:** Post-SP1/2/3, a 4-agent issue audit + a 3-agent spec tri-audit. This epic is the consolidated, over-engineering-stripped path to production-ready — the admin **close+recreate / publish** UI (the driving feature), the on-chain reward simplification, and the Next-15 pre-launch migration.

## Owner decisions (locked)

1. **Simplify the creator reward.** Remove `min_completions_for_reward` AND the 100-completion `CREATOR_REWARD_WINDOW` cap from the program. Rationale: course deployment is admin-gated, so the anti-Sybil machinery is over-engineering. Creator earns a flat `creator_reward_xp` **per completion, uncapped**.
2. **`creatorRewardXp` → small flat value (~30) on all courses.** Removing the cap without lowering the value would make 750 an unbounded mint. 30 is proportionate to the ~360 XP a learner earns per course. Set in content.
3. **#414 users:** accept the fresh-start, close. No migration (throwaway devnet rows). ✅ closed.
4. **#376 Next.js highs → Next 15 migration is PRE-LAUNCH, in scope (WS-3.5).** The four `next` highs are patched only in Next 15, so the upgrade fixes them directly (no dismiss-with-reason needed for those). Transitive dev-only criticals still cleared via `pnpm.overrides`. **Risk to plan around:** Next 15's caching-default flip (fetch / GET route handlers / router cache become uncached-by-default) directly touches the SP2 content-read layer — the catalog's ISR `revalidate 3600` + `revalidateTag("courses")` and the `unstable_cache`-wrapped `getActiveDeployments`. The migration must re-assert explicit caching on every cached read or the catalog hits Supabase/bundle per request. Own plan, own gate.
5. **#349 learner deploy UX:** in launch scope — fix the multi-prompt experience now.
6. **No mainnet without explicit confirmation; devnet via Helius RPC only + byte-verify.** (standing rule)
7. **[Rev 2] Anchor-forward; #387 (Pinocchio) stays PARKED, not closed.** WS-1 evolves the existing hardened Anchor program (already audited #299/#303/#315, tested, byte-verified live). #387's Pinocchio rewrite is a *later* migration that will reconcile against these v-next changes — keep it open, don't block launch on it.

## [Rev 2] Caveat stated: creator reward is on-chain-unbounded post-cap-removal
Deleting the `CREATOR_REWARD_WINDOW` cap means `finalize_course` mints `creator_reward_xp` per completion with no on-chain ceiling — bounded only by the admin-deploy gate + `creatorRewardXp = 30`. Deliberate trust-model change: fine for a soulbound, reputational, admin-gated token, but named explicitly. It also means #401's closure now rests entirely on `value = 30` + the admin gate (the cap that used to bound it is gone). Cap-removal and the value drop MUST land atomically in v-next (never uncapped-at-750).

## Decomposition — four workstreams

### WS-1 — Program v-next redeploy (SENSITIVE · on-chain · the spine)
**[Rev 2] Promoted to its own sub-spec** (`docs/superpowers/specs/2026-07-12-program-vnext-design.md`) — it's the sole SENSITIVE on-chain change that gates mainnet and co-mingles three independently-reviewable diffs. The epic tracks it; the sub-spec carries the detailed runbook. Absorbs **#449, #450, #332, #440, #432, #140, #141** and the deploy half of **#355/#356**; unblocks **#139**.

**[Rev 2] The BLOCKING deploy-safety fix (architecture-risk audit).** The client auto-deploys on merge to `main`; the program is a manual Solana op. They race, and the losing state — **v2-layout accounts read by the v1 client — decodes to SILENT garbage** (proven: `lesson_count`→255, `is_active`→false, finalize silently stops, cert mint mis-mints; the reverse throws loudly). Fix:
- **Ship a length-aware decoder FIRST** (own PR, behavior-neutral today): `decodeCourse` branches on `data.length` (224 → v1 coder, 253/255 → v2 coder), or try-v2/catch-v1. This makes the silent-garble window *impossible* and converts a knife-edge cutover into a tolerant migration.
- **Scope the maintenance gate to the 4 on-chain server paths only** — `/api/lessons/complete`, `/api/certificates/mint`, the Helius `event-handlers`/`onchain-queue` finalize+credential path, `/api/admin/status`. The catalog + course pages render from the committed bundle (no on-chain read), so **browsing stays up** during the reset.

**Ordered runbook (all within one announced window):**
1. **[pre]** Ship the length-aware decoder + gate-toggle for the 4 endpoints (behavior-neutral, merged ahead of the window).
2. **Simplify reward logic** (decision 1): delete `min_completions_for_reward` (Course field — **struct shrinks 255→253, a THIRD layout**; a middle-of-struct removal) + `create_course`/`update_course` params, and the `CREATOR_REWARD_WINDOW` cap; `finalize_course` drips flat `creator_reward_xp`. → **closes #450**. **[Rev 2] Full blast radius** (ground-truth): on-chain `state/course.rs`, `create_course.rs`, `update_course.rs`, `finalize_course.rs`; client `admin-signer.ts`, `sync-diff.ts` (drop the `minCompletionsForReward` diff or every course shows perpetual drift), `lib/content/queries.ts`, `packages/content-schema/src/course.ts`, **`api/admin/courses/sync/route.ts` (write path)**, **`api/admin/status/route.ts`**, **`lib/content/compile/projector.ts`**, **`packages/types/src/onchain.ts`**; content bundle; ~12 test/harness files incl. `cu-measurement.ts`; **and strip the #453 `recreate-course.ts` window warning** (it references the removed window).
3. **Content**: `creatorRewardXp: 30`, drop `minCompletionsForReward` on all 6 courses (decision 2) — courses-academy PR + bundle regen. Must land in the bundle **before** recreate (else a course goes live minting the wrong amount uncapped).
4. **Regenerate v2 IDL from the FINAL v-next source** (after step 2's field deletion — NOT in-tree v2, which still has the field) + migrate the **≥5** v1 client consumers (ground-truth): `academy-reads.ts` coder (auto), `admin-signer.updateCoursePda` → `newActiveLessons`, `sync-diff.ts` mask, **`api/admin/courses/sync/route.ts`** (`lesson_count`/`newLessonCount`), **`api/admin/status/route.ts`** (`RawCourse.lesson_count` → else renders `lessonCount=0`). Fold in **#332**'s `1 ≤ lessons ≤ 256` bound and **#432** (sending the mask makes `content_tx_id` update → clears the stale badge). → **closes #449 + #432**.
5. **Complete the recreate path** — merge #453 + **implement the sparse-mask re-apply** (ground-truth: it's TODO on the branch, not done), wire correct `creator`, re-bind `collection`, preserve `is_active`. → **#440**.
6. **Deploy the v-next program to devnet** (Helius RPC + byte-verify). Writes to the 6 v1 accounts now revert (intrinsic). → completes **#355**.
7. **`close_course` ×6** (not ×7 — only 6 course PDAs exist on devnet; reconcile any phantom 7th first) **+ recreate at SIZE 253** with correct creators; verify each recreated account decodes with the v2 client before proceeding. → **#356 + #440 devnet**.
8. **Verifiable build + record the deployed hash** (**#140**); **re-measure CU** (**#141**). Smoke-test enroll→complete→finalize→cert end-to-end, then lift the gate.

Gate: SENSITIVE. Full adversarial review + owner sign-off; **mainnet forbidden without explicit confirmation**.

### WS-2 — Recreate + Publish admin UI (after WS-1) + status-route fixes
The driving feature, now simpler (#450 guard is moot — no window to re-open). See the **Recreate-UI design** section. Bundles the small status-route correctness fixes on the same surface: **#433** (show creator wallet in the first-deploy preview), **#434** (`undecodable` on-chain account gets its own status/badge instead of showing green), **#436** (Supabase read failure degrades the admin screen instead of 500ing it). SAFE-lane unless it touches `onchain_deployments` write logic.

### WS-3 — Security / hygiene fix-bundles (parallel, mostly SAFE-lane)
Independent of WS-1; can run alongside. Grouped to minimize churn:
- **DB + route** (one PR, SENSITIVE — migration): **#410** (delete route must null `wallet_address` — real 1-line bug), **#377** (`REVOKE EXECUTE` on `handle_new_user`/`rls_auto_enable`). **[Rev 2] #377 must FIRST introspect the live `rls_auto_enable`** (`\df+` / pg_dump on prod) — it's untracked in the repo (the #414 drift class); you cannot author a correct `CREATE OR REPLACE`/`REVOKE` for a function whose live body/signature you don't have. **[Rev 2] #375 → document-and-close** (the issue's own accepted done-when): the shortfall is a <30-XP soulbound edge case; documenting partial-credit acceptance beats redesigning a SECURITY DEFINER function inside the launch migration. **[Rev 2] Pin migration-before-code** (SP1 lesson): apply via MCP → verify → *then* merge the code PR (main auto-deploys).
- **Supply-chain** (one PR, `.github/` + deps): **#376** transitive crit/highs via `pnpm.overrides` (the 4 `next` highs are handled by WS-3.5, not dismissed), **#382** (SHA-pin all Actions + dependabot github-actions), **#381** (content-lint symlink — emit generic parse error, drop `err.message`), **#437** (X-Frame-Options `DENY` + `frame-ancestors 'none'`). *These are hardening — must NOT gate #139/G-2.*
- **Env hygiene** (own PR): **#327** — route the ~26 raw `process.env.<secret>` reads through `serverEnv` (`"" → undefined` normalization).
- **Learner deploy UX** (own PR): **#349** (decision 5) — better prompt framing + raise `BATCH_SIZE` toward 50 (test the ~90s blockhash window); preserve #348's reliability. A true one-prompt deploy (durable nonce) is a later nicety.
- **[Rev 2] i18n — AFTER WS-2, not parallel** (alignment F2): **#452** (+ **#448** merged) collides with WS-2's Courses-screen rewrite. Do it *after* WS-2 lands, and fold WS-2's new recreate/confirm-modal strings into its scope — else i18n is done twice + merge-conflicts.
- **[Rev 2] Cleanup sweep — LAST, isolated** (alignment F6): **#442** (post-Sanity naming, 47 files) + **#404** + delete the dead `purge-legacy-sanity-docs.ts` (#441 residue) + **#392** (genericize the live Supabase ref in 4 docs). A 47-file cosmetic rename mid-crunch is a merge-conflict generator against WS-2 + i18n — run it last or defer past launch.

### WS-3.5 — Next 14 → 15 migration (PRE-LAUNCH · own plan · decision 4)
Its own workstream because it's a major-version bump, not a bundle item. Patches the four `next` highs in **#376** directly. **Load-bearing risk:** Next 15 flips caching to uncached-by-default (`fetch`, GET route handlers, client router cache). Every cached read in the SP2 content layer must be audited and its caching re-asserted explicitly — the catalog ISR (`revalidate 3600` + `revalidateTag("courses")`), `getActiveDeployments` (`unstable_cache`), and the admin `revalidate 0` reads. Also: async request APIs (`cookies()`/`headers()`/`params`) and the `next.config`/eslint-config bumps. Verification: full suite + a prod-parity pass proving the catalog still caches (no per-request Supabase/bundle hits) and lessons render. SAFE-lane (frontend/config) but broad — treat as its own spec→plan→gate. Independent of WS-1; parallel to the on-chain work but must land before launch.

### WS-4 — Mainnet cutover (LAST · ops + final gates)
**#305** (rotate Config.authority + upgrade authority to Squads multisig; split backend_signer — script ready) against the *freshly deployed* v-next program; record the final mainnet build hash (#140); then **#139 (G-2)** flips. No code — the closing checklist. Requires explicit owner mainnet confirmation.

## Recreate-UI design (WS-2 detail)

**Entry:** on the Courses screen, an immutable-field mismatch (creator/difficulty/trackId/trackLevel/prerequisite) currently shows a red "cannot auto-fix" card. Replace the alarm with an honest, actionable state + a **Recreate** action (authority-gated, same `admin_session`).

**Flow (server path exists — #453):**
1. **Preflight** (before anything is closed): validate the new params through the real #427 creator guard (denylist + not-platform-authority), confirm the content is compilable, confirm enrollments will survive (they do — enrollment PDAs key off `course_id`, unchanged). Display exactly what changes: the immutable field(s) old→new, and "completion counters reset; enrollments + learner progress preserved."
2. **Confirm modal** — explicit, not dismissible-by-habit: shows the creator old→new, the reset-vs-preserved list, and a **brief-downtime warning** (close and create are *not atomic* — a closed 0-lamport PDA isn't GC'd until the tx ends, so there's a window where the course PDA is absent and enroll/complete fail; normally seconds).
3. **Execute**: `close_course` → `create_course` at the same PDA (same `course_id` seed). Hard-retry the create; if it still fails, **fail loud** with the exact recovery instruction (a course with no PDA reads as `not_deployed`, so the ordinary Deploy button recreates it). **[Rev 2] The webhook finalize gap (architecture-risk #6):** `event-handlers.ts` does a plain early-return (no `queueFailedAction`) when the course PDA is absent — a learner who finishes their last lesson *during* the absent window permanently loses auto-finalize. So the recreate execute path (and WS-1's close×6) must **gate the finalize/complete endpoints for the affected course** during the window, per WS-1's runbook — recovery is natural for reads but NOT self-healing for that one write.
4. **Reward window**: **N/A after WS-1** (no window). Pre-WS-1 the residual guard would matter; post-simplification it's gone.

**[Rev 2] Mainnet gate = HARD assertion, not framing (alignment F4).** close+recreate expands the hot-key blast radius from "update fields" to "delete any course." The execute path must **assert `authority == the Squads vault` on mainnet** (post-#305) as a hard precondition — else a destructive close is reachable behind a single hot key during the WS-2→WS-4 window. On devnet: unchanged, low-stakes, recreate freely. The button labels it a maintenance-window op.

**Publish half:** the Courses screen already shows content drift + a prefilled publish-PR link (#456). No server-held GitHub write token (rejected trust boundary). This epic doesn't change that; it only makes the deploy/recreate side coherent.

## Close now (already done / obsolete)
✅ Closed with evidence: **#414** (fresh-start), **#401** (creatorRewardXp mitigated), **#361** (CS-10 done), **#441** (script dead), **#363** (auto-review works).
Close during execution: **#450** (when simplification lands), **#444** (delete dead drift route), **#435** (delete dead `diffAchievement`).

## Defer — post-launch, no live impact (explicit)
**#438** (schema-types cleanup), **#426** (doc comment), **#457** (challenge-layout hardening — 0 occurrences; optional trivial first-block guard), **#439** (instructor avatars — no live data; needs a DB exposure view), **#447** (denylist — 1-line comment). Not launch-gating.

## Sequencing & gates
- **WS-3 runs in parallel now** (independent, mostly cheap) — except its i18n + cleanup-sweep bullets, resequenced after WS-2 (F2/F6). **WS-1 is the critical path** (its redeploy unblocks WS-2 and #139) — gets its own sub-spec. **WS-2 follows WS-1** (recreate needs the v2 program + #453). **WS-3.5 (Next 15)** parallel, pre-launch. **WS-4 is last** (custody; #305 = effectively P0, gates #139).
- SENSITIVE PRs (WS-1 program, the DB migration in WS-3): full adversarial review + owner sign-off. SAFE PRs: both gates + independent verify.
- Each workstream gets its own just-in-time implementation plan (SP-epic pattern). WS-1 gets a full sub-spec first (it's the dangerous one).
- **Mainnet remains explicit-confirmation-only.** **#387 (Pinocchio) stays parked** — a future migration reconciles it against these v-next changes (decision 7); do not close it.

## Rev-2 changelog (tri-audit folded in)
- **Verdict:** design sound, **not over-engineered** (2 auditors confirmed — reward simplification is de-engineering; recreate UI is thin-over-#453, off the critical path).
- **BLOCKING fixed:** deploy-sequencing race (silent v1-client-on-v2-account garble, proven) → length-aware decoder shipped first + 4-endpoint maintenance gate + one-window runbook. WS-1 promoted to its own sub-spec.
- **Blast radii widened:** reward removal = 8 prod files + ~12 test/harness + the #453 window warning; #449 = ≥5 client consumers (added `sync/route.ts`, `status/route.ts`); struct shrinks 255→**253** (third layout); IDL regen from the **final** v-next source.
- **#432** un-orphaned → folded into WS-1 step 4. **Squads gate** on recreate = hard assertion (F4). **close_course ×6** not ×7.
- **Trims (owner's simplicity bar):** #375 → document-and-close; #442 → last/isolated; i18n after WS-2; #382/#437 non-gating. **#377** must introspect live `rls_auto_enable` first (untracked). **Caveat stated:** post-cap-removal creator XP is on-chain-unbounded (bounded by admin gate + value 30).
