# Master Launch-Experience Spec — Superteam Academy

**Date:** 2026-07-25 · **Status:** Executable plan
**Inputs:** three research reports (`docs/superpowers/specs/2026-07-25-learning-experience-research.md` [pedagogy, roadmap #1–14], `…-learning-uiux-research.md` [F1–F38, R1–R17], `…-personalization-launch-research.md` [S/I/D/C findings, Design A + Design B]) grounded in a 4-domain code audit + independent cross-check. All audit corrections applied (see inline `CORRECTED` tags).
**Hard constraints honored throughout:** ZERO new on-chain work (Pinocchio #387 is the final pre-mainnet program change; XP framing is copy/UI, credential gating is server-side); slots.lock stability (reordering/inserting is SAFE by design — slots are permanent, display order is free); every UI string ×3 locales (en/pt-BR/es, +30% PT-BR expansion budget); existing RLS/SECURITY-DEFINER/migration conventions (`challenge_assists` + `20260709120000` are the templates); serialize all migrations touching `award_xp` / `get_daily_quest_state` on prod (pywhtmidcrptomrabbrw).

---

## 1. Thesis

A Brazilian web2 dev lands on the site and taps **Start learning** — no email, no wallet. Two tap-questions ("I build web apps (JS/TS)" · "Get paid Solana work") route her onto one path: **Zero to Deployed Solana Program** (fundamentals → rust → anchor → capstone). She reads lesson 1 and runs its challenge in the browser, still anonymous — the platform already allows this; only the CTA is missing. A short retrieval close (the already-built quiz block, finally rendered with authored feedback) gates completion; the sign-in ask arrives exactly when her first XP would mint, with a "Later" that banks progress. Every return visit, the dashboard hero is a **Continue** card and, post-launch, a 3–6-item Leitner review strip fed by her own failed test cases — never an XP stats panel. Streaks forgive; XP always reads "n/m to Level k," never a balance; confetti fires once — at credential mint. The capstone ends with a **verified devnet deploy** (the build/deploy pipeline already exists; the mint route just never checks it) and the credential page carries a one-click **Add to LinkedIn** (the one RCT in the corpus tied to employment, +12% for the weakest-employability tercile — our audience) plus a **Superteam Earn handoff**: "your first $500–$5,000 of paid Solana work," never "a job."

**Vs Blueshift:** they own deep program-side education (Pinocchio, assembly, anchor-init challenge builds). Our lane is Brazil-first, zero-setup, browser-only: web2 dev → first deployed program → first paid work. We do not compete on program internals; we compete on the on-ramp and the Earn pipeline.

---

## 2. Current-State Scorecard

Per research P0/P1, with code evidence:

| Report item                                                          | Status                                                 | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pedagogy #1 / UIUX R2 — Leitner review queue + Review nav            | **MISSING**                                            | Zero product code matches leitner/spaced/srs; no review table in schema.sql; no /review route; nav has no slot. Substrate (skill tags #498, quest rail) is live.                                                                                                                                                                                                                                                                                                                                                                            |
| Pedagogy #2 / UIUX R3 — retrieval close gating XP                    | **PARTIAL**                                            | Quiz pipeline fully built end-to-end (zod schema w/ per-option `feedback`+`explanation`, server set-equality grader, fail-closed gate already blocks on-chain XP) — but **0 of 76 lessons contain a quiz block**, the renderer shows no feedback, and a failed quiz surfaces as an _enrollment_ error (lesson-client.tsx:168-171).                                                                                                                                                                                                          |
| Pedagogy #3 / UIUX R9 — streak forgiveness                           | **MISSING**                                            | Freezes not representable: no freeze columns; streak state mutated in **three** persisted-state writers (`award_xp` schema.sql:436-472, `award_community_xp` :1517-1540 — CORRECTED, audit said two DB writers — login_streak quest branch in get_daily_quest_state) plus one display-only module (**CORRECTED 2x: `lib/gamification/streaks.ts` writes nothing** — updateStreak/shouldResetStreak have zero non-test callers; client streak display + calendar derive from xp_transactions, so frozen days can't render). NOT a quick win. |
| Pedagogy #4 — north-star metric (weekly return of previously-active) | **PARTIAL**                                            | posthog-js wired, identify on auth; but only 4 distinct events across ~7 call sites (CORRECTED: audit said 5), no credential/review/challenge-run events, no retention insight defined.                                                                                                                                                                                                                                                                                                                                                     |
| UIUX R1 — dashboard Continue hero + review strip                     | **MISSING**                                            | dashboard/page.tsx is a 1100-line stats-first client component; "last lesson in progress" data exists nowhere (user_progress is completed-only); course-detail Continue CTA hardcodes `modules[0]?.lessons?.[0]` (course-detail-client.tsx:263) — latent bug.                                                                                                                                                                                                                                                                               |
| UIUX R4 — challenge screen refinements                               | **PARTIAL**                                            | AI panel is further along than the report assumes (context-fed, assist-budgeted, comprehension-sealed, #510 scroll-reveal — already built). Missing: first-failure auto-expand (failures currently always expanded, no collapse at all), `failure_message` field (absent from all 3 schema locations), stuck-nudge (no solve-time data anywhere), Monaco a11y (defaults only).                                                                                                                                                              |
| UIUX R5 — credential verify + LinkedIn                               | **PARTIAL**                                            | **CORRECTED: the report's "no wallet-free public verify URL" claim is FALSE** — /certificates/[id] is middleware-public with anon RLS read + X-share. Missing: LinkedIn prefill (zero 'linkedin' matches in src), course-version display (#497 stamps it), i18n on share text, privacy edge (is_public=false 404s the link).                                                                                                                                                                                                                |
| Personalization Design A — 2-tap intake /start                       | **MISSING**                                            | No onboarding route/component; no segment state in DB or localStorage; landing "Get Started" opens the AuthModal — the exact signup-first anti-pattern. BUT anonymous-before-value largely EXISTS (middleware gates only /dashboard,/settings,/teach,/profile; lessons + challenge runner work signed-out).                                                                                                                                                                                                                                 |
| Personalization Design B — flagship path                             | **MISSING**                                            | No "Zero to Deployed" path; solana-core.yaml orders the capstone **directly after fundamentals**, skipping rust/anchor (they live in a separate path); capstone's final lesson points at defi-on-solana — the course the report says to hold.                                                                                                                                                                                                                                                                                               |
| Pedagogy #6 / UIUX R12 — capstone-gated credential                   | **MISSING (server-side only, as assumed — CONFIRMED)** | finalize→issueCredential chained in event-handlers.ts (~426→501) with no artifact check; /api/certificates/mint checks only enrollment.completed_at; /api/deploy/save accepts any self-reported base58 with **no on-chain verification**. Deploy pipeline itself is real (buildable blocks, build server, deployed_programs).                                                                                                                                                                                                               |
| Pedagogy #9 / Design B — Earn pipeline terminus                      | **MISSING**                                            | One marketing string (`step3Desc`); zero superteam.fun links in src; nothing at the post-mint moment.                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Pedagogy #7 / UIUX R8 — cohort leaderboard                           | **MISSING**                                            | get_leaderboard is global-absolute (CORRECTED: DEFAULT p_limit=20, caller-supplied — not intrinsically top-100); no cohort tables (19 tables verified, none); no user-centered rank query; platform has **no scheduler of any kind** (no vercel cron, pg_cron deliberately avoided).                                                                                                                                                                                                                                                        |

---

## 3. Workstreams

Task fields: **surface** · **effort** S/M/L · **priority** P0-launch / P1-launch / P2-post · **deps** · **acceptance**.
Ownership note (cross-check): the review spine (review_items, feed, page, strip, quest) is specified ONCE here, in LX-B — other domains' duplicate specs are subsumed. `/api/lessons/complete` and `dashboard/page.tsx` are contested files; sequencing in §4 resolves the collisions.

### LX-A — Onboarding & Segments (Design A)

**LX-A1 · Landing deep-link to flagship lesson 1** — frontend · **S** · **P0-launch** · deps: LX-D1 (path must exist)
`landing-client.tsx`: hero CTA → first lesson of the flagship path (anonymous access already works — middleware verified public); bottom "Get Started" stops opening AuthModal. Traces: I1/C8 (activation before value), audit "funnel-shaping is the only gap."
_Accept:_ signed-out visitor reaches lesson 1 in one click from the landing page; no auth modal until completion attempt.

**LX-A2 · /start 2-tap intake** — frontend · **M** · **P1-launch** · deps: LX-A3
New route: Screen 1 experience fork (3 verifiable-history options, never self-rating — S10), Screen 2 goal (3 options), Screen 3 optional value-relevance chips (skippable; A/B by locale — S5 harmed no-gap populations), Screen 4 daily-goal picker wired to existing quest targets. i18n ×3. Instrument E2/E7 events (LX-F1). Traces: Design A screens 0–4; audit: greenfield, zero matches for onboarding/intake.
_Accept:_ tap-only, no data-entry fields, ≤4 screens, lands in the segment's entry lesson; every answer is consumed (segment→routing, goal→path-page framing copy, daily-goal→quest target).

**LX-A3 · Segment state: localStorage + profiles column** — mixed · **M** · **P1-launch** · deps: none
Pre-auth: localStorage key. Post-auth: `profiles` migration adding segment/goal/daily_goal (own-row RLS UPDATE — self-writable, unlike `role`; nothing reward-bearing reads it), copy-on-signin. **Launch routing = app-side constant (3 segments × entry course id)** — NOT path-schema metadata; avoids the two-repo staging cycle (cross-check recommendation).
**Acknowledged deferral (pedagogy §3.5):** launch segmentation is topic-routing only — the exact configuration the pedagogy report flags as insufficient ("tracks must differ in guidance level, not merely in which courses they're pointed at"; expertise reversal d=+0.505/−0.428). Accepted consciously: guidance-level differentiation requires the Parsons ladder + rung variants (LX-C7/LX-C8, priced L), which don't exist. Launch mitigations: anonymous skip-friendly access (LX-A1), per-segment guidance modality on the path page (LX-A7), and the course-detail escape-hatch design (LX-B14 — no forced linearity). Full §3.5 compliance arrives with LX-C7/C8.
_Accept:_ segment survives anonymous→signed-in transition; routing table is one exported constant; no content-schema change.

**LX-A4 · Delayed-signup "Later" + anonymous-enroll dead-end fix** — frontend · **M** · **P1-launch** · deps: none
(a) Fix the silent no-op: `use-on-chain-enroll.ts:59` returns when userId is null with no feedback — open AuthModal instead (bug regardless of this plan). (b) "Later" affordance copy at the claim moment (never "discard progress" — F4). (c) Local bank of completed-lesson proofs + replay-on-signin into /api/lessons/complete — replay must be **server-internal** (mark replayed completions so #459 volume gates are not loosened globally; cross-check constraint). (d) Owner decision D-2 (§7) resolves the wallet+enroll-tx collision.
_Accept:_ anonymous pass → tap Enroll → auth modal opens; post-signin, banked lessons complete without tripping the 40/hr gate; gate behavior for non-replay traffic unchanged.

**LX-A5 · Test-out offer for segment 2** — mixed · **L** · **P2-post** · deps: LX-A3, LX-D2 (question substrate)
10-question course challenge; pass → server-side batch drive of the existing per-lesson completion path (program already accepts any-order completions via backend signer — zero on-chain change). Batch is internally invoked service-role-side, exempt from per-user volume gates by construction, not by loosening them. Offer, not gate; retroactive XP so skipping never costs leaderboard position (I5).
Per-module test-out variant (UIUX R6) is the follow-on once course-level test-out works — same batch rails, module-scoped question set; do not build both at once.
_Accept:_ segment-2 user passes test-out → all fundamentals lessons complete + XP minted via existing rails; #459 gate unchanged for normal traffic; capped by xpPerLesson×lessonCount≤10000.

**LX-A6 · Session-end if-then prompt** — frontend · **S** · **P2-post** · deps: LX-A3
"When's your next lesson?" day+time picker, stored in profiles prefs. **No notification channel exists (cross-check: unpriced prerequisite)** — v1 displays the plan on the dashboard only; delivery waits for a future notification workstream (UIUX R17 — not specced here; no LX-F5 exists). Preregister the null on completion (S4).
_Accept:_ answer stored + shown on return visit; no notification code shipped.

**LX-A7 · Path-page presentation + per-segment guidance modality (Design A §3)** — frontend · **S** · **P1-launch** · deps: LX-D1, LX-A3
Path page renders as a **sequenced list with exactly one "start here" card** — NOT a catalog grid — plus a secondary "Browse all courses" link (S9: don't punish experts). Per-segment guidance modality from the routing constant: segment 3 (beginner) = fixed-path emphasis; segment 1 = same sequence with visible skip-ahead; segment 2 = open access (S9 asymmetry). ×3 locales.
_Accept:_ one primary start card; browse-all escape present; modality varies by stored segment; grid layout gone from the path page.

### LX-B — Dashboard & Review Loop

**Explicit deferral note (pedagogy roadmap #1):** the pedagogy report ranks the Leitner review queue its single highest P0. It is sequenced Wave 3 (post-launch) anyway because the audit found ZERO substrate (no table, no route, no nav slot — a 3-PR L-effort spine), while several report-P1 items ship at launch because they are S-effort on existing rails. This is a conscious demotion, not an oversight. Interim launch-time retrieval = in-lesson closes (LX-D2, P1-launch spine); the _spaced_ component is knowingly absent at launch and is the first post-launch build.

**LX-B1 · Dashboard component split (refactor)** — frontend · **M** · **P1-launch** · deps: none
Split the ~1100-line `dashboard/page.tsx` client component into hero-slot / identity-panel / courses / activity modules **before** any of the three contending changes (Continue hero, review strip, cohort strip) land — cross-check: otherwise three PRs collide in one file.
_Accept:_ behavior-identical refactor PR; each subsequent surface lands as an additive slot.

**LX-B2 · Continue card (next-incomplete derivation)** — frontend · **S** · **P0-launch** · deps: none (merge before/with LX-B1)
Derive next-incomplete lesson = content-bundle lesson order minus completed user_progress rows — computable today, no schema change. Same derivation **fixes the hardcoded `modules[0]?.lessons?.[0]` CTA bug** in course-detail-client.tsx:263. Dashboard hero = Continue card; stats demote below fold (F10 — the 5x-retention surface). True mid-lesson resume (scroll position) deferred: owner decision D-3.
_Accept:_ returning learner's dashboard hero and course-detail CTA both point at the actual next incomplete lesson; i18n ×3.

**LX-B3 · review_items migration (single owner of the table)** — db-migration · **M** · **P2-post** · deps: none
`review_items(user_id FK profiles ON DELETE CASCADE, item_key TEXT /* raw lesson _id — PDA-seed convention: never strip ids */, box SMALLINT, due_at TIMESTAMPTZ, last_result, lapse metadata)`, UNIQUE(user_id, item_key), index (user_id, due_at); own-row SELECT, service-role writes — copy the `challenge_assists` RLS pattern exactly. Seed from completed user_progress rows (pure SQL). Skills resolve from the bundle at read time — no skill column (avoids content drift). Fixed 1/3/7/21 boxes; **no ML scheduler ever** (pedagogy: HLR AUC ~0.54).
_Accept:_ migration with tested ROLLBACK; seeded rows for existing learners; anon/authenticated cannot write.

**LX-B4 · Failure-capture feed** — mixed · **M** · **P2-post** · deps: LX-B3
Stop discarding per-test results: plumb `run.results` (ServerTestResult[] already exists in packages/challenge-executor) through `gradeCode`'s `fromRun()` (graders/code.ts:24-27 currently collapses to {ok,status}); on the /api/lessons/complete deny path, service-role upsert failed items into review_items. Quiz misses feed the same way (grading is already server-side at completion). **v1 feeds on submit-failure only** — routing every practice "Run" through the server would break the zero-setup client-execution model and the rate-limit budget (cross-check). /api/lessons/validate-challenge is a verified orphan (zero callers); wiring it is optional, not required.
_Accept:_ a failed completion attempt creates/bumps review_items rows keyed by lesson \_id; practice runs remain client-side; no new rate-limit exposure.

**LX-B5 · /review page + nav slot** — frontend · **L** · **P2-post** · deps: LX-B3, LX-B4
Top-level Review route serving due items (challenge variants + quiz recall); nav item in `sidebar.tsx` AND `mobile-bottom-nav.tsx`; zero learner curation (F29). Clearing an item advances its box; misses reset to box 1. i18n ×3.
**Confusable-concept interleaved sets (pedagogy roadmap #12):** review sessions may mix items across confusable concepts (PDA vs ATA, Anchor constraint types — g≈0.34) — interleaving lives ONLY inside review sets; never interleave lesson prose (g=−0.39).
**Mobile scope (UIUX R15/F21):** /review is the mobile-first surface (quiz recall + Parsons-style items work on touch); Monaco challenges surfaced on mobile show a "continue on desktop" handoff instead of a broken editor.
_Accept:_ due items render and clear; box/due_at transitions match 1/3/7/21; both navs updated; empty state designed; mobile view never renders Monaco.

**LX-B6 · Dashboard review strip** — frontend · **S** · **P2-post** · deps: LX-B1, LX-B5
3–6 due items in the hero region under the Continue card (R1). Additive slot thanks to LX-B1.
_Accept:_ strip shows today's due items, deep-links into /review, hidden when queue empty.

**LX-B7 · Review quest kind (single owner of the quest)** — mixed · **M** · **P2-post** · deps: LX-B5
(1) Add `review` to QUEST_TYPES (packages/content-schema/src/constants.ts). (2) Quest YAML in courses-academy + content.lock bump — **can stage BEFORE the SQL lands**: unknown-type skip verified safe (schema.sql:1000, CS-7 hardening). (3) Migration adding the ELSIF branch to get_daily_quest_state counting items cleared today — preserves the xp_granted/pending_onchain_actions atomicity invariant; migration merges before code deploy (CS-7 precedent). (4) Quest cards become links with per-type hrefs (dashboard-identity-panel quest divs are currently static).
_Accept:_ "Clear your 3 due reviews" quest counts correctly and deep-links to /review; quest XP rides the existing quest_xp rail unchanged; other quest types unaffected.

**LX-B8 · Streak forgiveness — ONE coordinated PR across all streak code paths (3 DB writers + display)** — mixed · **L** · **P2-post** · deps: none (serialize vs LX-B7/LX-B9 migrations)
DB: freeze inventory + consumed-freeze log (or streak_days table). Consume-instead-of-reset in **all three** persisted-state writers: `award_xp` (schema.sql:436-472), **`award_community_xp` (schema.sql:1517-1540 — CORRECTED: audit missed this writer; forgiveness applied only to award_xp would still hard-reset a frozen streak on community XP, hard `ELSE 1` verified)**, and the login_streak branch in get_daily_quest_state. **CORRECTED (cross-check): `lib/gamification/streaks.ts` is display-only** — updateStreak/shouldResetStreak have zero state-writing callers; it and the client calendar (derived purely from xp_transactions dates) must be updated to _render_ freezes, not to consume them. Freezes earned via quest rewards, capped at 2, auto-applied server-side, retroactive snowflake on the calendar (calendar must merge freeze days). Weekly-cadence mode toggle (F32; A/B per pedagogy open question #2). Ship freezes **before** raising streak prominence anywhere (pedagogy #3); until this ships, LX-B13 keeps streak prominence demoted at launch.
_Accept:_ a missed day with a freeze in inventory shows a snowflake, streak unbroken across all code paths (headline streak, quest streak, client display agree); SECURITY DEFINER migration with tested ROLLBACK.

**LX-B9 · Cohort leagues** — mixed · **L** (+ **S** prerequisite) · **P2-post** · deps: LX-B9a; owner decision D-4 (scheduler)
**LX-B9a (S, land early, standalone):** `xp_transactions.source` typed column set at the 6–7 award call sites, backfilled by reason-prefix — league scoring must filter by source, not parse free-text reasons. Lesson XP is already structurally first-completion-only (on-chain bitmap idempotency — audit); the filter excludes creator/community XP.
**LX-B9b (L):** league_cohorts(week_start, tier) + league_members (UNIQUE(user_id, week_start)); assignment via the **lazy on-first-read pattern** (get_daily_quest_state precedent) unless D-4 chooses cron; cohort-scoped RPC + user-centered ±3 RPC (snapshot scores — do NOT extend the SUM-over-xp_transactions-per-call pattern); leaderboard page: cohort primary, global demoted to secondary tab; dashboard "you ±3" strip (additive slot via LX-B1). Zero on-chain work.
**RLS/privacy (cross-check REQUIRED):** replicate the platform convention (migration 20260624181348) exactly — `user_xp` stays own-row SELECT; cohort exposure ONLY via SECURITY DEFINER RPCs mirroring the `get_leaderboard` + `public_user_xp` pattern; the RPCs expose only the view's non-sensitive columns; `is_public=false` cohort members render anonymized (no username/wallet — "Anonymous learner" + score), never leak identity, never get silently dropped (a ~30-person cohort with holes breaks the mechanic). league tables themselves: no broad public SELECT policy.
_Accept:_ ~30-person weekly cohorts, promotion/demotion, weekly reset; cohort score counts only learning-source XP; global board still reachable; private-profile members visible but anonymized; direct table reads by anon/authenticated fail.

**LX-B10 · XP competence-framing copy audit** — copy-i18n · **S** · **P1-launch** · deps: none
Largely compliant already ("X XP to Level N" in sidebar/header/panel). Fix residuals: standalone totals on leaderboard rows/podium paired with level context; activity-feed "+N XP" framing check; rename `useXpBalance` internally; quests "+40" framing. Never "balance"/coin iconography (F34, overjustification d=−0.36 to −0.44). ×3 locales. This task also OWNS the design-system constants F37/F38: tabular numerals on all XP/level/rank figures, and a +30% PT-BR expansion audit of fixed-width controls touched in the pass.
_Accept:_ no learner-facing surface shows XP as a bare balance without level context; no new i18n key contains "balance"; numeric surfaces use tabular numerals; touched fixed-width controls verified at +30% PT-BR.

**LX-B11 · Celebration re-tiering** — frontend · **S** · **P0-launch** · deps: none
Exactly two confetti call sites exist and they are inverted (challenge-interface.tsx:89 on EVERY challenge; deploy-panel.tsx:312). Downgrade challenge pass → checkmark; keep/medium at deploy; add medium at level-up; add full-screen confetti at credential mint (certificate-popup / CourseCompletionMint); add struggling-encouragement state after N failed runs (F11, R10). New learner-facing strings (encouragement copy, level-up moment) are ×3 locales (cross-check: price the translation).
_Accept:_ confetti fires only at deploy + credential mint; level-up gets a medium moment; challenge pass gets a checkmark; encouragement state appears after ≥3 consecutive fails; all new strings externalized ×3.

**LX-B12 · Endowed progress mechanics (UIUX R11 — F6 CONFIRMED, two independent labs)** — frontend · **M** · **P1-launch** · deps: LX-B1 (dashboard slots), LX-B2
Endowed progress with **stated reasons** everywhere progress renders: enrollment/intro counts as the first tick ("you've already started — the intro is behind you"); pre-credit always carries an explicit reason (unexplained head-starts backfire); near-goal intensification (progress UI emphasis rises approaching module/course completion); next-course surfacing at completion against the post-reward slump. Pairs with the LX-F4 "endowed first-tick" experiment — this task builds the surface that experiment measures.
_Accept:_ no progress bar renders 0% after enrollment; every pre-credited tick shows its reason; completion state surfaces the next course; ×3 locales.

**LX-B13 · Launch prominence demotion: streaks + global leaderboard (interim insurance)** — frontend/copy · **S** · **P0-launch** · deps: none
The report P0s forgiveness because hard resets actively drive abandonment (§3.4: "a missed day must never zero visible progress") and calls the global-absolute board "poisoned by design" (§3.2: top ranks measure paste speed) — but both fixes (LX-B8, LX-B9) are post-launch L-items. Interim mitigation so launch doesn't ship the punishment without the insurance: (a) remove/demote the streak counter from dashboard-hero and header surfaces (available in profile/stats, never a hero metric); no copy that raises streak stakes; (b) demote leaderboard nav prominence (not a primary nav CTA; no home-surface leaderboard module). Both revert when LX-B8/LX-B9 land.
_Accept:_ no streak counter or global-rank module in any hero/header surface at launch; streak + leaderboard still reachable; explicitly reverted by LX-B8/B9 acceptance.

**LX-B14 · Course-detail linear-path view (UIUX R6)** — frontend · **M** · **P1-launch** · deps: LX-B2 (next-incomplete derivation)
Course-detail page renders the module list as a **progress map with exactly one active "next" node** (same derivation as the Continue card); completed lessons checked; upcoming lessons visible but visually secondary; **every lesson stays directly openable** (F2 escape hatch — this is presentation, not forced-linearity enforcement, per non-goal #12). Per-module test-out entry point reserved for the LX-A5 follow-on.
_Accept:_ exactly one primary next-lesson CTA per course page; all lessons remain clickable; skipping produces no warning or lockout; ×3 locales.

**LX-B15 · Surprise XP delight bonuses (pedagogy roadmap #8b)** — mixed · **S** · **P2-post** · deps: none
Unexpected rewards are the only reward form with zero undermining (§3.1, d=0.01). Occasional server-side surprise bonuses on the existing quest/award_xp rails (e.g., random small bonus on a completed session) — **never pre-announced, never schedulable, never farmable** (trigger logic server-side only); capped per user per week. No on-chain change (rides existing XP rails).
_Accept:_ bonus never appears in any UI before it is granted; server-side trigger; weekly cap enforced; rails unchanged.

**LX-B16 · Mastery panel from skill tags (UIUX R16/F30)** — frontend · **S** · **P2-post** · deps: none (per-lesson skill tags live since #498)
Per-skill progress panel (profile or dashboard secondary slot): derive skill-level progress from completed lessons × their skill tags, resolved from the content bundle at read time (no new schema). Competence framing consistent with LX-B10.
_Accept:_ panel renders per-skill progress from existing tags; zero schema change; ×3 locales.

### LX-C — Challenge & Lesson UX

**LX-C1 · Quiz feedback UX + 403 mismap + AI suppression (ONE PR)** — frontend · **M** · **P1-launch** · deps: none (content lands via LX-D2)
(a) QuizBlock renders authored per-option `feedback` + `explanation` with a per-question Check interaction — `correct` flags already ship to the client (D4 open-book), so instant feedback needs no new API; server stays authoritative at completion. (b) Fix lesson-client.tsx:168-171 mapping a quiz-fail 403 to `completionFailedEnrollment`. (c) Suppress/disable the AI pane while a quiz block is unanswered in mixed code+quiz lessons (retrieval stays AI-free — F18). **CORRECTED (cross-check): reuse the existing quiz block for retrieval-closes — a new block type is avoidable two-repo schema churn.** Instant client feedback makes the gate replay-limited only — already the accepted model (#459 comment in the route).
_Accept:_ wrong answer → authored feedback + explanation inline; failed quiz completion → correct error copy ×3 locales; AI pane hidden until quiz answered.

**LX-C2 · OutputPanel first-failure auto-expand** — frontend · **S** · **P1-launch** · deps: none
Collapsible rows; auto-expand first failure only (test code + message side-by-side), collapse passes, cap stdout, auto-focus Tests tab on failure (F16 — convention, labeled as such). Handle the degenerate Rust/build-server synthesized shapes (parseRustTestResults, runBuildChallenge fake rows). New affordance strings (expand/collapse labels, Tests tab) are ×3 locales (cross-check: price the translation).
_Accept:_ on failure, exactly the first failing test is expanded; passes collapsed; no layout break on Rust/build paths; new strings externalized ×3.

**LX-C3 · `failure_message` per test case (single-language v1)** — content-schema · **M** · **P2-post** · deps: none
Optional field added in all three shape locations (packages/content-schema code.ts, packages/types/course.ts, compile types) + OutputPanel rendering. **Ship EN-only as the honest v1** — "localized" requires the content-i18n mechanism (LX-D5); never scope content-i18n to one field (cross-check). Author messages for the 10 highest-failure challenges first (UIUX experiment #7). F17: authored beats LLM-generated — no LLM auto-explanation.
_Accept:_ backward-compatible (absent field = current behavior); authored message renders with the failing test; content.lock discipline followed.

**LX-C4 · Solve telemetry + stuck-nudge v1** — frontend · **S** (telemetry) + **M** (nudge) · **P2-post** · deps: LX-F1
Telemetry: challenge_started/run/failed/solved PostHog events (lessonId, elapsed, attemptNumber) — no DB table for v1; medians aggregate PostHog-side. Nudge v1 trigger = **N failed runs** (cold-start: no medians exist yet — audit); 1.5×-median trigger only after telemetry accumulates. Payload: surface a free authored hint (CodeBlock.hints — the existing scaffold channel), in-editor not chat-bubble. Ship as experiment (F15 weakened).
_Accept:_ events flowing; nudge appears after ≥3 failed runs, never on first attempt; acceptance + post-nudge solve rate instrumented.

**LX-C5 · Monaco a11y** — frontend · **S** · **P1-launch** · deps: none
"Press Ctrl+M to toggle tab focus" affordance on editor focus; verify F8 marker navigation with syntax-only diagnostics; NVDA pass (F20 — WCAG 2.1.2 tab-trap). ×3 locales.
_Accept:_ keyboard user can escape the editor; affordance visible on focus; F8 cycles diagnostics.

**LX-C6 · "View reference solution" soft-gate** — frontend · **P2-post** · **S** · deps: LX-B3 (reschedule target)
Solutions already ship silently in the client payload with no UI. Add explicit control: logged (PostHog + optional DB), reschedules the lesson into review. **CONSTRAINT: no XP reduction on-chain — xpPerLesson is fixed; any "reduced XP" is framing/review-scheduling only (cross-check zero-on-chain edge #1).** No Codewars-style permanent forfeit (UIUX not-build #7).
_Accept:_ reveal is a deliberate click, logged, feeds review; XP path untouched.

**LX-C7 · Parsons block + challenge ladder** — mixed · **L** · **P2-post** · deps: none (content volume follows)
New `parsons` block type: zod schema + BLOCK_REGISTRY + renderer (touch-capable, paired-distractor markers, indent guides, red-highlight — F13 CONFIRMED, the strongest editor finding) + **server-authoritative deterministic grader** (ordering proof inside the fail-closed gate, like quiz) + content-lint + JSON-schema regen in lockstep with courses-academy CI. Registry `satisfies` architecture makes wiring mechanical; component + grader + authored rung variants are the bulk. Worked-example/subgoal rungs = authoring formats (prose + numbered line-anchored callouts, F22), not new types.
**Justified drop (personalization I8 / experiment E6):** the report's incentive-graded XP ladder (Codewars: XP per challenge scales with rung minus user level) is DROPPED — xpPerLesson is fixed on-chain (non-goal #1), so XP cannot vary by rung or user level without program changes. Framing-level substitute only: rungs carry visible difficulty labels, no XP variance. E6 cannot run as designed (noted in LX-F4).
_Accept:_ a parsons block renders, grades server-side, gates completion; content repo CI green after schema regen; rungs show difficulty labels but identical XP.

**LX-C8 · Entry-rung-by-segment plumbing** — db-migration · **M** · **P2-post** · deps: LX-C7, LX-A3
Rung selection read in the lesson page once ladder variants exist. **Meaningless before LX-C7 — defer both together (cross-check).** Segment column ships in LX-A3; this adds only variant selection.
_Accept:_ segment-2 learner sees write-rung by default, beginner sees Parsons/worked rung; per-challenge override available.

**LX-C9 · AI post-pass idiomatic review (pedagogy roadmap #13)** — frontend · **M** · **P2-post** · deps: none
After a challenge PASSES, offer an opt-in AI review of the working solution for idiomatic improvement (Exercism finding: ~80% of human mentor comments were mechanizable; this is the report's answer to the RareSkills "feedback is the scarce good" gap, §2.4). Strictly post-pass: pre-pass AI suppression (LX-C1) and the assist budget are unchanged; the review gates nothing and grants nothing. Uses the existing context-fed AI panel.
_Accept:_ review offered only after a passing run; opt-in; zero effect on completion/XP; pre-pass AI behavior byte-identical.

### LX-D — Content & Catalog (courses-academy)

**LX-D1 · THE launch content PR (one PR, one content.lock bump)** — content-only · **M** · **P0-launch** · deps: none — **head of critical path**
Atomically: (1) new `paths/zero-to-deployed.yaml` — fundamentals → rust-for-solana → anchor-framework → building-your-first-solana-program (fixes solana-core.yaml ordering the capstone directly after fundamentals); (2) capstone `what-you-built` rewrite: explicit Earn/grant submission step (prose + curated category links — zero-schema path) AND remove the defi-on-solana next-step pointer (**same PR or the contradiction ships** — cross-check); (3) `paths/defi.yaml` draft:true (defi held per Design B #6 — endgame content; no course-level draft flag exists, path-draft is the mechanism; verify path-less course visibility, else deactivate on-chain via existing admin gate); (4) demote/retire solana-core + rust-programs paths. Slots are SAFE for all of this (reordering/insertion never disturbs learners — CORRECTED audit premise). Gotcha: course referenced by two paths resolves to the FIRST path title (queries.ts `learningPathTitleFor[0]`).
_Accept:_ one content.lock bump activates all four changes; spine renders as one path in the UI; capstone terminus mentions Earn, not defi; defi hidden from catalog; no slot renumbering in the diff.

**LX-D2 · Retrieval-close authoring wave (quiz blocks into the spine)** — content-only · **L** (rolling) · **P1-launch** (spine) / P2 (rest) · deps: LX-C1 (feedback UX should land first or simultaneously)
Author 1–3 retrieval items per lesson using the **existing quiz block** (per-option feedback + explanation are already in the schema — write elaborated retrieval: why/predict-the-output, not verbatim recall; pedagogy #1 transfer caveat). Mid-lesson retrieval-item _placement_ = authoring guideline every ~3–5 min of prose (no code change; rail placement in code lessons is accepted behavior). **Terminology guard: this is NOT "interleaving" in the report's sense** — confusable-concept interleaving (g≈0.34) lives only in review sets (LX-B5), and interleaving prose is actively harmful (g=−0.39). Items are quiz blocks INSIDE existing lessons — no new slots, no on-chain activation needed. Include the anchor-framework intro positioning copy (C4/Design B #2): "aimed at JS/TS devs, no Solidity assumed" — said out loud in the course intro, the differentiator vs RareSkills. Prioritize the 52-lesson flagship spine; EN-only v1 (LX-D5 gates localization). Do NOT author openEnded blocks (attestation endpoint doesn't exist — lessons would become uncompletable).
_Accept:_ every spine lesson ends with ≥1 quiz block with authored feedback+explanation; anchor-framework intro states the JS/TS-first positioning; content-lint green; no openEnded blocks introduced.

**LX-D3 · JS/TS entry-rung course (segment 3)** — content-only · **L** · **P2-post** (fast-follow) · deps: LX-A3 routing
New course directory via the standard pipeline (template scaffold, in-browser TS executor, `typescript` skill slug exists). **CONSTRAINT: must be created on-chain with the real instructor wallet the FIRST time — creator is immutable (pre-mainnet blocker memory; cross-check zero-on-chain edge #3).** C9: no survivor teaches code-from-scratch via Rust; do not market "learn to code via Rust."
_Accept:_ course live with correct creator wallet; prepended to segment-3 routing; standard create_course flow, zero program changes.

**LX-D4 · Stablecoin-payments module in solana-frontend** — content-only · **L** · **P2-post** (fast-follow #2 after LX-D3 per Design B; order per owner) · deps: none
Solana Pay, Token-2022 transfers, on/off-ramp UX — the Brazil wedge (D6/D7: 90% of Brazil's crypto volume is stablecoins). Module insertion is slot-safe, **but new lessons occupy NEW slots that must be ACTIVATED on-chain via `update_course` active_lessons through the existing admin gate (cross-check: complete_lesson enforces is_active_slot — a forgotten sync makes the new lessons silently uncompletable). No program change; it is a required operational step in the insertion checklist.** Applies to any future new-lesson insertion into an existing course.
_Accept:_ module ships inside solana-frontend (not a new course at launch); new slots activated via update_course before content.lock activation; honest scope, no earnings claims.

**LX-D5 · Content-i18n mechanism (the PT-BR moat) — priced as its own workstream** — content-schema · **L** · **P2-post** · deps: owner decision D-5
Content repo is EN-only end-to-end; next-intl covers chrome only. Design ONCE for all content (per-locale markdown variants or locale-suffixed fields) across schema + compiler + projection + renderer; interacts with byte-identical bundle CI and bundle size. Unblocks: PT-BR original content (C10 — incumbents are stale 2022 translations), localized failure_message, localized quiz feedback. **Four separate recs silently depend on this — it was unpriced by every report (cross-check).**
_Accept:_ one mechanism serves prose, quiz feedback, and failure_message; EN fallback; CI still byte-verifies.

**LX-D6 · Instructor credibility + docs drift** — content-only · **M** · **P2-post** (pre-mainnet gate) · deps: none
Fix courses-academy CLAUDE.md/CONTRIBUTING referencing a nonexistent `instructors/` dir; establish the wallet→instructor flow. Devnet placeholder-creator courses fixable only via WS-2 recreate; **mainnet must be right at creation**. Aligning credential trackId/trackLevel to the new spine also requires recreate (immutable to update_course) — decide before mainnet (owner decision D-6).
_Accept:_ docs match repo; mainnet creation checklist includes real instructor wallet + final track ladder.

**LX-D7 · AI-agents-on-Solana course (fast-follow)** — content-only · **L** · **P2-post** · deps: ordering per owner decision D-9
TS + Solana Agent Kit — the report calls this "arguably the biggest gap in the catalog" (D8) and ranks it fast-follow #1 in value order (§4 #3). Standard pipeline; in-browser TS executor (no new block types expected). Same immutable-creator constraint as LX-D3: **created on-chain with the real instructor wallet the FIRST time.** New-course path (create_course), so no slot-activation concern.
_Accept:_ course live with correct creator wallet; positioned after the JS/TS rung per D-9 unless the owner reorders; zero program changes.

### LX-E — Credentials & Earn Bridge

**LX-E1 · Harden /api/deploy/save (MUST precede the gate)** — backend-route · **M** · **P0-launch** · deps: none
Route currently accepts any self-reported base58. Add one RPC read verifying the program account is live + executable on devnet, plus upgrade-authority/ownership check so a public program id can't be claimed (cross-check: shipping the gate first would let anyone claim a credential with someone else's program).
_Accept:_ save rejects non-existent/non-executable/unowned program ids; existing legit rows unaffected; generic error messages per route conventions.

**LX-E2 · Capstone-gated credential (server-side, zero on-chain)** — backend-route · **M** · **P0-launch** · deps: LX-E1 (same PR or before), LX-D1 (capstone identity)
Split the chained Helius handler (event-handlers.ts ~426→501): finalize_course + completion-bonus XP proceed on lesson completion **as today**; only issue_credential gains the capstone check (cross-check: gating the chained handler would delay learner XP). Same check in /api/certificates/mint. Check = verified deployed_programs row exists for the capstone course's deploy lesson. Capstone identity = app-side constant for launch (content-schema flag later). Grandfather copy for pre-gate devnet certs.
_Accept:_ credential mints only with a verified deploy; completion XP timing unchanged; manual mint route returns a specific (localized) "deploy required" state; no program change.

**LX-E3 · LinkedIn Add-to-Profile + share nudge** — frontend · **S** · **P0-launch** · deps: none
Anchor to `linkedin.com/profile/add?startTask=CERTIFICATION_NAME` prefilled (name=course_title, org, issue date from minted_at, certUrl=public /certificates/[id], certId=mint address) — all data already on the page. Share nudge at the post-mint moment in course-completion-mint.tsx (F35 RCT: nudge ≫ passive). ×3 locales. Cheapest high-confidence item in the corpus.
_Accept:_ one click opens LinkedIn with all fields prefilled; nudge appears in the mint success state.

**LX-E4 · Earn handoff card post-mint** — frontend · **S** · **P0-launch** · deps: none
Card in course-completion-mint.tsx success state + certificate page: curated **category** links (bounty listings are ephemeral — D3 caveat), grant framing "avg $5.52k Brazil grants," promise = "first $500–$5,000 of paid Solana work" — never employment, no unverified Brazil earnings totals (Design B contradiction #7). Instrument E8 (Earn submission within 30d). ×3 locales.
_Accept:_ post-mint moment surfaces Earn; zero specific-bounty deep links; E8 event fires on click-through.

**LX-E5 · Verify-page polish** — frontend · **S** · **P1-launch** · deps: none
Display course version (#497 stamps it, page doesn't show it); i18n the hardcoded-English X-share text; network from env not hardcoded 'devnet'; unique-ID/issuer framing (F35 anatomy); optionally /credential/[id] redirect alias. Privacy edge → owner decision D-7 (is_public=false silently 404s the shared link).
_Accept:_ version + issuer + unique ID visible; zero hardcoded UI strings; devnet/mainnet label correct per env.

### LX-F — Metrics & Experiments

**LX-F1 · Event instrumentation pass** — frontend · **S** · **P0-launch** · deps: none
Add: credential_minted (post-mint-cliff baseline — pedagogy #4 demands it NOW), challenge_started/run/failed/solved (feeds LX-C4), earn_handoff_click (E8), onboarding funnel events (E2/E7), linkedin_share_click. Later: review_completed (with LX-B5). Confirm prod PostHog env vars (all optional today — audit).
_Accept:_ events visible in prod PostHog; naming documented in lib/analytics.

**LX-F2 · North-star retention insight** — analytics-config · **S** · **P1-launch** · deps: LX-F1
PostHog weekly-return retention insight filtered to users with a prior lesson_completed; 14-day post-mint activity insight (the cliff baseline). Computable today from $pageview+identify; nobody has defined it.
_Accept:_ dashboard exists, linked from docs; north-star = weekly return of previously-active learners; all mechanics judged on 10–12-week windows (novelty trough weeks 4–6).

**LX-F3 · Per-lesson drop-off instrumentation** — analytics-config · **S** · **P1-launch** · deps: LX-F1
Chapter-level attrition in rust-for-solana/anchor (E4 — locate our structs/interfaces/slices-style cliffs; fix content before any rec infra).
_Accept:_ per-lesson funnel visible for the spine.

**LX-F4 · Experiment registry** — docs/process · **S** · **P2-post** · deps: LX-F2
Track the reports' experiments (continue-hero, retrieval on/off, anonymous trial, test-out visibility, nudge threshold, weekly cadence, cohort vs global, LinkedIn nudge, endowed first-tick, celebration tiering, **challenge-first lesson pilot** — pedagogy roadmap #14/open question #6: attempt-before-exposition in ONE course, active learning +0.47 SD) with preregistered expectations — including the preregistered NULLS (S4: planning-prompt completion). **E6 (incentive-graded XP ladder) is explicitly EXCLUDED: it cannot run as designed — xpPerLesson is fixed on-chain (see LX-C7 justified drop).**
_Accept:_ one doc, metric + expected direction per experiment, window ≥10 weeks; challenge-first pilot scoped to one course; E6 listed as infeasible-as-designed.

---

## 4. Sequenced Delivery Plan

### Wave 1 — Independent quick wins (this week, parallel PRs)

LX-B11 celebrations · LX-B10 XP copy · LX-B13 streak/leaderboard prominence demotion · LX-E3 LinkedIn · LX-E4 Earn card · LX-B2 Continue card (+CTA bug fix) · LX-C2 OutputPanel · LX-A4(a) anonymous-enroll fix · LX-E5 verify polish · LX-B9a xp_transactions source column · LX-F1 events. All verified independent by cross-check. **Explicitly NOT a quick win: streak freeze (no data substrate — L item); LX-B13 is the launch-time insurance in its place.**

### Wave 2 — Launch spine (the critical path)

**CRITICAL PATH TO LAUNCH:**

1. **LX-D1** content PR (path + capstone Earn terminus + defi hold) → one content.lock bump
2. **LX-E1** deploy-save hardening → **LX-E2** capstone credential gate (same PR or ordered)
3. **LX-B2** Continue card (Wave 1) + **LX-A1** landing deep-link
4. **LX-E3/E4** credential + Earn moments (Wave 1)
5. **LX-F1/F2** KPI instrumentation (capstone deploys + Earn submissions = launch KPI, not signups)

Also in Wave 2: LX-B1 dashboard split · LX-C1 quiz feedback PR · LX-D2 spine retrieval authoring · LX-A2/A3 intake + segment state · LX-A4 Later/banking · LX-A7 path-page presentation · LX-B12 endowed progress · LX-B14 course-detail linear-path view · LX-C5 a11y · LX-F3.

### Wave 3 — Review spine (post-launch, strictly ordered)

LX-B3 review_items → LX-B4 failure capture → LX-B5 /review + nav → LX-B6 dashboard strip → LX-B7 review quest (YAML may stage early; SQL branch last). Then LX-C6 solution soft-gate.

### Wave 4 — Depth & scale (post-launch, serialize the SQL)

LX-B8 streak forgiveness (one PR, 3 DB writers + display) ‖ LX-B9b cohort leagues (after D-4) — **do not parallelize: both touch award_xp-shaped prod state; serialize with LX-B7's get_daily_quest_state migration too.** LX-C7 Parsons + LX-C8 rungs (together) · LX-C9 post-pass AI review · LX-A5 test-out · LX-C3 failure_message · LX-C4 stuck-nudge · LX-B15 surprise bonuses · LX-B16 mastery panel · LX-D3 JS/TS course · LX-D4 payments module · LX-D7 AI-agents course (order per D-9) · LX-D5 content-i18n · LX-D6 instructor/track pre-mainnet gate · LX-A6 if-then prompt · LX-F4.

**Migration serialization order (prod SECURITY DEFINER contention):** B9a (source column, trivial) → B3 (review_items, additive) → B7 (get_daily_quest_state branch) → B8 (award_xp + award_community_xp + quest branch) → B9b (league tables + RPCs). Each: tested ROLLBACK, migration-before-code-deploy.

---

## 5. Explicit Non-Goals

From the three reports' NOT-build lists + audit constraints:

1. **Any new on-chain work.** No program changes before Pinocchio #387. XP framing = copy; credential gating = server; solution-view "XP cost" = framing/review-scheduling only (xpPerLesson is fixed on-chain).
2. **ML spaced-repetition scheduler** (HLR AUC ~0.54; Leitner captures the value).
3. **Leaderboard prizes, XP→token bridges, monetary XP salience** (d=−0.88 configuration; soulbound illiquidity is the moat).
4. **Anti-cheat/plagiarism policing** (answer keys go public at every scale tested; integrity lives in the capstone artifact).
5. **XP as wallet/currency UI** — balances, coins, spend mechanics. Token stays invisible plumbing.
6. **LLM auto-explanation of test failures** replacing authored messages (F17: authored beats GPT-4). LLM assists; humans author failure pedagogy.
7. **Unrestricted AI in challenges / AI during retrieval closes** (F18 novice-gap).
8. **Codewars-style permanent solution forfeit** (fights our open-book public-git reality).
9. **One-question-per-screen lesson atomization** (untested unit; long-scroll + interleaved blocks is evidence-proportionate — current layout already matches).
10. **Global-absolute leaderboard as primary; raw streak counter without forgiveness** (confirmed evidence against both).
11. **Participation badges / "collect all 50" meta** (badges decorate, don't retain).
12. **Pure forced-linear path without test-out + practice hub** (Duolingo backlash; segment 2 bears the cost).
13. **Recommender/adaptive-sequencing infra at 6 courses** (S2/S11: zero completion effects; the 3-way routing constant IS the recommender). Revisit >20–30 courses.
14. **Pinocchio course, ZK, full security course, protocol deep-dives at launch** (Blueshift's lane / endgame content — D9, C2). Defi stays held/trimmed.
15. **"Learn to code via Rust" marketing** (C9: contradicted by every survivor — JS/TS rung first).
16. **Learn-to-earn positioning** (skill→work, never L2E; promise "first $500–$5,000," never a job; no unverified Brazil earnings claims).
17. **Notification bandit optimization / building a notification system before something needs it** (channel doesn't exist; LX-A6 v1 is display-only).
18. **Synchronous pair-programming infra; all-social-at-once** (forum nudges only).
19. **Delayed-feedback machinery** (timing g=0.03; spend on feedback content).
20. **Personality-keyed brand** (Buildspace lesson; institutional ownership).

---

## 6. Proposed Issue Breakdown (ready to file — NOT filed)

| #   | Title                                                                         | Labels                           | One-liner                                                                                                             | Tasks               |
| --- | ----------------------------------------------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------- |
| 1   | Celebration re-tiering: confetti only at deploy + credential mint             | area:gamification, priority:P0   | Invert the two confetti call sites; add level-up + struggling states.                                                 | LX-B11              |
| 2   | XP copy audit: competence framing everywhere                                  | area:i18n, priority:P1           | Pair standalone XP totals with level context; kill balance framing; ×3 locales.                                       | LX-B10              |
| 3   | Continue card + fix hardcoded first-lesson CTA                                | area:dashboard, priority:P0      | Derive next-incomplete lesson (no schema change); dashboard hero + course-detail CTA.                                 | LX-B2               |
| 4   | LinkedIn Add-to-Profile + post-mint share nudge                               | area:credentials, priority:P0    | Prefilled LinkedIn URL from data already on /certificates/[id].                                                       | LX-E3               |
| 5   | Earn handoff card at post-mint moment                                         | area:credentials, priority:P0    | Curated category links + honest promise copy; instrument E8.                                                          | LX-E4               |
| 6   | Verify-page polish: course version, i18n, network label                       | area:credentials, priority:P1    | Display #497 version stamp; externalize hardcoded share text.                                                         | LX-E5               |
| 7   | OutputPanel: first-failure auto-expand, collapse passes                       | area:editor, priority:P1         | Exercism-convention test panel; handle Rust/build degenerate shapes.                                                  | LX-C2               |
| 8   | Fix anonymous-enroll silent no-op                                             | area:auth, priority:P0           | use-on-chain-enroll.ts:59 returns silently when userId null — open AuthModal.                                         | LX-A4a              |
| 9   | xp_transactions.source typed column                                           | area:db, priority:P1             | Standalone migration; league prerequisite; backfill by reason prefix.                                                 | LX-B9a              |
| 10  | Analytics event pass: credential_minted, challenge lifecycle, funnels         | area:analytics, priority:P0      | Post-mint-cliff baseline + solve telemetry substrate + KPI events.                                                    | LX-F1, LX-F2, LX-F3 |
| 11  | Launch content PR: Zero-to-Deployed path + capstone Earn terminus + defi hold | area:content, priority:P0        | One courses-academy PR, one content.lock bump, four atomic changes.                                                   | LX-D1               |
| 12  | Harden /api/deploy/save with on-chain verification                            | area:security, priority:P0       | Executable + upgrade-authority check; blocks credential-gate exploit.                                                 | LX-E1               |
| 13  | Capstone-gated credential (split webhook handler)                             | area:credentials, priority:P0    | Gate issue_credential only; finalize/XP unchanged; gate manual mint too.                                              | LX-E2               |
| 14  | Landing CTA deep-link into flagship lesson 1                                  | area:marketing, priority:P0      | Anonymous access already works; stop opening AuthModal from Get Started.                                              | LX-A1               |
| 15  | Dashboard component split (refactor only)                                     | area:dashboard, priority:P1      | Break up the 1100-line client component before three surfaces contend for it.                                         | LX-B1               |
| 16  | Quiz feedback rendering + 403 mismap + AI suppression                         | area:lessons, priority:P1        | One PR: render authored feedback/explanation, fix enrollment-error mismap, AI-free retrieval.                         | LX-C1               |
| 17  | Author retrieval closes across the flagship spine (content)                   | area:content, priority:P1        | 1–3 quiz-block items per spine lesson; elaborated retrieval; EN v1.                                                   | LX-D2               |
| 18  | /start intake + segment state                                                 | area:onboarding, priority:P1     | 2-tap fork + goal + optional reflection + daily-goal; localStorage + profiles column; app-side routing constant.      | LX-A2, LX-A3        |
| 19  | Delayed signup: Later affordance + local progress banking                     | area:onboarding, priority:P1     | Bank proofs pre-auth; server-internal replay exempt from #459 gates.                                                  | LX-A4               |
| 20  | Monaco a11y: Ctrl+M affordance + F8 + NVDA pass                               | area:a11y, priority:P1           | Surface the built-in escape; ×3 locales.                                                                              | LX-C5               |
| 21  | Review spine 1/3: review_items migration + seed                               | area:review, priority:P2         | challenge_assists RLS pattern; lesson-grained item_key; 1/3/7/21 boxes.                                               | LX-B3               |
| 22  | Review spine 2/3: failure-capture feed                                        | area:review, priority:P2         | Plumb ServerTestResult[] through fromRun; upsert on complete-route deny path.                                         | LX-B4               |
| 23  | Review spine 3/3: /review page + nav + dashboard strip                        | area:review, priority:P2         | Top-level Review home; sidebar + mobile nav; hero strip slot.                                                         | LX-B5, LX-B6        |
| 24  | Review quest kind (enum + YAML + SQL branch + card links)                     | area:quests, priority:P2         | YAML stages early (unknown-type skip verified); migration before code deploy.                                         | LX-B7               |
| 25  | Streak forgiveness: one PR, all streak paths                                  | area:gamification, priority:P2   | Freeze storage + 3 DB writers (award_xp, award_community_xp, quest branch) + display/calendar merge + weekly cadence. | LX-B8               |
| 26  | Cohort leagues + you-±3 strip                                                 | area:leaderboard, priority:P2    | Tables + lazy assignment (or cron per D-4) + snapshot scoring + page restructure.                                     | LX-B9b              |
| 27  | failure_message field (EN v1)                                                 | area:content-schema, priority:P2 | Optional per-test field; author top-10 failure challenges first.                                                      | LX-C3               |
| 28  | Stuck-nudge v1 (N-failed-runs trigger)                                        | area:editor, priority:P2         | Telemetry-first; in-editor authored-hint payload; ship as experiment.                                                 | LX-C4               |
| 29  | Parsons block type + ladder rungs + segment entry                             | area:content-schema, priority:P2 | Server-authoritative grader; defer segment plumbing until variants exist.                                             | LX-C7, LX-C8        |
| 30  | Test-out for segment 2 (server-internal batch completion)                     | area:onboarding, priority:P2     | 10-question course challenge → retroactive per-lesson XP via existing rails.                                          | LX-A5               |
| 31  | JS/TS entry-rung course                                                       | area:content, priority:P2        | New course, REAL instructor wallet at creation (immutable).                                                           | LX-D3               |
| 32  | Content-i18n mechanism design (PT-BR moat)                                    | area:content-schema, priority:P2 | One mechanism for all content; unblocks 4 recs; needs owner decision D-5.                                             | LX-D5               |
| 33  | Instructor credibility + track ladder pre-mainnet checklist                   | area:content, priority:P2        | Docs drift fix; mainnet creation must have final wallets + trackId/trackLevel.                                        | LX-D6               |
| 34  | Solution-reveal soft-gate + if-then prompt + experiment registry              | area:misc, priority:P2           | Three small P2s bundled for triage.                                                                                   | LX-C6, LX-A6, LX-F4 |
| 35  | Launch prominence demotion: streaks + global leaderboard                      | area:gamification, priority:P0   | Interim insurance until forgiveness + cohorts ship; no hero streak/rank surfaces.                                     | LX-B13              |
| 36  | Endowed progress with stated reasons                                          | area:dashboard, priority:P1      | First tick at enrollment, explained pre-credit, near-goal intensification, next-course surfacing (F6 CONFIRMED).      | LX-B12              |
| 37  | Course-detail linear-path view                                                | area:courses, priority:P1        | One active next node, module progress map, every lesson stays openable (R6).                                          | LX-B14              |
| 38  | Path-page presentation + per-segment guidance modality                        | area:onboarding, priority:P1     | Sequenced list + one start-here card + Browse-all; modality varies by segment (S9).                                   | LX-A7               |
| 39  | AI post-pass idiomatic review                                                 | area:ai, priority:P2             | Opt-in review after a passing run; pre-pass suppression untouched (roadmap #13).                                      | LX-C9               |
| 40  | AI-agents-on-Solana course                                                    | area:content, priority:P2        | Fast-follow, real instructor wallet at creation; order per D-9.                                                       | LX-D7               |
| 41  | Surprise XP bonuses + mastery panel                                           | area:gamification, priority:P2   | Two small P2s: never-pre-announced bonuses on existing rails; per-skill panel from #498 tags.                         | LX-B15, LX-B16      |

---

## 7. Open Decisions for the Owner

**D-1 · defi-on-solana hold mechanics.** Path draft:true is the only hiding mechanism (no course-level draft flag). If path-less courses still render, the alternative is on-chain deactivation via the existing admin gate — which affects existing devnet enrollments. Hold-invisible vs "visibly trimmed"?

**D-2 · First-XP signup vs the wallet+enroll-tx reality.** "Signup at first XP mint" is actually "account + linked wallet + learner-signed on-chain enroll tx (~30s)." Options: (a) accept a two-step ask (account now, wallet when claiming); (b) bank XP server-side pre-wallet and mint on link. The reports never price this. (b) is more work but matches the Later philosophy.

**D-3 · True mid-lesson resume.** Next-incomplete derivation ships free (LX-B2). Scroll-position resume needs a last_visited column + write path. Worth a migration, or is lesson-granularity enough?

**D-4 · The platform's first scheduler.** Cohort leagues need weekly assignment: lazy on-first-read (arrival-order cohorts, approximate engagement matching, zero new architecture) vs first-ever cron (true batch matching). This is an architectural decision the reports don't acknowledge.

**D-5 · Content-i18n mechanism + timing.** PT-BR original content is the stated moat, and the mechanism is a cross-cutting L. Decide the design (per-locale files vs suffixed fields) and whether it precedes or follows the fast-follow courses. Everything ships EN-first until then.

**D-6 · Credential track ladder vs the new spine — decide BEFORE mainnet.** trackId/trackLevel are recreate-only. If the ladder should follow Zero-to-Deployed, devnet needs WS-2 recreates and mainnet must be created correctly the first time. After mainnet creation it costs a full recreate per course.

**D-7 · Certificate verifiability vs profile privacy.** is_public=false silently 404s a shared verify link (the LinkedIn URL included). Should certificates stay verifiable regardless of profile privacy (separate cert-level flag), or is the current coupling intended?

**D-8 · Capstone scope: follow-along counter vs original program.** Ackee's credential attests an ORIGINAL program; ours attests a follow-along counter deploy. Original-program scope strengthens the credential but raises the cliff. Extend the capstone, or accept counter-deploy for launch and add an "original build" epilogue later?

**D-9 · Fast-follow order.** Design B says JS/TS rung (launch-required) → payments module → AI-agents course (LX-D7) → defi rescope. Audit prices the JS/TS course at weeks of authoring — confirm it slips to fast-follow #1 rather than blocking launch (this spec assumes it does).

**D-10 · PT-BR long-form YouTube cut of the flagship path.** The personalization report's hedged acquisition idea (§4 #4, "consider": long-form PT-BR video cut of Zero-to-Deployed, C3 pattern). Marketing asset, outside product scope — in or out, and who owns it? This spec takes no position; recorded here so the drop is explicit rather than silent.
