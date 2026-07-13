# Launch-Readiness Epic (Design)

**Date:** 2026-07-12
**Status:** Approved-in-session (owner decisions locked below). Pending tri-audit before execution.
**Origin:** Post-SP1/2/3, a 4-agent audit validated all ~40 open issues against current code. This epic is the consolidated, over-engineering-stripped path to production-ready. It also delivers the admin **close+recreate / publish** UI (the driving feature) and simplifies the on-chain reward model.

## Owner decisions (locked)

1. **Simplify the creator reward.** Remove `min_completions_for_reward` AND the 100-completion `CREATOR_REWARD_WINDOW` cap from the program. Rationale: course deployment is admin-gated, so the anti-Sybil machinery is over-engineering. Creator earns a flat `creator_reward_xp` **per completion, uncapped**.
2. **`creatorRewardXp` → small flat value (~30) on all courses.** Removing the cap without lowering the value would make 750 an unbounded mint. 30 is proportionate to the ~360 XP a learner earns per course. Set in content.
3. **#414 users:** accept the fresh-start, close. No migration (throwaway devnet rows). ✅ closed.
4. **#376 Next.js highs → Next 15 migration is PRE-LAUNCH, in scope (WS-3.5).** The four `next` highs are patched only in Next 15, so the upgrade fixes them directly (no dismiss-with-reason needed for those). Transitive dev-only criticals still cleared via `pnpm.overrides`. **Risk to plan around:** Next 15's caching-default flip (fetch / GET route handlers / router cache become uncached-by-default) directly touches the SP2 content-read layer — the catalog's ISR `revalidate 3600` + `revalidateTag("courses")` and the `unstable_cache`-wrapped `getActiveDeployments`. The migration must re-assert explicit caching on every cached read or the catalog hits Supabase/bundle per request. Own plan, own gate.
5. **#349 learner deploy UX:** in launch scope — fix the multi-prompt experience now.
6. **No mainnet without explicit confirmation; devnet via Helius RPC only + byte-verify.** (standing rule)

## Decomposition — four workstreams

### WS-1 — Program v-next redeploy (SENSITIVE · on-chain · the spine)
One coherent redeploy that absorbs **#449, #450, #332, #355, #356, #440, #140, #141** and unblocks **#139**. Ordered:

