# Superteam Academy — Learning UI/UX Research Report & Redesign Roadmap

**Date:** 2026-07-25
**Scope:** Cited evidence review (4 pillars, adversarially verified) + concrete UI roadmap mapped onto the current product surface.
**Evidence-tier labels used throughout:** `[peer-reviewed]` · `[company A/B]` (self-reported, unaudited) · `[company metric]` (self-reported, no experiment) · `[teardown]` · `[practitioner consensus]`
**Verdict handling:** One claim was REFUTED in adversarial review (the arXiv 2512.22407 "scaffold-by-experience-level" claim — the paper is an n=9 non-peer-reviewed perception study that contains none of the claimed findings) and is **excluded** from this report. All WEAKENED caveats are carried inline where the claim is used.

> **Correction note (2026-07-26, per #645 — do not rewrite the body below; this note governs).** Two claims in this report were later bounded and must not be quoted in those forms from live guidance:
>
> - **LinkedIn credential sharing → employment** (the F-item citing Stanford/Coursera arXiv 2405.00247, "+9% certificate-related jobs, +15-20 resume-score points"): **the study is NOT peer-reviewed** (arXiv preprint / Stanford GSB working paper); the new-employment figure is **+8%, not +9%**; the outcomes are **LinkedIn profile updates, not administrative employment records**; and the **"+15-20 resume-score points" is unsourced** (UIU-02 WEAKENED). Use only the surviving, sourced figures — +17pp sharing, +6% new employment, +12% bottom-employability tercile — and never present the claim as peer-reviewed or cite a resume-score delta.
> - **"3rd-largest esports audience"** (used below in the PT-BR localization line): **REFUTED** (UIU-26). Brazil is **3rd in _pro players_**, not audience; the audience is **34M+ fans**. Competitive mechanics remain culturally safe on the 34M figure — never cite the esports _rank_.
>
> Authoritative dispositions: UNIFIED-LAUNCH-SPEC §1 evidence table (UIU-02, UIU-26) + §3 item 52.

---

## 1. Executive Summary

The single strongest signal across all four pillars is not a feature — it is a re-weighting of the product's attention. Duolingo's growth model found current-user retention had **~5x the DAU impact** of any acquisition or resurrection lever `[company metric — Lenny's/Mazal]`. For Academy, that makes the **returning-learner surface** (dashboard resume affordance + daily review entry) the highest-leverage screen in the product, and it is currently occupied by XP stats. That is the first thing to change.

The second theme: **the adopted learning-science direction (Leitner review, retrieval closes, challenge ladder) only works if the UI gives it a permanent home and a default path.** Spaced review gets used when it has a top-level nav slot auto-fed by mistakes (Duolingo Practice Hub pattern), not when it hides inside quests. The linear-path pattern is a _defensible way to enforce spacing_ — adversarial review confirmed the causal "linearity improves learning" claim has zero independent measurement and produced real power-user backlash — so Academy must ship linearity **with the escape hatches Duolingo omitted**: per-module test-out and a standalone practice hub. That combination serves all three segments (beginners get one next action; experienced web3 devs get test-out + open catalog).

Third: the **challenge screen is where the credibility budget is spent**, and the evidence here is unusually strong. Parsons problems are a legitimate full rung (~35% less time, equal learning and retention, `[peer-reviewed RCT]`, confirmed). Expert-handwritten per-test failure messages beat both stock and GPT-4-generated messages (`[peer-reviewed]`, confirmed) — so failure explanations belong in the content schema, not in the AI assistant. Unrestricted AI help widens the novice metacognition gap (`[peer-reviewed]`), so the assistant stays guardrailed and the retrieval close stays AI-free.

Fourth: **gamification survives adversarial review only in its restrained forms.** Confirmed evidence _against_: raw daily streak counters (GitHub natural experiment, ICSE 2021), absolute-rank leaderboards (need-frustration + coasting), and badge/leaderboard bundles in classrooms. What survives: endowed/goal-gradient progress (confirmed, two independent labs, with a "the head start needs a stated reason" boundary), capped auto-applied streak forgiveness, small weekly cohorts (shape is academically preferred; magnitudes are unverified company claims), and XP framed as competence progress, never a balance. Celebration is rarity-tiered; confetti is reserved for credential-mint-class events.

One finding stands alone as directly outcome-linked: an 800k-learner RCT showed **one-click prefilled LinkedIn credential sharing causally raised employment (+6% overall, +12% for the weakest-employability tercile)** — precisely Academy's Brazil-first career-switcher audience. The credential NFT page with a wallet-free public verify URL and an Add-to-LinkedIn button is the cheapest high-confidence win in this entire report.

**Priority order (detail in §4):** P0 = dashboard resume hero, Review nav home for the Leitner queue, retrieval-close component, challenge-screen refinements (test ordering, authored failure messages, stuck-nudge), credential share/verify page. P1 = linear path + test-out, segment onboarding + anonymous trial, cohort leaderboard, streak forgiveness, celebration recalibration. P2 = notification system, mastery panel, mobile review-only scope, path page.

---

## 2. Verified Findings by Pillar

### 2.1 Lesson-flow UX

**F1. Linear path as spacing enforcement — WEAKENED, use with escape hatches.** `[teardown + company rationale]`
Duolingo replaced its branching tree with a forced-linear path because tree users massed practice ("gold before moving on") and didn't know the "correct" way; the path interleaves new + review lessons [https://blog.duolingo.com/new-duolingo-home-screen-design/]. _Caveat (adversarial):_ no first-party A/B on learning outcomes was ever published; the widely-cited "completion improved" metric is unsourced folklore; the rollout drew mass documented backlash from experienced users [https://duoplanet.com/duolingo-new-learning-path-review/, https://news.ycombinator.com/item?id=33673522]. What survives: lab evidence for spacing/interleaving over massing is robust, and the tree demonstrably invited massing. **Treat as "one defensible way to enforce spacing," never "forced linearity improves learning."**

**F2. Forced linearity's documented cost — load-bearing counter-evidence.** `[teardown, uncontested]`
Experienced learners lost targeted practice, hit untaught content, and reported quitting despite long streaks; practice became harder to find [https://duoplanet.com/duolingo-new-learning-path-review/]. This matters _more_ for Academy than for Duolingo: segment 2 (web3 devs deepening) is exactly the population that revolted. → Ship linearity **with** per-module test-out and a standalone practice hub.

**F3. Interleaved retrieval — WEAKENED but directionally intact.** `[peer-reviewed + failed high-power replication]`
Szpunar et al. 2013 (n=16/group) found interpolated testing cut mind-wandering ~half and raised final-segment scores [https://pmc.ncbi.nlm.nih.gov/articles/PMC3631699/]. A ~5x-larger 2022 replication (N=195) found only a marginal attention effect (d=-0.29, BF ~1) and **no retention benefit** [https://pmc.ncbi.nlm.nih.gov/articles/PMC8964911/]. Nobody tested "one question per screen"; the tested unit was a 6-item block per ~5-min segment. **Cite as: small, fragile attention benefit; interpolated retrieval still beats passive restudy; do not promise 2x effects.** The adopted retrieval close is justified on the broader testing-effect literature, not on Szpunar's magnitudes.

**F4. Delayed signup / soft wall — WEAKENED, direction uncontradicted.** `[company A/B, ~2016, unreplicated independently]`
Duolingo reported +20% DAU from letting users complete lessons before signup, +8.2% from soft/hard-wall optimization; the winning micro-change was replacing "Discard my progress" with a subtle "Later" [https://review.firstround.com/the-tenets-of-a-b-testing-from-duolingos-master-growth-hacker/]. No independent quantitative replication exists; the pattern is otherwise practitioner lore [https://ui-patterns.com/patterns/LazyRegistration]. **Direction is safe to adopt; the magnitudes are not portable.**

**F5. Onboarding screen order — WEAKENED to hypothesis.** `[teardown, metric-free]`
The motivation-question → goal-picker → placement-fork → lesson-1 sequence is a metric-free teardown of one company's flow [https://goodux.appcues.com/blog/duolingo-user-onboarding]. Only the lesson-before-signup element has (company-reported) backing. **Frame the full sequence as a hypothesis to A/B, not evidence-backed design.** The mapping to Academy's three segments is design judgment layered on top.

**F6. Goal-gradient + endowed progress — CONFIRMED.** `[peer-reviewed, two independent labs]`
Effort accelerates near a goal (café loyalty field data); pre-stamped progress speeds completion at identical remaining effort [Kivetz, Urminsky & Zheng 2006, https://home.uchicago.edu/ourminsky/Goal-Gradient_Illusionary_Goal_Progress.pdf]; independently corroborated by Nunes & Drèze 2006 (34% vs 19% completion) [https://academic.oup.com/jcr/article-abstract/32/4/504/1787425]. _Boundaries:_ the endowment needs a plausible stated reason (arbitrary free stamps can backfire); all field evidence is consumer loyalty — transfer to learning UIs is plausible extrapolation; expect a post-reward slump after each goal (matters for chained progress bars). _Magnitude caveat (from IA-pillar verdict):_ the ~2x/15pp lift rests on one pre-replication-crisis field study; a 2024 large-N analogue found ~1.6pp — expect direction, not doubling.

**F7. Badges — WEAKENED on both sides.** `[company A/B + peer-reviewed counter-evidence + meta-analyses]`
Duolingo reported +2.4% DAU from achievements v1 [First Round, above]. Hanus & Fox 2015 found a badges+leaderboard classroom bundle depressed intrinsic motivation and exam scores — but it is a two-section quasi-experiment that cannot isolate badges [https://www.sciencedirect.com/science/article/abs/pii/S0360131514002000]. Meta-analytic reality: badge effects are **small, heterogeneous, and design-dependent**; reward/status-only configurations are the weakest [Sailer & Homner 2020; 2023 ETR&D meta-analysis, https://link.springer.com/article/10.1007/s11423-023-10337-7]. The competence-not-participation prescription is SDT-consistent inference, not a tested A/B. → Keep achievements; make each one certify a competence event.

**F8. Cohort leagues — WEAKENED magnitudes, preferred shape.** `[company metric + peer-reviewed shape support]`
Duolingo leagues (~30 users, weekly reset, engagement-matched) reportedly raised learning time 17% and tripled highly-engaged learners [https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth]. All numbers are internal and unaudited, and the peer-reviewed record on Duolingo leagues specifically documents metric-gaming (XP grinding via gibberish) [https://arxiv.org/abs/2203.16175]. But the academically recommended leaderboard shape — relative/nearby rank, matched cohorts, regular resets — is structurally what leagues are [https://www.emerald.com/intr/article/33/7/1/178330/]. → Adopt the shape; don't promise the magnitudes; design against XP-grinding from day one.

**F9. Streak forgiveness — WEAKENED on the "earned not bought" pillar.** `[company A/B + teardown]`
Weekend Amulet +2.1% D7 [First Round]; freezes auto-apply silently, capped at 2 equipped, marked retroactively as calendar snowflakes [https://blog.duolingo.com/how-duolingo-streak-builds-habit/, https://duolingo.deconstructoroffun.com/mechanics/streaks]. _Caveat:_ Duolingo's actual model is earn-AND-buy (gems); no experiment isolates "earned vs bought." Since Academy has no monetization, earned-only is our design choice, not an evidenced requirement. Capped + auto-applied + retroactively-visible is the practice-validated core.

**F10. Retention beats acquisition ~5x; the resume surface is the product's most valuable screen.** `[company metric — growth-model sensitivity analysis]`
CURR had 5x the DAU impact of the next-best metric; raising it 21% cut best-user churn >40% [https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth]. Company-internal, but the modeling logic is transparent and the implication is cheap to act on: the dashboard hero is a Continue card, full stop.

**F11. Celebration calibration.** `[practitioner consensus — no A/B either way]`
Brilliant/ustwo deliberately restrain game elements because STEM work needs deep focus; encouragement-when-struggling is paired with small correct-answer celebrations [https://ustwo.com/work/brilliant/]. Duolingo tiers its biggest animations to rare events; a milestone-animation redesign alone was reported at +1.7% D7 `[company A/B]` [https://blog.duolingo.com/how-duolingo-streak-builds-habit/].

**F12. Notifications (future).** `[peer-reviewed production A/B + company A/B]`
Template rotation with recency penalty beat greedy selection (+0.5% DAU, +2% new-user retention, KDD 2020) [https://www.kdd.org/kdd2020/accepted-papers/view/a-sleeping-recovering-bandit-algorithm-for-optimizing-recurring-notificatio.html]; ~23.5h timing and streak-saver messages are company-reported wins [First Round]. Relevant only when Academy builds email/push.

### 2.2 Code-editor UX

**F13. Parsons problems — CONFIRMED, strongest finding in the pillar.** `[peer-reviewed RCT, n=135, independently conceptually replicated]`
2D Parsons with paired distractors: 473s vs 679s (fix) vs 714s (write), p<.001, **no difference** in posttest, 1-week retention, or cognitive load [Ericson et al., Koli Calling 2017, http://faculty.chas.uni.edu/~schafer/cohort23/Methods/ReadingsBackups/mod2/ParsonsProblems.pdf]; efficiency conceptually replicated (CHI 2021 adaptive Parsons; Proof Blocks) [https://dl.acm.org/doi/10.1145/3411764.3445292]. _Boundaries:_ "equal learning" is a null result with ceiling effects; retention n=82; distractors reduced efficiency for young novices in separate work — validated for adult intro-CS populations, which is Academy's audience. UI details that worked: paired-distractor visual markers, indent guide lines, red-highlight wrong-block feedback.

**F14. Help avoidance and in-workspace hints — WEAKENED (domain transfer).** `[peer-reviewed, single lab, logic tutor not code editor]`
Unsolicited partially-worked steps injected into the workspace beat text hints on uptake and posttest efficiency for low-prior-knowledge learners [Maniktala et al., https://arxiv.org/abs/2009.13371]. The system was a propositional-logic tutor; transfer to free-form code editing is a reasonable hypothesis, not settled. Help avoidance itself is broadly supported.

**F15. Time-on-task stuck triggers — WEAKENED (behavior, not outcomes).** `[peer-reviewed field experiment, >5,000 MOOC users]`
Prompting learners who exceed average exercise time raised help call-outs up to 66% (max case) and cut dwelling time [https://arxiv.org/abs/1809.10059, DOI 10.1145/3231644.3231650]. No learning-gain outcome was measured, and the trigger flags slow-but-productive learners too. → Use as a _behavior-changing affordance_, tuned conservatively (≥1.5x median time or N failures), never on first attempt.

**F16. Test-output display — WEAKENED to sane default.** `[practitioner consensus, codified in Exercism's spec]`
Per-test results in visible test-file order, first failure emphasized, test code + human-readable message shown together, output capped [https://exercism.org/docs/building/tooling/test-runners/interface]. Zero learning-outcome measurement behind it; LeetCode-style judges show all failures. Adopt as convention, not science.

**F17. Expert-authored failure messages beat GPT-4 — CONFIRMED.** `[peer-reviewed, n=106 within-subjects]`
Handwritten error explanations beat both stock compiler messages and GPT-4-generated ones on time-to-fix and subjective measures; GPT-4 beat stock in only 1 of 6 tasks [Santos & Becker, UKICER 2024, https://arxiv.org/abs/2409.18661]. _Boundary:_ 2023-era GPT-4, C diagnostics, no code context — read as "LLM rewriting is not automatically better," not "LLMs can never help." → **Invest in an authorable per-test-case failure message field (PT-BR/ES/EN) in the content schema.**

**F18. Unrestricted GenAI widens the novice gap.** `[peer-reviewed, n=21 eye-tracking replication]`
Struggling students "succeed" via AI with illusory competence; new harm modes: Interruption, Mislead, Progression [Prather et al., ICER 2024, https://arxiv.org/html/2405.17739v1]. CodeHelp shows a guardrailed pipeline (structurally withholds solution code) runs a full semester and complements instruction [https://arxiv.org/abs/2308.06921] `[peer-reviewed deployment study]`. boot.dev found curated minimal context (lesson + editor buffer + last test run) beats history-dumping `[practitioner]` [https://elite-ai-assisted-coding.dev/p/lane-wagner-boot-dev]. → Assistant: tutor-mode enforced at the prompt-pipeline level; retrieval close stays AI-free.

**F19. Open-book solution viewing.** `[teardown]`
Codewars makes "Unlock Solutions" a permanent reward forfeit [https://docs.codewars.com/references/kata-trainer/]. Academy is deliberately open-book (tests/solutions in public git), so copy the _soft_ version: "View reference solution" always available, logged, reduces that attempt's XP, and reschedules the challenge into the 1/3/7/21 queue.

**F20. Monaco accessibility requires integrator work.** `[vendor doc + production bug reports]`
Tab-trap risk (WCAG 2.1.2) unless Ctrl+M "tab moves focus" is surfaced; F8/Shift+F8 diagnostics navigation; NVDA version floor [https://github.com/microsoft/monaco-editor/wiki/Monaco-Editor-Accessibility-Guide].

**F21. Mobile scope.** `[practitioner — fCC engineering blog]`
Even freeCodeCamp ships only a curriculum subset to mobile with a purpose-built editor [https://www.freecodecamp.org/news/freecodecamp-mobile-app-curriculum-update/]. → Mobile web = prose/video/quiz + touch Parsons + review queue; full Monaco challenges stay desktop with a "continue on desktop" handoff.

**F22. Syntax color alone doesn't teach.** `[peer-reviewed, contested; directional]`
At least one large controlled experiment found no novice comprehension benefit from syntax highlighting [Hannebauer et al. 2018, via https://ouci.dntb.gov.ua/en/works/l1MOJzBl/]. → Lesson code blocks get numbered line-anchored callouts (subgoal-label pattern), not color-as-explanation.

### 2.3 Course structure & IA

**F23. Shorter courses, auto-graded — WEAKENED (correlational, era-specific).** `[peer-reviewed regression, 221 MOOCs]`
Length was the largest design-side negative predictor (~-1.75pp/week, β=-.503); peer/manual grading -9.6pp; weeks 1-2 dominate attrition [Jordan 2015, https://files.eric.ed.gov/fulltext/EJ1067937.pdf]. _Caveats:_ opportunistic 2011-13 sample; Perna et al. found no length effect; the 12.6% median completion is era-flattered (edX administrative data shows ~3% and 52% never starting) [https://pubmed.ncbi.nlm.nih.gov/30630920/]. **Safe use: keep courses short, keep everything auto-graded, front-load module 1 quality. Unsafe: per-week planning constants.** Early-attrition dominance is independently corroborated.

**F24. Choice overload is conditional — CONFIRMED.** `[peer-reviewed meta-analysis, 99 obs, N=7,202]`
Harm from options is strongest under preference uncertainty, decision difficulty, complex option sets, effort-minimizing goals — the beginner-at-the-catalog profile; for experts the effect _reverses_ [Chernev et al. 2015, https://chernev.com/wp-content/uploads/2017/02/ChoiceOverload_JCP_2015.pdf]. _Boundaries:_ browsing (vs committing) reduces overload; field remains contested [https://arxiv.org/pdf/2212.03931]. → Segment-dependent catalog: beginners get a recommended track with one highlighted start; web3 devs get the full filterable catalog.

**F25. Placement + test-out mechanics — CONFIRMED as description.** `[company documentation]`
Duolingo: scratch-vs-placement choice at start; placement irreversible but skipped lessons stay reviewable; mid-course skipping one unit at a time [https://blog.duolingo.com/duolingo-101-how-to-learn-a-language-on-duolingo/]. This proves the mechanics at one vendor, not optimality — adopt as convention (Khan course challenges are the independent parallel).

**F26. Self-report is a bad sole level selector — WEAKENED but directionally usable.** `[peer-reviewed, n=309, task-level not learner-level]`
Self-assessment accuracy varied strongly by task cognitive level with symmetric errors [Clauss & Geedey 2010, https://files.eric.ed.gov/fulltext/EJ890708.pdf]. _Caveats:_ the study doesn't show learners misrouting on a beginner/advanced selector, and self-efficacy meta-analyses show moderate positive performance correlations. What survives (broader literature, typical self-assessment r~.3): **don't make a bare dropdown the only selector** — pair segment self-ID with an optional 2-minute placement challenge and observable signals.

**F27. Path anatomy.** `[teardown with explicit vendor rationale]`
boot.dev's backend path: strictly sequential, concept course → guided project pairs, solo portfolio project mid-path, capstone penultimate, one fork only (language choice) [https://www.boot.dev/paths/backend, https://www.boot.dev/about/]. Cyfrin composes tracks from per-course certificate milestones [https://updraft.cyfrin.io/courses]. _Note (adversarial):_ the boot.dev "removes what-should-I-learn-next entirely" quote was misattributed — the page's actual claim is "right information, in the right order."

**F28. Capstone = embedded auto-test suite, published artifact.** `[company rationale, two platforms converging]`
fCC replaced interpretive "user stories" with runnable per-project test suites; boot.dev's principle is publish real artifacts [https://www.freecodecamp.org/news/freecodecamps-new-coding-curriculum-is-now-live-with-1400-coding-lessons-and-6-developer-certifications-you-can-earn/]. → Capstone page = live checklist of automated checks; submission = devnet program address, verified on-chain, then credential mint. This is the trust-minimized version of "we hit your API endpoints."

**F29. Return-visit IA: home IS the path; review has a permanent nav home.** `[company metric + product guide]`
Duolingo's Daily Refresh (~6-node daily-resetting loop) reported +700K learning min/day, +1.58% retention `[company metric]` [https://devansh.design/daily-refresh]; the Practice Hub lives in primary nav, auto-populated from logged mistakes, system-picked/learner-triggered [https://blog.duolingo.com/guide-to-duolingo-practice-hub/]. → The Leitner queue needs its own top-level "Review" nav item fed by failed test cases and retrieval-close misses; daily quests deep-link INTO it.

**F30. Per-skill mastery states.** `[company research, large-N, correlational risk]`
Khan links per-skill proficiency progression to learning gains (effect size 0.36, ~350K students) [https://blog.khanacademy.org/khan-academy-efficacy-results-november-2024/]. → Surface the just-activated per-lesson skill tags as a mastery panel driven by challenge/review performance, complementing the linear path.

### 2.4 Gamification & social UI

**F31. Streak visibility — WEAKENED to correlation + small unverified lifts.** `[company A/B/metric + peer-reviewed counter-evidence]`
The 3.6x completion figure is methodology-free marketing with obvious selection bias; A/B lifts are tiny relative deltas [https://blog.duolingo.com/how-duolingo-streak-builds-habit/]. Peer-reviewed counter-evidence documents streak-maintenance displacing learning [L@S 2022, https://arxiv.org/abs/2203.16175]. → Keep the streak, restate it post-lesson, but treat it as an engagement device with known failure modes, not a learning instrument.

**F32. Raw daily counters drive pathological behavior — CONFIRMED.** `[peer-reviewed natural experiment, ICSE 2021]`
GitHub's unannounced 2016 streak-counter removal: long streaks abandoned, weekend grinding and one-token contributions declined; "gamification can steer the behavior of software developers in unexpected and unwanted directions" [Moldon, Strohmaier & Wachs, https://arxiv.org/abs/2006.02371]. Independent, no company PR. → Justifies the weekly-cadence option and framing the activity heat-map as a record, not an obligation.

**F33. Absolute-rank leaderboards — CONFIRMED evidence against.** `[peer-reviewed x2]`
High ranks coast (effort cut by round 5, p=.00), low ranks suffer competence-need frustration; authors recommend nearby-rank, matched multi-level boards, regular resets [https://www.emerald.com/intr/article/33/7/1/178330/]. Hanus & Fox 2015 (bundle caveat as in F7). "Evidence against exists" is accurate; "proven harmful" would overstate — the meta-analytic literature is mixed [https://link.springer.com/article/10.1007/s11423-023-10337-7].

**F34. XP as progress, not currency — WEAKENED (preprint, stated preferences).** `[preprint, n=125 convenience sample — NOT peer-reviewed]`
Best-worst scaling ranked Progress Bar > Achievements > Feedback top and Virtual Currency 9th of 10 (Points mid-pack, 5th) [https://arxiv.org/abs/2512.08551]. A design heuristic, not proof of prohibition. Combined with the overjustification literature and the adopted "XP as competence info" frame: display XP as "Level 4 — 320/500 to Level 5" in tabular figures; no coin iconography, no balances, no spend — even though XP is technically a token.

**F35. Credential sharing → employment — the standout RCT.** `[peer-reviewed RCT, >800,000 learners]`
One-click prefilled LinkedIn sharing + reminders: +6% new employment within a year, +9% certificate-related jobs, +12% in the bottom-employability tercile; +15-20 resume-score points for weak resumes [Stanford/Coursera, https://arxiv.org/abs/2405.00247]. Directly matches Academy's Brazil-first career-switching audience. Anatomy of a credible certificate page: recipient, course, issuer, unique ID, public verification URL requiring no wallet knowledge `[teardown]` [https://certfusion.com/r/coursera-shareable-certificates-explained-everything-you-need-to-know].

**F36. Social features — selective.** `[peer-reviewed literature review]`
Forum-nudge prompts, early low-stakes interaction, and engagement-homogeneous grouping have evidence; shipping all social mechanics at once overwhelms [https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2024.1345205/full]. → Contextual "Discuss this lesson" deep-links + "N learners completed this challenge"; no cohort chat in v1.

**F37. Dev-tool visual credibility.** `[teardown/practitioner consensus]`
Dark-canonical, color-as-punctuation, mono/tabular numerals for all metrics, hairline borders, minimal shadows read as "engineering-grade" [https://www.designsystems.one/design-systems/vercel-geist]. Gamification chrome must live inside this shell. boot.dev proves an overt game theme _can_ coexist with adult-dev credibility, but the credibility is carried by content rigor and feedback, not theme art `[company self-report]` [https://www.boot.dev/blog/misc/the-benefits-of-gamified-learning/].

**F38. PT-BR localization.** `[practitioner consensus + market data]`
Budget +30% text expansion (worst in buttons/short labels); Brazil-specific translation, not neutral PT; competitive mechanics are culturally safe (3rd-largest esports audience); seasonal metaphors invert [https://www.localizedirect.com/posts/brazilian-portuguese-game-localization-factsheet].

---

## 3. Where the Current UI Contradicts the Evidence

**3.1 Dashboard IA — the biggest gap.** Today a returning learner is greeted by XP bar, level, streak, quests, achievements: a stats page. The 5x-retention finding (F10) and the Daily Refresh pattern (F29) say the hero must be one **Continue card** (resuming mid-lesson scroll position) plus a small **daily review strip** (today's 3-6 Leitner items). Everything else demotes below the fold. This is the cheapest highest-leverage change in the report.

**3.2 Global leaderboard page.** A global-absolute table is the one leaderboard format with confirmed peer-reviewed evidence against it (F33: low-rank need-frustration, high-rank coasting) and no evidence for it. The adopted cohort direction needs UI: ~30-person weekly engagement-matched cohorts, "you ±3" nearby-rank strip on the dashboard, weekly reset, global table demoted to a secondary tab. Design against XP-grinding (F8 caveat): cohort XP counts only quest/challenge/review completions, not re-runs.

**3.3 Streak counter with zero forgiveness.** A raw daily counter is the exact artifact the GitHub natural experiment (F32, confirmed) warns about, and Academy's audience _is_ developers. Missing affordances: earned freeze inventory (capped, auto-applied server-side at failure, retroactive snowflake on the calendar — never a modal decision), and a weekly-cadence mode for weekend learners. Current UI has none of these.

**3.4 Long-scroll lesson pages.** Lessons render all typed blocks in one scroll; retrieval (if any) sits at the end. F3 (weakened but directional) supports interleaving one-item quiz blocks every ~3-5 minutes of prose/video with instant feedback, and the adopted 1-3-item retrieval close gating XP reuses the same component. Full Duolingo-style one-task-per-screen conversion is **not** warranted by the evidence (that unit was never tested — F3 caveat); interleaved blocks within the scroll is the defensible middle.

**3.5 Course catalog and course detail treat all three segments identically.** F24 (confirmed) says beginners face choice-overload conditions at commit-time while experts don't: today's single catalog serves neither. Course detail presents the module list as a menu; F1/F2 say default to one active "next" node with the module list as a progress map — _plus_ per-module test-out (challenge-based, not quiz-based, per F26's self-report caveat) so segment-2 devs never feel the Duolingo-backlash trap. No placement exists anywhere today.

**3.6 Spaced review has no home.** The adopted 1/3/7/21 Leitner queue currently has nowhere to live except daily quests. F29 says review only gets used with a permanent top-level nav item, auto-fed (failed test cases, retrieval-close misses — zero learner curation), with quests deep-linking into it. Burying review inside quest cards duplicates state and hides the surface.

**3.7 Challenge split view — keep, refine.** The LeetCode-style split (instructions left, Monaco right) matches the dominant practitioner pattern (F19 teardown) and needs no relayout. Refinements the evidence demands: (a) test results in visible-test order, first failure auto-expanded with test code + authored message, passes collapsed (F16 — convention, say so); (b) authored per-test failure messages in the schema, not AI auto-explanation (F17, confirmed); (c) stuck-state nudge only after ~1.5x median solve time or N failed runs, delivering an in-editor scaffold line rather than a chat bubble (F14/F15, both weakened — ship as experiment); (d) the scroll-revealed AI assistant becomes a context-fed guardrailed panel (challenge spec + editor buffer + last test run; no solution completion; thumbs feedback) (F18); (e) Ctrl+M focus-escape affordance and F8 wiring for accessibility (F20). The open-book model stays: "View reference solution" logs, reduces attempt XP, reschedules into the review queue — no Codewars-style permanent forfeit.

**3.8 Celebration calibration.** canvas-confetti currently fires on XP gains. F11/F31 (practitioner + small company A/B): per-test pass = checkmark animation only; lesson close = subtle XP tick; module = small burst; level-up = medium; full-screen confetti reserved for course capstone + credential mint, which also generates a shareable milestone card. Add the Brilliant-style "struggling" encouragement state after N failed runs.

**3.9 Credential page under-leveraged.** The soulbound NFT page exists but (a) has no wallet-free public verify URL and (b) no Add-to-LinkedIn. F35 is the only RCT in this corpus tied to a real-world outcome, targeted at exactly our audience. This is a contradiction of omission — the highest-confidence unshipped win.

**3.10 Progress bars start at zero.** F6 (confirmed): enrolling + intro should register as the first tick, placement-passed modules pre-credit, with the _reason stated_ ("Placement cleared Module 1") — unexplained free progress can backfire.

---

## 4. Prioritized UI/UX Roadmap

Priorities: **P0** = highest leverage / prerequisite for adopted direction. **P1** = high value, depends on P0 or more build. **P2** = valuable, defer.
Surfaces: `frontend` (apps/web), `content-schema` (courses-academy repo + monorepo lint/types), `on-chain` (program/credential metadata).

### P0

**R1. Dashboard rework: Continue hero + daily review strip.**
Change. Screen: dashboard. Hero = one "Continue: [lesson]" card restoring position + today's review strip (3-6 Leitner nodes, resets daily). XP/level/achievements/quests move below fold. Evidence: F10, F29, F6. Segments: all. Surface: frontend.

**R2. "Review" as primary nav — home of the Leitner queue.**
Add. New top-level nav item + /review page: system-picked queue auto-fed by failed test cases and retrieval-close misses (zero learner curation); serves old challenge variants per the adopted 1/3/7/21 scheme; daily quests deep-link into it (a new quest kind referencing the queue — small content-schema addition). Evidence: F29, F2 (practice hub is the escape hatch linearity needs). Segments: all; especially segment 2. Surface: frontend + content-schema (quest kind).

**R3. Retrieval-close block gating lesson XP.**
Add. Screen: lesson page. 1-3 items, one per screen-state, instant feedback, AI assistant disabled in this context; misses feed the Review queue. Same component reused for interleaved mid-lesson quiz blocks (author-placed every ~3-5 min — content guideline, not code). Evidence: F3 (weakened — sell internally as "better than restudy," not 2x), F18 (AI-free rationale). Segments: all. Surface: frontend + content-schema (retrieval-close block type; authoring guideline).

**R4. Challenge screen refinement bundle.**
Change (keep split layout). (a) Test panel: visible-test order, first failure auto-expanded (test code + message side-by-side), stdout capped, passes collapsed. (b) `failure_message` per test case in schema, localized PT-BR/ES/EN. (c) Guardrailed context-fed AI panel (spec+buffer+last run; pipeline-enforced no-solution; thumbs rating) replacing scroll-reveal. (d) "View reference solution" = logged + reduced attempt XP + auto-reschedule into Review. (e) Ctrl+M affordance on editor focus; F8 diagnostics; NVDA pass. Evidence: F16 (convention), F17 (confirmed), F18, F19, F20. Segments: all. Surface: frontend + content-schema (failure_message field).

**R5. Credential verify + share page.**
Add. Public /credential/[id]: server-side on-chain read rendered as human-readable proof (learner, course, course version — already stamped at mint per WS-2 — capstone artifact, date, unique ID); zero wallet knowledge required. Prominent "Add to LinkedIn" prefilling name/issuer/date/credential-URL; share nudge at course completion. Evidence: F35 (RCT — the strongest outcome-linked finding in this report). Segments: all; maximal for Brazil-first career switchers. Surface: frontend (+ existing on-chain metadata).

### P1

**R6. Linear path view + per-module test-out.**
Change. Course detail becomes a vertical node path: exactly one active "next" node, spaced-review nodes injected inline, module list rendered as progress map not menu. Every module header gets "Test out": pass the module's retrieval set + hardest challenge → module marked complete (reduced XP, reason shown on the progress bar per F6 boundary); skipped lessons stay openable. Evidence: F1 (weakened — enforcement mechanism, not proven superiority), F2 (the escape hatch is non-negotiable), F25, F6. Segments: beginners get the default; segments 1-2 get test-out. Surface: frontend.

**R7. Segment-first onboarding + anonymous trial.**
Add. First-run: "What brings you to Solana?" — 3 segment cards (JS/TS dev · web3 dev · new to code) → optional 2-minute placement challenge (never a bare self-report dropdown alone) → straight into lesson 1. Segment + placement set the challenge-ladder entry rung (worked example / subgoal-labeled / Parsons / independent write) stored per learner. Anonymous visitors can read lessons AND run the challenge runner; auth walls only "claim your XP," phrased as keep-progress with a subtle "Later," never "discard progress." Evidence: F4 (weakened — direction only), F5 (hypothesis — instrument it), F24 (confirmed — segment-dependent catalog), F26, F13. Segments: all, by construction. Surface: frontend (+ content-schema: per-challenge ladder-rung variants, which the adopted challenge ladder needs anyway).

**R8. Cohort leaderboard.**
Change. Leaderboard page: ~30-person weekly cohorts matched on prior-week engagement, promotion/demotion, weekly reset; dashboard gets a "you ±3" nearby-rank strip; global table → secondary tab. Anti-gaming: cohort XP counts first-completions only. Evidence: F33 (confirmed against absolute), F8 (shape preferred, magnitudes unverified — say so in the PR). Segments: all; PT-BR competitive framing is culturally safe (F38). Surface: frontend + a cohort-assignment job (Supabase).

**R9. Streak forgiveness + cadence.**
Change. Streak widget: earned-freeze inventory (quest rewards, capped at 2), auto-applied server-side at miss, retroactive snowflake on the streak calendar — never a modal; weekly-cadence mode toggle (N-days-per-week goal) for weekend learners; heat-map framed as activity record. Evidence: F9 (capped+auto+retroactive is practice-validated; earned-only is our free-product choice), F32 (confirmed — the counter needs escape valves), F31 caveats. Segments: all; cadence mode targets working devs. Surface: frontend + Supabase (streak logic).

**R10. Celebration recalibration + struggling state.**
Change. Tiering per §3.8; credential-mint moment generates a shareable card (feeds R5). Challenge runner gets an encouragement state after N failed runs. Evidence: F11 (practitioner — labeled as such), F31. Segments: all; beginners benefit most from the struggling state. Surface: frontend.

**R11. Endowed progress with stated reasons.**
Change. All progress surfaces: enrollment + intro view = first tick; placement/test-out pre-credits shown with explicit reason; "x of y lessons" framing; visual intensification near module/capstone completion; expect and design for the post-completion slump (immediately surface the next course on completion screens). Evidence: F6 (confirmed, with the reason-required and magnitude boundaries). Segments: all. Surface: frontend.

### P2

**R12. Capstone checklist page.** Add. Requirements as a live checklist of automated checks; submit = devnet program address; platform verifies deployed program on-chain → credential mint. Evidence: F28, F23 (auto-graded), adopted capstone-gated credentials. Segments: all (entry differs by ladder rung). Surface: frontend + on-chain verification service.

**R13. "Solana Developer Path" page.** Add. Ordered course sequence per segment fork; credential NFTs as per-course milestone markers; portfolio project mid-path; capstone penultimate; one honest total time estimate at path level (per-course estimates on detail pages, not catalog cards). Evidence: F27, F23 (short courses composed into a path). Segments: all. Surface: frontend + content-schema (path/track definition).

**R14. Parsons block type.** Add. Touch-capable drag-drop with paired-distractor markers, indent guides, red-highlight feedback; a full ladder rung, also the mobile-native challenge format and the review-variant workhorse. Evidence: F13 (confirmed). Segments: entry rung for beginners; review variants for all. Surface: content-schema (new block type) + frontend.

**R15. Mobile scope: review-first.** Change. Mobile web serves prose/video/quiz + Parsons + Review queue + streak; Monaco challenges show "continue on desktop" handoff. Evidence: F21, F13. Segments: all (Brazil mobile-heavy usage). Surface: frontend.

**R16. Mastery panel from skill tags.** Add. Per-skill state (attempted→familiar→proficient→mastered) driven by challenge/review performance, on dashboard + public profile; complements the path. Evidence: F30 (company research), F34 (progress framing). Segments: all; segment 2 values skill granularity most. Surface: frontend (skill tags already active per #498).

**R17. Re-engagement notifications (when email/push lands).** Add. 5-10 rotating templates, no-repeat-within-N-days; ~23.5h timing; streak-at-risk message first; PT-BR-native voice; log template→return from day one. Evidence: F12 (peer-reviewed bandit + company A/Bs). Segments: all. Surface: backend + frontend prefs.

**Design-system constants across all items (F37, F38, F34):** dark-canonical; purple→teal gradient as punctuation only (progress fills, active states — never large surfaces); mono/tabular numerals for XP, streaks, ranks, test output; all fixed-width controls audited for +30% PT-BR expansion; XP always "n/m to Level k," never a balance.

---

## 5. What NOT to Build

1. **A pure forced-linear path with no test-out and no practice hub.** Duolingo's documented omission and backlash (F2); segment 2 would bear the cost. Linearity ships only with both escape hatches.
2. **A global-absolute leaderboard as the primary competitive surface.** Confirmed peer-reviewed evidence against (F33); keep only as a demoted secondary tab.
3. **Raw daily streak counter without forgiveness or cadence options.** Confirmed natural-experiment evidence of weekend grinding and metric-gaming in developer populations specifically (F32).
4. **XP as a wallet/currency UI** — balances, coins, spend mechanics. Preference evidence ranks currency near-bottom (F34, preprint — labeled), overjustification risk, and it contradicts the adopted competence-info frame. The token stays invisible plumbing.
5. **LLM auto-explanation of test failures** in place of authored messages. Confirmed evidence that expert-written messages beat GPT-4 generations for novices (F17). The LLM assists; humans author the failure pedagogy.
6. **Unrestricted AI assistant inside challenges / AI available during retrieval closes.** Widens the novice gap with illusory competence (F18).
7. **Codewars-style permanent solution-forfeit.** Fights our open-book, public-git reality; soft-gate instead (log, reduce XP, reschedule).
8. **"Collect all 50" badge meta-progress / participation badges.** Badge evidence is thin and design-dependent (F7); every badge certifies a competence event or doesn't exist.
9. **All social mechanics at once** (cohort chat, study groups, profiles-heavy v1). Evidence supports selective forum nudges only (F36).
10. **Confetti on routine events.** Rarity-tiered celebration or the big moments stop meaning anything (F11 — practitioner consensus, honestly labeled).
11. **Duration labels on catalog cards as a conversion tactic dropped from fear.** No evidence honest labels deter starts; the measured deterrent is actual length (F23). Put honest estimates on detail/path pages.
12. **One-question-per-screen full lesson conversion.** The tested unit in the literature was block-interleaved testing, not screen atomization (F3 caveat); long-scroll with interleaved retrieval blocks is the evidence-proportionate change.

---

## 6. Experiments Worth Running

Each: metric + expected direction. Instrument before building; several adopted patterns are (honestly) hypotheses.

1. **Continue-hero vs current stats dashboard.** Metric: D7 return rate + median time-to-first-learning-action on return visits. Expect: return↑, time-to-action↓. (F10/F29 are company-tier — this is our chance to get a real number.)
2. **Retrieval close on/off per course.** Metrics: 7-day delayed retention quiz score (learning), lesson-completion rate (cost). Expect: retention↑ modestly, completion −small. If completion craters, cut items from 3→1 before cutting the gate.
3. **Anonymous trial + claim-XP wall vs auth-first.** Metric: visitor→first-lesson-complete and visitor→signup-within-7d. Expect: both↑. (Tests F4's non-portable magnitude for our audience.)
4. **Onboarding sequence ablation** (segment cards only vs +goal picker vs +placement). Metric: onboarding completion, week-1 retention by segment. Expect: placement helps segments 1-2, hurts beginners if mandatory — hence optional. (F5 is a hypothesis; treat it as one.)
5. **Per-module test-out visibility for experienced segments.** Metrics: segment-2 course completion, week-2 churn. Expect: completion↑, churn↓ vs forced-linear-only.
6. **Stuck-nudge trigger threshold** (1.5x vs 2.5x median solve time) and payload (in-editor scaffold line vs chat-bubble prompt). Metrics: nudge acceptance, post-nudge solve rate, next-challenge unassisted solve rate (guards against dependence). Expect: in-editor > bubble on acceptance (F14 is a domain-transfer bet — verify it).
7. **Authored failure messages vs stock runner output** on the 10 highest-failure challenges first. Metric: median time-to-green after first failure, rage-quit rate (abandon after ≥3 fails). Expect: both↓. Cheap because it's content-only.
8. **Weekly-cadence streak option uptake.** Metrics: opt-in rate, D28 retention of opt-ins vs matched daily-streak users, Saturday/Sunday activity distortion. Expect: opt-ins retain ≥ daily users with less weekend-grinding signature (F32).
9. **Cohort leaderboard vs global.** Metrics: weekly learning time, review-queue completions, XP-grinding signal (re-run ratio). Expect: time↑ modestly; watch the grinding metric — Duolingo's leagues invited gaming (F8 caveat).
10. **LinkedIn share nudge at completion vs credential page only.** Metric: share-click rate; long-run: self-reported job outcomes in exit surveys. Expect: nudge ≫ passive (the RCT's mechanism was friction reduction + reminders, F35).
11. **Endowed first-tick with stated reason vs 0% start.** Metric: module-1 completion. Expect: ↑ low-single-digit pp (the honest modern magnitude, not Nunes & Drèze's 15pp).
12. **Celebration tiering.** Metric: session continuation after lesson close (does removing per-lesson confetti hurt?). Expect: no decrease; milestone-card shares↑.

---

## 7. Full Source List

**Peer-reviewed**

- Szpunar et al. 2013, PNAS — interpolated testing: https://pmc.ncbi.nlm.nih.gov/articles/PMC3631699/
- 2022 high-powered replication, Cog. Research — https://pmc.ncbi.nlm.nih.gov/articles/PMC8964911/
- Kivetz, Urminsky & Zheng 2006, JMR — goal gradient: https://home.uchicago.edu/ourminsky/Goal-Gradient_Illusionary_Goal_Progress.pdf ; https://journals.sagepub.com/doi/abs/10.1509/jmkr.43.1.39
- Nunes & Drèze 2006, JCR — endowed progress: https://academic.oup.com/jcr/article-abstract/32/4/504/1787425
- Hanus & Fox 2015, Computers & Education: https://www.sciencedirect.com/science/article/abs/pii/S0360131514002000
- Kyewski & Krämer 2018, Computers & Education: https://www.sciencedirect.com/science/article/abs/pii/S0360131517302506
- Sailer & Homner 2020 (meta-analysis): https://www.semanticscholar.org/paper/be6769b967370c9852210e2fb7a34e499902f814
- 2023 ETR&D gamification meta-analysis: https://link.springer.com/article/10.1007/s11423-023-10337-7
- Yancey & Settles, KDD 2020 — notification bandit: https://www.kdd.org/kdd2020/accepted-papers/view/a-sleeping-recovering-bandit-algorithm-for-optimizing-recurring-notificatio.html
- Ericson, Margulieux & Rick, Koli Calling 2017 — Parsons RCT: http://faculty.chas.uni.edu/~schafer/cohort23/Methods/ReadingsBackups/mod2/ParsonsProblems.pdf
- CHI 2021 adaptive Parsons: https://dl.acm.org/doi/10.1145/3411764.3445292 ; Proof Blocks: https://arxiv.org/pdf/2211.09609
- Maniktala et al., IJAIED 2020 — help avoidance/Assertions: https://arxiv.org/abs/2009.13371 ; https://link.springer.com/article/10.1007/s40593-020-00213-3
- L@S 2018 — automated interventions MOOC: https://arxiv.org/abs/1809.10059 ; https://doi.org/10.1145/3231644.3231650
- Santos & Becker, UKICER 2024 — error messages: https://arxiv.org/abs/2409.18661 ; https://dl.acm.org/doi/10.1145/3689535.3689554
- Prather et al., ICER 2024 — widening gap: https://arxiv.org/html/2405.17739v1
- Liffiton et al. — CodeHelp: https://arxiv.org/abs/2308.06921
- Hannebauer et al. 2018 — syntax highlighting (index record): https://ouci.dntb.gov.ua/en/works/l1MOJzBl/
- Jordan 2015, IRRODL — MOOC completion: https://files.eric.ed.gov/fulltext/EJ1067937.pdf
- Reich & Ruipérez-Valiente 2019, Science — MOOC pivot: https://pubmed.ncbi.nlm.nih.gov/30630920/ ; https://www.researchgate.net/publication/330316898_The_MOOC_pivot
- Chernev, Böckenholt & Goodman 2015, JCP — choice overload: https://chernev.com/wp-content/uploads/2017/02/ChoiceOverload_JCP_2015.pdf ; contested: https://arxiv.org/pdf/2212.03931 ; https://www.researchgate.net/publication/256846155_Re-Analyzing_a_Meta-Analysis_Another_Look_at_Choice_Overload
- Clauss & Geedey 2010, JoSoTL — self-assessment: https://files.eric.ed.gov/fulltext/EJ890708.pdf
- Moldon, Strohmaier & Wachs, ICSE 2021 — GitHub streak removal: https://arxiv.org/abs/2006.02371
- L@S 2022 — Duolingo gamification misuse: https://arxiv.org/abs/2203.16175
- Emerald Internet Research — leaderboard positions: https://www.emerald.com/intr/article/33/7/1/178330/
- Stanford/Coursera RCT — credential sharing & employment: https://arxiv.org/abs/2405.00247
- Frontiers in Education 2024 — social features in MOOCs: https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2024.1345205/full
- Badge/engagement exploratory (OLJ): https://olj.onlinelearningconsortium.org/index.php/olj/article/view/1007

**Preprint (not peer-reviewed)**

- Game-element preference BWS study (n=125): https://arxiv.org/abs/2512.08551 ; https://arxiv.org/html/2512.08551v1
- (Excluded/REFUTED: arXiv 2512.22407 — does not contain the claimed findings)

**Company primary sources / A-B accounts**

- Duolingo path redesign: https://blog.duolingo.com/new-duolingo-home-screen-design/
- Duolingo streak/habit: https://blog.duolingo.com/how-duolingo-streak-builds-habit/
- Duolingo Practice Hub: https://blog.duolingo.com/guide-to-duolingo-practice-hub/
- Duolingo 101 (placement): https://blog.duolingo.com/duolingo-101-how-to-learn-a-language-on-duolingo/
- First Round × Gotthilf — Duolingo A/B tenets: https://review.firstround.com/the-tenets-of-a-b-testing-from-duolingos-master-growth-hacker/
- Lenny's × Mazal — Duolingo growth: https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth
- Duolingo 2024 whitepaper: https://duolingo-papers.s3.amazonaws.com/reports/Duolingo_whitepaper_language_read_listen_write_speak_2024.pdf
- Daily Refresh case study: https://devansh.design/daily-refresh
- Khan Academy efficacy 2024: https://blog.khanacademy.org/khan-academy-efficacy-results-november-2024/
- freeCodeCamp curriculum/tests: https://www.freecodecamp.org/news/freecodecamps-new-coding-curriculum-is-now-live-with-1400-coding-lessons-and-6-developer-certifications-you-can-earn/ ; mobile: https://www.freecodecamp.org/news/freecodecamp-mobile-app-curriculum-update/
- boot.dev philosophy/path: https://www.boot.dev/about/ ; https://www.boot.dev/paths/backend ; https://www.boot.dev/blog/misc/the-benefits-of-gamified-learning/
- boot.dev AI mentor interview: https://elite-ai-assisted-coding.dev/p/lane-wagner-boot-dev

**Teardowns / vendor docs / practitioner**

- duoplanet path review (backlash record): https://duoplanet.com/duolingo-new-learning-path-review/ ; streak freeze: https://duoplanet.com/duolingo-streak-freeze/
- NBC — von Ahn on redesign: https://www.nbcnews.com/tech/tech-news/duolingos-update-redesign-luis-von-ahn-interview-rcna44655 ; HN thread: https://news.ycombinator.com/item?id=33673522
- Deconstructor of Fun — Duolingo streak mechanics: https://duolingo.deconstructoroffun.com/mechanics/streaks ; fandom shop page: https://duolingo.fandom.com/wiki/Shop/Streak_freeze ; streak revival: https://android.gadgethacks.com/news/duolingo-streak-revival-who-qualifies-and-how-it-works/ ; league cheating: https://duolingoguides.com/duolingo-leagues-cheating/
- Appcues — Duolingo onboarding teardown: https://goodux.appcues.com/blog/duolingo-user-onboarding ; gradual engagement: https://www.appcues.com/blog/gradual-engagement-mobile-app-first-screen ; lazy registration: https://ui-patterns.com/patterns/LazyRegistration
- ustwo × Brilliant: https://ustwo.com/work/brilliant/
- Exercism test-runner interface: https://exercism.org/docs/building/tooling/test-runners/interface
- Codewars kata trainer: https://docs.codewars.com/references/kata-trainer/
- Monaco accessibility guide: https://github.com/microsoft/monaco-editor/wiki/Monaco-Editor-Accessibility-Guide
- Cyfrin Updraft catalog: https://updraft.cyfrin.io/courses
- Unbounce course landing pages: https://unbounce.com/landing-page-examples/online-course/
- Vercel Geist teardown: https://www.designsystems.one/design-systems/vercel-geist
- Coursera certificate anatomy: https://certfusion.com/r/coursera-shareable-certificates-explained-everything-you-need-to-know
- PT-BR localization factsheet: https://www.localizedirect.com/posts/brazilian-portuguese-game-localization-factsheet
- Hanus & Fox secondary summary: https://sites.psu.edu/zaczidik/2024/09/15/leaderboards-in-educational-gaming-striking-a-balance-between-motivation-and-meaningful-learning/ ; https://www.semanticscholar.org/paper/dff76a9862467d426113ec530f83942016ae3a97
- Belgian gamified-progress field study 2024: https://link.springer.com/article/10.1007/s10639-024-12928-0 ; endowed-progress SSRN: https://papers.ssrn.com/sol3/papers.cfm?abstract_id=991962
