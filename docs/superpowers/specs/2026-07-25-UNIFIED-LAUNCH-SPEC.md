# Superteam Academy — Unified Launch Spec

**Status**: PLAN OF RECORD. Supersedes all six research/spec documents dated 2026-07-25
(learning-experience-research, learning-uiux-research, personalization-launch-research,
launch-experience-master-spec, catalog-redesign-spec, ai-tutor-economics).
Where this document and any of those six disagree, this document wins.

**Date**: 2026-07-25 · **Owner decisions folded in**: D-A … D-E · **Filed issues mapped**: #549–#592
**Revision**: adversarial-review pass applied 2026-07-25. Every change below was re-verified against
the repository and against live devnet, not taken on a reviewer's word; the findings that did **not**
survive that re-check are recorded in §9.4 with the reason.

Reading rule: every recommendation below carries its claim ids and those claims' validation
verdicts. `CONFIRMED` = independently verified. `WEAKENED` = verified with a boundary, and the
boundary is stated inline, not in a footnote. `REFUTED` = the claim died; anything that rested
on it is dropped and said so. `UNVERIFIABLE` = load-bearing and unproven; it appears in §7 as a
named risk, never as a silent assumption.

---

## 1. The thesis

**Superteam Academy takes a Brazilian web2 JavaScript/TypeScript developer from zero Solana
knowledge to a deployed program and a first paid Solana bounty, in the browser, with a credential
that attests an artifact rather than attendance.**

**This is the destination thesis, not the launch state.** Two honesty clauses, both added after
adversarial review because §1 as originally written described a product §4/§5 do not ship:

- **Language.** The thesis used to say "in their own language". Nothing in §3–§5 delivers that at
  launch: #580 (the content-i18n mechanism) is Wave 5 and everything content-side ships **EN-first**.
  UI chrome is already ×3 locales; _content_ is not. Say "in the browser" at launch; the
  own-language claim becomes true only when #580 lands. Sequencing is item 19c, and whether Spanish
  is promoted to a launch language is **O-10**.
- **Scope.** The five-course path is the Wave-2 product. **At launch only C5 exists as new content**
  (item 19); C1–C4 are Wave 2, and C2/C3 are hard-gated on the build server (item 5). See "What
  actually launches" below.

**Who it is for.** Two segments in the finished path:

- **S1 — web2 devs new to Solana.** Ship JS/TS, no Rust, no chain experience. Entry at C1 lesson 1.
  This is the funnel and the volume. **At launch C1 does not exist**: S1 lands on the legacy
  `solana-fundamentals` spine that C1 is written to replace, with its known factual defects (item 52)
  still live. This is the single largest gap between the thesis and the launch plan and it is
  deliberate, not overlooked — closing it means either shipping C1 in Wave 1 (it needs item 10 and
  item 11 first, neither of which is on any wave today) or accepting a legacy front door for one wave.
- **S2 — web3 devs deepening.** Some Solana, want Anchor/Rust depth and a paid outcome. Entry at
  C3 lesson 1 (with a known-good reference `vault_core.rs`) or C5 lesson 1 (TS-only, standalone).
  **S2 is the segment launch actually serves**: C5 is TS-only, declares S2 as its entry segment, and
  is the only new course in Wave 1.

A third segment — people learning to program at all — is **not served at launch** and the catalog
page must say so and point outward. This is open decision **O-5**; Design A's intake ships a
three-way fork whose third branch currently routes nowhere.

**What actually launches.** C5 (new, 9 lessons, TS-only, Earn terminus) + the legacy six-course
bundle + the credential chain + the funnel and measurement work in §3C/§3E/§3G. The "deployed
program" half of the thesis is reachable at launch **only** through the legacy C3
(`building-your-first-solana-program`) deploy lesson — which is `buildable`, and therefore depends on
the build server being both bumped (item 5) and _enabled in production_ (item 5b). If either is
missing, the launch KPI can produce Earn submissions but **zero capstone deploys**, and half the
KPI's numerator is structurally unavailable. Both are on the critical path for that reason.

**The journey.** Anonymous visitor lands → deep-links straight into flagship lesson 1 (no auth
modal; anonymous lesson reading and the challenge runner already work — MAS-02 CONFIRMED) →
completes the first challenge → signs in only to claim XP → follows one sequential path of five
courses carrying a single artifact, a **vault**, from a TypeScript client to a deployed Anchor
program to a published npm client and dApp to a paid x402 tier → deploys to devnet → capstone-gated
credential mints → **LinkedIn Add-to-Profile prefill + a curated Superteam Earn handoff** at the
same success screen.

**The destination is Earn, and it is real money, today.** Verified live against the Earn API on
2026-07-25: **$15,153,260 paid across 3,048 listings, average $4,971, 201,180+ members, 2,600+
sponsors** (LAU-13 CONFIRMED, reproduced to the listing count). Superteam Brasil is currently the
single most active dev-bounty sponsor on the entire platform — 5 open listings, 2 of the 6 global
dev bounties (LAU-15 CONFIRMED). Foundation Brazil grants average **$5,519**, up to $10,000, 68
approved (LAU-15 CONFIRMED). The promise is **"your first $500–$5,000 of paid Solana work"** and
grant framing at "avg $5.5k Brazil grants". Never "get a job". Never "learn to earn". Never a
Brazil earnings total we have not verified (MAS-24 CONFIRMED-caveated).

**Positioning vs Blueshift.** Three claims we used to make are dead, verified against their live
site (CAT-05 CONFIRMED): Blueshift ships **206/206 pages in genuine pt-BR** at full locale parity,
so "PT-BR is the gap" is retired; they ship an explicit _comece do zero_ beginner path, so "we are
the beginner option" is retired; Solana Playground has offered browser build+deploy for years as
the Foundation's own quickstart, so "zero-setup is unique" is retired.

What is actually ours:

1. **Spanish is an empty lane.** Blueshift's Spanish page count is zero. **This is an opportunity we
   have not yet taken**: our UI chrome is ES-capable, our _content_ is EN-only end-to-end
   (MAS-26). "Ours is a first-class locale" is a Wave-5 claim (#580) and must not appear in launch
   copy until it is true. The per-course second-language plan is item 19c; the promotion decision
   is **O-10**.
2. **The wrapper, not the words.** Nobody in the comp set ships a _sequenced, graded, version-stamped,
   credentialed_ path. Blueshift has no Rust-language course and no web dApp course in any language;
   their SDK course is 3 lessons of codegen mechanics (CAT-05 CONFIRMED).
3. **A terminus.** Blueshift, Cyfrin, Ackee and RareSkills end at knowledge. We end at a submission.
4. **x402 / agentic payments is a global first-mover position with a clock on it.** Zero coverage at
   Blueshift, Cyfrin, RareSkills, Ackee and freeCodeCamp; Solana's own coverage is one demo folder
   (CAT-04 CONFIRMED).

**What we concede.** Blueshift owns program-side depth — Pinocchio, assembly, anchor-init challenge
builds — and owns mobile with a 5-course/18h path. We do not contest either (§6).

**How we will know it worked.** Launch KPI is **capstone deploys + Earn submissions**, not signups
(MAS-29 CONFIRMED). North star is **weekly return of previously-active learners**. Every mechanic is
judged on a 10–12 week window, never earlier, because the gamification novelty effect dips at week 4
and recovers by week 10 in a 14-week study of 756 Brazilian CS1 undergraduates (PED-15, directly
relevant population). Completion expectations are set low and deliberately: free async MOOC
completion is **3.13%** against 46% on verified tracks (PED-20 CONFIRMED, edX 2017-18 census), and
Ackee — selective, mentored, free, capstone = deploy an original program — graduates **13%**
(LAU-20 CONFIRMED, exact on both seasons). Self-paced will be well under that.

---

## 2. What is true

Only findings that change a decision. Effect sizes are the corrected ones.

### 2.1 Pedagogy

| Finding                                | Verdict                                                 | Number                                                                                                                                                                                                                                                                                      | What it buys                                                                                                                                                                                    |
| -------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Retrieval practice improves retention  | PED-01 **CONFIRMED**                                    | honest band **g≈0.50** (Yang 2021, 222 studies, N=48,478). _Boundary added in validation: 0.42–0.61 are not three replications of one design; Adesope's 0.61 uses a pooled control, Sotola & Credé's 0.42 is associational. Quote 0.50._                                                    | Retrieval closes (§3 item 12), quizzes in every code-bearing lesson                                                                                                                             |
| …but **transfer** is the weak half     | PED-02 **CONFIRMED**                                    | d=0.40 over 192 effects; **near zero after bias correction unless** elaborated retrieval, response congruency and high initial success are present                                                                                                                                          | Items must be _why / predict-the-output_, never verbatim recall, and must ship with explanatory feedback. A verbatim item with no feedback sits in the measured-zero cell.                      |
| Feedback timing is a non-issue         | PED-09 **CONFIRMED**                                    | **g=0.03** (51 studies, 160 effects; leave-one-out 0.00–0.04)                                                                                                                                                                                                                               | Zero engineering on delayed feedback. Budget goes to authored failure messages.                                                                                                                 |
| Spaced practice works                  | PED-04 **CONFIRMED with a live boundary**               | d=0.54 [0.31,0.77], I²=92%, 7-day gaps most reliable. **The same paper reports _expanding_ intervals produced smaller and occasionally negative effects.** Egger's p=0.007.                                                                                                                 | Review queue is justified — but **1/3/7/21 expansion is convention, not evidence.** Record it as such; prefer weekly-dominant spacing if it is ever tuned.                                      |
| Expertise reversal                     | PED-05 **CONFIRMED**                                    | novice+guidance **d=+0.505**, expert+low-guidance **d=−0.428**, asymmetric, independent lab (176 effects, 5,924 pp)                                                                                                                                                                         | Tracks must differ in _guidance level_. Launch ships topic-routing only — a **knowing** non-compliance (MAS-21), mitigated by skip-friendly access and per-segment guidance copy.               |
| Mastery gating                         | PED-07 **WEAKENED**                                     | Kulik 1990 local tests d=0.52–0.65; standardized **d=0.33 (k=9) / 0.10 (k=2)**. **The "≈0.08" in the source doc is not in the primary and must never be quoted.** High-standard mastery beat conventional teaching by 0.60–0.76 SD on standardized tests. Stricter thresholds beat lenient. | Gate the credential on the capstone. Do not market gating as transfer. Do not repeat the 0.08.                                                                                                  |
| Project capstones                      | PED-07 **CONFIRMED**                                    | Chen & Yang 2019 **d=0.71** (46 effects, 12,585 students); unstructured PBL underdelivers without milestone scaffolding                                                                                                                                                                     | One structured, milestone-scaffolded capstone per path                                                                                                                                          |
| Overjustification                      | PED-10 **CONFIRMED, verbatim against the 1999 primary** | **completion-contingent d=−0.36 to −0.44** ← the cell per-lesson XP actually sits in. Headline performance-contingent = −0.28. Unexpected rewards = 0.01.                                                                                                                                   | XP is informational, never a balance. Surprise bonuses are the only zero-undermining reward form.                                                                                               |
| The **d=−0.88** figure                 | **MAS-20 REFUTED (as attribution)**                     | −0.88 is _performance-contingent, less-than-maximum reward, vs a no-feedback control_ (6 studies). Deci et al. measured no leaderboard, no prize and no monetary framing.                                                                                                                   | **Strike −0.88 from #550, #583 and all non-goal copy.** The no-prize / no-bridge decision survives on PED-10 + PED-14 + UIU-09.                                                                 |
| Raw streak counters steer devs badly   | UIU-08 **CONFIRMED**                                    | GitHub's unannounced 2016 counter removal (ICSE 2021 natural experiment): long streaks abandoned, weekend grinding and one-token commits declined                                                                                                                                           | Strongest item in the corpus for our audience. Demote the counter at launch; forgiveness before prominence.                                                                                     |
| Streak _causal_ evidence               | PED-12 **WEAKENED**                                     | The 60k-student Peru RCT tested **message salience**, not freezes; the achievement result rests on the **2.5% (~1,500)** who sat the endline and **was not significant against the other treatment arms**. Forgiveness support comes from Sharif & Shu, not Peru.                           | Do not cite Peru as proof streaks teach. Freezes are justified by Sharif & Shu + UIU-08.                                                                                                        |
| Leaderboards                           | PED-14 / UIU-09 **CONFIRMED with labelling boundary**   | Hanus & Fox is a **two-section quasi-experiment**, not a controlled RCT, and cannot isolate badges from the leaderboard; exam effect is mediated. Correct language: _"evidence against exists"_, not _"proven harmful"_.                                                                    | Demote the global absolute board. Cohorts post-launch. Never prizes.                                                                                                                            |
| Novelty trough                         | PED-15                                                  | dip week 4, recovery weeks 6–10, net positive at 14 — N=756 Brazilian CS1                                                                                                                                                                                                                   | **No mechanic is evaluated before week 10.**                                                                                                                                                    |
| Badges                                 | PED-16                                                  | >40% unaffected; the ~20% steered collapse right after earning                                                                                                                                                                                                                              | No badges as retention. Expect a post-credential cliff and instrument it.                                                                                                                       |
| ML review schedulers                   | PED-17                                                  | Duolingo HLR cut prediction error ~45% but AUC ~0.54 (near chance)                                                                                                                                                                                                                          | Never build one. Fixed schedule over shipped skill tags.                                                                                                                                        |
| SRS adherence                          | PED-18                                                  | Anki cohort: +6–13% exam, usage 60% → 8% in a year                                                                                                                                                                                                                                          | Reviews ride inside the existing quest/streak loop, never standalone opt-in.                                                                                                                    |
| Interleaving numbers                   | **MAS-22 REFUTED (as numbers)**                         | g≈0.34 is _mathematical tasks_; g=−0.39 is _word lists_. The lesson-prose analogue is **expository text g=0.21, p=.119 — n.s., not harmful.** These numbers appear in no upstream ledger; they materialised at master-spec stage.                                                           | Ruling survives on the null + the authors' own caution: **interleave only inside review sets, never reorder lesson prose.** Strike both figures from LX-B5 and the LX-D2 guard.                 |
| Productive failure                     | AIE-27 **WEAKENED**                                     | g=0.36 [0.20,0.51], 166 comparisons; bias-adjusted 0.87. **But grade level _is_ a significant moderator (contra the source doc), and effects favour instruction-first for domain-general skills** — i.e. the case is weakest exactly on a beginner coding rung.                             | Attempt-gate ships as a nudge with a one-tap override, never a refusal.                                                                                                                         |
| Unguarded AI harms learning            | AIE-26 **CONFIRMED**                                    | ~1,000 students, preregistered: GPT Base +48% assisted practice but **−17% on the unassisted exam**; GPT Tutor +127% assisted and _largely mitigated_ the harm — **under unmetered free access**.                                                                                           | **The evidenced intervention is the output contract, not the meter.** Teacher-authored input was part of the arm that worked → `tutorNotes` (#592) is half the treatment and has never shipped. |
| How AI harm happens                    | UIU-05 **CONFIRMED (mechanism only)**                   | ICER 2024, n=21 eye-tracking: Interruption, Mislead, Progression; illusory competence                                                                                                                                                                                                       | Tutor-mode enforced at the prompt pipeline; retrieval close stays AI-free. Not a magnitude source — that is Bastani.                                                                            |
| Help-seeking is not the harm signal    | AIE-28                                                  | Help _abuse_ r=−0.46 with gain; help _avoidance_ r=−0.10 n.s.; non-punitive remediation gained 46 points pre→post vs 20                                                                                                                                                                     | Never meter test runs, submissions, completions or the first ask. Gate the _patch apply_ on a comprehension check; wrong answers are explained, never charged.                                  |
| Structured feedback is the scarce good | PED-22                                                  | RareSkills sells 5-person cohorts and weekly 1-on-1 review; Exercism buckets 55% of submissions into common errors                                                                                                                                                                          | Free content is not the moat. AI post-pass review + authored failure messages are.                                                                                                              |

### 2.2 UX

| Finding                                  | Verdict                                                          | Number                                                                                                                                                                                                                                                                                                                                        | What it buys                                                                                                                                                                                                                      |
| ---------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LinkedIn credential sharing → employment | UIU-02 **WEAKENED**                                              | Real and large: >800k completers, ~40k experimental, **+17pp sharing, +6% new employment, +12% bottom-employability tercile**. **Boundaries: NOT peer-reviewed (arXiv 2405.00247 / Stanford GSB WP); the figure is +8% not +9%; outcomes are LinkedIn profile updates, not administrative records; the "+15–20 resume points" is unsourced.** | Still the cheapest high-confidence item in the corpus (#552). **Strike "peer-reviewed" and the resume-score figure from the PR.**                                                                                                 |
| Endowed progress                         | UIU-06 **CONFIRMED direction only**                              | Two independent labs on direction; the 34%-vs-19% magnitude rests on **one 2006 consumer-loyalty field study**, pre-replication-crisis. _(The "~1.6pp 2024 analogue" cited as the deflator is itself unsourced — both anchors are weak.)_                                                                                                     | Ship #584, but **preregister direction, not doubling.** Every pre-credited tick must carry a stated reason or unexplained head-starts backfire. MAS-18 dropped this caveat in transit; it is restored here.                       |
| Choice overload                          | UIU-07 **CONFIRMED conditional**                                 | 99 observations, N=7,202; harm under preference uncertainty + complex sets — the beginner-at-catalog profile; **reverses for experts**                                                                                                                                                                                                        | Segment-dependent catalog: one highlighted start for S1, full filterable catalog for S2.                                                                                                                                          |
| Interpolated retrieval                   | UIU-12 **CONFIRMED as weak**                                     | N=195 replication: marginal attention effect, **no retention benefit**; nobody ever tested one-question-per-screen                                                                                                                                                                                                                            | Ship the close, justify it on the broader testing effect. **Strike "one per screen-state" from R3** — it contradicts the doc's own NOT-build list. A 2025 _Communications Psychology_ in-lecture-quiz paper is a better citation. |
| Authored failure messages                | UIU-04 **CONFIRMED**                                             | n=106 within-subjects: expert-handwritten per-test explanations beat stock **and** GPT-4; GPT-4 beat stock in 1 of 6 tasks                                                                                                                                                                                                                    | Add `failure_message` to the schema (#575). Do **not** ship LLM auto-explanation of test failures.                                                                                                                                |
| Monaco accessibility                     | UIU-20 **CONFIRMED + boundary**                                  | Tab trap is real (WCAG 2.1.2); escape chord is **Ctrl+M on Windows/Linux and Ctrl+Shift+M on macOS**; F8/Shift+F8 diagnostics; NVDA 2017.3+ floor                                                                                                                                                                                             | #568 must ship a **platform-aware** affordance. A hardcoded "Ctrl+M" leaves Mac users trapped.                                                                                                                                    |
| Parsons efficiency                       | UIU-03 **CONFIRMED**                                             | 473s vs 679s (fix-code) vs 714s (write-code), p<.001; equal learning is a _null_ with ceiling effects                                                                                                                                                                                                                                         | Legitimate ladder rung and review format. P2.                                                                                                                                                                                     |
| Test-panel conventions                   | UIU-17 **UNVERIFIED, practitioner consensus**                    | Exercism's spec; zero learning-outcome measurement                                                                                                                                                                                                                                                                                            | Ship #555, label it convention in the PR.                                                                                                                                                                                         |
| Forced linearity                         | UIU-10 / UIU-11 **WEAKENED / counter-evidence**                  | No published A/B that linearity improves learning; the documented cost (lost targeted practice, untaught content, quitting despite streaks) is uncontested teardown                                                                                                                                                                           | Linear path view ships **only** bundled with per-module test-out and a practice surface. Claim spacing enforcement, never superior learning.                                                                                      |
| Duolingo's numbers                       | UIU-01, UIU-13, UIU-15, UIU-16, UIU-22 **UNVERIFIED throughout** | CURR 5× DAU impact; +20%/+8.2% signup wall; +17% leagues; +2.1% amulet; Daily Refresh +700k min/day                                                                                                                                                                                                                                           | **Direction only. No Duolingo magnitude enters any forecast or PR.** The shapes (delayed signup, ~30-person weekly cohorts, auto-applied capped freezes, a Review home) are adopted; the numbers are not.                         |
| PT-BR craft constants                    | UIU-26 **WEAKENED**                                              | +30% expansion and Brazil-native (not neutral) Portuguese are **craft convention with no primary source**. **"Brazil is the 3rd-largest esports audience" is REFUTED** — Brazil is 3rd in _pro players_; audience is 34M+ fans.                                                                                                               | Keep the +30% width budget as engineering hygiene. **Never cite the esports rank.** Competitive mechanics remain culturally fine on the 34M figure.                                                                               |

### 2.3 Market

| Finding                                                         | Verdict                                                               | Number                                                                                                                                                                                                                                                                                                                                                            | What it buys                                                                                                                                                                                                                     |
| --------------------------------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Earn scale                                                      | LAU-13 **CONFIRMED**                                                  | **$15,153,260 / 3,048 listings / $4,971 avg / 201,180+ members** — reproduced live. Velocity is **~$886k/mo**, not "$1M and accelerating".                                                                                                                                                                                                                        | The Earn terminus and the $500–$5,000 promise                                                                                                                                                                                    |
| Superteam Brasil is the live sponsor                            | LAU-15 **CONFIRMED**                                                  | Zeroclaw $5,000 USDG; Privacy-Through-Noise $3,900 USDG; plus UNICEF/design listings. Foundation Brazil grants avg **$5,519**, 68 approved, $375.3k total                                                                                                                                                                                                         | The handoff has somewhere to point **today**. It is ephemeral — link _categories_, never listings.                                                                                                                               |
| Competition is a **deadline** function, not a category function | CAT-06 **CONFIRMED**                                                  | A $5,000 frontend-only listing drew **731 submissions**; SDK/tooling sit at 11–52; Zeroclaw went ≤12 → 53 as its deadline approached, in real time during validation                                                                                                                                                                                              | **Never quote a single-day submission count as a competition rate.** Surface newly-opened listings. Quote medians over completed listings.                                                                                       |
| "Dev bounties are scarce and uncrowded"                         | LAU-14 **WEAKENED**                                                   | The listing set is exact (6 dev listings at the stated amounts). **The "0–12 submissions" half is refuted** — the same six now read 4/53/11/80/5/50.                                                                                                                                                                                                              | Dev-readiness is still the right optimisation target, but not on submission counts.                                                                                                                                              |
| Vault as the through-line artifact                              | CAT-01 **CONFIRMED**                                                  | Five vault bounties located live: $4,000/62 (Nigeria), $4,000/12 (Brasil), $500/7, $450/10, $450/9 (UK, NL)                                                                                                                                                                                                                                                       | Every course's artifact is a vault component. Recap range "$300–$4,000 against 7–62 submissions" is literally accurate.                                                                                                          |
| "~84% of paid dev work is TS-reachable"                         | CAT-02 **WEAKENED**                                                   | Not reproducible — Earn exposes no skills field. Independent title-classification proxy over 1,974 listings gives ~78% by a cruder method.                                                                                                                                                                                                                        | Keep C1 as the short TS funnel gate and C5 as a valid standalone entry. **Do not publish 84%.** Say "roughly four in five".                                                                                                      |
| "Rust is the best money-per-competitor on the board"            | CAT-03 **WEAKENED**                                                   | Independent cut: Rust-flavoured n=50 → median **37** submissions, **~$69**/competitor. General dev n=181 → median 21, **~$176**. Content n=890 → median 61.                                                                                                                                                                                                       | Rust beats content; it does **not** beat general dev. C2 survives as the depth rung, not as the arbitrage play. **Do not quote $124 / median 14.**                                                                               |
| AI-agent bounties                                               | CAT-03 **CONFIRMED (relative)**                                       | ~$53/competitor at median 91 submissions — the worst on the board                                                                                                                                                                                                                                                                                                 | **No standalone AI-agents course.** Agents live as one fenced payments lesson in C5.                                                                                                                                             |
| x402                                                            | CAT-04 **CONFIRMED + hype guard**                                     | Linux Foundation x402 Foundation launched 14 Jul 2026, 40 founding members incl. Visa, Mastercard, Amex, Stripe, Circle, Coinbase, Solana Foundation; ~35M tx by mid-July, Solana most active by volume. Superteam Canada paid $2,750 ×2 at 31 and 44 subs = **$63–$89**/competitor, not "~$100". **Guard: ~75M tx moved only ~$24M over 30 days protocol-wide.** | C5 is the first-mover course. **Never imply payment volume from transaction counts.**                                                                                                                                            |
| BCB Resolution 561                                              | CAT-07 **CONFIRMED**                                                  | Published **2026-04-30**, effective **2026-10-01**. Bars regulated eFX providers from taking reais and settling abroad in virtual assets. Domestic merchant acceptance, contractor payouts, subscriptions and agent budgets remain in scope. Unicad registration by 2026-10-30; unauthorised providers apply by 2027-05-31.                                       | **No remittance copy anywhere in C5.** C5 L1 teaches the boundary. This is a dated decay clock and needs an alarm (§3 item 30).                                                                                                  |
| Brazil stablecoin market                                        | LAU-17 **CONFIRMED with a dating boundary**                           | $318.8B received is the **Jul 2024–Jun 2025** window — date it or do not use it. ~90% of Brazilian crypto volume in stablecoins (BCB). **Solana's 32.6% share, the $650B Feb-2026 figure and +207.7% YoY are NOT independently verified.** Real payments ≈ **$300M/month**.                                                                                       | Payments-first positioning for Brazil. Use only the dated and verified figures.                                                                                                                                                  |
| Liquid rewards get farmed                                       | PED-23 **WEAKENED (magnitude moves against us), provenance DISPUTED** | The widely-reported LayerZero figure is 803,093 sybil addresses, ~38% of the ~2.08M eligible snapshot (not 13%). **Provenance caveat restored: the AI-economics doc recorded that 803,093 does not appear in the official post it is usually attributed to.** Both readings are in the corpus; this document does not pick one.                                   | Soulbound illiquidity is the moat. Direction is not in doubt on any reading — the _qualitative_ farming of liquid airdrops is uncontested. **Do not quote 803,093 externally without a primary link.** No XP→token bridge, ever. |
| Public quizzes get farmed                                       | PED-24 **CONFIRMED**                                                  | Eight distinct, currently-maintained Coinbase Earn answer-key sites, several dated 2026                                                                                                                                                                                                                                                                           | Build **no** anti-cheat. Integrity lives in the deployed artifact.                                                                                                                                                               |
| Comp catalogue sizes                                            | LAU-23 **CONFIRMED**                                                  | Cyfrin Updraft is **33 courses / 150+ hours free** — the source doc's "12" is refuted, its "~30" is right. Buildspace: $10M raised, ~125k participants, shut down 23 Aug 2024.                                                                                                                                                                                    | Launch a polished spine + a dated fast-follow cadence. Do not chase module count.                                                                                                                                                |
| "No platform teaches from scratch via Rust"                     | LAU-22 **WEAKENED**                                                   | Cyfrin ships **Rust Programming Basics** _and_ a beginner Solana course; Blueshift ships a _comece do zero_ path                                                                                                                                                                                                                                                  | Keep the "never market learn-to-code-via-Rust" prohibition. **Drop the "no surveyed platform" absolute** from positioning.                                                                                                       |
| "Cyfrin's free 48-lesson DeFi course"                           | CAT-08 **REFUTED**                                                    | Does not exist. DeFi is 8 separate protocol courses under a career track.                                                                                                                                                                                                                                                                                         | The no-DeFi decision survives (arguably strengthened). **Do not cite the 48-lesson course.**                                                                                                                                     |
| Pinocchio                                                       | LAU-19 **CONFIRMED**                                                  | 88–95% CU reduction, ~19× on SPL token ops; Anchor remains the hiring default                                                                                                                                                                                                                                                                                     | No Pinocchio course at launch. **But CAT-08's "Anchor v2 is Pinocchio-based so the course self-obsoletes" is REFUTED** — v2 is benchmarked _against_ Pinocchio and no v2 branch or tag exists. Strike that reason.               |

### 2.4 Technical currency

| Finding                                | Verdict                                             | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Consequence                                                                                                                                                                                                                                                                      |
| -------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anchor 1.0 breaking changes            | CAT-09 **CONFIRMED** (5 of 6 verbatim)              | `CpiContext::new` drops the program AccountInfo; one `#[error_code]` per program; duplicate mutable accounts error by default (`#[account(mut, dup)]`); legacy on-chain IDL removed for the Program Metadata Program; 3 of 4 Context lifetimes removed                                                                                                                                                                                                                                                                                                                                                                                                    | Any content PR containing a pre-1.0 form is rejected. **Reword the AVM rule**: otter-sec/anchor is canonical, coral-xyz and solana-foundation both redirect there — but the official docs _print_ `solana-foundation/anchor`, so the rule as written would fire false positives. |
| Anchor 1.x toolchain floor             | CAT-18 **CONFIRMED, but the pin was misidentified** | anchor-lang **1.1.2 declares MSRV rust 1.89** and depends on solana-\* ^3.x. **Re-verified in-repo: rustc ≥1.89 is a PLATFORM-TOOLS property, not an Agave-CLI property.** `docs/PINOCCHIO-MIGRATION.md:121-122` states it verbatim — rustc ≥1.89 → platform-tools **v1.54**, which "any Agave 2.x/3.x CLI fetches on demand". The monorepo already uses `--tools-version v1.54` (`.github/workflows/ci.yml:347,411`, `fuzz.yml:89`, `onchain-academy/package.json:6`, `scripts/build-pinocchio-deploy.sh`). `apps/build-server/src/build.rs:225` invokes `cargo-build-sbf` with **no** `--tools-version`, so it silently takes the Agave 3.0.14 default. | The blocker is **four pins plus a baked toolchain**, not an Agave version choice — see the rewritten item 5. **O-6 as originally posed ("3.1.10 vs 4.1.2") was a false binary on the wrong axis and has been reframed.**                                                         |
| Kit pin decay                          | CAT-13 **CONFIRMED + flag**                         | @solana/kit 7.0.0 is `latest` today, but **8.0.0-canary has published daily since ~2026-07-13**. @solana/web3.js holds `latest` at 1.98.4 with 2.10M/wk vs Kit's 1.65M; @coral-xyz/anchor frozen at 0.32.1 at 659k/wk vs @anchor-lang/core 16k/wk; gill static since 2025-11-07. **Third state missed by the docs: web3.js `rc` is 3.0.0-rc.2 — a v1-shaped API rebuilt on Kit internals.**                                                                                                                                                                                                                                                               | Pin one stack and say so in-lesson. Teach learners to **read** v1 and map it. **Version-stamp frontmatter + a CI currency check is load-bearing, not hygiene.**                                                                                                                  |
| **C5's pinned stack does not resolve** | CAT-12 **WEAKENED — new blocker**                   | @solana/pay@1.0.23 peers kit ^6.9.0 (known). **@solana/subscriptions@0.4.0 — the mandatory C5 dependency the spec orders pinned exactly — peers `@solana/kit: ^6.4.0`, which also excludes 7.0.0.** There is no newer release. Token peers are disjoint too (pay ^0.12.0 vs @x402/svm ^0.9.0; latest is 0.15.0).                                                                                                                                                                                                                                                                                                                                          | **This refutes "C5 has zero platform blockers".** Resolve before C5 L3 authoring: pin C5 to kit 6.x, or ship an explicit documented peer override. See §3 item 9.                                                                                                                |
| x402 package split                     | CAT-11 **CONFIRMED**                                | Unscoped line frozen at 1.2.0 (2026-04-16, protocol v1); scoped `@x402/*` all at 2.19.0 (2026-07-17); `@x402/svm` peers kit >=5.1.0 (admits 7); both v1 and v2 live on the wire                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Unscoped packages are auto-reject. C5 L6 teaches the version seam with two captured 402 responses.                                                                                                                                                                               |
| Compute budget API                     | CAT-10 **CONFIRMED from the 7.0.0 tarball**         | All three CU-named functions carry `@deprecated` pointing at the resource-limits trio; the estimator returns `{computeUnitLimit, loadedAccountsDataSizeLimit?}` and the second field only when the RPC returns it                                                                                                                                                                                                                                                                                                                                                                                                                                         | C4 L8 teaches the resource-limits trio **and** the conditionality.                                                                                                                                                                                                               |
| Codama / react peers                   | CAT-14 **largely dischargeable**                    | @codama/renderers-js **2.3.0 exports `getRenderMapVisitor` and declares a real browser export** → the C4 L1 read-and-diff fallback is probably unnecessary. @solana/react peers swr and @tanstack/react-query but **both optional** — and it pins kit at exactly `7.0.0`, so a Kit 8 bump forces it in lockstep. @solana-program/token latest is **0.15.0**. npm trusted-publishing steps remain unverified.                                                                                                                                                                                                                                              | Three of four verifications are done. Fold the results into the authoring checklist (§3 item 8).                                                                                                                                                                                 |
| Licensing                              | CAT-15 **CONFIRMED**                                | program-examples, sealevel-attacks, archived developer-content, Ackee, developer-bootcamp-2024, Neodyme: **no license = all rights reserved**. Live docs/cookbook are **GPL-3.0** (copyleft, incompatible). Only LiteSVM, Mollusk, Surfpool (Apache-2.0) and Trident (MIT) are adaptable.                                                                                                                                                                                                                                                                                                                                                                 | Every word and line of catalog code is original. Those corpora are checklists and outbound links only. **No gate enforces this today** — §3 item 31.                                                                                                                             |
| Monaco chord                           | UIU-20                                              | Ctrl+M / Ctrl+Shift+M split                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | #568                                                                                                                                                                                                                                                                             |

### 2.5 Cost and the AI tutor

Owner has settled the shape: **D-A no coin, D-B a generous degrade-before-deny wall whose job is
pedagogical.** What remains is code exposure and one number.

| Finding                                                    | Verdict                              | Detail                                                                                                                                                                                                                                                                                   |
| ---------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Refunds fire **after** we are billed                       | AIE-10 **CONFIRMED**                 | `refundAssist()` at route.ts 305 / 334 / 352 / 362 / 411. 334, 352, 362 are unambiguously post-generation. **Validation correction: 411 is not "pre-fetch throws" — the try block wraps `appendAssistLog`, so a throw after a fully billed success also refunds.** Narrow the catch too. |
| The truncation is attacker-triggerable                     | AIE-11 **CONFIRMED**                 | `propose` returns code inside a JSON envelope; 20,000 chars of non-BMP emoji escape to ~120,000, guaranteeing MAX_TOKENS → non-JSON → refund with the full output budget billed                                                                                                          |
| The limiter fails **open** and has no IP dimension         | AIE-12 **CONFIRMED**                 | `isRateLimited("ai:partner", user.id, …)` — user only, no `x-forwarded-for` read anywhere in the route; `lib/rate-limit.ts` returns false at :110 and :120                                                                                                                               |
| There is no spend cap anywhere                             | AIE-13 **CONFIRMED**                 | Zero hits for spend_ledger / ai_spend across `lib`, `api` and `schema.sql`. Per-account cost ceiling is currently unbounded.                                                                                                                                                             |
| `resetAssists` is an unlimited primitive with zero callers | AIE-20 **CONFIRMED**                 | Correctly locked to service_role, but no once-per-lesson flag and no cooldown. Guards must live inside the SECURITY DEFINER function, in the same migration that exposes it.                                                                                                             |
| Half the evidenced safeguard never shipped                 | AIE-25 **CONFIRMED**                 | `buildStaticPrefix` emits `[TUTOR_NOTES]`; route.ts:263 passes `tutorNotes: undefined`. The reference solution reaches the model; authored common-mistakes never do.                                                                                                                     |
| The pinned model is stale                                  | AIE-03 **CONFIRMED + better option** | Prices verified live: 3.5-flash (pinned) $1.50/$9.00; 3.6-flash $1.50/$7.50; 3.1-flash-lite $0.25/$1.50. **But gemini-2.5-flash-lite is $0.10/$0.40 — 2.5×/3.75× cheaper than the recommended lite model.** Price the hint/Socratic route against it.                                    |
| Flex tier                                                  | AIE-16 **CONFIRMED**                 | Exactly 50% of Standard on both families, **with zero documented latency or synchronicity semantics**. Spike with a measured p95 exit criterion, or skip.                                                                                                                                |
| Reachability                                               | AIE-04 **UNVERIFIABLE**              | Page presence ≠ key reachability; a documented 404-on-a-whole-family already happened on this key. No external source can discharge this.                                                                                                                                                |
| thinkingBudget honoured?                                   | AIE-05 **UNVERIFIABLE**              | `thinkingConfig: { thinkingBudget: 0 }` set on a model the adjacent comment calls a thinking model; `usageMetadata` is only ever read behind `AI_PARTNER_DEBUG` and `thoughtsTokenCount` is never read. 10k MAU is **~$280 or ~$750/mo** depending on the answer.                        |
| Prompt caching                                             | AIE-14 **CONFIRMED as worthless**    | 33 prefixes, max ~1,386 tokens — none reach any documented cache floor. Padding _raises_ the bill below an 87.2% hit rate. **Do nothing, and document the $0 so nobody re-proposes it.**                                                                                                 |
| Diff-propose                                               | AIE-15                               | Reference solutions are median ~151 tokens; `propose` echoes the whole file against an 8,192 cap → ~30% blended cut and ~10× lower adversarial worst case                                                                                                                                |
| Variable per-action pricing                                | AIE-17 **CONFIRMED**                 | Every 2025 product that moved to a variable pool issued public apologies (Cursor Jun 2025, Replit Jul 2025)                                                                                                                                                                              | One unit = one turn, always 1.                                                   |
| No calendar drip                                           | AIE-19                               | A time-based drip is unbounded by construction; a 3/day drip ≈ $5.00/learner/yr against a $1.98 lifetime heavy-learner ceiling                                                                                                                                                           | Progression is the refill. Zero new code.                                        |
| Referral / quest / streak → AI budget                      | AIE-23, AIE-24 **CONFIRMED**         | Quests are open-book YAML; wallets are free, instant and platform-fee-paid; the capstone artifact is a public answer key; `/api/deploy/save` accepts a self-reported base58                                                                                                              | **No earning surfaces. No credential minted on condition of recruiting people.** |

---

## 3. What we are building

One numbered plan. Catalog work and platform work are interleaved because they block each other.
Every item carries its claim ids, the verdicts, and the filed issue where one exists.

### A. Stop the bleeding (start today)

_(Items 1, 2, 3a and 4 have no dependencies and start immediately. Only 3b waits — on two curls that
are themselves minutes of work. **All four are Wave 1**; three of them appeared in no wave in the
previous revision, which is how the cheapest high-evidence change in the document, #592, ended up
unscheduled.)_

**1. Close the AI cost holes.** — #590
Refund only on `!response.ok`; **narrow the outer catch so a post-success throw at 411 does not
refund** (validation correction to AIE-10); add a non-refundable `billed_assists` counter; make
`ai:partner` fail **closed** via an opt-in flag on `lib/rate-limit.ts`; add a per-IP token bucket
alongside per-user. _Evidence: AIE-10 / AIE-11 / AIE-12 / AIE-13 all CONFIRMED in code._ This is
live exposure, not a launch feature.
**Fairness window, named rather than hidden.** Removing the refund closes the hole but leaves the
_cause_ — AIE-11's attacker-triggerable truncation — open until item 3a lands. In that gap a small
number of honest learners with long files will be charged an assist for a truncated answer. The
source spec's own recommendation was to ship both halves in the same wave; this plan keeps the split
only because 3a is a two-line change that should land in the **same week**, not the same PR. If 3a
slips past a week, restore a _narrow_ refund keyed to `finishReason === "MAX_TOKENS"` only — never
the broad catch. Do not leave the window open silently.

**2. Populate `tutorNotes`.** — #592
Add a `tutorNotes` field to the challenge content schema, author per-challenge common mistakes,
pass it at route.ts:263. _Evidence: AIE-25 CONFIRMED (never populated); AIE-26 CONFIRMED — teacher-authored
input was part of the arm that eliminated the −17% harm._ Cheapest high-evidence change available.

**3. Model routing + diff-propose.** — #590 follow-up · **split, because only half of it was ever blocked**

**3a — UNBLOCKED, ships with item 1.** Emit `propose` as a unified diff at a 2,048-token cap; trim
`MAX_CODE_CHARS` 20,000 → 8,000 (AIE-15). **Neither depends on model reachability or on
`thinkingBudget`** — bundling them behind the curls invented a dependency that does not exist, and
that bundling is what created item 1's fairness window. Together these make AIE-11's truncation
attack nearly impossible.

**3b — BLOCKED on the two curls (AIE-04 / AIE-05 UNVERIFIABLE).** Per-action model switch:
ask/propose → cheapest verified Flash; hint/Socratic → cheapest verified Flash-Lite, **priced against
gemini-2.5-flash-lite ($0.10/$0.40), not 3.1-flash-lite** (AIE-03 CONFIRMED with correction). Also in
3b: **the Flex-tier spike (AIE-16 CONFIRMED — exactly 50% of Standard on both families with zero
documented latency or synchronicity semantics). Spike it with a measured p95 exit criterion, or skip
it and record the skip.** This is the only home AIE-16 has in the plan.

Do **nothing** on caching, in either half, and document the $0 so nobody re-proposes it (AIE-14
CONFIRMED).

**4. Spend ledger as a runaway-abuse backstop.** — #591
`ai_spend_ledger` + fail-closed SECURITY DEFINER `record_ai_spend`, mirroring
`spend_challenge_assist` exactly (RLS on, no policies, REVOKE from PUBLIC/anon/authenticated, GRANT
to service_role, `SET search_path = ''`). All windows on **America/Sao_Paulo** — a UTC-midnight
breaker trips at 21:00 BRT and blacks out the following Brazilian study day (AIE-21). **Sized above
the ~$73/day pathological load (AIE-07), never as a learner-facing cap.** Thresholds are derived
from the sponsor number, not proposed in advance → **O-1**.

### B. Platform prerequisites that gate content

_(This section used to be headed "cross-repo PR 0". There is no PR 0 and there will not be one — see
item 29. Items 5, 5b, 6 and 11 are **monorepo** work; only 7, 8 and 9 are content-repo work, and they
follow PR #6 rather than preceding it.)_

**5. Build server: platform-tools + Anchor bump.** — no issue; **longest pole in the plan**
**Rewritten after review — the original framing named the wrong pin and the wrong repo.**

The blocker is **rustc ≥1.89** (anchor-lang 1.1.2 MSRV). That is a **platform-tools** property, not
an Agave-CLI property: `docs/PINOCCHIO-MIGRATION.md:121-122` says so verbatim, and the monorepo
already ships the fix pattern — `cargo build-sbf --tools-version v1.54` in
`.github/workflows/ci.yml:347,411`, `fuzz.yml:89`, `onchain-academy/package.json:6` and
`scripts/build-pinocchio-deploy.sh`. The build server is the one place that does **not** use it.

Verified change set (all four are required; none alone is sufficient):

1. `apps/build-server/src/build.rs:225` — `Command::new("cargo-build-sbf")` passes no
   `--tools-version`, so it takes the Agave 3.0.14 default. Add `--tools-version v1.54`.
2. `apps/build-server/Dockerfile:2` — `FROM rust:1.85-bookworm`, and `:34` —
   `--default-toolchain 1.85.0`. **The host Rust is pinned to 1.85 twice.**
3. `apps/build-server/programs/Cargo.toml:16` — the learner-facing template still declares
   `anchor-lang = "0.32.1"` (and `borsh = "0.10.3"`, with the "edition2024 not supported by
   platform-tools Cargo 1.79" comment). Bump both with the toolchain.
4. **Bake platform-tools v1.54 into the image.** The runtime container is non-root with a read-only
   rootfs, so "any Agave CLI fetches it on demand" is true on a developer laptop and **false here** —
   an on-demand fetch at request time will fail. This is the part most likely to eat the schedule.

Blocks **all of C2 and all of C3** authoring, and — through the legacy C3 deploy lesson — the
"capstone deploys" half of the launch KPI. _Evidence: CAT-18 CONFIRMED on the MSRV; the pin
identification is a review correction verified in-tree._ Re-derive the Rust feature ceiling and borsh
byte arithmetic after the bump. Which **Agave CLI** to ship alongside is now a minor, reversible
choice, not a blocker → **O-6, reframed**.

**5b. Enable the build server in production — unowned, and the same failure class as item 6.**
— no issue
`apps/web/src/lib/challenge/buildable-executor.ts` fails closed to `available: false` (callers deny → 503) whenever `BUILD_SERVER_URL` / `BUILD_SERVER_API_KEY` are unset, and its header comment still
says **"DO NOT set `BUILD_SERVER_URL` in production until the build server is network-isolated
(issue #193)"**. #193 is now **CLOSED** (verified). Nothing in the plan confirms the prod env vars
were subsequently set, and nothing removes the stale prohibition from the comment. If they are unset
at launch, **every `buildable` lesson is permanently uncompletable** — including the legacy C3 deploy
lesson, i.e. the only path to a capstone deploy in Wave 1. Item 46 already says "confirm prod env
vars" for PostHog; this needs the identical treatment and is strictly more load-bearing. Confirm the
vars, confirm the VPC deny-egress that #193 delivered, then update the comment.

**6. `openEnded` attestation route.** — no issue; **LAUNCH-BREAKING, build before the C5 content.lock bump**
`openEnded` is declared `{graded:false, required:true}`, `/api/lessons/complete` therefore demands a
sealed attestation, and `sealAttestation()` has **zero callers**. courses-academy PR #6 authors
`openEnded` in two C5 lessons — including `submit-and-what-you-built`, the Earn terminus and the
entire launch KPI. Merging as-is makes those lessons return 403 forever: no finalize, no credential,
no submission, no measurable KPI. **Build one POST that calls the already-tested
`sealAttestation({lessonId, blockKey, userId, exp})`.** Build rather than strip, because `openEnded`
is also the artifact-URL fallback for C1/C2/C4 milestones (CAT-17). Interim fallback if it slips:
delete the two blocks in the same PR. Add "no unattested `openEnded`" to content-lint so it cannot recur.

**Ruling on what the route _is_ — this was ambiguous and the ambiguity was consequential.**
`packages/content-schema/src/blocks/open-ended.ts` defines the block as _"A reflection: one learner
message, one AI reply, feedback only"_ with `maxWords` documented as _"Bounds one cache-shaped Gemini
call"_, and the seal is keyed off `AI_PARTNER_SEAL_SECRET`. Read one way, the Earn-terminus lesson —
`submit-and-what-you-built`, `required: true`, verified present in PR #6 — becomes **hard-gated on
Gemini availability and on item 4's fail-closed spend ledger**, which contradicts AIE-21
("degrade never block") and adds a mandatory unmetered billed call the ~$73/day sizing does not
model. Read the other way it is a bare submission receipt, and the block contract plus `maxWords` are
dead letters.

**Decision for launch: ship the receipt, keep the reply optional.** The POST validates the submission
server-side and returns the seal **unconditionally**; the AI reply is a best-effort enrichment that
may fail, be rate-limited, or be disabled without ever blocking the seal. Rationale: AIE-21 is a
standing rule, and gating the entire launch KPI on a third-party model's uptime is exactly the
dependency the rest of §3 spends its effort removing. `maxWords` stays live as a _validation_ bound
(it still bounds the optional call when the call happens). This closes what was an unmade decision,
not a settled one — if the owner wants the reply mandatory, that is **O-13**.

**Corollary — the capability enum, ruled rather than left open.** CAT-17's three candidate
capabilities are `signed-transaction`, `source-file` and `published-artifact`. **Ship
`published-artifact` only** — it covers C1 L7 and C4 L4/L10, which is the whole launch-relevant set —
and defer the other two. The governing rule, restored from the catalog spec: _milestones that cannot
be verified are not milestones — but the copy can be honest cheaply._ An unverifiable milestone must
say "record what you built" and must not say "verified".

**7. Content-lint skills gate (PB-5).** — no issue; cheapest item on the blocker list
`skills:` **is** format-validated by the generated schema — **CAT-20's "unvalidated" sub-claim is
REFUTED** (#487/#498 landed it). What is missing is registry resolution: an invented slug still
passes CI. Add a lint rule requiring every entry to resolve to `skills.yaml` (**42 slugs — D-D,
settled; CAT-24's ~80-slug migration is DROPPED**) plus CAT-24's minimum reuse bar (≥2 lessons,
except `brazil-compliance` and `earn-submission`). Without it the draft syllabi's ~130 invented tags
degenerate the future review queue into "redo that lesson".

**Also restored from CAT-24, and load-bearing precisely _because_ the 80-slug migration was dropped:
the interleaving-pair vocabulary requirement.** Non-goal 15 and item 21 both promise interleaving
"only inside review sets", and Wave 3 builds those sets — on a 42-slug vocabulary nobody has checked
can express them. The review queue must be able to build at least these pairs, so both members of
each must exist in `skills.yaml` and be applied to ≥2 lessons each:

`pdas` ↔ `account-model` · `cpi` ↔ `signers` · `anchor` ↔ `program-security` ·
`checked-arithmetic` ↔ `rust-result` · `compute-budget` ↔ `transaction-fees`

And the negative rule: **overly broad tags are dropped as review keys** — `typescript`, `react`,
`program-basics` and anything of that grain retrieve nothing useful and must not be review-eligible
even if they remain useful as catalog facets. Add both as lint assertions in the same PR as the
registry gate; a pair that cannot be built is a Wave-3 bug discovered a wave too late.

**8. Version-stamp frontmatter + CI currency check.** — no issue
Every lesson stamps the stack version it was authored against; CI flags drift.
_Evidence: CAT-13 CONFIRMED — Kit 8.0.0-canary publishes daily; @solana/react pins kit exactly 7.0.0
so a Kit 8 bump moves in lockstep; @solana-program/token is already six minors past the spec's pin
(CAT-14)._ This is load-bearing, not hygiene. Fold in the three now-discharged CAT-14 verifications
(`getRenderMapVisitor` + real browser export exists → the C4 L1 read-and-diff fallback is likely
unnecessary; swr/react-query peers are optional; token latest is 0.15.0).

**9. Resolve C5's dependency seam.** — no issue; **blocks C5 authoring**
`@solana/subscriptions@0.4.0` peers `@solana/kit ^6.4.0`, which excludes the 7.0.0 pinned everywhere
else in C5, and there is no newer release. _Evidence: CAT-12 WEAKENED — the source doc located the
seam in Solana Pay, the package C5 never installs; it actually swallows C5's mandatory dependency._
**This refutes "C5 has zero platform blockers" (CAT-30).** Either pin C5 to kit 6.x or ship a
documented peer override, and state the seam in-lesson. Decide before C5 L3.

**10. Freeze a devnet reference vault (PB-4).** — no issue
Deployed, funded, **frozen**, account layout treated as a curriculum-wide decision. Precedes C1 and
C4 authoring and any standalone C5 publish; also the fallback for the C4 dead-end (arriving without
a deployed program), which otherwise shows up as a completion cliff (CAT-29).

**11. Decide PB-1 (Kit-capable sandbox vs permanent pure-function grading).** — no issue
The QuickJS isolate has no module resolution and no WebCrypto. _Validation refined the mechanism:
imports are rewritten to `__modules__[…]`, which contains only web3.js and spl-token — so a Kit import
binds `undefined` and dies with "createSolanaRpc is not a function", not a module error (CAT-16)._
The spec **assumes** the fallback: every graded TS block is a pure function over injected fixtures.
Needed before C1 authoring; **does not block C5** (sampled C5 starters contain zero imports). Retire
the fabricated `findProgramAddressSync`/`isOnCurve` mock alongside the legacy web3.js-v1 exercises —
cleanup, not a blocker (CAT-21 CONFIRMED).

### C. The credential chain (launch-critical, platform)

**12. Quiz feedback rendering + 403 mapping + AI suppression.** — #564 **promote to P0**
The quiz pipeline is fully built and used by **0 of 76** lessons, and a failed quiz on a prose-only
lesson currently reads as `completionFailedEnrollment` (MAS-03 CONFIRMED).

**Scope correction (review finding, verified).** The original text said "there is no renderer at
all". That is **wrong**. `blocks/index.ts` registers `quiz: QuizBlock` inside a
`satisfies Record<BlockType, Renderer>` map — a missing renderer would be a compile error — and
`quiz-block.tsx` is a 70-line client component that already collects selections into a `QuizProof`
via `ctx.setProof`. **The renderer exists and is silent.** #564's real scope is _add a check action
and feedback rendering to an existing renderer_, not _build a renderer_. Sizing #564 on the wrong
premise would have mis-estimated it. The feasibility half stands: `QuizOptionData.correct` /
`.feedback` and `QuizQuestionData.explanation` are on the client-facing type
(`packages/types/src/course.ts:59-72`) and `project.ts:114-124` projects them, so an anonymous learner
gets full pedagogical value with zero new endpoints while the server grader stays the claim-time gate.

**AI suppression, now actually specified** (the item's own title promised it and the body never
delivered it): while any quiz block on the lesson is unanswered, the AI pane is **suppressed** — not
merely un-prompted. No ask, no hint, no Socratic, no `propose`. It re-enables when the close is
submitted, pass or fail. _Evidence: UIU-05 CONFIRMED (mechanism) — retrieval stays AI-free or the
retrieval attempt measures the model, not the learner._ This is also §6 non-goal 21.

**Ruling on CAT-23 vs MAS-03 — they contradicted each other and both were marked CONFIRMED.**
CAT-23's sub-claim was "do NOT claim quizzes gate XP — they do not on today's platform". **That
sub-claim is REFUTED in code.** `apps/web/src/app/api/lessons/complete/route.ts` §1 iterates every
block, and for any `BLOCK_REGISTRY[type].graded` block (which includes `quiz`) a missing grader or a
failed grade returns `deny(...)` before any on-chain XP path is reached. The gate is real,
fail-closed, and already blocks on-chain XP; it is simply **unexercised**, because 0 of 76 lessons
carry a quiz. **MAS-03 wins; CAT-23 survives only as "the block is unused".** No platform change is
needed for per-lesson XP gating on retrieval — it is already the behaviour.

**Corollary: because the answer key ships to the client, the retrieval close is a pedagogy device
only. No integrity or anti-farming claim may rest on it** (consistent with PED-24).

_Evidence: PED-01 CONFIRMED, PED-02 CONFIRMED (elaborated + feedback or the effect is zero),
PED-03 CONFIRMED — **Rowland 2014 softens the retrieval-success boundary, so item format and
difficulty calibration are second-order and must not block this item**; ship immediate explanatory
feedback on every item and tune format later. UIU-12 WEAKENED — strike "one per screen-state"._

**13. Harden `/api/deploy/save`.** — #560
Today it accepts any self-reported base58 with no RPC call, no executable check and no
upgrade-authority comparison (MAS-05 CONFIRMED). **Must precede #561** or anyone claims a credential
with someone else's program.

**14. Capstone-gated credential.** — #561
Split the chained `finalize_course` → `issue_credential` handler so only credential issuance gains
the capstone check; apply the same check in `/api/certificates/mint`; grandfather pre-gate devnet
certs; **learner XP timing must not change** (MAS-06 CONFIRMED). Define **one** app-side capstone
constant — the same constant the AI-off-in-capstone check reads (§3 item 33), so there is one source
of truth rather than two that drift. _Evidence: PED-21 (integrity lives in artifacts), PED-30
CONFIRMED, PED-07 CONFIRMED for PBL at d=0.71 with milestone scaffolding._ Scope depends on **O-2**.

**15. Verify-page polish — not a build.** — #554
**UIU-29 is REFUTED**: `/certificates/[id]` is already middleware-public with anon RLS read and X
share shipping (MAS-04 CONFIRMED). Real remaining gaps, narrower than the claim: no LinkedIn prefill,
no course-version display, no i18n of share text, `is_public=false` **silently 404s a shared link**,
and — new in validation — the page is `"use client"` with a browser-side fetch, so there is **no
server-rendered on-chain verification and no crawler-visible OG card**. A LinkedIn or X crawler sees
an empty shell. **Restored from LX-E5 and re-verified: the network label is hardcoded —
`certificates/[id]/page.tsx:76` passes `network: "devnet"` literally, and line 151 builds the
explorer URL from it. Read it from env.** Shipping a mainnet credential that links to a devnet
explorer is a credibility defect, not cosmetics. Privacy coupling is **O-8**.

**16. LinkedIn Add-to-Profile + share nudge.** — #552
Prefilled `linkedin.com/profile/add` URL from data already on the page, plus an explicit nudge at the
mint success state, ×3 locales. Zero `linkedin` matches exist anywhere in `src` today (MAS-08
CONFIRMED). \*Evidence: UIU-02 **WEAKENED** — +6% new employment, +12% bottom tercile, but not
peer-reviewed, +8% not +9%, LinkedIn-profile outcomes not administrative records, and the resume-score
figure is unsourced. **Strike "peer-reviewed" and the resume figure from the PR.\*** Still the cheapest
high-confidence item we have.

**17. Earn handoff card.** — #553
Curated **category** links only — listings are ephemeral and competition is a deadline function
(CAT-06 CONFIRMED, watched change during validation). Copy bounds: "your first $500–$5,000 of paid
Solana work", grant framing "avg $5.5k Brazil grants". Never employment, never learn-to-earn, no
unverified Brazil totals (MAS-24, LAU-13/LAU-15 CONFIRMED).

**18. Capture the 14-day post-mint activity baseline BEFORE 16 and 17 ship.** — #558 scope
_Evidence: PED-16 — the badge literature predicts a post-credential cliff._ Ship the intervention
first and the counterfactual is destroyed. This is an ordering constraint, not a task.

### D. The catalog — the reconciled content plan

**The catalog spec wins over the master spec's LX-D1/LX-D2 content plan.** It is later, it is the
only document that audited technical currency, and courses-academy PR #5/#6 have already committed
to it. Decisive reason: **CAT-09 CONFIRMED** — Anchor 1.0's breaking changes invalidate every pre-1.0
lesson body, so rewriting is not optional.

**19. The five-course path.** Sequential prerequisite chain, one vault carried through:

| #   | Course                                                     | Lessons | xpPerLesson | Artifact                         |
| --- | ---------------------------------------------------------- | ------- | ----------- | -------------------------------- |
| C1  | solana-for-web-devs (rewrite of solana-fundamentals, 12→8) | 8       | 10          | Kit client                       |
| C2  | rust-for-program-devs (rewrite of rust-for-solana, 12→14)  | 14      | 20          | Rust vault core                  |
| C3  | building-your-first-solana-program (KEEP, 16→15)           | 15      | 20          | Deployed Anchor program          |
| C4  | solana-dapp (rewrite of solana-frontend, 12→11)            | 11      | 20          | Published npm client + dApp      |
| C5  | stablecoin-agentic-payments (NEW)                          | 9       | 25          | x402 paid tier + Earn submission |

**"Rewrite of X" means a NEW on-chain course, not an edit — this was silently elided and it changes
the on-chain workstream by a factor of three.** Retrofitting a live course needs an `active_lessons`
bitmap sync per insert/delete (MAS-15), and C1/C2/C4 each change lesson count _and_ trackLevel.
Correct disposition, per CAT-25/CAT-26:

| Slug                                 | On-chain action              | Note                                      |
| ------------------------------------ | ---------------------------- | ----------------------------------------- |
| `solana-fundamentals`                | **retire**; C1 created fresh | C1 is a new course id, not an edit        |
| `rust-for-solana`                    | **retire**; C2 created fresh | new course id                             |
| `anchor-framework`                   | **retire**, no successor     | 3 prose lessons merged into C3            |
| `solana-frontend`                    | **retire**; C4 created fresh | new course id                             |
| `defi-on-solana`                     | **retire**, no successor     | only token-standards salvaged, into C5 L2 |
| `building-your-first-solana-program` | **close + recreate** (C3)    | trackLevel 2→3 only                       |
| —                                    | **create** C5                | new                                       |

That is **five retirements, four `create_course` calls and one close+recreate** — seven operations,
not the two item 50 originally budgeted. Item 50 has been rewritten accordingly.

**How a retired course is actually hidden is an unanswered question, not an implementation detail →
O-9.** Verified: `packages/content-schema/src/course.ts` has **no `draft` field** — the generated
`courses.json` carries no draft/active flag at all — and `draft: true` exists only on _paths_
(`path.ts:18`). Meanwhile `/courses` calls `getAllCourses()`, which reads the whole bundle regardless
of path membership. **So path-level `draft` hides nothing on the catalog page.** The three real
options are (a) delete the course directory from the content repo, (b) add a course-level draft flag
to the schema (a platform change nobody has scoped), or (c) on-chain deactivation. Pick one before
the Wave-2 content.lock bump.

_Evidence: CAT-25, CAT-26, CAT-28 CONFIRMED; CAT-08 for the
seven not-built topics — with the Cyfrin-48-lesson and Anchor-v2-Pinocchio reasons **struck**._
xpPerLesson is **per course, not per lesson or per learner** — MAS-17 is WEAKENED, not confirmed:
`UpdateCourseParams` exposes `new_xp_per_lesson`, so it is mutable post-creation. **Do not write
"immutable" into any issue.** `trackId`/`trackLevel`/`creator` genuinely have no update param.

**19b. The salvage ledger — carry, carry-prose-only, and DELETE-DO-NOT-PORT.** — no issue
Restored in full from the catalog spec §7. Without it an author rewriting C2/C3/C4 "from the existing
course" has no salvage plan **and no prohibition list**, and the actively-false material below is
exactly what gets ported forward under the word "rewrite".

_Carry verbatim_ (these are assets, not filler): `bfsp/your-first-build` + its 3 hints;
`wire-up-initialize`'s `// BUG:` DEBUG rung — **the crown jewel of the existing corpus, the one rung
that teaches reading a failure**; `airdrop-fund-wallet`'s wallet-funding block;
`deploy-program-devnet`'s deployable + Resume hint; `interact-with-program`'s program-explorer block;
the `_template` quiz syntax.

_Carry prose only_ (~16 named lessons in the source ledger — reuse the exposition, re-author every
exercise against the current stack). The version stamp (item 8) is authored fresh in every case;
carried prose does **not** inherit a stamp.

**DELETE — DO NOT PORT, DO NOT CITE, DO NOT "FIX IN PLACE":**

- **The two `anchor-framework` exercises that teach a `DefaultHasher` PDA model** accepting a bump
  when `hash % 2 == 0`. This is an actively false model of the most important Solana primitive,
  taught twice. Delete. Do not port. Do not cite as prior art.
- `why-rust`'s zero-cost-abstractions snippet — **does not compile.**
- `connect-wallet-challenge`'s `Keypair.generate()` hidden behind `simulateWalletConnection()` —
  teaches a fabricated wallet flow.
- The JS mock's `findProgramAddressSync` / `isOnCurve` — fabricated APIs (also item 11's cleanup,
  CAT-21 CONFIRMED).

Put the delete list in the C2/C3/C4 PR templates as a checkbox, not in a doc nobody re-reads.

**19c. Localization sequencing — restored, and it is why §1's language claim was softened.**
— #580 · **O-10**
The catalog spec's per-course second-language plan, dropped in unification:

| Course | Second language | Why                                                                                                              |
| ------ | --------------- | ---------------------------------------------------------------------------------------------------------------- |
| C1     | PT-BR → ES      | highest volume, Brazil-first                                                                                     |
| C2     | **ES first**    | Blueshift has zero Spanish pages **and** no Rust course — the least-contested topic × language cell on the board |
| C3     | both            | flagship                                                                                                         |
| C4     | ES first        | same reasoning as C2                                                                                             |
| C5     | ES first        | first-mover topic, uncontested language                                                                          |

Two rules that are not negotiable and were lost with the section:

1. **A lesson is not translated until its version stamp is confirmed current.** Translating a stale
   lesson multiplies the correction cost by the locale count and guarantees the locales drift apart.
2. **Translation PRs are separate, one per course per locale, and never merge ahead of the EN
   stamp.** A mixed EN+translation PR cannot be reviewed by a translator or by an engineer.

Whether ES is _promoted to a launch language_ for C2/C4/C5, or PT-BR stays first everywhere, is a
positioning call, not a research question → **O-10**.

**20. Rescope #559 (was LX-D1).** — #559 **CONTRADICTED BY THIS PLAN**
It builds a "Zero to Deployed" path over four courses, three of which cease to exist. It stops being
a path-creation PR and becomes **the content.lock bump gate** in the catalog's PR sequence. Split out
and ship this week, decoupled: **(a)** retarget the capstone's `what-you-built` next-step pointer off
defi-on-solana; **(b)** insert rust-for-solana and anchor-framework into `solana-core.yaml` so the
live path stops skipping them. Watch dual-path title resolution in the diff (a course in two paths
resolves to the _first_ path's title). _Evidence: MAS-07 CONFIRMED._

**Acknowledged tension in (b), previously unstated.** Item 19 retires `anchor-framework` outright and
replaces `rust-for-solana` with a new C2 course id. So (b) routes new learners into two courses the
plan closes one wave later, and spends content-PR effort on a path composition Wave 2 deletes. It is
still the right call — a live path that visibly skips two of its own courses is a worse defect for
one wave than a migration cost for a small cohort — but the cost must be named and budgeted, not
discovered. **Concretely:** anyone who enrolls in `anchor-framework` or `rust-for-solana` between
this PR and the Wave-2 bump needs (i) a DB-side note of their `enrollments` rows in those slugs, and
(ii) a decision at bump time on whether they are migrated to C2/C3, grandfathered on a hidden course,
or simply told. That decision belongs with **O-9** (retirement mechanism), because the three hiding
options have three different answers.

**21. Rescope #565 (was LX-D2).** — #565 **SUPERSEDED IN SCOPE**
Authoring retrieval items into all 52 old-spine lessons throws ~36 of them away on merge. Redirect
the budget to the ~15 surviving C3 lesson IDs and to new-course authoring. Retrieval policy is free
and needs no platform change: every code-bearing lesson carries a quiz; one concept-retrieval lesson
per course (C1 L5 / C2 L9 / C3 L12 / C4 L6 / C5 L2); cumulative quiz in every recap with ≥1 item per
skill tag; ≥2 seeded items from the previous course. _(Citation corrected: CAT-23 is confirmed only
for "the quiz block is unused"; its "quizzes do not gate XP" sub-claim is refuted in code — see
item 12. The retrieval policy rests on PED-01/PED-02/PED-03, not on CAT-23.)_ **Retrieval placement is NOT
interleaving** — MAS-22's numbers are REFUTED but the ruling stands: interleave only inside review
sets, never reorder lesson prose.

**22. Fix the C3 slot ID map against `slots.lock` before the C3 PR.** — no issue
The spec states the surviving count three ways (12 / "13 of 16" / "13 of 15") while its own 16−2+1=15
arithmetic implies 14 (CAT-27, self-flagged). Governing principle: rename freely, retire twice
(`lesson-bfsp-deploy-to-devnet` slot 11 and the trivial module-1 independent-write), add once
(pre-flight-check). Lesson slots are permanent and reordering is safe — **but any newly inserted
lesson occupies a new slot that must be activated on-chain via `update_course active_lessons`, or it
is silently uncompletable** (MAS-15 CONFIRMED). Put that in the insertion checklist.

**23. Authoring rules, enforced at review.** _Evidence: PED-05 CONFIRMED, PED-06 (ladder is a design
inference — treat subgoal/Parsons gains as cheap levers, do not bank them), CAT-29._
No module jumps worked-example → independent-write; a concept-retrieval lesson does not satisfy the
intermediate rung; subgoal labels appear as literal numbered comments in starter files; Parsons rungs
ship target code present-but-scrambled; every milestone names a checkable object; the last technical
rung of a course is independent-write; a 2-lesson capstone module carries its scaffold inside the
capstone lesson. **Rule 7, restored (it was the one of seven that went missing): length follows
material — no course is authored to a lesson count.** The counts in item 19's table are the current
estimate, not a target; a course that needs 9 lessons ships 9 and the table is edited, never the
reverse.

**Marketing anti-claims, restored — these are authoring rules too, because the copy is authored in
the same PRs.** Never "get hired as a Solana frontend dev" — say **"ship the package, not just the
page"**. And **marketing must not promise a graded deployed dApp until a preview/verification block
exists** (today only `published-artifact` ships — item 6). Both belong in the C4 PR review checklist.

**24. Never author "hidden tests" on the Rust path.** _Evidence: CAT-19 CONFIRMED verbatim._
Rust grading is **compile-only** — a withdraw that omits `checked_add` or the zero-amount guard
passes C2's capstone. Marketing says "compiled against the real Anchor 1.x toolchain", never
"unit-tested".

**The stated mitigation does not work as an authoring rule — verified.** "A fixed non-editable
`mod verify` harness" cannot be non-editable in the current architecture:
`apps/web/src/lib/challenge/buildable-executor.ts` → `toBuildFiles(code, nonce)` returns exactly
`[["/src/lib.rs", code], ["/src/_grade_nonce.rs", "// " + nonce]]`, i.e. **the entire compiled source
is the learner's submission**, and `/api/build-program` takes the file set wholly from the client
(`files: { path, content }[]`, validated only for count and 500KB total) while
`apps/build-server/src/build.rs:200-207` writes whatever paths it is handed. A learner omits or
rewrites the harness and the build still passes. Making the harness real requires **server-side
injection** in `toBuildFiles` (append a non-overridable `/src/_verify.rs` and reject a submission that
declares `mod verify`) — a small, well-scoped platform change, but a platform change, and it is not
filed. **File it with C2, or C2 ships with compile-only grading and honest copy.**

**That is the decision, and it is the owner's → O-12.** Either (a) build the injection so
`buildType: unit-tested` can eventually mean something, treating it as a C2 launch blocker, or
(b) C2 ships compile-only with softened copy ("compiles against the real toolchain" and nothing
stronger) and the injection becomes a fast-follow. The catalog spec left this open; unification
dropped both the remedy and the decision.

**25. Schema-imposed authoring constraints.** _Evidence: CAT-20 WEAKENED — three of four sub-claims hold._
`buildType` is `[standard|buildable]` (no LiteSVM, no unit-tested) → C3 L12's LiteSVM block ships
prose+quiz by default. `language` is `[typescript|rust]` → C4 L4's Actions YAML ships as prose. One
starter path per code block → C2 L13 teaches modules as inline `mod vault { … }`. **Multi-file Rust
must not block the catalog.**

**26. Close #588 (AI-agents course).** — #588 **SUPERSEDED — CLOSE**
_Evidence: CAT-03 — AI-agent bounties are ~$53/competitor at median 91 submissions, the worst
money-per-competitor measured; LAU-18 was flagged non-load-bearing and its volume signals are not
comparative._ Already implemented correctly in PR #6 as `budgeted-agent-with-a-hard-cap`, a fenced
C5 payments lesson with no agent-framework dependency.

**27. LX-D4 (stablecoin module inside solana-frontend) is DELETED, not re-filed.**
Superseded by authoring before it was ever filed. A module buried in a frontend course cannot carry a
first-mover positioning claim (CAT-04 CONFIRMED). **Fix in PR #6 before merge — the list, verified
against head `f8d6867`:**

1. **The false opener.** `course.yaml`'s description opens _"You have a deployed vault app that earns
   nothing"_ — a C4 through-line assumption that breaks a standalone C5 publish, which is the only
   publish C5 gets at launch. Same defect the spec flags for C3.
2. **Ratify `trackId: 1` / `trackLevel: 5`**, which the file already declares — that is **O-3**, and
   PR #6 merging is what makes it expensive to change.
3. **Confirm the 42-slug `skills.yaml`** carried in this PR satisfies item 7's interleaving pairs
   before the lint PR that will enforce them lands behind it.

**28. #581 collapses to documentation drift.** — #581 **PARTIALLY SUPERSEDED**
**D-C settles it: `creator: B7o8Nf…` is the owner's wallet and is correct.** PB-7 is therefore not a
blocker — it is `CONTRIBUTING.md` referencing an `instructors/` directory that does not exist and a
`teachers.yaml` whose own header says nothing reads it (CAT-22 CONFIRMED, all four sub-facts).
**Concrete schedule unlock: C3 authoring is blocked ONLY by item 5, not by 5 and PB-7.** The track-ladder
half of #581 survives and is **O-3**.

**29. Cross-repo delivery order — corrected against the PRs that are actually in flight.**
_Evidence: CAT-30, plus a review correction verified against both repos._

The original "PR 0 → PR 1..5 → content.lock bump" order was already violated when it was written, and
it put a monorepo change inside a content PR. Verified state:

- **There is no PR 0** and there will not be one. `courses-academy` PR #5 (catalog blueprint +
  doc-drift) and PR #6 (C5, 42 files) are both open and CI-green.
- **The skills migration already shipped inside PR #6**: `skills.yaml` at PR #6 head has **42** slugs;
  `main` has 24; the committed bundle (`apps/web/src/content/generated/skills.json` at content.lock
  `bccd92f`) has **24**. So item 7's registry lint "against 42 slugs" **cannot precede** the course PR
  it was supposed to precede — the 42 slugs arrive with it.
- **Item 5 is a monorepo change**, not a content one (`apps/build-server/Dockerfile`,
  `src/build.rs`, `programs/Cargo.toml`). It never belonged in a `courses-academy` PR.

Corrected order:

1. **Monorepo, in parallel and independent of content:** items 5 + 5b (build server), 6 (`openEnded`
   route), 11 (PB-1 decision).
2. **`courses-academy` PR #5 → PR #6** (merge order as filed; #6 carries the 42-slug registry).
3. **`courses-academy` lint PR**, immediately after #6: item 7's registry + reuse + interleaving-pair
   gates, item 8's version-stamp check. **After, not before** — the gates need the vocabulary #6
   introduces. Anything authored between #6 and this PR is lint-unprotected; keep the gap to days.
4. **PR per course** (C1..C4), staged, nothing live.
5. **The monorepo `content.lock` bump** — the only PR that changes what learners see, and the natural
   owner sign-off gate.
6. **On-chain operations** (item 50).

C3 may publish before C1 only if its false opener is fixed in the same PR.

**30. BCB-561 re-verification alarm.** — no issue
C5 is the only course with a dated decay clock (**2026-10-01**, CAT-07 CONFIRMED). Set a calendar
task to re-verify C5 L1 before it. Nothing currently does.

**31. Originality gate for catalog code.** — no issue
CAT-15 CONFIRMED: the reference corpora authors are told to use are all-rights-reserved, and the live
docs are GPL-3.0. **No CI check and no review gate enforces "every word and line is original".** Add a
review checkbox at minimum.

### E. Funnel, onboarding and the AI wall

**32. The AI wall: keep the shape, un-anchor the numbers.**
**D-B blesses the shape** — degrade-before-deny, Socratic tier, `propose` alive at every tier, no
padlock, PT-BR/ES/EN copy, America/Sao_Paulo windows, Tier 0 = 3 authored hints with no model call
(99 free hints across 33 code lessons already exist — AIE-08 CONFIRMED). **The 2/8/20 boundaries were
reverse-engineered from a cost model that D-B declared not-the-constraint, and AIE-26 records that
the decisive result was obtained under _unmetered_ access — so the numbers currently rest on no
claim.** Re-derive them from the pedagogical question (_when does the tutor start becoming an answer
machine_), not from cents. Guards on `reset_challenge_assists` (once-per-lesson + cooldown) live
inside the SECURITY DEFINER function, in the same migration that exposes the route (AIE-20).

**Two evidenced interventions were stated in §2.1 and never became work. They are work now — they
are the only two pedagogical mechanisms in the plan, and the ladder without them is just a meter.**

**(a) The attempt gate, as a nudge (AIE-27 WEAKENED).** Before the first AI turn on a challenge the
learner has not yet run, show an inline _"run the tests once first"_ prompt with a **one-tap
"I'm stuck before I can run it" override that costs nothing** — no assist, no delay, no friction
beyond the tap. Never a refusal. The weakening matters here: grade level **is** a significant
moderator and effects favour instruction-first for domain-general skills, so the productive-failure
case is weakest exactly on a beginner coding rung — which is why this is a nudge and not a gate.
**Log the override rate as a content-quality signal**: a challenge with a high override rate has a
setup problem, not a learner problem.

**(b) Gate the _patch apply_ on a comprehension check (AIE-28).** When the learner applies a
`propose` patch, ask one short question about what the patch does before the apply lands. **A wrong
answer is explained, never charged** — no assist debit, no retry limit, no lockout. This is the
strongest alternative to friction in the corpus: help _abuse_ is r=−0.46 with gain while help
_avoidance_ is r=−0.10 n.s., and non-punitive remediation gained 46 points pre→post against 20. The
check attacks abuse without touching avoidance, which is what a meter cannot do.
**The first-attempt accuracy of this check is the primary AI metric** (item 46) — it is the one
signal the public answer key cannot contaminate.

**33. AI unavailable in the capstone — scoped to the graded deploy lesson only.**
_Evidence: AIE-29 (assessment environment was the only significant moderator: AI-allowed g=0.76 vs
AI-restricted g=−0.06) coupled with PED-05 CONFIRMED (expertise reversal: guidance matters most
exactly where the cliff is steepest) and LAU-20 CONFIRMED (13% is the ceiling for a **mentored**
cohort)._ Keyed off the **same** capstone constant as item 14. **Coupled to O-2**: if the owner picks
"original program", this relaxes from off to Socratic-only, or the launch KPI sits behind an
unassisted cliff with a measured single-digit ceiling.

**34. Terminal-rung copy must not promise a human.** — decide before ×3 translation
The ladder's last rung points at the community forum. The tables and routes exist; a launch-time
responder population does not. Either staff a named rotation or write "post it in the forum — the
authored hints and the reference solution stay available". **Do not ship copy that implies an answer
is coming** (PED-22 — the structured-feedback gap is real, and pretending to close it is worse than
naming it).

**35. Intake (Design A), corrected.** — #566
Tap-only, zero data-entry fields, ≤4 screens: experience fork (verifiable history — **never
"rate your skill"**, self-assessment correlates r=.29 with performance, LAU-08), goal question
(3 options, consumed by framing/quest/notification copy only), optional skippable value-relevance
micro-prompt. **DROPPED: the 1/day-vs-3/day daily-goal picker.** It commits the learner to a daily
target whose only feedback surfaces we are simultaneously demoting (#583), while forgiveness (#573)
does not land until Wave 3 — the exact configuration UIU-08 CONFIRMED says must not ship. Design A's
own rule kills it: _an answer nothing consumes must not be asked._

**In its place, LAU-05's if-then implementation intention (d=0.65 on goal attainment) — but
DISPLAY-ONLY, not a notification slot. Corrected: the same rule that killed the daily-goal picker
kills a notification slot harder.** Verified: **there is no notification channel of any kind** — no
notification table in `supabase/schema.sql`, no delivery code under `lib/` or `app/api/`, no
`pg_cron`, no Vercel cron. The master spec recorded this as a blocking unpriced prerequisite and
scoped LX-A6 to "v1 displays the plan on the dashboard only; delivery waits for a future notification
workstream". Unification lost that constraint and promoted an if-then prompt into a channel that
does not exist. **v1 asks for day + time and renders the resulting plan on the dashboard. Nothing is
delivered.** When a notification workstream exists, the stored answer is already there to consume.

**LAU-28 is a hard precondition on this whole item, not a footnote: verify that quests, streaks and
notification timing can actually consume each answer BEFORE building the screen that asks it.** Every
question on the intake must name its consumer in the PR description. A question with no named
consumer is deleted from the screen, not deferred.

If any cadence question is asked, phrase it weekly to match the north star (and see item 40's weekly
track, which is the surface that consumes it). **Value-relevance boundary (LAU-04 WEAKENED): the moderator is a
per-course achievement gap, not a locale — it produced −1.6 to −1.7pp in no-gap courses, and the
authors could not predict which courses had a gap. Gate on a measured per-course control-arm gap, or
keep it skippable and A/B per course. Do not gate by locale.**

**36. Segment routing = a static app-side constant.** — #586
3 (or 2 — **O-5**) segments × entry course id, rendered as one default path with a single highlighted
"start here" plus a secondary Browse-all. \*Evidence: LAU-02 CONFIRMED — catalog-level adaptive
personalization does not move completion (ALMAP ~19,500 students, no effect; PNAS-2020 ML targeting
13.38% vs 13.08% random at ~250k learners). **No recommender, no adaptive sequencing, ever, until the
catalog exceeds 20–30 courses.\*** Sell intake internally as activation, never as a completion lever.
Per-segment guidance modality on the path page is the launch mitigation for the MAS-21 deferral.

**37. Anonymous-enroll fix + Later affordance + progress banking.** — #556, #567
Must precede #562. _Evidence: MAS-02 CONFIRMED (anonymous access already works — this is funnel
shaping, not an access build); UIU-13 WEAKENED (direction safe, Duolingo magnitudes not portable)._
**Gated on O-4**: `/api/lessons/complete` requires `profiles.wallet_address`, so a learner who takes
the Google branch signs in and still cannot complete a single lesson.

**Security constraint, restored from LX-A4(c) and re-verified.** `/api/lessons/complete` runs two
volume gates — `isRateLimited("lessons:complete", user.id, …)` and
`isRateLimited("lessons:complete:ip", getClientIp(request.headers), …)` (the #459 gates). Replaying a
banked anonymous session on sign-in will trip them, and the tempting fix is to raise the limits.
**Do not.** The replay must be **server-internal, with replayed completions marked as such**, and
exempt **by construction** — never by loosening a gate that protects every other caller. A relaxed
global throttle is a permanent security regression bought to fix a one-time funnel event.

**38. Landing CTA deep-link into flagship lesson 1.** — #562
A CTA/link change, not a build. **Does not ship until 12, 37 land** — deep-linking an anonymous
visitor into a lesson whose retrieval close cannot grade and whose enroll button silently no-ops
ships a dead end.

### F. Learning surfaces at launch

**39. Dashboard split first, then the Continue card.** — #563 **then** #551
`dashboard/page.tsx` is 1,094 lines, `"use client"`, stats-first (MAS-10 CONFIRMED). Three changes
(Continue hero, review strip, cohort strip) contend for it. **Resolves MAS-30(a) in favour of #563:**
letting #551 land first defeats the entire justification for the split. The one piece of #551 that
can ship immediately is the course-detail CTA bug — `course-detail-client.tsx:263` hardcodes
`modules[0]?.lessons?.[0]`. **Caveat on "uncontested": that file is uncontested _for the launch
window only_.** #585 (Course-detail linear-path view, Wave 4) targets the same file and the same CTA
region. If #585 is pulled forward it recreates on course-detail exactly the three-way contention this
item spends its argument avoiding on the dashboard — so if #585 moves, it absorbs the CTA fix rather
than racing it. Next-incomplete lesson is derivable today
from bundle order minus completed `user_progress` rows; no schema change (validation note: the
`completed` column exists but the only production writer hardcodes `true`, so no in-progress row will
ever exist — derive, do not query).

**Deliberately not doing: true mid-lesson resume.** Restoring scroll position inside a lesson needs a
`last_visited` column and a write on every scroll settle. It was an open question upstream; the ruling
here is **no for launch** — next-incomplete-_lesson_ is the resume unit, and the column is not worth a
migration plus a write-amplification path before there is evidence anyone abandons mid-lesson rather
than between lessons. Revisit only if item 47's drop-off data shows intra-lesson abandonment.

**40. Launch prominence demotion.** — #583
Demote the raw daily streak counter and the global absolute leaderboard. _Evidence: UIU-08 CONFIRMED
(the strongest item in the corpus, developer population, non-vendor); PED-14/UIU-09 CONFIRMED with
the "evidence against exists, not proven harmful" labelling._ This is the **interim insurance** while
forgiveness (#573, an L-effort coordinated PR across three DB writers — MAS-11 CONFIRMED) waits.

**The third component of pedagogy P0 #3, restored: a weekly-cadence track as the headline unit.**
#573 was reduced in unification to earned freezes + missed-day repair, dropping the piece that
actually resolves the cadence mismatch. Our north star is **weekly return of previously-active
learners**; a daily-obligation counter optimises a different variable and, per UIU-08, steers
developers badly. So the headline streak unit becomes **"active N weeks running"**, with the daily
count demoted to a secondary detail for learners who want it. This is the surface that consumes
item 35's weekly-phrased cadence answer — without it, that answer has no consumer and by Design A's
own rule should not be asked.

**Freeze design constraints (UIU-16), also restored — these are requirements on #573, not options:**
capped at **2**; **auto-applied server-side** with no learner action; shown **retroactively** as a
snowflake on the calendar; and **never a modal decision**. A freeze the learner has to choose is a
loss-framed prompt, which is the mechanic the plan forbids everywhere else.

**41. XP copy audit.** — #550
`n/m to Level k`, never a balance; no coin iconography, no spend mechanics; tabular numerals; no new
i18n key may contain "balance". _Evidence: PED-10 CONFIRMED at −0.36 to −0.44 for the completion-contingent
cell XP actually occupies; PED-11 WEAKENED (informational +0.66 vs controlling −0.44 rests on ~4
partly SDT-lab-authored studies — best available guidance, not proof); UIU-23 WEAKENED (n=125
preprint, stated preferences — a heuristic, not a prohibition)._ **Strike the d=−0.88 attribution
(MAS-20 REFUTED).**

**42. Celebration re-tiering.** — #549
Exactly two confetti sites exist and they are inverted: every challenge pass, and deploy; **nothing at
credential mint** (MAS-09 CONFIRMED). Retier: challenge pass → checkmark, deploy and level-up →
medium, credential mint → full, plus an encouragement state after ≥3 consecutive fails.
**The credential-mint tier ships the shareable milestone card** (UIU-24's design, dropped in
unification): a rendered card at the full-celebration moment carrying course, artifact and date. It
is what item 16's LinkedIn prefill and the X share actually share — without it, the "cheapest
high-confidence item in the corpus" shares a bare URL to a page that is currently an empty shell to
crawlers (item 15). Card + OG card + prefill are one coherent unit; shipping the prefill alone
under-delivers all three. _Evidence:
UIU-24 UNVERIFIED — practitioner consensus, label it as such in the PR._

**43. Endowed progress with stated reasons.** — #584
No progress bar renders 0% after enrollment; every pre-credit shows its reason; next course surfaced
at completion. _Evidence: UIU-06 CONFIRMED for direction; the magnitude rests on one 2006 field study._
**Preregister direction, not doubling** — MAS-18 dropped that caveat and would set #584 up to read as
a failure while working correctly.

**44. Challenge-screen refinements — split by wave, because this item straddled two.**

**44a — Wave 1.** #555 output panel: first-failure auto-expand in visible-test order with test code
and authored message side by side, passes collapsed, stdout capped (UIU-17 **UNVERIFIED** —
convention, label it). #568 Monaco a11y with a **platform-aware** chord — Ctrl+M on Windows/Linux,
**Ctrl+Shift+M on macOS**; a hardcoded Ctrl+M leaves Mac users tab-trapped (UIU-20 CONFIRMED + boundary).

**44b — Wave 4.** #575 `failure_message` EN-first (UIU-04 CONFIRMED — and **do not** ship LLM
auto-explanation). #576 stuck-nudge. #587 AI post-pass review.

**Named consequence, previously unstated: the moat ships post-launch.** §2.1 identifies authored
failure messages (PED-09: "budget goes to authored failure messages") and AI post-pass review
(PED-22: "free content is not the moat — AI post-pass review + authored failure messages are") as the
two differentiators. Both are in 44b. **Launch therefore ships without the moat**, and that is a
deliberate, funded-later choice rather than an oversight — but it must not be described internally as
"launch ships the differentiated experience". It does not. If any single item is worth pulling into
Wave 1, it is #575, because it is content-schema work that unblocks authors rather than app work.

**Stuck-nudge cold-start gotcha, restored from LX-C4.** The trigger was stated as "≥1.5× median solve
time **or** N failed runs". **There are no medians at launch** — no telemetry exists to compute them,
so the median arm silently never fires or fires on noise. **v1 must be N-failed-runs only** (which is
what #576's own title already says: _"Stuck-nudge v1 (N-failed-runs trigger)"_). The median trigger
is added only once item 46's challenge lifecycle events have accumulated enough completed attempts to
compute a stable per-challenge median. Never on first attempt. Instrument on next-challenge
unassisted solve rate (UIU-18 WEAKENED — domain transfer unproven, no learning gain measured).

**44c. Mobile surface scope — dropped in unification, restored, and it is not optional for a
Brazil-first audience.** — part of #555/#568 scope; no separate issue
The plan currently says "mobile" three times, all about Blueshift owning the mobile-_development_
lane. Nothing states what our own product renders on a phone. Requirements (UIUX R15/F21, master-spec
LX-B5):

- Mobile web serves **prose, video, quiz, Parsons, the Review queue and streak** — the majority of
  the learning surface works.
- **Mobile never renders Monaco.** A challenge opened on mobile shows a _"continue on desktop"_
  handoff with the lesson saved, not a broken editor. This is an acceptance criterion, not a
  nice-to-have: it is the one place the plan risks shipping a desktop-only code editor to the
  majority device class.
- Any new nav slot lands in **both** `components/layout/sidebar.tsx` **and**
  `components/layout/mobile-bottom-nav.tsx` (both verified to exist). This applies to Wave 3's Review
  slot specifically — a review spine reachable only on desktop is a review spine most learners never
  see.

**45. Solution reveal = review scheduling, not XP cost.** — #582 **RENAME REQUIRED**
Viewing the reference solution is logged and reschedules that challenge into the review queue. **No
XP change.** _Evidence: the pedagogy doc's own #8 forbids loss framing, and MAS-17 makes XP variance
structurally impossible._ **Rename the issue** or the forbidden version gets rebuilt from the label.
Same ruling kills experiment E6 (Codewars-style incentive-graded XP ladder) as infeasible-as-designed.

**The experiment registry is the third component of #582 and it now has an owner — this one.** The
filed title is _"Solution-reveal soft-gate + if-then prompt + experiment registry"_; unification
carried the first two (items 45 and 35) and dropped the third, which left item 48's "put 'do not
evaluate before week 10' **on the experiment registry**" pointing at nothing. **Item 45 owns
creating it.** Minimum contents — one row per experiment, and nothing ships as an experiment without
a row:

- name · hypothesis · **primary metric** · exposure unit · start date · **earliest read date
  (start + 10 weeks, computed, not typed)** · owner · pre-registered direction
- **Seed it with the sets the sources defined and unification orphaned**: UIUX's 12 (continue-hero vs
  stats dashboard; retrieval close on/off, with the standing rule _if completion craters, cut items
  3→1 before cutting the gate_; stuck-nudge threshold; weekly-cadence uptake; cohort vs global with
  the XP-grinding guard; endowed first-tick; celebration tiering; …), personalization's **E1–E8**
  (including **E3**'s locale-gated value-relevance A/B and **E8**'s Earn-submission-within-30-days
  measure), and the pedagogy report's open questions.
- **E6 is entered as `INFEASIBLE-AS-DESIGNED` with the reason**, not omitted, so it is not
  re-proposed.

A registry row is also where item 43's "preregister direction, not doubling" physically lives.

### G. Measurement

**46. Event pass.** — #558 **P0**
`credential_minted`, challenge lifecycle, `earn_handoff_click`, onboarding funnel,
`linkedin_share_click`. Only 4 distinct events exist across ~7 call sites today and prod PostHog env
vars are all optional (MAS-14 CONFIRMED). **Confirm prod env vars.** (Same treatment for the build
server's prod vars — item 5b.)

**The AI-tutor instrumentation set (AIE §8 G-6 / P2-6), restored in full. It was dropped entirely,
and without it item 32's ladder is unfalsifiable and item 1's new counter reports to nobody.**

- **PRIMARY metric: comprehension-check first-attempt accuracy** (item 32b). Authored per challenge
  and **deliberately not in the public content repo** — that is the entire point: it is the one
  learning signal the public answer key and public tests cannot contaminate. Every other candidate
  can be gamed by reading the repo.
- **Unassisted capstone pass rate** — demoted, not deleted: read as a **cohort-level gap trend**, not
  a per-learner score.
- **Time-to-lesson-completion is explicitly DISQUALIFIED as a success metric.** Faster completion is
  the _harm signature_ in AIE-26 (GPT Base: +48% assisted practice, **−17% unassisted exam**). If it
  is charted at all, chart it as a risk indicator with that label attached. This disqualification is
  load-bearing and was the first thing lost when the set was dropped.
- Assists-per-challenge distribution (the shape, not the mean).
- **% of challenges completed with 0 AI turns.**
- Socratic-tier entry rate.
- **Attempt-gate override rate** (item 32a's G-1 signal — a content-quality metric).
- **Billed calls vs spent assists.** Item 1 creates the non-refundable `billed_assists` counter
  precisely to expose this divergence; **no item was monitoring it.** This one is also the standing
  regression test that item 1's fix stayed fixed.

**And instrument E8** (item 45's registry): Earn submission within 30 days of the handoff. Item 17
ships the Earn card and item 46 logs `earn_handoff_click`, but a _click_ is not the KPI — the launch
KPI is capstone deploys **+ Earn submissions**, and nothing currently measures the second half past
the click.

**47. Retention insight + post-mint cliff insight.** — part of #558 · **fix the P1 label to P0**
**Resolves MAS-30(b) in favour of P0.** The launch KPI is capstone deploys + Earn submissions and the
north star is weekly return of previously-active learners; without these two insights **no launch
decision can be read at all**. Per-lesson drop-off stays P1 — but instrument the rust-course
difficulty cliff from day 1 (LAU-12: boot.dev's 336,271-user data shows drop-off concentrating at
concept-difficulty spikes, not at choice points; unaudited first-party).

**48. Encode the 10–12 week evaluation rule.** — no issue
_Evidence: PED-15, PED-31, MAS-29 all insist on it; **no wave plan, no issue and no dashboard encodes
it**._ Put "do not evaluate before week 10" on the experiment registry and on the dashboards
themselves. Week-3 numbers will lie.

### H. On-chain operations (a workstream no spec owned)

**49. Restate the constraint — and retract the recreate-safety guarantee, which is no longer true.**
MAS-01 said "zero new on-chain work". With **D-E** (#387 Pinocchio merged 2026-07-21) the constraint
has _tightened_ to **zero program changes, full stop** — and it must be restated as: **on-chain
_operations_ via shipped instructions are permitted and are budgeted.** Recreate uses only
`close_course` + `create_course` through the WS-2 flow.

**RETRACTED: "all 38 enrollments byte-identical".** Two things were wrong with that sentence.

1. **It cited the wrong claim.** CAT-25's verdict is about `trackId`/`trackLevel` collision in the
   content repo. It says nothing about enrollment preservation and cannot support it.
2. **The Pinocchio program deliberately abolished the property.** Verified in-tree: `create_course`
   bumps a course **generation**, and `complete_lesson.rs:84-85`, `finalize_course.rs:87-88`,
   `issue_credential.rs:94-95` and `upgrade_credential.rs:93-94` each
   `require!(enr_off.course_gen(&ed) == course_off.generation(&cd), AcademyError::StaleEnrollment)`
   → **error 6034**. `enroll.rs:41-60` re-initialises a stale enrollment **in place, zeroing lesson
   flags**. `docs/PINOCCHIO-MIGRATION.md` §3c documents this as intended: it prevents replaying XP and
   credentials across a recreation.

**So the true post-recreate behaviour is:** the enrollment _account_ survives byte-identically, and
is functionally dead. An affected learner gets 6034 on complete / finalize / credential, and
re-enrolling **wipes their on-chain lesson progress** so they must re-complete every lesson. That is
the correct security trade — it is not a bug — but it is a cost, and no plan item budgeted it.

**Two derived tasks, both unowned until now:**

- **Client error-map drift.** `apps/web/src/lib/solana/program-errors.ts` carries 33 entries spanning
  6000–6032 and **none of 6034 / 6035 / 6036**; its header still points at the deleted Anchor crate
  path (`programs/onchain-academy/src/errors.rs`). The IDL the app actually loads
  (`superteam_academy_vnext.json`, used by `instructions.ts`, `academy-reads.ts`, `admin-signer.ts`,
  `academy-program.ts`, `event-decoder.ts`) declares **6034 but not 6035/6036** — one revision behind
  `onchain-academy/idl/onchain_academy.json` (37 errors, through 6036). `docs/PINOCCHIO-MIGRATION.md`
  §6 lists this as an unchecked migration item. **Item 50 is the exact operation that triggers 6034**,
  so an affected learner would today see an unmapped raw error. Fix the map, refresh the IDL, and
  add the three i18n strings **before** the devnet window.
- **Stale doc comment.** `apps/web/src/lib/solana/admin-signer.ts`'s `close_course` block still says,
  under the heading _"What survives (verified against the program…)"_, that learner `lesson_flags`
  and `completed_at` survive a recreate. **That was verified against the Anchor program and is now
  false.** It is the most load-bearing wrong comment in the repo, because it is what an operator reads
  immediately before running a recreate.

**50. The devnet on-chain window(s), after O-3.** — no issue · **rewritten: 7 operations, not 2**

Item 19's table is the operation list: **create C1, C2, C4, C5** (four `create_course` calls — the
"rewrites" are new course ids, not edits), **close+recreate C3** for `trackLevel` 2→3, and **retire**
`solana-fundamentals`, `rust-for-solana`, `anchor-framework`, `solana-frontend`, `defi-on-solana` by
whichever mechanism **O-9** selects. Inserting a 14-lesson Rust course between fundamentals and the
flagship collides with the flagship's level and there is no in-place edit that achieves the ordering
(CAT-22/CAT-25 CONFIRMED). Create with `creator: B7o8Nf…` (**D-C**). Cheap now, impossible after
mainnet.

**Only the C5 creation is in the Wave-1 window.** The other six operations follow their courses into
Wave 2 and should be batched into a second window, after the Wave-2 `content.lock` bump. Do not plan
one window; plan two, and size the second at six operations.

**Blast radius, measured rather than assumed** (live devnet, queried 2026-07-25 — see item 50b):
the program the app currently points at holds **zero enrollments**, so today the retirements and the
C3 recreate strand **no on-chain learner state at all**. That is a fact with a short shelf life: it
stops being true the moment learners enroll after launch. **If the Wave-2 window slips past a cohort
of real enrollments, item 49's 6034 cost becomes live and must be re-priced before, not during, the
window.**

**50b. The program instance moved and nothing in this plan had noticed.** — no issue · **verify before
anything in §3C is trusted**
`apps/web/.env.local:18` sets `NEXT_PUBLIC_PROGRAM_ID=Dsro2Cd9Mhgk8L71imh3LLPwYU5PU8hvBY5HEcPrcx5u` —
the fresh Pinocchio instance deployed 2026-07-21 (`onchain-academy/DEPLOYMENT-LOG.md`), **not** the
`7NeJaSRy…` instance every prior document reasoned about. Live `getProgramAccounts` on devnet,
run during this revision:

|                              | `Dsro2Cd9…` (live) | `7NeJaSRy…` (superseded) |
| ---------------------------- | ------------------ | ------------------------ |
| Course (253B)                | 6                  | 6                        |
| AchievementType (338B)       | 10                 | 12                       |
| **Enrollment (127B)**        | **0**              | **38**                   |
| **AchievementReceipt (49B)** | **0**              | **30**                   |

All learner on-chain state, the XP mint (`BUk5izZc…` vs the old mint) and 2 achievement types did not
migrate and **cannot** — enrollment PDAs are program-derived, so they are unreachable from the new
program id. The Supabase rows still exist; their on-chain counterparts do not. **Decide and record
what learners are told**, and whether any XP is re-minted on the new instance.

**And the launch-critical part: `issue_credential` has never run on this instance.**
`DEPLOYMENT-LOG.md` records the open follow-up verbatim — _"Credential + achievement (mpl-core) leg
not smoked on devnet"_, blocked on an unfunded umi identity in `scripts/create-mock-track.ts` (a
client-side problem, not a program one; the program's hand-rolled mpl-core CPIs are proven byte-exact
in LiteSVM against the real dumped `mpl_core.so`). **The whole of §3C — items 14, 15, 16, 42 — and the
launch KPI rest on that unexercised path.** Fund the umi identity, create a course with a collection,
run `issue_credential` end-to-end on `Dsro2Cd9…`, and record the signature **before** #561 is
capstone-gated. This is a one-afternoon task standing directly under the launch KPI.

**51. Prod migration serialization.** — #557 first
`#557` (source column) → #569 (review_items) → #572 (quest branch) → #573 (award_xp +
award_community_xp + quest branch) → #574 (league tables + RPCs). Each with a tested ROLLBACK,
migration-before-code-deploy. **#573 and #574 must not be parallelized.** Cohort exposure only through
SECURITY DEFINER RPCs mirroring `get_leaderboard` + `public_user_xp`, with `is_public=false` members
anonymized, never dropped (MAS-28). **#557 is the first migration in this chain and was missing from
the Wave-3 list in §5 — it is added there.**

**#574 requires the platform's first scheduler, and that is an architectural decision nobody has
made → O-11.** Cohort leagues need periodic cohort assignment and periodic close-out. Verified: there
is **no scheduler of any kind** — no `pg_cron` (schema.sql explicitly notes the rate-limit cleanup
"stays bounded without depending on pg_cron being enabled"), no `app/api/cron` route, no Vercel cron
config. So #574 is not "another migration"; it is either the first lazy-on-first-read design or the
first real cron the platform has ever had, with the operational surface that implies.

### I. Hygiene the plan must not keep ignoring

**52. Corrections sweep across specs, issues and copy.** — no issue
Strike, everywhere: `d=−0.88` for leaderboards/monetary salience (MAS-20 REFUTED); the interleaving
`g≈0.34 / g=−0.39` pair (MAS-22 REFUTED); "≈0.08 standardized" for mastery gating (PED-07 WEAKENED);
"peer-reviewed" and "+15–20 resume points" on the LinkedIn RCT (UIU-02 WEAKENED); "84%" TS-reachable
(CAT-02 WEAKENED); "$124/competitor, median 14" for Rust (CAT-03 WEAKENED); "0–12 submissions"
(LAU-14 WEAKENED); "3rd-largest esports audience" (UIU-26 REFUTED); "Cyfrin's 48-lesson DeFi course"
and "Anchor v2 is Pinocchio-based" (CAT-08 REFUTED); "no surveyed platform teaches from scratch"
(LAU-22 WEAKENED); "~$100 per competitor" for x402 (CAT-04, actual $63–$89); "19 tables" (now 20).
Date the $318.8B figure to Jul-2024–Jun-2025. Reword the AVM auto-reject rule.

**52b. Second sweep — factual errors in content that is LIVE RIGHT NOW.** This was a separate list in
the catalog spec and unification dropped it entirely; item 52 above is exclusively about _research
claims_ and contains none of it. It matters because these lessons stay live until the Wave-2
content.lock bump, and because **C3 is KEPT rather than rewritten**, so its inherited defects are
carried forward unless someone fixes them:

- **"65,000+ TPS"** and **"$0.00025"** — unsourced, and in the first lesson a beginner reads.
- **"C/C++"** listed as Solana program languages.
- `rent_epoch` glossed as **"when rent is next due"** — rent collection no longer exists.
- **"up to 2 SOL per airdrop"** — stale.
- `AccountInfo.lamports` used as a `u64` in a snippet that **does not compile**.
- `cluster = 'mainnet-beta'` hardcoded on **devnet** explorer links in `notifications`.
- Token-2022 **"⚠️ Limited DEX support"** — stale; support is at parity (and PR #6's own quiz
  explicitly teaches that this claim is stale, so the live course now contradicts the new one).
- **Francium / Tulip** cited as live exemplars.

Fix these in the same PRs that touch those lessons; do not wait for the rewrite that may not reach
them. C3's own two known defects — the byte-identical duplicate slot-11 deploy lesson and the false
opener — are already covered by items 22 and 29.

**52c. Third sweep — purge and do-not-reimport.** Two lists, both lost with their source docs:

- **Purge the debunked funnel statistics from every internal deck and spec** (LAU-10): **44.7%**,
  **38.4%→24.1%**, **+29.3% SSO**. All three failed provenance checks and must not be cited. They are
  the kind of number that survives in a slide long after the doc that killed it is archived.
- **Carried forward so nobody re-imports them** (from the superseded AI-economics doc): Gneezy &
  Rustichini's fine study **as commonly mis-stated**; the **"10–30% referral fraud"** vendor-FAQ
  figure; **"Perplexity's wave of fake .edu accounts"**; **Khanmigo's self-reported 22%-vs-9%**; and
  **"implicit caching has no storage cost"**. Each was evaluated and rejected once; without this list
  the next person re-derives them from the same sources.

**53. PT-BR +30% width sweep — assign an owner.** — no issue
It appears in every task's acceptance criteria and in no task's scope. **A per-task checkbox is not a
sweep.** One pass over every fixed-width control before launch (UIU-26 / MAS-27).

**54. Brazilian counsel review of _existing_ on-chain issuance.** — no issue
We already mint NonTransferable Token-2022 XP and Metaplex Core credentials into Brazilian wallets and
pay the fees. _Evidence: AIE-30 — "requires no legal analysis" is false, and this is open today,
independent of any coin._ Bright lines regardless: never sell assist packs for any currency; never
bridge an in-app allowance to an on-chain asset; any allowance stays a server-side integer, never a
balance object, never rendered as a wallet, never on-chain.

**55. Name the debt no spec owns.** — #305, #376
Squads custody (one hot key holds every role) is the **mainnet** blocker and gates it absolutely; 123
dependabot vulns; and `apps/web` still ships @coral-xyz/anchor 0.32.1 + @solana/web3.js 1.98.4, both
superseded. None of the six documents planned any of it. §7.

---

## 4. The critical path to launch

Ordered. Anything not on this list can slip without moving the launch date.

1. **Close the AI cost holes** (#590) — item 1, **plus item 3a in the same week** (diff cap +
   `MAX_CODE_CHARS` trim: neither is blocked by anything, and together they close AIE-11 rather than
   just its refund symptom). Live exposure; deterministic to trigger; no dependencies.
2. **Run the two Gemini curls** (AIE-04 reachability, AIE-05 `usageMetadata`). Minutes of work. They
   unblock item 3b, they set the sponsor number (O-1), and they lift the external cost-quote embargo.
   They are #2 because everything about the AI plan waits behind them and nothing else does.
3. **Start the build-server work** (items 5 **and 5b**) — **in parallel from day one**. Item 5 gates
   the entire C2/C3 rewrite wave. **Item 5b gates the "capstone deploys" half of the launch KPI at
   launch**, because the legacy C3 deploy lesson is `buildable` and the grader fails closed when the
   prod env vars are unset. 5b is a configuration check, not a build — do it first and find out.
4. **Build the `openEnded` attestation route** (item 6, receipt-first ruling). Without it the C5
   Earn-terminus lesson is permanently uncompletable and the launch KPI cannot be produced at all.
5. **Ship quiz feedback + 403 mapping + AI suppression** (#564). C5 is the first quiz-bearing content
   in the catalog — all 9 lessons carry one, against 0 of 76 today — and a quiz failure currently
   reads "enrollment failed". (Scope is _extend the existing silent renderer_, not build one.)
6. **Resolve C5's kit peer seam** (item 9) and fix the C5 false opener in PR #6 (item 27).
7. **Smoke the credential chain on the live program instance** (item 50b). `issue_credential` has
   never run on `Dsro2Cd9…`. Everything in step 8 assumes it works.
8. **Harden `/api/deploy/save`** (#560), then **capstone-gate the credential** (#561). In that order.
9. **Answer O-2 (capstone scope + AI coupling).** Irreversible after mainnet, upstream of on-chain
   creation, and it also settles item 33's AI-off scope. **O-3 (track ladder) is now a ratification,
   not an open design question** — PR #6 already encodes trackId 1 / trackLevel 5; either confirm it
   or revise PR #6 before merge.
10. **Fix the client error map** (item 49: 6034/6035/6036 + refreshed IDL) — **before** any on-chain
    window, because the window is what produces 6034.
11. **Devnet on-chain window #1** (item 50): create C5 only. The other six operations belong to the
    Wave-2 window. Shipped instructions only.
12. **Bump `content.lock`** to activate C5 — and land the two urgent old-catalog fixes in the same bump
    (defi pointer, solana-core skipping rust+anchor). This is the owner sign-off gate.
13. **Capture the 14-day post-mint baseline** (item 18), _then_ ship the milestone card + LinkedIn
    (#552) and the Earn card (#553).
14. **Answer O-4**, then ship anonymous-enroll + banking (#556, #567, with the #459 by-construction
    exemption), then the landing deep-link (#562). **#562 deep-links into C5 lesson 1** — the only new
    course at launch, and the one whose first lesson is authored to be read cold. Say so in the issue;
    it was previously unstated even though the deep-link is the funnel's first step.
15. **Ship analytics** (#558 events + the AI instrumentation set + retention/cliff insights, prod env
    vars confirmed) and the launch-time surface corrections together: #563 → #551, #583, #550, #549 —
    all ×3 locales with the width check.

**Also on the critical path but easy to lose because they are cheap:** item 2 (#592 `tutorNotes` —
the document calls it "the cheapest high-evidence change available" and it appeared in no wave),
item 4 (#591 spend-ledger structure, thresholds pending O-1), item 33 (AI-off-in-capstone, coupled to
step 9's O-2) and item 34 (terminal-rung copy, which must be decided **before** ×3 translation or it
gets translated wrong three times).

**True blockers, named:** the build-server toolchain **and its prod enablement** (items 5 + 5b — 5
gates all of C2/C3, 5b gates capstone deploys at launch); the unsmoked `issue_credential` leg on the
live instance (item 50b); Squads custody (#305, gates **mainnet** absolutely and is owned by nobody);
and the two un-run Gemini curls (step 2, which also gate the sponsor number).

---

## 5. Waves

**Wave 1 — launch.** Everything in §4, plus: **item 2 (#592 tutorNotes)**, **item 3b (model routing +
Flex spike-or-skip, post-curls)**, **item 4 (#591 spend-ledger structure)**, **item 33 (AI-off in the
capstone)**, **item 34 (terminal-rung copy — before translation)**, #554 verify polish (incl. the
network-from-env fix), #555 output panel, #568 Monaco a11y, **item 44c mobile handoff**, #584 endowed
progress, #586 path page, #566 intake (post-O-5, display-only if-then), #562 deep-link.
_Items 2, 3, 4, 33 and 34 were in §3 and in no wave — a scheduling hole, now closed._

**Wave 2 — immediately post-launch, content.** C3 and C2 rewrites (unblocked by item 5) → C1 (needs
the PB-1 decision, item 11, and the reference vault, item 10) → C4 (needs C3 shipped). Publish order
is always 1→5 regardless of authoring order. Each course = one staged PR; nothing is live until a
`content.lock` bump. **Then devnet on-chain window #2** — the six remaining operations from item 50
(four creates, one close+recreate, five retirements by the O-9 mechanism). **Closing the S1 gap is
this wave's real deliverable**: until C1 ships, the funnel segment lands on legacy content.

**Wave 3 — the review spine.** **#557** → #569 → #570 → #571 → #572, then #573 streak forgiveness
(L-effort, three DB writers, one coordinated PR — and it carries the **weekly-cadence track** and the
UIU-16 freeze constraints from item 40, not just forgiveness), then #574 cohort leagues (**needs the
O-11 scheduler decision first**). Migration order is item 51 and is not negotiable; **#557 was missing
from this list and is the chain's first migration.** The Review nav slot lands in **both** navs
(item 44c). **We are consciously launching without the spaced-review spine** — the pedagogy report
ranks it the single highest P0, but it is a 3-PR L-effort build with zero substrate (no table, no
route, no nav slot) while several report-P1 items are S-effort on shipped rails (MAS-12 CONFIRMED).
Launch-time retrieval is the in-lesson close. Reviews must ride inside the quest/streak loop when they
land, never as standalone opt-in (PED-18).

**Wave 4 — guidance-level differentiation, and the moat.** #577 Parsons block + ladder rungs, #578
test-out (**with the by-construction volume-gate exemption and the `xpPerLesson × lessonCount ≤ 10000`
cap — see below**), #585 linear path view (**only** bundled with test-out and a practice surface —
UIU-11; note it re-contends `course-detail-client.tsx` with item 39), #576 stuck-nudge (**N-failed-runs
only in v1**), #575 failure_message, #587 AI post-pass review, #589 surprise bonuses **+ the mastery
panel from skill tags** (UIU-30/F30/R16 — half of #589's filed bundle, dropped in unification and
restored here). This wave discharges the MAS-21 expertise-reversal deferral **and carries both
components §2.1 names as the moat** (#575, #587) — see item 44's named consequence.

_#578 constraint, restored from LX-A5:_ the batch completion is **internally invoked service-role-side
and exempt from per-user volume gates by construction, not by loosening them** (same rule as item 37),
and the granted total is capped at `xpPerLesson × lessonCount ≤ 10000`.

**Wave 5 — reach.** #580 content-i18n mechanism (**O-7**) **plus item 19c's per-course locale
sequencing and its two blocking rules** (**O-10**), #579 JS/TS rung (**O-5**), rescoped defi,
Pinocchio/performance much later. Everything content-side ships **EN-first** until #580 lands
(MAS-26 CONFIRMED — the content repo is EN-only end-to-end and four separate recommendations silently
depend on a mechanism nobody priced). **§1's language and Spanish claims are not true until this wave
ships and must not appear in launch copy.**

**Cross-cutting, no wave:** items 30 (BCB alarm), 31 (originality gate), 48 (evaluation rule), 52 /
52b / 52c (corrections, live-content facts, purge list), 53 (width sweep), 54 (counsel), 55 (debt).

---

## 6. Explicit non-goals

Each with the evidence for not doing it.

1. **No learner-facing coin, no in-app currency, no earning surfaces.** **D-A**, settled on evidence.
   The rationed resource costs cents; the mechanism makes cost, abuse and motivation all worse
   (AIE-01). Referral-minted credits are refused outright: wallets are free, instant and
   platform-fee-paid, so our identity substrate is strictly weaker than Perplexity's and the incentive
   strictly stronger (AIE-23/AIE-24 CONFIRMED). No calendar drip of any kind — unbounded by
   construction (AIE-19). No variable per-action pricing (AIE-17 CONFIRMED: every 2025 product that
   tried it apologised publicly).
2. **No XP→token bridge, no leaderboard prizes, no rank→value conversion, no monetary salience.**
   PED-10 CONFIRMED (−0.36 to −0.44 for the cell XP occupies); PED-23 WEAKENED but _against_ us —
   LayerZero's sybil rate is ~38% of the eligible pool, not 13%. Soulbound illiquidity is the moat.
3. **No Blueshift depth lane.** No Pinocchio course, no assembly, no protocol deep-dives, no ZK, no
   standalone security course (thread it through C3), no mobile. Pinocchio is real (88–95% CU
   reduction, LAU-19 CONFIRMED) and is an elite niche, not an earn-ability play; Blueshift owns mobile
   with 5 courses/18h and owns program-side depth (CAT-05, CAT-08). _Note: CAT-08's "Anchor v2 would
   obsolete a Pinocchio course" reason is **REFUTED** and struck — the decision stands on the other two._
4. **No anti-cheat, no plagiarism policing.** Eight live Coinbase Earn answer-key sites, several dated
   2026 (PED-24 CONFIRMED). Our challenges are deliberately open-book — tests and solutions live in
   public git. Integrity lives in the deployed artifact (PED-21), not in the quiz. The retrieval close
   ships its answer key to the client by design (item 12) and carries **no** integrity claim.
5. **No ML review scheduler.** Duolingo's HLR had near-chance discrimination (AUC ~0.54); the
   transferable value was having _any_ principled scheduler (PED-17 CONFIRMED, self-deflating).
6. **No delayed-feedback machinery.** g=0.03 across 51 studies (PED-09 CONFIRMED).
7. **No badges or achievements as a retention strategy.** >40% of users unaffected; the steered ~20%
   collapse right after earning (PED-16). Keep achievements, make each certify a competence event, and
   never build "collect all 50" (UIU-14 WEAKENED on both sides).
8. **No notification bandit optimization.** Duolingo's ceiling was +0.5% DAU at hundreds of millions of
   sends (PED-33). A small rotating template pool, triggered by streak state and due reviews, volume flat.
9. **No recommender, no adaptive sequencing.** LAU-02 CONFIRMED: ALMAP found no completion effect in
   any of 23 courses; PNAS-2020 ML targeting scored 13.38% vs 13.08% random at ~250k learners. Defer
   until the catalog exceeds 20–30 courses.
10. **No "learn to earn" positioning and no "learn to code via Rust" marketing.** Reward-liquid
    platforms got farmer-captured; no survivor teaches programming from scratch through Rust
    (LAU-22 WEAKENED but the prohibition survives). Describe Academy as skill→work.
11. **No personality-keyed brand.** Buildspace: $10M raised, ~125k participants, dead Aug 2024
    (LAU-23 CONFIRMED). Academy stays institutionally owned.
12. **No prompt-cache engineering.** Worth exactly $0 — 33 prefixes, max ~1,386 tokens, none reaching
    any documented cache floor; padding raises the bill below an 87.2% hit rate (AIE-14 CONFIRMED).
13. **No XP-variance mechanic of any kind.** `xpPerLesson` is per-course; rungs may carry visible
    difficulty labels with identical XP. Experiment E6 is infeasible-as-designed (MAS-17).
    **And explicitly: no Codewars-style permanent solution forfeit.** Item 45 replaces it with review
    scheduling; the prohibition is stated here because the substance and the _ban_ are different
    things, and only the substance survived unification.
14. **No screen atomization of lessons.** Nobody ever tested one-question-per-screen; the tested unit
    was a 6-item block per ~5-minute segment (UIU-12).
15. **No interleaving of lesson prose.** Only inside review sets (MAS-22's numbers REFUTED, ruling kept).
16. **No LLM auto-explanation of test failures.** Expert-handwritten beat GPT-4 (UIU-04 CONFIRMED).
17. **No new on-chain program changes.** D-E; Pinocchio #387 merged. On-chain _operations_ via shipped
    instructions are in scope and budgeted (item 49).
18. **No unscoped `x402*` packages, no `@solana/client`, no `@solana/react-hooks`, no `gill`, and never
    install Solana Pay** — teach it as a decision (CAT-11, CAT-12, CAT-13 all CONFIRMED).
19. **No synchronous pair-programming infrastructure.** _(Restored — PED-33 was traced to §6 but this
    entry was missing.)_ Fragile evidence, later nulls, publication bias. Forum "debug together"
    threads at most.
20. **No "all social mechanics at once", and no cohort chat in v1.** _(Also restored from PED-33 /
    UIUX not-build #9.)_ **But note the tension this creates**, because it is the reason the entry
    matters: the pedagogy report's SDT finding is that relatedness/community is the _highest-leverage_
    motivational surface, and item 34's terminal AI rung points at the forum. So the cheap social
    surfaces are **in scope and wanted** — contextual _"Discuss this lesson"_ deep-links and
    _"N learners completed this challenge"_ (UIU-F36) — while the expensive ones are out. The non-goal
    is simultaneity and chat, not community.
21. **No AI during a retrieval close.** The AI pane is suppressed while a quiz block is unanswered
    (item 12). UIU-05 CONFIRMED as mechanism: an AI-assisted retrieval attempt measures the model.
22. **No large-surface brand gradient.** _(Design constant F37, dropped in unification.)_ The
    purple→teal gradient is **punctuation only** — accents, rules, small marks — never a large fill,
    never a page or card background. Tabular numerals (item 41) survived the merge; this one did not,
    and the two are the same class of rule.

---

## 7. Risks

**R1 — Two un-run curls gate the AI plan and the sponsor number.** (AIE-04, AIE-05 **UNVERIFIABLE**.)
Model presence on a pricing page is not reachability for _this_ key, and a documented 404-on-a-whole-family
already happened. `thinkingBudget: 0` is set on a model our own comment calls a thinking model, and
`usageMetadata` has never been inspected: 10k MAU is **~$280 or ~$750/mo** depending on the answer.
**The embargo on quoting any cost figure externally stands until both curls run** — and D-B implicitly
requires quoting a number to set the sponsor commitment, so the embargo and O-1 are the same
dependency. Mitigation: both curls are minutes of work; they are item 3's precondition.

**R2 — Version decay is faster than the authoring cycle.** Kit 8.0.0-canary publishes daily; Agave is
already at 4.1.2 with 4.2.0-rc.0 cut; `@solana/react` pins kit at exactly 7.0.0 so a bump moves in
lockstep; `@solana/subscriptions` is pre-1.0 and pins kit ^6.4.0; `@solana-program/token` is six minors
past the spec's pin; x402 has two live protocol versions on the wire. (CAT-13, CAT-12, CAT-11, CAT-14,
CAT-18 — all CONFIRMED.) A five-course catalog authored against a moving stack decays while it is
written. Mitigation: item 8 (version-stamp + CI check) is load-bearing, and O-6 should pick a target
that does not guarantee a second bump.

**R3 — Single-key custody.** #305: one hot key holds every role. This gates mainnet **absolutely** and
**no specification in the corpus owns it.** It is an operations task, not an engineering one, and it
will not resolve itself while everyone works on content.

**R4 — Unowned security and dependency debt.** 123 dependabot vulns (#376); `apps/web` still on
@coral-xyz/anchor 0.32.1 and @solana/web3.js 1.98.4, both superseded. Neither appears in any of the six
documents' plans. The app teaching current tooling runs on superseded tooling.

**R5 — The plan's success threshold may be set too high by an uncaveated effect size.** #584 endowed
progress will be judged against an implied ~15pp when the honest prior is direction-only (UIU-06
CONFIRMED direction, magnitude from one 2006 field study). A correctly-working feature reads as a
failure and gets ripped out. Mitigation: item 43 preregisters direction.

**R6 — Completion reality.** Free async completion is 3.13% (PED-20 CONFIRMED); a selective, mentored,
free cohort with a deploy-an-original-program capstone graduates 13% (LAU-20 CONFIRMED). Self-paced
lands under that. Plan for roughly **5% artifact production** (PED-25). This is why the KPI is deploys
and Earn submissions, not signups — but it also means the absolute numbers at launch will look small
and must not trigger a strategy reversal inside the novelty trough (PED-15: judge at week 10+).

**R7 — Launch segmentation is knowingly non-compliant with the strongest design constraint we have.**
Expertise reversal is d=+0.505 / −0.428 and demands differentiation by _guidance level_; we ship
topic-routing (MAS-21, PED-05 CONFIRMED). Mitigations are skip-friendly anonymous access, per-segment
guidance modality copy and no forced linearity. Full compliance is Wave 4. If S2 learners bounce off
C3 at a visibly higher rate than S1 bounces off C1, this is the cause.

**R8 — The Earn terminus depends on an ephemeral market.** Superteam Brasil's dev-bounty dominance is a
today-fact, not a structural one (LAU-15 CONFIRMED, self-caveated). Competition is a deadline function
(CAT-06 CONFIRMED — watched a listing go ≤12 → 53 during validation). Mitigation: category links only,
medians over completed listings, never a single-day count.

**R9 — Craft constants carried as facts.** The +30% PT-BR expansion budget and Brazil-native copy rule
have no primary source (UIU-26 WEAKENED); Duolingo's entire numeric corpus is company-internal and
unaudited (UIU-01/13/15/16/22 UNVERIFIED); boot.dev's drop-off data is unaudited first-party (LAU-12).
None of these should ever enter a forecast. They are adopted as _shapes_ only.

**R10 — The plan's model of on-chain state was two weeks stale, and the credential chain rests on an
unexercised path.** The app points at `Dsro2Cd9…` (deployed 2026-07-21), not the `7NeJaSRy…` instance
every source document reasoned about. Live devnet: the new instance holds 6 courses and **0
enrollments / 0 achievement receipts**; the old holds 38 and 30, permanently unreachable. And
`DEPLOYMENT-LOG.md` records that the **mpl-core credential leg has never been smoked on devnet** on
the new instance. §3C, the launch KPI and item 42's celebration tier all assume `issue_credential`
works there. Mitigation: item 50b, ahead of #561. **The general lesson is the risk**: three separate
specs reasoned confidently about on-chain state none of them re-queried. Re-query before any on-chain
claim, every time.

**R11 — Recreate is no longer non-destructive, and the client cannot even name the error.** The
Pinocchio generation check (item 49) means a recreated course invalidates every existing enrollment
with `StaleEnrollment` (6034), and re-enrolling zeroes lesson flags. Today the blast radius is zero
because the live instance has no enrollments — **which is exactly why this is a risk rather than an
incident**: it becomes real the moment the first post-launch cohort enrolls, and the Wave-2 window is
scheduled after them. Compounding it, `program-errors.ts` maps 6000–6032 only, so an affected learner
sees a raw unmapped error. Mitigations: item 49 (error map + IDL refresh + fix the stale
`admin-signer.ts` comment) and item 50's two-window split.

**R12 — Launch ships without the thing the plan calls the moat, and without the segment it calls the
funnel.** §2.1 names authored failure messages and AI post-pass review as the differentiators; both
are Wave 4 (item 44b). §1 names S1 as "the funnel and the volume"; C1 is Wave 2, so S1 lands on legacy
content at launch. Neither is an error — both are consequences of the build-server pole and of C1's
own prerequisites — but together they mean **the launch measures a product materially weaker than the
thesis**, which interacts badly with R6's small absolute numbers and PED-15's week-4 trough. Do not
read Wave-1 numbers as a verdict on the Wave-2 product.

**What would falsify this plan.** (a) The `usageMetadata` curl shows thinking tokens are billed and the
sponsor will not fund ~$750/mo at 10k MAU → the wall stops being purely pedagogical and the tier
numbers get a fiscal constraint back. (b) **Superseded by the item 5 rewrite — this is now a known
fact, not a falsifier.** Platform-tools, not Agave, _is_ the pin; the falsifiable residue is narrower:
**baking platform-tools v1.54 into a non-root, read-only-rootfs image proves harder than expected**,
in which case C2/C3 slip and C5-standalone becomes the launch, at the cost of a weakened through-line
for early cohorts (CAT-30's own hedge). A second, sharper falsifier now sits beside it: **item 5b
reveals the build server was never enabled in prod and cannot be safely enabled before launch** → the
"capstone deploys" half of the KPI is unavailable in Wave 1 and the KPI must be restated as Earn
submissions only, explicitly, rather than reported as a miss. (c) Capstone
deploys in the first 10 weeks land at zero rather than single digits → the credential cliff is upstream
of the Earn handoff and the whole terminus thesis needs rework, not the handoff copy. (d) O-2 resolves
to "original program" **and** AI stays off in the capstone → the launch KPI sits behind an unassisted
cliff with a measured single-digit ceiling and should be expected to produce near-nothing.

---

## 8. Open decisions for the owner

**O-1 — The AI sponsor commitment figure.**
Recommendation: run both Gemini curls first (minutes), then set a monthly number; derive the spend-ledger
thresholds from it, sized above the ~$73/day pathological load and never learner-facing. _Blocks:_ item 4
(#591) threshold values, and lifting the external cost-quote embargo. _Does not block:_ items 1, 2, 3 or
the learner-facing tier shape.

**O-2 — Capstone scope: follow-along/reference deploy, or an original program?**
Recommendation: **follow-along for launch.** AI-off in the capstone is then defensible because a worked
reference exists, and the credential cliff stays survivable. If you pick "original program", the
AI-in-capstone rule must relax from off to Socratic-only — otherwise the launch KPI sits behind an
unassisted cliff against a 13% mentored ceiling. _Blocks:_ #561 scope, item 33, the capstone constant.
_Note:_ the two documents each decided half of this independently; it is one decision.

**O-3 — The credential track ladder (`trackId` / `trackLevel`): RATIFY, do not deliberate.**
Recommendation: freeze **trackId 1 / trackLevel 1→5** as the single sequential path. Today's catalog is
five tracks, one of which already has two levels, and inserting the Rust course collides with the
flagship at level 2.
**Status correction: the recommended answer is already committed in content this plan expects to
merge.** `courses/stablecoin-agentic-payments/course.yaml` at PR #6 head (`f8d6867`) declares
`trackId: 1` and `trackLevel: 5` — verified. So this is not an open design question; it is a
ratification with a deadline. **Either confirm the ladder before PR #6 merges, or revise PR #6** (in
which case item 27's "fix in PR #6 before merge" list is incomplete and must gain this line).
_Blocks:_ item 50, all on-chain creation. **Irreversible after mainnet** — `trackId`, `trackLevel`
and `creator` have no update param.

**O-4 — Signup at first XP mint: bank XP server-side pre-wallet, or a two-step ask?**
Recommendation: **bank and mint on link.** `/api/lessons/complete` requires `profiles.wallet_address`,
so a learner who takes the Google branch signs in and still cannot complete a lesson. A two-step ask is
acceptable **only** if Google is removed from the claim-moment copy — offering a branch that dead-ends
is worse than not offering it. _Blocks:_ #556, #567, and therefore #562.

**O-5 — Segment 3 (beginners learning to code): build the JS/TS rung, or refer out?**
Recommendation: **refer out at launch, say so on the catalog page.** Framed honestly: the catalog's own
argument is that ~4 in 5 of paid Earn dev work is TS-reachable, which makes C1 the front door only for
people who _already_ write TS — so referring out narrows the funnel to existing JS/TS devs, deliberately.
Whichever way it goes, the intake fork and the routing constant must be specified against the answer.
**Do not ship a three-way fork whose third branch routes nowhere.** _Blocks:_ #566, #586, #579.

**O-6 — Build-server toolchain, REFRAMED (the original question was a false binary on the wrong axis).**
The old question was "Agave 3.1.10 or 4.1.2?". Verified: **neither reaches rustc 1.89 by itself**,
because the MSRV is a platform-tools property. The real question the owner must answer is narrower and
cheaper: **do we bake platform-tools v1.54 into the build-server image (required — the runtime is
non-root with a read-only rootfs, so on-demand fetch will not work), and which Agave CLI ships
alongside it?** Recommendation: **bake v1.54; ship the current stable Agave (4.1.2 today), because the
CLI choice is now reversible and cheap while the toolchain bake is not.** Also bump the two host-Rust
pins (Dockerfile:2 and :34) and the template's `anchor-lang` (programs/Cargo.toml:16) in the same
change. _Blocks:_ item 5, and therefore all of C2 and C3. _Does not block:_ item 5b, which is a
configuration check and should run first.

**O-7 — Content-i18n mechanism: design now, or after the fast-follow courses?**
Recommendation: **design now, ship EN-first.** The content repo is EN-only end-to-end and four separate
recommendations (PT-BR original content, localized `failure_message`, localized quiz feedback, the PT-BR
moat) silently depend on a mechanism nobody priced. Given Blueshift's full pt-BR parity, "PT-BR later"
means arriving second in the one language we claimed as the gap. _Blocks:_ #580, and the PT-BR half of
every content wave.

**O-8 — Credential privacy coupling.** `is_public=false` silently 404s a shared credential link, and the
page is client-rendered so crawlers see an empty shell. Recommendation: make credential visibility
independent of profile visibility, and server-render the verification + OG card. _Blocks:_ #554, and the
effectiveness of #552.

---

_O-9 … O-13 were open in the source documents and were neither answered nor carried forward during
unification. They are restored here rather than left to be rediscovered at execution time._

**O-9 — How is a retired course actually hidden?** Verified: **no course-level draft flag exists**
(`course.ts` has none; `courses.json` carries none), `draft: true` lives only on _paths_, and
`/courses` renders `getAllCourses()` regardless of path membership — **so path-level draft hides
nothing on the catalog page.** The options are (a) delete the course directory from the content repo
(clean, but destroys the content history and any in-progress learner's lesson bodies), (b) add a
course-level draft flag to the content schema (an unscoped platform change, ~S but real), or
(c) on-chain deactivation via `update_course` (affects enrollments and is the least reversible).
Recommendation: **(b)**, because it is the only option that is reversible, greppable, and lint-able,
and because five courses need it at once. _Blocks:_ item 19, item 20(b)'s migration answer, item 50's
retirement operations, and the Wave-2 content.lock bump.

**O-10 — Is Spanish promoted to a launch language for C2/C4/C5, or does PT-BR stay first everywhere?**
A positioning call, not a research question. The case for ES-first on C2/C4/C5: Blueshift ships zero
Spanish pages **and** no Rust course, making Rust × Spanish the least-contested cell on the board
(CAT-05 CONFIRMED). The case against: Brazil is the home market and PT-BR is where the audience
already is. Recommendation: **ES-first on C2 only**, as a cheap test of the empty-lane thesis, with
PT-BR first everywhere else. _Blocks:_ item 19c, #580 scope, and — because §1 currently claims a
language advantage the plan does not deliver — the honesty of the positioning copy.

**O-11 — The platform's first scheduler: lazy-on-first-read, or a real cron?** #574 cohort leagues
need periodic assignment and close-out. Verified: **no scheduler exists** — no `pg_cron`, no
`api/cron` route, no Vercel cron. Recommendation: **lazy-on-first-read** for v1 (compute the cohort
window on access, memoize), because a cron is a new operational surface with alerting, idempotency and
failure-mode obligations that a launch-adjacent team should not take on for one feature. _Blocks:_
#574, and any future digest/notification delivery (item 35).

**O-12 — Does C2 ship compile-only, or is verified grading a C2 blocker?** Rust grading is
compile-only and the "non-editable `mod verify` harness" mitigation **does not work** in the current
architecture (item 24 — the learner's submission _is_ the whole compiled source). Options: (a) build
server-side harness injection in `toBuildFiles` and treat it as a C2 launch blocker, or (b) ship C2
compile-only with softened copy and file the injection as a fast-follow. Recommendation: **(b)** —
C2 is Wave 2, the copy fix is free, and injection is a platform change that should not gate content.
_Blocks:_ C2 authoring copy, and the honesty of any "unit-tested" claim.

**O-13 — Is the `openEnded` AI reply mandatory or best-effort?** Item 6 rules **best-effort** for
launch (the seal is returned unconditionally; the reply may fail without blocking), because gating the
Earn-terminus lesson on Gemini uptime contradicts AIE-21 and adds an unmodelled mandatory billed call.
Flag it here because it is a _product_ call the owner may want differently: making the reply mandatory
buys a better reflection experience at the cost of putting the launch KPI behind a third-party
dependency. _Blocks:_ nothing if the recommendation stands; #591 sizing and item 6's route shape if it
is reversed.

---

## 9. Traceability appendix

### 9.1 Claim → verdict → plan item

Verdict column: **C** = independently CONFIRMED, **W** = WEAKENED (boundary stated in §2/§3),
**R** = REFUTED, **U** = UNVERIFIABLE, **·** = carried from the ledger without an independent pass
(ledger confidence in brackets).

**Pedagogy (PED)**

| Claim                                                          | Verdict        | Supports                                                                                                                                                                                                                                                                             |
| -------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PED-01 retrieval g≈0.50                                        | C              | 12, 21                                                                                                                                                                                                                                                                               |
| PED-02 transfer d=0.40, ~0 without moderators                  | C              | 12, 23                                                                                                                                                                                                                                                                               |
| **PED-03 Rowland 2014 softens the retrieval-success boundary** | C              | **12 — was missing from this table entirely; the rule it carries is "item format and difficulty calibration are second-order and must not block #564", now stated in item 12**                                                                                                       |
| PED-04 spacing d=0.54, expansion disfavoured                   | C (boundary)   | Wave 3 (#569–#572)                                                                                                                                                                                                                                                                   |
| PED-05 expertise reversal ±0.5                                 | C              | 19, 23, 33, 36; R7                                                                                                                                                                                                                                                                   |
| PED-06 ladder is a design inference                            | · (caveated)   | 23, Wave 4 (#577)                                                                                                                                                                                                                                                                    |
| PED-07 mastery gating / PBL                                    | W              | 14, 19                                                                                                                                                                                                                                                                               |
| PED-09 feedback timing g=0.03                                  | C              | non-goal 6                                                                                                                                                                                                                                                                           |
| PED-10 overjustification −0.36…−0.44                           | C              | 41, non-goal 2                                                                                                                                                                                                                                                                       |
| PED-11 informational vs controlling                            | · (caveated)   | 41                                                                                                                                                                                                                                                                                   |
| PED-12 streaks + forgiveness                                   | W              | 40, #573                                                                                                                                                                                                                                                                             |
| PED-14 leaderboards                                            | C (labelling)  | 40, non-goal 2                                                                                                                                                                                                                                                                       |
| PED-15 novelty trough                                          | · (verified)   | 48; R6                                                                                                                                                                                                                                                                               |
| PED-16 badges + post-credential cliff                          | · (caveated)   | 18, non-goal 7                                                                                                                                                                                                                                                                       |
| PED-17 no ML scheduler                                         | · (verified)   | non-goal 5                                                                                                                                                                                                                                                                           |
| PED-18 SRS adherence                                           | · (verified)   | Wave 3                                                                                                                                                                                                                                                                               |
| PED-19 problem-first                                           | · (verified)   | **CORRECTED: pointed at "Wave 4", which contains no challenge-first pilot. Its only real home is 32a's attempt-gate nudge (attempt before exposition, with a free override). No separate challenge-first pilot is planned — recorded as a deliberate non-build, not a silent drop.** |
| PED-20 MOOC 3.13% / 46%                                        | C              | §1, R6                                                                                                                                                                                                                                                                               |
| PED-21 credential = artifact                                   | · (caveated)   | 14, non-goal 4                                                                                                                                                                                                                                                                       |
| PED-22 feedback is the scarce good                             | · (verified)   | 34, #587                                                                                                                                                                                                                                                                             |
| PED-23 liquid rewards farmed                                   | W (against us) | non-goal 2                                                                                                                                                                                                                                                                           |
| PED-24 quiz answer keys                                        | C              | 12, non-goal 4                                                                                                                                                                                                                                                                       |
| PED-25 survivor pattern ~5% ship                               | · (caveated)   | 17, R6                                                                                                                                                                                                                                                                               |
| PED-27 uniform one-shot delivery                               | · (verified)   | 12, 21, 36                                                                                                                                                                                                                                                                           |
| PED-28 daily streaks, no forgiveness                           | · (verified)   | 35, **40 — incl. the restored weekly-cadence track, which is PED-28's actual implication and had survived only as a clause in 35**                                                                                                                                                   |
| PED-29 leaderboard farmable                                    | · (verified)   | 40                                                                                                                                                                                                                                                                                   |
| PED-30 credential attests completion; build-server hedge       | · (verified)   | 14; **the hedge became item 5**                                                                                                                                                                                                                                                      |
| PED-31 north star + windows                                    | · (verified)   | 46, 47, 48                                                                                                                                                                                                                                                                           |
| PED-32 capstone-gated credential                               | · (verified)   | 14                                                                                                                                                                                                                                                                                   |
| PED-33 NOT-build list                                          | · (verified)   | §6 — **now complete: non-goals 19 (no synchronous pair-programming) and 20 (no all-social-at-once / no cohort chat) were missing when this row was written**                                                                                                                         |

**UI/UX (UIU)**

| Claim                                | Verdict                      | Supports                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| UIU-01 CURR 5×                       | U (company-internal)         | 39 — direction only                                                                                                                                                                                                                                                                                                                                          |
| UIU-02 LinkedIn RCT                  | W                            | 16                                                                                                                                                                                                                                                                                                                                                           |
| UIU-03 Parsons efficiency            | C                            | Wave 4 (#577)                                                                                                                                                                                                                                                                                                                                                |
| UIU-04 authored failure messages     | C                            | 44 (#575), non-goal 16                                                                                                                                                                                                                                                                                                                                       |
| UIU-05 GenAI metacognition gap       | C (mechanism)                | 32, 33                                                                                                                                                                                                                                                                                                                                                       |
| UIU-06 endowed progress              | C (direction)                | 43; R5                                                                                                                                                                                                                                                                                                                                                       |
| UIU-07 choice overload               | C                            | 36                                                                                                                                                                                                                                                                                                                                                           |
| UIU-08 GitHub streak removal         | C                            | 35, 40                                                                                                                                                                                                                                                                                                                                                       |
| UIU-09 absolute leaderboards         | C                            | 40, #574                                                                                                                                                                                                                                                                                                                                                     |
| UIU-10 forced linearity              | · (caveated)                 | #585                                                                                                                                                                                                                                                                                                                                                         |
| UIU-11 linearity's cost              | · (unverified, load-bearing) | #585 gating on #578                                                                                                                                                                                                                                                                                                                                          |
| UIU-12 interpolated retrieval        | C (as weak)                  | 12; non-goal 14                                                                                                                                                                                                                                                                                                                                              |
| UIU-13 delayed signup                | · (caveated)                 | 37                                                                                                                                                                                                                                                                                                                                                           |
| UIU-14 badges both ways              | · (caveated)                 | non-goal 7                                                                                                                                                                                                                                                                                                                                                   |
| UIU-15 leagues shape                 | · (caveated)                 | #574                                                                                                                                                                                                                                                                                                                                                         |
| UIU-16 freezes earned-not-bought     | · (caveated)                 | #573                                                                                                                                                                                                                                                                                                                                                         |
| UIU-17 test-panel conventions        | · (unverified)               | 44 (#555)                                                                                                                                                                                                                                                                                                                                                    |
| UIU-18 stuck-state                   | · (caveated)                 | 44 (#576)                                                                                                                                                                                                                                                                                                                                                    |
| UIU-19 solution reveal soft          | · (unverified)               | 45                                                                                                                                                                                                                                                                                                                                                           |
| UIU-20 Monaco a11y                   | C + platform boundary        | 44 (#568)                                                                                                                                                                                                                                                                                                                                                    |
| UIU-21 course length                 | · (caveated)                 | **CORRECTED: pointed at item 19, which carries none of it. Now → 23 (authoring rule 7: length follows material, no course authored to a lesson count; keep everything auto-graded; front-load module-1 quality) and its anti-recommendation → 17/36: honest duration estimates belong on detail and path pages and must NOT be hidden for conversion fear.** |
| UIU-22 Daily Refresh / Practice Hub  | U                            | Wave 3 (#571) — shape only                                                                                                                                                                                                                                                                                                                                   |
| UIU-23 XP as progress                | · (caveated)                 | 41                                                                                                                                                                                                                                                                                                                                                           |
| UIU-24 celebration tiers             | · (unverified)               | 42                                                                                                                                                                                                                                                                                                                                                           |
| UIU-25 capstone = automated checks   | · (unverified)               | 13, 14                                                                                                                                                                                                                                                                                                                                                       |
| UIU-26 PT-BR + esports               | W / **R** on esports         | 53; 52                                                                                                                                                                                                                                                                                                                                                       |
| UIU-27 dashboard is a stats page     | · (verified)                 | 39                                                                                                                                                                                                                                                                                                                                                           |
| UIU-28 four contradicting surfaces   | · (verified)                 | 40, 42, 43                                                                                                                                                                                                                                                                                                                                                   |
| **UIU-29 no public verify URL**      | **R**                        | **superseded by MAS-04 → item 15 is polish, not a build**                                                                                                                                                                                                                                                                                                    |
| UIU-30 four missing prerequisites    | · (verified)                 | 12, 36, Wave 3, Wave 4 (**incl. the mastery panel, restored into #589's scope**)                                                                                                                                                                                                                                                                             |
| UIU-F36 contextual social surfaces   | · (design)                   | **§6 non-goal 20 — in scope as the cheap half: "Discuss this lesson" deep-links + "N learners completed this challenge"**                                                                                                                                                                                                                                    |
| UIU-F37 gradient is punctuation only | · (design)                   | **§6 non-goal 22 — was dropped while tabular numerals (41) survived**                                                                                                                                                                                                                                                                                        |

**Personalization / market (LAU)**

| Claim                                    | Verdict                                 | Supports                                                                                                                                                                                                       |
| ---------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LAU-01 ITS d range                       | · (caveated)                            | 12, 44 — never quote 0.66 alone                                                                                                                                                                                |
| LAU-02 no catalog personalization effect | · (verified)                            | 36, non-goal 9                                                                                                                                                                                                 |
| LAU-03 planning prompts                  | · (verified)                            | 35 — week-1 bump only                                                                                                                                                                                          |
| LAU-04 value-relevance                   | W (moderator is per-course, not locale) | 35                                                                                                                                                                                                             |
| LAU-05 implementation intentions d=0.65  | · (caveated)                            | 35 — **promoted into launch**                                                                                                                                                                                  |
| LAU-06 choice 2–4 options                | · (caveated)                            | 35, 36                                                                                                                                                                                                         |
| LAU-07 expertise reversal asymmetry      | · (caveated)                            | 36                                                                                                                                                                                                             |
| LAU-08 self-placement r=.29              | · (verified)                            | 35 — no "rate your skill"                                                                                                                                                                                      |
| LAU-09 delayed signup ~20%               | · (self-contradictory)                  | 37 — direction only                                                                                                                                                                                            |
| LAU-10 tap screens vs form fields        | · (caveated)                            | 35; **52c — LAU-10 also carries the instruction to PURGE 44.7% / 38.4%→24.1% / +29.3% SSO from all internal decks and specs, which item 52 did not cover**                                                     |
| LAU-11 optional test-out                 | · (caveated)                            | #578                                                                                                                                                                                                           |
| LAU-12 drop-off at difficulty spikes     | · (unaudited first-party)               | 47                                                                                                                                                                                                             |
| LAU-13 Earn scale                        | C                                       | §1, 17                                                                                                                                                                                                         |
| LAU-14 dev bounty scarcity               | W (submission half refuted)             | 17, 19                                                                                                                                                                                                         |
| LAU-15 Superteam Brasil live             | C                                       | §1, 17; R8                                                                                                                                                                                                     |
| LAU-16 salaried market                   | C (headline)                            | 19 — 87%-remote is unsourced                                                                                                                                                                                   |
| LAU-17 stablecoin Brazil                 | C (date it)                             | 19 (C5), 52                                                                                                                                                                                                    |
| LAU-18 AI-agents demand                  | · → **superseded by CAT-03**            | 26 (drop #588)                                                                                                                                                                                                 |
| LAU-19 Pinocchio niche                   | C                                       | non-goal 3                                                                                                                                                                                                     |
| LAU-20 Ackee 13% ceiling                 | C                                       | §1, R6, O-2                                                                                                                                                                                                    |
| LAU-21 commitment > catalog              | · (caveated)                            | R6                                                                                                                                                                                                             |
| LAU-22 no from-scratch-via-Rust          | W                                       | O-5, non-goal 10                                                                                                                                                                                               |
| LAU-23 comp norms; Updraft = 33          | C                                       | §1, non-goal 11, 52                                                                                                                                                                                            |
| LAU-24 PT-BR content stale               | · → **partly superseded by CAT-05**     | O-7                                                                                                                                                                                                            |
| LAU-25 intake screens                    | · (design)                              | 35 — daily-goal picker **dropped**                                                                                                                                                                             |
| LAU-26 static routing / signup moment    | · (design)                              | 36, 37, O-4                                                                                                                                                                                                    |
| LAU-27 no diagnostic                     | · (design)                              | #578; E6 **dropped**                                                                                                                                                                                           |
| LAU-28 unverified platform assumptions   | · (unverified)                          | 35 — **now an explicit precondition in the item body (every intake question names its consumer in the PR, or it is deleted from the screen). Verified example of why: no notification channel exists at all.** |
| LAU-29 flagship ranking                  | · → **superseded by CAT-25/26**         | 19                                                                                                                                                                                                             |
| LAU-30 launch gaps                       | · → **partly superseded**               | 19, 26, 27, O-5                                                                                                                                                                                                |

**Master spec (MAS)**

| Claim                                                                                                   | Verdict                                                                                                       | Supports                                                                                                            |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| MAS-01 zero on-chain work                                                                               | U (internal constraint)                                                                                       | **restated by item 49; the enrollment-preservation claim attached to it is RETRACTED (Pinocchio generation check)** |
| **NEW — program instance moved to `Dsro2Cd9…`; 0 enrollments, 0 receipts; mpl-core leg unsmoked**       | **C (live devnet + DEPLOYMENT-LOG)**                                                                          | **50b; R10; §3C's entire premise**                                                                                  |
| **NEW — recreate invalidates enrollments via `StaleEnrollment` (6034); client error map stops at 6032** | **C (in-tree program + `program-errors.ts`)**                                                                 | **49, 50; R11**                                                                                                     |
| MAS-02 anonymous already works                                                                          | C                                                                                                             | 37, 38                                                                                                              |
| MAS-03 quiz pipeline built, 0/76 used, gate is fail-closed                                              | C — **re-verified in `api/lessons/complete/route.ts`; WINS over CAT-23's "quizzes do not gate XP" sub-claim** | 12                                                                                                                  |
| MAS-13b cohort leagues need the first scheduler                                                         | C (**no `pg_cron`, no cron route, no Vercel cron**)                                                           | **O-11, #574**                                                                                                      |
| MAS-04 verify page exists                                                                               | C                                                                                                             | 15 — **supersedes UIU-29**                                                                                          |
| MAS-05 deploy/save unverified                                                                           | C                                                                                                             | 13                                                                                                                  |
| MAS-06 chained handler                                                                                  | C                                                                                                             | 14                                                                                                                  |
| MAS-07 no Zero-to-Deployed path                                                                         | C                                                                                                             | 20                                                                                                                  |
| MAS-08 empty post-mint moment                                                                           | C                                                                                                             | 16, 17                                                                                                              |
| MAS-09 confetti inverted                                                                                | C                                                                                                             | 42                                                                                                                  |
| MAS-10 1,094-line dashboard + CTA bug                                                                   | C                                                                                                             | 39                                                                                                                  |
| MAS-11 three streak writers                                                                             | · (verified)                                                                                                  | #573, 40                                                                                                            |
| MAS-12 review spine has zero substrate                                                                  | · (verified)                                                                                                  | Wave 3                                                                                                              |
| MAS-13 global leaderboard, no scheduler                                                                 | C (20 tables, not 19)                                                                                         | 40, #574, 52                                                                                                        |
| MAS-14 4 events, optional env vars                                                                      | C                                                                                                             | 46                                                                                                                  |
| MAS-15 slots permanent, activation required                                                             | · (verified)                                                                                                  | 22                                                                                                                  |
| MAS-16 creator/track immutable                                                                          | · → creator half settled by **D-C**                                                                           | 28, O-3                                                                                                             |
| MAS-17 xpPerLesson fixed                                                                                | **W** — per-course, mutable via `new_xp_per_lesson`                                                           | 19, 45, non-goal 13                                                                                                 |
| MAS-18 endowed progress CONFIRMED                                                                       | · → **caveat restored from UIU-06**                                                                           | 43; R5                                                                                                              |
| MAS-19 LinkedIn is the only employment RCT                                                              | · → **W via UIU-02**                                                                                          | 16                                                                                                                  |
| **MAS-20 d=−0.88 for monetary salience**                                                                | **R (attribution)**                                                                                           | **struck in 41, 52; decision survives on PED-10**                                                                   |
| MAS-21 segmentation deferral                                                                            | · (verified)                                                                                                  | 36; R7                                                                                                              |
| **MAS-22 interleaving g=0.34 / −0.39**                                                                  | **R (numbers)**                                                                                               | **struck in 21, 52; ruling kept**                                                                                   |
| MAS-23 weak items ship as experiments                                                                   | · (caveated)                                                                                                  | 35, 44                                                                                                              |
| MAS-24 Earn copy bounds                                                                                 | · (caveated)                                                                                                  | 17                                                                                                                  |
| MAS-25 competitive lane                                                                                 | · → **corrected by CAT-05**                                                                                   | §1                                                                                                                  |
| MAS-26 content repo EN-only                                                                             | U (repo-internal)                                                                                             | O-7, Wave 5                                                                                                         |
| MAS-27 ×3 locales + 30%                                                                                 | · (design)                                                                                                    | 53                                                                                                                  |
| MAS-28 migration serialization                                                                          | · (design)                                                                                                    | 51                                                                                                                  |
| MAS-29 KPI = deploys + submissions                                                                      | · (design)                                                                                                    | §1, 47                                                                                                              |
| MAS-30 two self-contradictions                                                                          | · (self-flagged)                                                                                              | **resolved: 39 (B1 first), 47 (F2 = P0)**                                                                           |

**Catalog (CAT)**

| Claim                                          | Verdict                                                                                                                                                                                                                                                                                                | Supports                                                                                                                                                                                     |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CAT-01 vault is paid work                      | C                                                                                                                                                                                                                                                                                                      | 19                                                                                                                                                                                           |
| CAT-02 ~84% TS-reachable                       | W (not reproducible)                                                                                                                                                                                                                                                                                   | 19; 52 strikes the number                                                                                                                                                                    |
| CAT-03 Rust margin / AI-agents worst           | W / C(relative)                                                                                                                                                                                                                                                                                        | 19, 26; 52 strikes $124/14                                                                                                                                                                   |
| CAT-04 x402 first-mover                        | C (+ hype guard)                                                                                                                                                                                                                                                                                       | 19 (C5), 30, 52                                                                                                                                                                              |
| CAT-05 Blueshift map                           | C                                                                                                                                                                                                                                                                                                      | §1                                                                                                                                                                                           |
| CAT-06 competition = deadline                  | C                                                                                                                                                                                                                                                                                                      | 17; R8                                                                                                                                                                                       |
| CAT-07 BCB-561                                 | C                                                                                                                                                                                                                                                                                                      | 19 (C5 L1), 30                                                                                                                                                                               |
| CAT-08 seven not-built                         | W (two reasons refuted)                                                                                                                                                                                                                                                                                | §6-3, 52                                                                                                                                                                                     |
| CAT-09 Anchor 1.0 breaking                     | C (AVM rule needs rewording)                                                                                                                                                                                                                                                                           | 19, 52                                                                                                                                                                                       |
| CAT-10 resource-limits trio                    | C                                                                                                                                                                                                                                                                                                      | 19 (C4 L8)                                                                                                                                                                                   |
| CAT-11 x402 v1/v2 split                        | C                                                                                                                                                                                                                                                                                                      | 19 (C5 L6), non-goal 18                                                                                                                                                                      |
| CAT-12 payments pins                           | **W — new blocker**                                                                                                                                                                                                                                                                                    | **9**                                                                                                                                                                                        |
| CAT-13 ecosystem contradictions                | C (+ Kit 8 canary, web3.js v3)                                                                                                                                                                                                                                                                         | 8; R2                                                                                                                                                                                        |
| CAT-14 four unverified details                 | **3 of 4 discharged**                                                                                                                                                                                                                                                                                  | 8                                                                                                                                                                                            |
| CAT-15 licensing                               | C                                                                                                                                                                                                                                                                                                      | 31                                                                                                                                                                                           |
| CAT-16 QuickJS isolate                         | C (mechanism refined)                                                                                                                                                                                                                                                                                  | 11                                                                                                                                                                                           |
| CAT-17 capability enum gaps                    | · (verified)                                                                                                                                                                                                                                                                                           | 6                                                                                                                                                                                            |
| CAT-18 build-server pin                        | C on the MSRV; **the pin was misidentified as Agave — it is platform-tools v1.54, and the repo already uses `--tools-version v1.54` everywhere except `build.rs`**                                                                                                                                     | 5, 5b; **O-6 reframed**                                                                                                                                                                      |
| CAT-19 Rust grading compile-only               | C                                                                                                                                                                                                                                                                                                      | 24 — **and its stated `mod verify` mitigation is INFEASIBLE as an authoring rule (`toBuildFiles` sends only learner-supplied files); needs server-side injection → O-12**                    |
| CAT-20 schema gaps                             | **W** — `skills` **is** format-validated                                                                                                                                                                                                                                                               | 7, 25                                                                                                                                                                                        |
| CAT-21 JS mock                                 | C                                                                                                                                                                                                                                                                                                      | 11 (cleanup)                                                                                                                                                                                 |
| CAT-22 instructor pipeline                     | C → **collapses under D-C**                                                                                                                                                                                                                                                                            | 28                                                                                                                                                                                           |
| CAT-23 quiz block unused                       | C **on "unused"; its sub-claim "quizzes do not gate XP" is REFUTED in code** — the grader loop in `api/lessons/complete` is fail-closed for every `graded` block type, quiz included. **MAS-03 wins; ruling stated in item 12 so the appendix no longer hands out two verdicts with equal authority.** | 12, 21                                                                                                                                                                                       |
| CAT-24 ~80 slugs                               | **superseded by D-D (42)**                                                                                                                                                                                                                                                                             | 7 — **the lint gate is NOT dropped, and the interleaving-pair vocabulary requirement + broad-tag exclusion are RESTORED (load-bearing precisely because the 80-slug migration was dropped)** |
| CAT-25 track collision                         | C                                                                                                                                                                                                                                                                                                      | 50, O-3 — **NOTE: CAT-25 says nothing about enrollment preservation and must not be cited for it (item 49)**                                                                                 |
| CAT-26 course disposition                      | · (design)                                                                                                                                                                                                                                                                                             | 19 (**incl. the corrected new-course-vs-edit table and the five retirements**), 19b (**salvage + delete-do-not-port ledger**), 20, 50                                                        |
| **CAT-26b reuse / delete-do-not-port ledger**  | · (design)                                                                                                                                                                                                                                                                                             | **19b — was reduced to one clause and is now restored in full**                                                                                                                              |
| **CAT-31 localization sequencing**             | · (design)                                                                                                                                                                                                                                                                                             | **19c; O-10; §1's softened language claim**                                                                                                                                                  |
| **CAT-32 live-content factual errors**         | · (verified against live bundle)                                                                                                                                                                                                                                                                       | **52b**                                                                                                                                                                                      |
| CAT-27 C3 slot arithmetic                      | · (self-flagged)                                                                                                                                                                                                                                                                                       | 22                                                                                                                                                                                           |
| CAT-28 xpPerLesson per course                  | · (design)                                                                                                                                                                                                                                                                                             | 19                                                                                                                                                                                           |
| CAT-29 authoring rules / segment 3 out         | · (design)                                                                                                                                                                                                                                                                                             | 23, O-5, 10                                                                                                                                                                                  |
| CAT-30 authoring order; "C5 has zero blockers" | · → **the zero-blockers half is refuted by CAT-12**                                                                                                                                                                                                                                                    | 9, 29                                                                                                                                                                                        |

**AI economics (AIE)**

| Claim                                        | Verdict                                   | Supports                                                                                                                                                                                                                   |
| -------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AIE-01 no coin                               | **D-A settled**                           | §6-1                                                                                                                                                                                                                       |
| AIE-02 ladder as the only meter              | **D-B settled (shape)**                   | 32                                                                                                                                                                                                                         |
| AIE-03 stale model pin                       | C (+ 2.5-flash-lite is cheaper)           | 3                                                                                                                                                                                                                          |
| AIE-04 reachability                          | **U**                                     | 3; R1                                                                                                                                                                                                                      |
| AIE-05 thinkingBudget                        | **U**                                     | 3; R1, O-1                                                                                                                                                                                                                 |
| AIE-06 / AIE-07 / AIE-09 cost model          | · (caveated, now un-anchored by D-B)      | 4 (ledger sizing only)                                                                                                                                                                                                     |
| AIE-08 99 authored hints                     | C                                         | 32 (Tier 0)                                                                                                                                                                                                                |
| AIE-10 post-generation refunds               | C (+ site 411 correction)                 | 1                                                                                                                                                                                                                          |
| AIE-11 deterministic truncation              | C                                         | 1, 3                                                                                                                                                                                                                       |
| AIE-12 fail-open limiter                     | C                                         | 1                                                                                                                                                                                                                          |
| AIE-13 no spend cap                          | C                                         | 4                                                                                                                                                                                                                          |
| AIE-14 caching worth $0                      | C                                         | non-goal 12                                                                                                                                                                                                                |
| AIE-15 diff-propose                          | · (medium)                                | 3                                                                                                                                                                                                                          |
| AIE-16 Flex 50%, no semantics                | C                                         | **3b — CORRECTED: item 3 never mentioned Flex; the spike-or-skip-with-a-p95-exit-criterion is now written into 3b, which is its only home**                                                                                |
| AIE-17 fixed unit pricing                    | C                                         | §6-1                                                                                                                                                                                                                       |
| AIE-18 2/8/20 ladder                         | shape ✓ / **numbers un-anchored**         | 32                                                                                                                                                                                                                         |
| AIE-19 no drip                               | · (design)                                | §6-1                                                                                                                                                                                                                       |
| AIE-20 resetAssists unguarded                | C                                         | 32                                                                                                                                                                                                                         |
| AIE-21 degrade never block; Sao_Paulo        | · (design)                                | 4, 32, 34                                                                                                                                                                                                                  |
| AIE-22 ledger thresholds                     | **placeholder**                           | 4; O-1                                                                                                                                                                                                                     |
| AIE-23 / AIE-24 no earning surfaces          | C                                         | §6-1                                                                                                                                                                                                                       |
| AIE-25 tutorNotes never populated            | C                                         | 2                                                                                                                                                                                                                          |
| AIE-26 Bastani                               | C ("largely mitigated", not "eliminated") | 2, 32                                                                                                                                                                                                                      |
| AIE-27 productive failure                    | W (grade level _is_ a moderator)          | **32a — the attempt-gate NUDGE with a free one-tap override + override-rate logging. Previously stated in §2.1 and in no plan item.**                                                                                      |
| AIE-28 help abuse vs avoidance               | · (verified)                              | **32b — comprehension check on PATCH APPLY, wrong answers explained never charged. Previously stated in §2.1 and in no plan item.**                                                                                        |
| AIE-29 AI off in capstone                    | · (caveated)                              | 33; O-2                                                                                                                                                                                                                    |
| **AIE-29b instrumentation set (G-6 / P2-6)** | · (design)                                | **46 — comprehension-check first-attempt accuracy as PRIMARY; time-to-completion explicitly DISQUALIFIED; billed-calls-vs-spent-assists monitored (item 1 builds the counter). The whole set was dropped in unification.** |
| AIE-30 regulatory posture                    | · (caveated)                              | 54                                                                                                                                                                                                                         |

### 9.2 Orphans

**Actions that had no claim — dropped or re-anchored:**

- 2/8/20 AI tier boundaries — derived from a cost model D-B declared not-the-constraint; **re-anchored to
  the pedagogical question** (item 32).
- AIE-22's $2/$5/$6/$15/$250/$600 thresholds — **placeholders**, now downstream of O-1.
- Design A's daily-goal picker — **dropped** (item 35).
- LX-D2's authoring across the 52-lesson old spine — **dropped**, ~36 lessons deleted on merge (item 21).
- LX-D4 stablecoin module — **deleted**, superseded by PR #6 (item 27).
- LX-D7 / #588 AI-agents course — **dropped** (item 26).
- PB-7 as a C3 blocker — **dropped** under D-C (item 28).
- CAT-24's ~80-slug migration — **dropped** under D-D; **the lint gate survives** (item 7).
- R3's "one per screen-state" — **struck** (item 12, non-goal 14).
- Solution reveal priced in forfeited XP — **impossible and forbidden**; replaced by review scheduling
  (item 45).
- Experiment E6 (incentive-graded XP) — **infeasible as designed** (non-goal 13).

**Claims that had no action — now assigned:**

- 10–12 week evaluation windows (PED-15/31, MAS-29): nothing encoded it → **item 48**.
- 14-day post-mint baseline before the intervention (PED-16) → **item 18** as an ordering constraint.
- CAT-14's four unverified details → three discharged during validation, folded into **item 8**.
- BCB-561's 2026-10-01 clock (CAT-07) → **item 30**.
- Brazilian counsel review of existing on-chain issuance (AIE-30) → **item 54**.
- The external cost-quote embargo (AIE-05) → **R1 + O-1**, explicitly linked.
- PT-BR +30% width sweep (UIU-26/MAS-27) → **item 53**, with an owner.
- Licensing originality gate (CAT-15) → **item 31**.
- PED-30's own build-server hedge — raised by pedagogy, assumed away by the master spec, verified only by
  the catalog → **item 5**, now #2 on the critical path.
- Dependabot #376, Squads custody #305, app-side anchor/web3.js debt → **item 55 + R3/R4**.

**Assigned during the review pass** (each had been dropped without a stated reason):

- CAT-26's reuse / **delete-do-not-port** ledger → **item 19b**.
- The catalog's localization sequencing → **item 19c** + **O-10**.
- LX-F4's experiment registry → **item 45**, using #582's own filed scope (the issue title already
  carries it; only the spec had lost it). UIUX's 12 experiments, personalization's E1–E8 and the
  pedagogy open questions are its seed rows.
- The AI instrumentation set → **item 46**.
- AIE-27's attempt-gate nudge and AIE-28's comprehension-check patch gate → **items 32a / 32b**.
- Mobile surface scope + the both-navs rule → **item 44c**.
- Live-content factual errors → **item 52b**; LAU-10's purge list and the AI doc's
  do-not-reimport list → **item 52c**.
- Weekly-cadence streak track + UIU-16 freeze constraints → **item 40 / #573**.
- The #459 by-construction exemption → **items 37 and Wave 4 (#578)**.
- Build-server prod enablement → **item 5b**. Client error-map drift → **item 49**.
- Program-instance cutover + the unsmoked mpl-core credential leg → **item 50b** + **R10**.

**Dropped DELIBERATELY, and named so the drop is explicit rather than silent** (the sources' own rule):

- **The PT-BR long-form YouTube cut** (master D-10). Not in any wave. Recorded here because the source
  spec kept it specifically so the drop would be visible; unification made it invisible.
- **True mid-lesson resume** (master D-3) — needs a `last_visited` column and a scroll-settle write.
  Ruled out for launch in item 39, revisitable on item 47's drop-off data.
- **A separate challenge-first / attempt-before-exposition pilot** (PED-19). The mechanism ships inside
  item 32a's nudge; a standalone pilot does not.
- **`signed-transaction` and `source-file` capabilities** (CAT-17) — only `published-artifact` ships
  (item 6).

**Still orphaned, deliberately:** npm trusted-publishing setup steps (CAT-14, item 4 of 4) — verify at
authoring, no gate. This is the only accepted unowned verification in the plan.

### 9.3 Filed issues this plan supersedes or contradicts

| Issue                                                      | Disposition                                                                                                                                                                                                                                                                                     |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **#588** AI-agents course                                  | **CLOSE** — refuted by CAT-03 (worst money-per-competitor on the board); already fenced into C5 by PR #6                                                                                                                                                                                        |
| **#559** Launch content PR                                 | **RESCOPE** — contradicts the catalog: 3 of its 4 spine courses are retired or rewritten. Becomes the content.lock gate + two decoupled urgent fixes (item 20)                                                                                                                                  |
| **#565** Author retrieval closes across the flagship spine | **RESCOPE** — ~36 of 52 target lessons are deleted; redirect to surviving C3 IDs + new courses (item 21)                                                                                                                                                                                        |
| **#581** Instructor + track ladder                         | **HALF SUPERSEDED** — the instructor half is documentation drift under D-C; the track-ladder half becomes O-3                                                                                                                                                                                   |
| **#582** Solution-reveal soft-gate                         | **RENAME** — the title implies an XP cost, which is forbidden and impossible; it is review scheduling (item 45). Also: the if-then prompt inside it is **promoted to launch** (item 35)                                                                                                         |
| **#558** Analytics                                         | **RELABEL** — the retention + post-mint-cliff insights are **P0**, not P1 (item 47, resolving MAS-30(b))                                                                                                                                                                                        |
| **#564** Quiz feedback                                     | **PROMOTE to P0** — C5 is the first quiz-bearing content and the 403 mismap ships a wrong error (item 12)                                                                                                                                                                                       |
| **#551** Continue card                                     | **REORDER behind #563** — resolving MAS-30(a). The CTA bug fix may ship immediately and separately (item 39)                                                                                                                                                                                    |
| **#579** JS/TS entry rung                                  | **BLOCKED on O-5** — the catalog declares its audience out of scope                                                                                                                                                                                                                             |
| **#568** Monaco a11y                                       | **SCOPE NOTE** — the chord is platform-split; a hardcoded Ctrl+M leaves macOS users trapped                                                                                                                                                                                                     |
| **#590** AI cost holes                                     | **SCOPE NOTE** — refund site 411 is also post-generation; narrow the outer catch too. Route hint/Socratic against gemini-2.5-flash-lite, not 3.1-flash-lite                                                                                                                                     |
| **#591** Spend ledger                                      | **THRESHOLDS BLOCKED on O-1**; the structure ships regardless                                                                                                                                                                                                                                   |
| **#582** (second entry)                                    | **SCOPE NOTE** — the issue's third component, the **experiment registry**, is real work and is now owned by item 45; unification had carried only the first two components                                                                                                                      |
| **#589** Surprise bonuses                                  | **SCOPE NOTE** — the filed bundle is "surprise bonuses **+ mastery panel**"; the mastery panel half was dropped in unification and is restored (Wave 4)                                                                                                                                         |
| **#576** Stuck-nudge                                       | **SCOPE NOTE** — v1 is **N-failed-runs only**. The issue title already says so; item 44's "≥1.5× median" arm cannot fire at launch because no medians exist                                                                                                                                     |
| **#573** Streak forgiveness                                | **SCOPE NOTE** — carries the **weekly-cadence track** and the UIU-16 freeze constraints (cap 2, auto-applied, retroactive, never a modal), not just forgiveness                                                                                                                                 |
| **#574** Cohort leagues                                    | **BLOCKED on O-11** — needs the platform's first scheduler; none exists                                                                                                                                                                                                                         |
| **#578** Test-out                                          | **SCOPE NOTE** — service-role batch completion exempt from volume gates **by construction**, plus `xpPerLesson × lessonCount ≤ 10000`                                                                                                                                                           |
| **#585** Course-detail linear path                         | **SCOPE NOTE** — targets the same file and CTA region as item 39's quick fix; if pulled forward it absorbs that fix rather than racing it                                                                                                                                                       |
| **#554** Verify polish                                     | **SCOPE NOTE** — add "network from env"; `certificates/[id]/page.tsx:76` hardcodes `network: "devnet"`                                                                                                                                                                                          |
| **courses-academy PR #6**                                  | **SCOPE NOTE** — already encodes `trackId: 1` / `trackLevel: 5` (**ratify via O-3 or revise before merge**) and already carries the **42-slug `skills.yaml`**, so item 7's lint gate follows #6 rather than preceding it. Item 27's "fix before merge" list must also gain the false-opener fix |

**New work with no filed issue** (file these): items 5, **5b**, 6, 7, 8, 9, 10, 11, 18, **19b**,
**19c**, 22, 24's injection (per O-12), 30, 31, **32a**, **32b**, **44c**, 48, 49's error-map fix, 50,
**50b**, 52, **52b**, **52c**, 53, 54.

**File first, in this order:** **5b** (a configuration check that may already be silently breaking the
launch KPI), **50b** (`issue_credential` has never run on the live instance), **6** (`openEnded` is
launch-breaking), then 49's error-map fix (must precede any on-chain window).

### 9.4 Review findings rejected, and why

Two adversarial reviewers attacked this document. The great majority of their findings survived
re-verification and are applied above. These did not survive as stated. Each was re-checked directly
against the repository or live devnet rather than adjudicated on argument.

**1. "38 existing devnet enrollments are stranded by the retirements." — REJECTED as stated;
the operations-count half was accepted.**
The enrollment figure is real but attached to the wrong program. Live `getProgramAccounts`
(2026-07-25): the instance the app points at, `Dsro2Cd9…`, holds **0** Enrollment accounts and **0**
AchievementReceipts; the 38 enrollments and 30 receipts are on the superseded `7NeJaSRy…`. So the
retirements and the C3 recreate strand **no** on-chain learner state today. The reviewer reasoned from
the pre-Pinocchio world. The underlying concern was nonetheless real and larger than the finding:
those 38 were orphaned by the _program cutover_, which no section mentioned — now item 50b and R10.
The finding's other half — that item 50 budgeted 2 of ~7 on-chain operations — was correct and item 50
is rewritten.

**2. "Item 50's C3 recreate blocks every enrolled C3 learner with 6034." — MECHANISM ACCEPTED,
BLAST RADIUS REJECTED.**
The generation check is exactly as described and is now item 49 and R11. But with zero enrollments on
the live instance there is presently **no affected learner**. Stating it as a current harm would have
mis-prioritised it; stating it as a dormant one that activates with the first post-launch cohort is
what the plan now does, and it is why item 50 splits into two windows.

**3. "No item creates or owns an experiment registry." — HALF REJECTED.**
True of the spec, false of the backlog: **#582's filed title is "Solution-reveal soft-gate + if-then
prompt + experiment registry"**, so the work was scoped and filed; unification dropped the third
component while keeping the first two. The correct fix was to re-attach it to item 45, not to invent a
new workstream. Recorded because the distinction matters for estimating: this is a restoration, not
new scope.

**4. "§2.3 picks a side on the LayerZero 803,093 figure." — ACCEPTED AS A PROCESS POINT, REJECTED AS A
CONSEQUENCE.**
The provenance objection is now restored to the §2.3 row and the figure carries a do-not-quote-without-
a-primary-link caveat. But the reviewer's implication — that non-goal 2 was over-claimed — does not
follow: the no-bridge / soulbound decision rests on the _qualitative_ farming of liquid airdrops
(uncontested on every reading) plus PED-10 and PED-24. The decision needed no magnitude and does not
move. The sentence "more justified than the source doc said" is the part that was struck.

**5. "CAT-23 and MAS-03 contradict and the document never rules." — CONTRADICTION ACCEPTED,
CAT-23's SIDE REJECTED ON CODE.**
Resolved by reading `apps/web/src/app/api/lessons/complete/route.ts` rather than by weighing the two
documents: the grader loop denies completion for any `graded` block whose grader is missing or fails,
`quiz` is a graded type, and the denial precedes every on-chain XP path. **The gate is real and
fail-closed.** CAT-23's "quizzes do not gate XP" is refuted; it survives only as "the block is
unused". Ruling now stated in item 12 and in both appendix rows.

**6. "Item 12 is mis-sized because a QuizBlock renderer already exists." — ACCEPTED; noting here only
that the reviewer's _reason_ was incomplete.**
The renderer exists (`blocks/index.ts` registers `quiz: QuizBlock` in a `satisfies Record<BlockType,
Renderer>` map; `quiz-block.tsx` is 70 lines). But the corrected scope is not merely "add a check
action": the AI-suppression requirement (UIU-05) had **also** vanished from the body despite being in
the item's own title, and that is app-shell work on the lesson client, not renderer work. Both
corrections are applied; sizing #564 on the reviewer's version alone would have under-counted again.

**7. "O-6 is a false binary." — ACCEPTED, with one correction to the reviewer's own account.**
Verified and applied in full: platform-tools v1.54 is the pin, `build.rs:225` omits `--tools-version`,
the Dockerfile pins host Rust 1.85 twice, the template still declares anchor-lang 0.32.1, and the repo
already uses v1.54 in four other places. The reviewer characterised it as "4 pins plus baking"; the
bake is the _hard_ part and the pins are trivial, because the runtime container is non-root with a
read-only rootfs — so "any Agave CLI fetches it on demand" is true on a laptop and false in
production. Item 5 states it that way round, since scheduling the work on the reviewer's ordering
would have front-loaded the easy half.

**8. Not a rejection, but recorded: "the AVM rule needs rewording" and similar copy-level items were
left as written.** They were already correct in the source and no reviewer contested them; they appear
here only so a future reader does not mistake silence for oversight.