1. **Simplify reward logic** (decision 1): delete `min_completions_for_reward` (Course field + `create_course`/`update_course` params) and the `CREATOR_REWARD_WINDOW` cap; `finalize_course` drips flat `creator_reward_xp` per completion. Client blast radius (mechanical): `admin-signer.ts` params, `sync-diff.ts` (drop the `minCompletionsForReward` diff), `lib/content/queries.ts`, and the content bundle schema. → **closes #450**.
2. **Content**: set `creatorRewardXp: 30`, drop `minCompletionsForReward` on all 6 courses (decision 2) — a courses-academy content PR + bundle regen.
3. **Regenerate v2 IDL + migrate the 3 v1 client consumers**: `academy-reads.ts` coder (auto once IDL swapped), `admin-signer.updateCoursePda` must send `newActiveLessons` (not `newLessonCount`), `sync-diff.ts` must model lessons as the active mask (not increase-only u8). Fold in **#332**'s `1 ≤ lessons ≤ 256` bound. → **closes #449** (the real mainnet blocker; IDL regen is the definition-of-done of any program deploy, now written into the runbook).
4. **Merge #453 (recreate server path)** + wire the correct `creator`; the recreate orchestrator re-applies the sparse mask (recreate rebuilds dense), re-binds `collection`, and preserves `is_active`. → **#440** + #450 residual-correctness notes.
5. **Verifiable build + record the deployed hash** (**#140**); **re-measure CU** on the v2+simplified program (**#141**).
6. **Deploy devnet via Helius RPC only + byte-verify** → completes **#355**; then **`close_course` ×7 + recreate at SIZE 255** with correct creators → **#356** (+ resolves the #440 devnet mismatch).

Gate: SENSITIVE (on-chain + program logic). Full adversarial review + owner sign-off; mainnet forbidden without explicit confirmation.

### WS-2 — Recreate + Publish admin UI (after WS-1) + status-route fixes
The driving feature, now simpler (#450 guard is moot — no window to re-open). See the **Recreate-UI design** section. Bundles the small status-route correctness fixes on the same surface: **#433** (show creator wallet in the first-deploy preview), **#434** (`undecodable` on-chain account gets its own status/badge instead of showing green), **#436** (Supabase read failure degrades the admin screen instead of 500ing it). SAFE-lane unless it touches `onchain_deployments` write logic.

### WS-3 — Security / hygiene fix-bundles (parallel, mostly SAFE-lane)
Independent of WS-1; can run alongside. Grouped to minimize churn:
- **DB + route** (one PR): **#410** (delete route must null `wallet_address` — real 1-line bug), **#377** (`REVOKE EXECUTE` on `handle_new_user`/`rls_auto_enable` + pull the untracked `rls_auto_enable` into schema), **#375** (`award_xp` defer-for-keyed shortfall). SENSITIVE (migration) → gated apply.
- **Supply-chain** (one PR, `.github/` + deps): **#376** transitive crit/highs via `pnpm.overrides` (the 4 `next` highs are handled by WS-3.5, not dismissed), **#382** (SHA-pin all Actions + dependabot github-actions), **#381** (content-lint symlink — emit generic parse error, drop `err.message`), **#437** (X-Frame-Options `DENY` + `frame-ancestors 'none'`).

### WS-3.5 — Next 14 → 15 migration (PRE-LAUNCH · own plan · decision 4)
Its own workstream because it's a major-version bump, not a bundle item. Patches the four `next` highs in **#376** directly. **Load-bearing risk:** Next 15 flips caching to uncached-by-default (`fetch`, GET route handlers, client router cache). Every cached read in the SP2 content layer must be audited and its caching re-asserted explicitly — the catalog ISR (`revalidate 3600` + `revalidateTag("courses")`), `getActiveDeployments` (`unstable_cache`), and the admin `revalidate 0` reads. Also: async request APIs (`cookies()`/`headers()`/`params`) and the `next.config`/eslint-config bumps. Verification: full suite + a prod-parity pass proving the catalog still caches (no per-request Supabase/bundle hits) and lessons render. SAFE-lane (frontend/config) but broad — treat as its own spec→plan→gate. Independent of WS-1; can run parallel to the on-chain work but must land before launch.
- **Cleanup sweep** (one PR): **#442** (post-Sanity naming, 47 files — rename vars/log strings, no logic change) + **#404** (gate-6 stale notice) + delete the dead `purge-legacy-sanity-docs.ts` (#441 residue) + **#392** (genericize the live Supabase ref in 4 docs).
- **i18n** (one PR): **#452** with **#448** merged in — externalize the sync-table + `sync-diff-view` strings across en/pt-BR/es.
- **Env hygiene**: **#327** — route the ~26 raw `process.env.<secret>` reads through `serverEnv` (`"" → undefined` normalization).
- **Learner deploy UX**: **#349** (decision 5) — better prompt framing + raise `BATCH_SIZE` toward 50 (test the ~90s blockhash window); preserve #348's reliability. A true one-prompt deploy (durable nonce) is a later nicety.

### WS-4 — Mainnet cutover (LAST · ops + final gates)
**#305** (rotate Config.authority + upgrade authority to Squads multisig; split backend_signer — script ready) against the *freshly deployed* v-next program; record the final mainnet build hash (#140); then **#139 (G-2)** flips. No code — the closing checklist. Requires explicit owner mainnet confirmation.

## Recreate-UI design (WS-2 detail)

**Entry:** on the Courses screen, an immutable-field mismatch (creator/difficulty/trackId/trackLevel/prerequisite) currently shows a red "cannot auto-fix" card. Replace the alarm with an honest, actionable state + a **Recreate** action (authority-gated, same `admin_session`).

**Flow (server path exists — #453):**
1. **Preflight** (before anything is closed): validate the new params through the real #427 creator guard (denylist + not-platform-authority), confirm the content is compilable, confirm enrollments will survive (they do — enrollment PDAs key off `course_id`, unchanged). Display exactly what changes: the immutable field(s) old→new, and "completion counters reset; enrollments + learner progress preserved."
2. **Confirm modal** — explicit, not dismissible-by-habit: shows the creator old→new, the reset-vs-preserved list, and a **brief-downtime warning** (close and create are *not atomic* — a closed 0-lamport PDA isn't GC'd until the tx ends, so there's a window where the course PDA is absent and enroll/complete fail; normally seconds).
3. **Execute**: `close_course` → `create_course` at the same PDA (same `course_id` seed). Hard-retry the create; if it still fails, **fail loud** with the exact recovery instruction (a course with no PDA reads as `not_deployed`, so the ordinary Deploy button recreates it — recovery is natural).
4. **Reward window**: **N/A after WS-1** (no window). Pre-WS-1 the residual guard would matter; post-simplification it's gone.

**Mainnet framing:** the button labels this a maintenance-window operation and requires the Squads authority (WS-4). On devnet it's low-stakes — recreate freely.

**Publish half:** the Courses screen already shows content drift + a prefilled publish-PR link (#456). No server-held GitHub write token (rejected trust boundary). This epic doesn't change that; it only makes the deploy/recreate side coherent.

## Close now (already done / obsolete)
✅ Closed with evidence: **#414** (fresh-start), **#401** (creatorRewardXp mitigated), **#361** (CS-10 done), **#441** (script dead), **#363** (auto-review works).
Close during execution: **#450** (when simplification lands), **#444** (delete dead drift route), **#435** (delete dead `diffAchievement`).

## Defer — post-launch, no live impact (explicit)
**#438** (schema-types cleanup), **#426** (doc comment), **#457** (challenge-layout hardening — 0 occurrences; optional trivial first-block guard), **#439** (instructor avatars — no live data; needs a DB exposure view), **#447** (denylist — 1-line comment). Not launch-gating.

## Sequencing & gates
- **WS-3 runs in parallel now** (independent, mostly cheap). **WS-1 is the critical path** (its redeploy unblocks WS-2 and #139). **WS-2 follows WS-1** (recreate needs the v2 program + #453). **WS-4 is last** (custody against the deployed program).
- SENSITIVE PRs (WS-1 program, the DB migration in WS-3): full adversarial review + owner sign-off. SAFE PRs: both gates + independent verify.
- Each workstream gets its own just-in-time implementation plan (SP-epic pattern). This spec goes through the tri-audit first.
- **Mainnet remains explicit-confirmation-only.**
