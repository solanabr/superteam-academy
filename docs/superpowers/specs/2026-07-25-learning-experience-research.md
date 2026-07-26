# Learning Experience Research: Evidence Review & Roadmap

**Superteam Academy — team meeting deliverable — 2026-07-25**

Method note: four research pillars (learning science, motivation/gamification, modern learning apps, web3 education market) were researched and then adversarially verified against independent sources. Findings below carry their verification verdict. No claims were refuted outright; WEAKENED claims carry their caveats inline. Effect sizes are reported honestly, including where they shrank under scrutiny.

> **Correction note (2026-07-26, per #608 — do not rewrite the body below; this note governs).** Two figures used in this report were later refuted _as applied_ and are struck from all live guidance:
>
> - **d=−0.88** (used below at the executive summary, §on motivation, and the never-do list for leaderboards / XP→money bridges / monetary salience): refuted _as attribution_ (MAS-20). −0.88 is Deci/Koestner/Ryan's performance-contingent-less-than-maximum reward vs a no-feedback control (6 studies) — it measures no leaderboard, prize, or monetary framing. The no-prize / no-bridge decision survives on PED-10 + PED-14 + UIU-09 and the airdrop-extraction literature, not on −0.88.
> - **Interleaving g≈0.34 / g=−0.39** (used below for "confusables help / prose is harmful"): refuted _as numbers_ for prose (MAS-22). g≈0.34 is mathematical-task interleaving; g=−0.39 is word-list interleaving. The lesson-prose analogue is expository text **g=0.21, p=.119 — n.s., not harmful**. The "interleave only inside review sets, never reorder lesson prose" ruling stands on that null, not on a prose-harm number.
>
> Authoritative dispositions: `docs/superpowers/specs/2026-07-25-UNIFIED-LAUNCH-SPEC.md` §1 evidence table + §3 item 52.

> **Correction note (2026-07-26, per #645 — do not rewrite the body below; this note governs).** One further figure in this report was weakened under adversarial verification and must not be quoted from live guidance:
>
> - **"≈0.08 on standardized/transfer measures" for mastery learning** (used below in the Kulik 1990 line, §on the mechanizable mentorship / mastery-gating evidence): the "≈0.08" is not in the primary and **must never be quoted** (PED-07 WEAKENED). The standardized effect is **d=0.33 (k=9) / 0.10 (k=2)**; high-standard mastery beat conventional teaching by 0.60–0.76 SD on standardized tests, and stricter thresholds beat lenient ones. The ruling — gate the credential on the capstone, do not market gating as transfer — stands on those figures, not on 0.08.
>
> Authoritative disposition: UNIFIED-LAUNCH-SPEC §1 evidence table (PED-07) + §3 item 52.

---

## 1. Executive Summary

**The good news:** Academy's core mechanics are mostly pointed the right way. Graded code challenges are retrieval practice — the single best-attested learning intervention in the literature (g≈0.5 across independent meta-analyses). Soulbound, non-liquid XP is exactly what the web3 evidence prescribes: every platform that made rewards liquid was captured by extractors (up to 66% immediate sell-through, six-figure sybil waves). Free content is not the moat and never was — RareSkills open-sources its curriculum and charges for feedback; Cyfrin gives everything away and monetizes the pipeline.

**The bad news, in priority order:**

1. **Our lessons are read-then-code-once. The evidence says the learning happens in retrieval and spaced re-exposure, and we do neither systematically.** We have the substrate (per-lesson skill tags, daily quests, streaks) but quests serve new content, not review. A simple fixed-schedule review queue (1/3/7/21 days) injected into daily quests captures most of the value of Duolingo's ML scheduler at near-zero complexity — their own model barely beat Leitner on discrimination (AUC ~0.54).
2. **One linear path for three audiences is actively harmful, not just suboptimal.** The expertise-reversal effect is a confirmed true reversal (meta-analysis 2025: novices +0.5 SD with high guidance, experienced learners −0.43 SD with the same guidance). The scaffolding that keeps our beginners in also pushes our web3-dev segment out. Tracks must differ in guidance level, not just topic.
3. **Per-lesson XP is a completion-contingent tangible reward — the exact category shown to undermine intrinsic motivation (d≈−0.36 to −0.44).** The worst case in the entire literature (d=−0.88) is rank-based rewards where most people get less than the maximum — i.e., any bridge from leaderboard rank to token value. Framing is load-bearing: XP as competence information is safe; XP as payment is not.
4. **The credential currently attests nothing.** Open-book + accepted paste-farming is a consistent, defensible stance for XP — but it makes the soulbound credential NFT paste-attestable. freeCodeCamp's answer: credential integrity lives in capstone artifacts (5 required projects per cert), not anti-cheat. Ours should be "deployed a working program to devnet," verified by the build server we already run.
5. **Our streaks are stricter than habit science requires.** Missed single days don't derail habit formation; broken streaks demotivate and drive abandonment (JCR 2023). Forgiveness mechanics (streak freezes) _increase_ engagement — independently confirmed by a 60k-student RCT, not just Duolingo PR.

**Realistic baselines to set now:** free async course completion is single-digit (MOOC census: 3.13%); ~5% of learners producing an artifact is normal at well-funded free platforms. Weekly-return retention will come from commitment devices, spaced-review hooks, and a real learning→paid-work pipeline (Superteam Earn), not content volume. Define our north-star metric as weekly return of previously-active learners and judge every mechanic against it over 10–12 week windows — Brazilian CS1 data shows a novelty trough at weeks 4–6 with recovery by 6–10; week-3 dashboards will lie to us.

---

## 2. What the Science Says

### 2.1 Learning science

**Retrieval practice — the anchor finding. [CONFIRMED for retention; transfer conditional]**
Practicing recall beats restudying: independent meta-analyses converge at g≈0.42–0.61, including in real classrooms (Adesope 2017 g=0.61 [https://pmc.ncbi.nlm.nih.gov/articles/PMC6288371/]; Yang 2021, 222 classroom studies, N=48,478, g=0.499 with low publication-bias risk [https://gwern.net/doc/psychology/spaced-repetition/2021-yang.pdf]; Sotola & Crede 2021 d=0.42 [https://eric.ed.gov/?id=EJ1296076]). **Caveat that matters for us:** the transfer claim is weaker than the retention claim. Pan & Rickard's dedicated transfer meta-analysis (192 effects) found d=0.40 overall, often near zero after bias correction unless moderators are present — elaborated retrieval, response congruency, high initial success [https://pdf.retrievalpractice.org/transfer/Pan_Rickard_2018.pdf]. Retrieval reliably makes knowledge stick; making it transfer requires designing the retrieval items well.

**Boundary conditions on retrieval — softer than first reported. [WEAKENED as "hard boundary"]**
The original framing ("works only with high retrieval success") overstated: Rowland 2014 (159 effects, g=0.50) found retrieval success moderates the effect _only in the absence of feedback_ — with feedback the benefit is robust regardless of initial success [https://pubmed.ncbi.nlm.nih.gov/25150680/]. MC quizzes with feedback match short-answer in real classrooms (McDermott 2014 [https://pubmed.ncbi.nlm.nih.gov/24274234/]). The claim that testing stops working for complex material is contested and largely rebutted (Karpicke & Aue 2015 [https://link.springer.com/article/10.1007/s10648-015-9309-3]). **Design rule:** every retrieval item gets immediate explanatory feedback; then format and difficulty calibration are second-order.

**Spaced practice. [CONFIRMED]**
One of the most replicated effects in psychology. Classroom meta-analysis 2025: d=0.54 [0.31, 0.77], larger at longer retention delays, 7-day gaps consistently positive [https://pmc.ncbi.nlm.nih.gov/articles/PMC12189222/]; independently triangulated by Cepeda 2006/2008 (317 experiments; optimal gap grows with target retention interval [https://laplab.ucsd.edu/articles/Cepeda%20et%20al%202008_psychsci.pdf], [https://www.yorku.ca/ncepeda/publications/CPVWR2006.html]) and Donovan & Radosevich 1999 (separate meta, ES 0.46 [https://gwern.net/doc/psychology/spaced-repetition/1999-donovan.pdf]). Honest note: classroom heterogeneity is high (I²=92%) — "moderate on average, variable in practice."

**Expertise reversal / faded guidance. [CONFIRMED — the strongest design constraint in this report]**
Novices learn more from worked examples; learners with domain knowledge learn _worse_ with redundant guidance — a true reversal, not attenuation. Kalyuga/Sweller line [https://mrbartonmaths.com/resourcesnew/8.%20Research/Explicit%20Instruction/The%20Expertise%20Reversal%20Effect.pdf], independently confirmed by Tetzlaff et al. 2025 (176 effects, 5,924 participants, independent lab): low-prior-knowledge + high assistance d=+0.505; high-prior-knowledge + low assistance d=−0.428 [https://www.sciencedirect.com/science/article/pii/S0959475225000660]. Effect is asymmetric (helping novices matters more than withdrawing help from experts) and detecting expertise in practice is hard — but the direction is unambiguous.

**Subgoal labels. [WEAKENED — promising single study, right target]**
Subgoal-labeled worked examples in intro programming: exams barely move (d=0.20 n.s.) but quizzes d=0.44 and — the headline — failure/attrition roughly halved, with at-risk students helped most (Margulieux et al. 2020, n=265 [https://link.springer.com/article/10.1186/s40594-020-00222-7]). **Caveat:** the attrition-halving is one quasi-experiment from the originating lab, no independent replication. Treat as a cheap, low-risk retention lever for beginners — not a banked effect size.

**Parsons problems. [WEAKENED — right direction, overconfident numbers]**
Drag-and-drop code-reordering achieves comparable learning to writing code in less time (Ericson randomized experiments [https://computinged.wordpress.com/tag/parsons-problems/], [https://dl.acm.org/doi/10.1145/3141880.3141895]). **Caveats:** "same learning" is a failure-to-reject in small samples; "half the time" is study-specific and vanishes for unusual solutions [https://dl.acm.org/doi/10.1145/3411764.3445292]; "adaptive doubles solve rates" is one same-lab study. Independent analogous results exist (UIUC Proof Blocks [https://arxiv.org/pdf/2211.09609]). Verdict for us: worth adding as a cheap intermediate rung, especially for Rust syntax exposure before writing Rust — don't oversell internally.

**Mastery gating. [Source-dense secondary review; effects real but narrow]**
Kulik 1990: d≈0.5 on course-aligned tests, but ≈0.08 on standardized/transfer measures; benefits concentrate in weaker students; stricter thresholds (90–100%) outperform lenient ones [https://nintil.com/bloom-sigma/]. Gate on mastery to guarantee coverage and help weaker learners — don't market it as producing outsized transfer.

**Project-based capstones. [Moderate-to-large but implementation-sensitive]**
Meta-analytic effects moderate-to-large (Chen & Yang 2019 d≈0.71; 2026 multi-method study g=0.66 experimental [https://www.nature.com/articles/s41599-026-06684-4]) but generic unstructured PBL underdelivers; success requires milestone scaffolding. One structured capstone per course path, not project-based-everything.

**Feedback timing is a non-issue; feedback content is not.**
2026 meta-analysis (51 studies, 160 effects): immediate vs delayed g=0.03, p=.61 [https://link.springer.com/article/10.1007/s10648-026-10117-8]. Keep instant runner feedback; invest engineering in _explanatory_ failure messages, not timing.

**Interleaving — narrow tool.** Helps discrimination of confusable categories (math-like g≈0.34); useless-to-harmful for prose (g=−0.39 for word learning) (Brunmair & Richter 2019 [https://www.psychologie.uni-wuerzburg.de/fileadmin/06020400/2019/Brunmair_Richter_in_press__2019_META-ANALYSIS_OF_INTERLEAVED_LEARNING.pdf]). Use in review quizzes for confusable Solana concepts (PDA vs ATA, account constraints); never interleave lesson texts.

**Pair programming — skip.** Positive meta (Umapathy & Ritzhaupt 2017 [https://eric.ed.gov/?id=EJ1252509]) but later randomized work found nulls and flags publication bias. Not worth infrastructure.

**The validated cognitive-load ladder (design inference, each rung independently evidenced):** full worked example → subgoal-labeled example → Parsons/completion → independent writing, with entry rung set by expertise. This is one authoring format that serves all three audience segments.

### 2.2 Motivation & gamification

**Gamification works modestly; pedagogy carries the load. [CONFIRMED]**
Cognitive g≈0.49 (stable under rigor subsplits), motivational g≈0.36, behavioral g≈0.25 (Sailer & Homner 2020 [https://eric.ed.gov/?id=EJ1245270]); independently converging with Bai, Hew & Huang 2020 g=0.504, no detected publication bias [https://www.semanticscholar.org/paper/4baea6e6ca74597feaa6ce691c41577a67e87b54]. Points are an amplifier, not the engine.

**Which elements matter — evidence is murky. [WEAKENED]**
The "game fiction + competition-with-collaboration drives behavior" moderator finding rests on k=9 and does _not_ replicate across metas (Bai et al. found no element-type moderation at all; Huang & Ritzhaupt found competition alone moderated [https://eric.ed.gov/?id=EJ1266144]). Directionally, social/cooperative elements plausibly beat adding more solo point mechanics — hold that belief loosely.

**SDT profile: relatedness and autonomy are where gamification bites; competence barely moves. [WEAKENED on precision, direction supported]**
2023 ETR&D meta: relatedness g=1.78 (huge CI — few heterogeneous studies, treat the magnitude as unstable), autonomy g=0.64, competence g=0.28 (marginal), intrinsic motivation g=0.26 (small but significant) [https://link.springer.com/article/10.1007/s11423-023-10337-7]. Single meta, no replication of the rank ordering. Practical read: community features are the highest-leverage motivational surface; the _feeling of competence_ must come from well-calibrated challenges, not from XP numbers.

**Overjustification — the sharpest risk to our design. [CONFIRMED]**
Deci, Koestner & Ryan (128 experiments; verified against the primary 1999 Psych Bull full text [https://home.ubalt.edu/tmitch/642/articles%20syllabus/Deci%20Koestner%20Ryan%20meta%20IM%20psy%20bull%2099.pdf], [https://www.selfdeterminationtheory.org/SDT/documents/2001_DeciKoestnerRyan.pdf]): expected tangible rewards undermine free-choice intrinsic motivation — engagement-contingent d=−0.40, completion-contingent d=−0.36 to −0.44, and the single largest undermining in the meta-analysis: **performance-contingent rewards where most people get less than the maximum, d=−0.88** (6 studies, verified verbatim). Unexpected rewards: no undermining (d=0.01). Even the hostile Cameron/Pierce rebuttals concede undermining for expected tangible rewards on interesting tasks. Per-lesson XP is literally completion-contingent; leaderboard-rank payouts are literally the d=−0.88 case.

**Informational vs controlling feedback. [WEAKENED — tiny study base, directionally credible]**
Verbal/informational feedback enhances intrinsic motivation (d=+0.66) while controlling framing undermines it (d=−0.44) — but the contrast rests on ~4 studies, partly SDT-lab-authored, controlling CI barely excludes zero. Still the best available guidance for copywriting: frame XP and level-ups as competence information ("you can now derive a PDA-based escrow"), never as pressure ("don't lose your XP momentum").

**Streaks + forgiveness. [CONFIRMED — with independent causal evidence]**
Streak salience causally increases engagement: 60,000-student RCT in Peru (NBER w34173) — highlighting streaks raised platform use and _math achievement_ [https://www.nber.org/papers/w34173]. Forgiveness mechanics increase persistence, including after failure (Sharif & Shu emergency-reserves experiments [https://journals.sagepub.com/doi/abs/10.1509/jmr.15.0231]). Duolingo's specific figures (7-day streak ≈3.6× completion; freezes +DAU) are unverifiable company numbers with selection confounds [https://blog.duolingo.com/how-duolingo-streak-builds-habit/] — but the mechanism survives adversarial checking. The cost side is real too: broken streaks demotivate and drive abandonment (Silverman & Barasch, JCR 2023, seven studies [https://academic.oup.com/jcr/article/49/6/1095/6623414]). Habit science: automaticity forms over ~66 days (range 18–254) and a single missed day does not derail it; obligation-driven repetition decays (Lally & Gardner [https://www.cykelvaeksthuset.dk/media/az3linp0/promoting-habit-formation.pdf]).

**Leaderboards — handle with gloves.**
Randomized experiment: top-ranked users coast (superficial effort), bottom-ranked grind from ego-involvement then disengage after repeated low ranks; neither end intrinsically motivated (N=111, artificial task — single study [https://www.emerald.com/insight/content/doi/10.1108/intr-12-2021-0897/full/html]). Independently confirmed stronger evidence: Hanus & Fox 2015, 16-week controlled classroom study — badges + leaderboard _reduced_ intrinsic motivation, satisfaction, and final exam scores over time, mediated by motivation [https://www.sciencedirect.com/science/article/abs/pii/S0360131514002000]. Context caveat: mandatory classroom, not an opt-in platform. Duolingo's league numbers (+17% learning time) are single-source ex-CPO lore measuring time-in-app on a farmable XP metric [https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth] — direction plausible, magnitudes unverifiable, learning-quality risk real.

**Novelty dynamics — directly relevant population.** 14-week study, N=756 Brazilian CS1 undergraduates: gamification effect dips after week 4, recovers weeks 6–10, nets positive [https://link.springer.com/article/10.1186/s41239-021-00314-6]. Never evaluate a mechanic on a <12-week window.

**Goal-gradient, endowed progress, post-reward reset.** Effort accelerates near visible goals; illusory head-start progress speeds completion; motivation resets after a reward unless a new goal starts immediately (Kivetz et al. 2006, field experiments [https://home.uchicago.edu/ourminsky/Goal-Gradient_Illusionary_Goal_Progress.pdf]).

**Badges steer few and briefly.** Stack Overflow modeling: >40% of active users unaffected; the ~20% who are steered collapse to near-zero activity right after earning the badge [https://arxiv.org/pdf/2002.06160]. Expect a post-credential cliff; design the bridge, don't mint more badges.

**Implementation intentions — cheapest high-evidence retention feature found.** If-then planning prompts: d=0.65 on goal attainment across 94 tests (d=0.77 for preventing derailment); event-based cues beat time-based (Gollwitzer & Sheeran 2006 [https://cancercontrol.cancer.gov/sites/default/files/2020-06/goal_intent_attain.pdf]). Mostly health-domain evidence — but the feature costs a session-end picker.

### 2.3 Modern learning apps — what transfers

- **Engagement mechanics ≠ learning mechanics.** Company A/B evidence (streaks, leagues, notifications) measures app-return; the learning evidence lives in retrieval, spacing, active lessons, mastery gating, and project assessment. Don't conflate the two when reading dashboards.
- **Don't build an ML review scheduler.** Duolingo's half-life regression cut prediction error ~45% vs Leitner but had near-chance discrimination (AUC ~0.54) — independently confirmed as mediocre by the open srs-benchmark [https://research.duolingo.com/papers/settles.acl16.pdf], [https://github.com/open-spaced-repetition/srs-benchmark]. A fixed Leitner schedule (1/3/7/21 days) over our skill tags captures most of the value. Their +12% engagement from _having any principled scheduler_ is the point [CONFIRMED as self-deflating].
- **Adherence is the SRS failure mode.** Anki med-school cohort: consistent users +6–13% on high-stakes exams, but voluntary usage collapsed 60%→8% over a year [https://pmc.ncbi.nlm.nih.gov/articles/PMC10403443/]. Reviews must ride inside the daily-quest/streak loop, not live in a standalone feature.
- **Active/problem-first beats exposition.** Freeman 2014 PNAS, 225 studies: +0.47 SD, failure 33.8%→21.8% [https://pmc.ncbi.nlm.nih.gov/articles/PMC4060654/]. Brilliant operationalizes attempt-before-instruction but publishes no efficacy data of its own [https://brilliant.org/about/].
- **Credential integrity through artifacts.** freeCodeCamp: 5 required build-projects per free cert; the portfolio is the mechanism employers check; the "40k jobs" figure is marketing-grade [https://www.freecodecamp.org/news/freecodecamp-certifications/].
- **The mechanizable 80% of mentorship.** Exercism's own data: 25% of submissions pass outright, 55% fall in common error buckets; day-to-week human latency is the cost [https://exercism.org/blog/automated-mentoring-support-project]. Our AI assistant can deliver instant post-pass idiomatic review; forum power-users cover the rest.
- **Metric discipline.** Duolingo's DAU growth (~4.5×) is corroborated by SEC filings, but the internal causal story (CURR metric, +21%) is one ex-executive's unauditable narrative with COVID and TikTok confounds inside the window [WEAKENED] [https://www.sec.gov/Archives/edgar/data/1562088/000156208822000061/duol-20220331.htm]. What transfers: pick one retention metric for previously-active learners and run everything against it.
- **Boot.dev pattern worth copying:** solution reveal costs XP (75% of the lesson's award) — norm-setting friction without policing; learners voluntarily re-practice (11.7% of submissions are resets) [https://www.boot.dev/blog/education/state-of-learning-to-code-2024].

### 2.4 Web3 education market

- **The survivor pattern (inductive, ~8 cases):** external funding engine (audit revenue: Cyfrin; tuition-for-feedback: RareSkills; infra: Alchemy; foundation: Encode) + credible learning→paid-work pipeline. Failures were engagement-rich but pipeline-poor (Buildspace) or reward-liquid and farmer-captured (Coinbase Earn, RabbitHole) [https://www.cyfrin.io/updraft], [https://rareskills.io/web3-blockchain-bootcamps], [https://www.therunway.ventures/p/buildspace].
- **Buildspace [WEAKENED on cause]:** died Aug 2024 at scale (~30–70k participants, $10M raised); founder-confirmed burnout, founder-_denied_ monetization pressure — the "sponsorship ceiling" diagnosis is one analyst's unaudited inference [https://x.com/FarzaTV/status/1827030900456169849]. What stands: high engagement with ~4–10% shipping is normal, and personality-keyed brands are fragile. Academy's institutional ownership is the right structure.
- **Cyfrin [WEAKENED on one fact]:** free-content-funded-by-audit-business structure is real and observable; **but First Flights award XP only, not money** — real money is in regular CodeHawks competitions [https://docs.codehawks.com/first-flights]. Scale claims (200k students) are self-reported.
- **RareSkills [CONFIRMED]:** entrance exam, ~5-person cohorts, weekly 1-on-1 code review, openly published curriculum — independently corroborated via Course Report/SwitchUp [https://www.coursereport.com/schools/rareskills]. **Content is commoditized; feedback is the scarce good.** Academy currently has no structured feedback loop on submissions — that is the gap RareSkills monetizes.
- **MOOC baseline [CONFIRMED]:** 3.13% completion for free async (census of 12.67M edX registrations), verified-track ~46% (≈15×); year-over-year learner return collapsed 38%→7% [https://www.edsurge.com/news/2019-01-10-article-in-journal-science-argues-mooc-participation-is-declining-as-providers-pivot]. Commitment devices move completion more than content quality.
- **Liquid rewards → extraction [CONFIRMED direction, WEAKENED magnitudes]:** up to 66% of airdropped tokens sold rapidly (a maximum, not a norm) [https://arxiv.org/abs/2312.02752]; LayerZero flagged ~803k sybil wallets (~13% of eligible pool — the "59%" framing comes from low-rigor aggregators) [https://cointelegraph.com/news/layerzero-concludes-sybil-self-reporting-phase]; Linea final sybil removal ~40% [https://www.theblock.co/post/335979/linea-filters-over-half-a-million-sybil-addresses-from-upcoming-token-airdrop]. Quiz-gated token rewards fail open at scale — an entire SEO industry maintains Coinbase Earn answer keys [CONFIRMED, ≥6 independent sites] [https://techozu.com/coinbase-earn-quiz-answers/].
- **Ecosystem tailwind:** Solana led new-developer inflow by mid-2024, but newcomer churn is high and experienced devs write ~70% of commits (Electric Capital, via secondary full-text [https://www.chaincatcher.com/en/article/2156880]). The product goal is graduating learners into the shipping cohort. **Brazil-specific public data: essentially none** — PT-BR-first has no found incumbent, and our own cohort data will be the best Brazil dataset in existence.

---

## 3. Where the Evidence Contradicts Our Current Design

Plainly, per the brief.

**3.1 XP token per lesson vs overjustification.**
Our per-lesson soulbound XP is an expected, tangible, completion-contingent reward — the category with confirmed undermining of intrinsic motivation (d=−0.36 to −0.44). Two aggravators specific to us: (a) it's a _token_, and any salience of market value or any XP→money bridge (leaderboard prizes, creator payouts framed as earnings) moves us toward the d=−0.88 worst case (rank-based, most-get-less-than-max); (b) memory already flags creator rewards as insider-farmable. The mitigation is not removing XP — it's framing and structure: XP copy as competence information, no monetary salience, surprise bonuses (the one reward form with zero undermining) for delight, and no rank→value conversion, ever. Our accepted-risk creator-reward design survives only because the reward was cut to 30 XP and stays illiquid.

**3.2 Public global leaderboard.**
A single absolute all-time ranking is the configuration the evidence dislikes most: coasting at the top, ego-grind-then-disengagement at the bottom, and the only semester-long controlled study of leaderboard+badge gamification found _reduced_ motivation and exam scores. Worse, ours is poisoned by design: XP is farmable by pasting public solutions, so top ranks measure paste speed, which degrades the comparison for honest learners. The evidence-aligned shape is small weekly cohorts (Duolingo uses 30) with resets, relative "nearby-rank" windows, or opt-in — not what we have.

**3.3 Open-book challenges + accepted XP-farming.**
The stance is internally consistent — the Coinbase Earn evidence _validates_ accepting that public assessments get gamed rather than fighting it, and it stays safe precisely while XP is illiquid. But it has an unpriced casualty: the credential NFT. A soulbound credential earned by paste-through attests wallet activity, not skill. fCC and the mastery literature agree on the fix: credentials attest _artifacts_ (a capstone deployed to devnet through our build server), not lesson completion. We already stamp course version into credential metadata at mint; the capstone requirement is the missing half.

**3.4 Streaks as implemented.**
Daily streaks with hard resets contradict three findings: single missed days don't derail habit formation; broken streaks actively demotivate and drive abandonment (JCR 2023); forgiveness mechanics increase engagement (RCT + field experiments). Also, our stated goal is _weekly_ return, but our streak mechanic prices _daily_ obligation — a cadence mismatch. We ship the punishment without the retention insurance.

**3.5 One linear path vs three segments.**
The strongest contradiction in the report. Expertise reversal is a confirmed true reversal: the worked-example scaffolding that segment-3 beginners need (d=+0.505) actively harms segment-2 web3 devs (d=−0.428) when forced through the same lesson flow. Today all three segments get identical lessons and identical challenge scaffolding. Tracks must differ in _guidance level_ — worked examples and Parsons rungs for beginners, problem-first with examples-on-demand for experienced devs — not merely in which courses they're pointed at.

**3.6 Read-then-code-once lesson flow (bonus, unprompted).**
Lessons are exposition followed by one challenge, then never revisited. Active/problem-first instruction (+0.47 SD), retrieval practice (g≈0.5), and spacing (d≈0.5) all point the other way: attempt-first openings, retrieval closings, and scheduled re-exposure. Daily quests currently push new content — the evidence says their highest use is carrying old-item review, because voluntary SRS adherence collapses (60%→8%) unless the engagement loop carries it.

---

## 4. Prioritized Roadmap

| #   | P   | Action                                                                                                                                                                               | Keep/Change/Add | Key evidence                                                                                                                | Segments                  | Weight                                                                 |
| --- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ---------------------------------------------------------------------- |
| 1   | P0  | Spaced-review daily quests: resurface challenge variants + retrieval items from completed lessons on a fixed 1/3/7/21-day Leitner schedule keyed to per-lesson skill tags            | Add             | Spacing d≈0.5 (CONFIRMED); retrieval g≈0.5 (CONFIRMED); Anki adherence collapse; HLR "any scheduler" result                 | all                       | frontend + content                                                     |
| 2   | P0  | Per-lesson retrieval close: 1–3 short-answer/code-prediction items with explanatory feedback, gating the lesson's XP                                                                 | Change          | Retrieval CONFIRMED; feedback erases the success-rate boundary (Rowland); feedback-timing null                              | all                       | content + frontend                                                     |
| 3   | P0  | Streak forgiveness: earned streak freezes, missed-day repair, and a weekly-cadence streak track aligned to the weekly-return goal                                                    | Change          | RCT streak salience; Sharif & Shu reserves; broken-streak abandonment (JCR); habit science                                  | all                       | frontend                                                               |
| 4   | P0  | North-star metric: weekly return of previously-active learners in PostHog; 10–12 week evaluation windows on all mechanics                                                            | Add             | MOOC baselines; Brazilian CS1 novelty trough; Duolingo metric discipline (mechanism WEAKENED, practice sound)               | —                         | frontend (analytics)                                                   |
| 5   | P1  | Segment-differentiated challenge ladder in the content schema: worked example → subgoal-labeled → Parsons → write; entry rung by declared segment/prior performance                  | Change          | Expertise reversal CONFIRMED (d=+0.505/−0.428); subgoals (WEAKENED, cheap); Parsons (WEAKENED, cheap)                       | beginners + web3devs esp. | content schema + frontend (Parsons component)                          |
| 6   | P1  | Capstone-gated credentials: each course's soulbound NFT requires a working program deployed to devnet, verified via the existing build server; stamped in credential metadata        | Change          | fCC artifact model; PBL g≈0.66–0.71 (implementation-sensitive → scaffold milestones); mastery gating d≈0.5 course-aligned   | web2devs + web3devs       | frontend + build-server + content (on-chain metadata already supports) |
| 7   | P1  | Leaderboard reform: weekly small-cohort leagues (~30) with resets, or nearby-rank relative view; global all-time board demoted/opt-in; league XP weights first-time challenge passes | Change          | Leaderboard backfire (Hanus & Fox); coasting/ego-grind experiment; farmability poisons ranking                              | all                       | frontend + db                                                          |
| 8   | P1  | XP/notification copy audit (PT-BR/ES/EN): all gain messaging informational ("you can now X"), never controlling or monetary; surprise XP bonuses for delight                         | Change          | Overjustification CONFIRMED; informational vs controlling (WEAKENED but only guidance available); unexpected rewards d=0.01 | all                       | content-only                                                           |
| 9   | P1  | Earn pipeline: course completion → curated Superteam Earn bounty/gig shortlist surfaced in-app at the post-credential moment                                                         | Add             | Survivor pattern (pipeline); badge-cliff evidence (post-reward reset needs a bridge); Cyfrin/RareSkills models              | web2devs + web3devs       | frontend                                                               |
| 10  | P2  | Session-end if-then planner: "When's your next lesson?" event-anchored picker feeding reminders                                                                                      | Add             | Implementation intentions d=0.65 (health-domain caveat)                                                                     | all                       | frontend                                                               |
| 11  | P2  | Solution-reveal XP price: solutions stay public (open-book stands) but one-click in-app reveal costs a share of lesson XP                                                            | Add             | Boot.dev pattern; norm-friction without policing                                                                            | beginners                 | frontend                                                               |
| 12  | P2  | Interleaved review sets for confusable concepts (PDA vs ATA, CPI account lists, Anchor constraints) inside review quests only                                                        | Add             | Interleaving g≈0.34 for confusables; harmful for prose                                                                      | web2devs + web3devs       | content-only                                                           |
| 13  | P2  | AI-assistant post-pass idiomatic review: "it passes; here's the idiomatic Rust/Anchor way"                                                                                           | Add             | Exercism 80% mechanizable; feedback-quality > timing                                                                        | web2devs + web3devs       | frontend                                                               |
| 14  | P2  | Challenge-first lesson pilot (one course): open the Monaco pane with a small attempt before exposition                                                                               | Change          | Active learning +0.47 SD; Brilliant pattern (no platform efficacy data)                                                     | all                       | content-only                                                           |

**Detail on the P0s:**

**#1 Spaced-review quests.** This is the highest evidence-density gap: both CONFIRMED heavyweight effects (spacing, retrieval), an adherence mechanism we already own (daily quests + streaks), and a substrate already shipped (#466 per-lesson skill tags). Do not build a memory model — fixed intervals, review items = existing challenges with varied inputs (aligns with the hidden-test anti-hardcode principle) plus short recall questions. A daily quest becomes "clear your 3 due reviews." Transfer caveat applies: write review items as elaborated retrieval (why/predict-the-output), not verbatim recall.

**#2 Retrieval close per lesson.** Cheapest learning upgrade. Design constraints from the evidence: immediate explanatory feedback on every item (this removes the success-rate boundary condition), items calibrated so most learners succeed, open-book compatible. Content-authoring change plus one quiz component.

**#3 Streak forgiveness.** Ship freezes _before_ increasing streak prominence anywhere. A missed day must never zero visible progress. Add a weekly streak ("active N weeks running") as the headline metric — it matches the platform goal and habit-science cadence tolerance.

**#4 Metric.** Without this, every other item gets judged by week-3 novelty noise. Also instrument the post-credential cliff (activity 14 days after each mint) now, so #9's bridge has a baseline.

---

## 5. What NOT to Build

- **An ML spaced-repetition model.** HLR's discrimination was near-chance (AUC ~0.54, independently benchmarked as mediocre). Leitner captures the value. [https://github.com/open-spaced-repetition/srs-benchmark]
- **Leaderboard prizes, XP→token bridges, or any monetary salience for XP.** The d=−0.88 configuration, plus the entire airdrop-extraction literature. Soulbound illiquidity is the moat — don't breach it.
- **Anti-cheat / plagiarism policing for challenges.** Answer keys go public day one at every scale tested (Coinbase Earn's SEO industry). Ours are public by design; integrity lives in capstones (#6), not detection.
- **More badges/achievements as a retention strategy.** >40% of active users unaffected; steered users quit right after earning. Badges decorate; they don't retain.
- **Delayed-feedback machinery.** Timing effect is g=0.03. Zero engineering here; spend on feedback content.
- **Synchronous pair-programming infrastructure.** Fragile evidence, later nulls, publication bias. Forum "debug together" threads at most.
- **Notification bandit optimization.** Duolingo's ceiling was +0.5% DAU at hundreds of millions of sends. At our scale: a small rotating template pool triggered by streak state and due-reviews, volume held flat.
- **Learn-to-earn positioning.** The category converged to marketing-quests (RabbitHole pivot); surviving education brands sell skill and jobs. Describe Academy as skill→work, never L2E.
- **A personality-keyed brand.** Buildspace's confirmed lesson. Keep Academy institutionally owned.

---

## 6. Open Questions Worth an Experiment

1. **Does a mastery gate depress completion more than it improves learning?** A/B: challenge-pass required for next-lesson XP vs advisory. Metrics: course completion rate, 21-day skill-tag review accuracy, weekly return. Evidence says gate at a high bar (90%+) helps weaker learners; risk is funnel drop in a free product where baseline completion is already single-digit.
2. **Weekly vs daily streak cadence.** A/B headline streak unit. Metric: weekly return of previously-active learners (north star), streak-break abandonment rate. Habit science predicts weekly wins; Duolingo lore predicts daily.
3. **Parsons rung for Rust: does it reduce the Anchor-course cliff?** Add Parsons pre-exercises to the two highest-drop lessons only. Metric: lesson-level drop-off (Boot.dev located 10–24% drops at hardest chapters), time-to-first-pass. Evidence is intro-level; Rust/Anchor is not — genuine uncertainty.
4. **League cohort size and composition.** If #7 ships: 30-person engagement-matched vs nearby-rank window. Metric: participation of bottom-half learners after 3 weeks (the disengagement zone in the rank experiment).
5. **Post-credential bridge.** On mint, immediately surface next course pre-seeded with endowed progress + an Earn shortlist vs plain congratulations. Metric: 14-day post-mint activity (measure the cliff first — Stack Overflow data predicts near-zero for steered users).
6. **Challenge-first lessons.** Flip one course to attempt-before-exposition. Metric: lesson completion, challenge first-pass rate, 7-day retention of that cohort. Productive-failure evidence is strong in STEM classrooms, untested in our UI.
7. **Do review quests move real skill?** After 8+ weeks of #1: compare capstone build-server pass rates of high-review-adherence vs low-adherence learners (controlling for prior XP velocity). This is our transfer check — the literature warns transfer is the weak edge of retrieval practice.

---

## 7. Full Source List

**Learning science**

- Adesope et al. 2017 via Greving & Richter 2018 — https://pmc.ncbi.nlm.nih.gov/articles/PMC6288371/
- Yang et al. 2021, Psych Bull — https://gwern.net/doc/psychology/spaced-repetition/2021-yang.pdf ; https://pubmed.ncbi.nlm.nih.gov/33683913/
- Sotola & Crede 2021 — https://eric.ed.gov/?id=EJ1296076
- Pan & Rickard 2018 (transfer) — https://pdf.retrievalpractice.org/transfer/Pan_Rickard_2018.pdf
- Rowland 2014 — https://pubmed.ncbi.nlm.nih.gov/25150680/
- McDermott et al. 2014 — https://pubmed.ncbi.nlm.nih.gov/24274234/
- Karpicke & Aue 2015 — https://link.springer.com/article/10.1007/s10648-015-9309-3
- Classroom spacing meta 2025 — https://pmc.ncbi.nlm.nih.gov/articles/PMC12189222/
- Cepeda et al. 2006 — https://www.yorku.ca/ncepeda/publications/CPVWR2006.html ; 2008 — https://laplab.ucsd.edu/articles/Cepeda%20et%20al%202008_psychsci.pdf
- Donovan & Radosevich 1999 — https://gwern.net/doc/psychology/spaced-repetition/1999-donovan.pdf
- Latimier et al. 2021 — https://link.springer.com/article/10.1007/s10648-020-09572-8
- Brunmair & Richter 2019 (interleaving) — https://www.psychologie.uni-wuerzburg.de/fileadmin/06020400/2019/Brunmair_Richter_in_press__2019_META-ANALYSIS_OF_INTERLEAVED_LEARNING.pdf
- Kalyuga et al. 2003 (expertise reversal) — https://mrbartonmaths.com/resourcesnew/8.%20Research/Explicit%20Instruction/The%20Expertise%20Reversal%20Effect.pdf
- Tetzlaff et al. 2025 meta — https://www.sciencedirect.com/science/article/pii/S0959475225000660
- Barbieri et al. 2023 (worked examples) — https://www.danamillercotto.com/uploads/4/7/7/2/47725475/barbieri_et_al__2023__we_meta-analysis.pdf
- Margulieux et al. 2020 (subgoals) — https://link.springer.com/article/10.1186/s40594-020-00222-7
- Ericson/Guzdial (Parsons) — https://computinged.wordpress.com/tag/parsons-problems/ ; https://dl.acm.org/doi/10.1145/3141880.3141895 ; https://dl.acm.org/doi/10.1145/3411764.3445292 ; https://arxiv.org/pdf/2211.09609
- Kulik et al. 1990 via Nintil review (mastery) — https://nintil.com/bloom-sigma/
- PBL multi-method 2026 — https://www.nature.com/articles/s41599-026-06684-4
- Feedback-timing meta 2026 — https://link.springer.com/article/10.1007/s10648-026-10117-8
- Umapathy & Ritzhaupt 2017 (pairs) — https://eric.ed.gov/?id=EJ1252509

**Motivation & gamification**

- Sailer & Homner 2020 — https://eric.ed.gov/?id=EJ1245270
- Huang et al. 2020 — https://link.springer.com/article/10.1007/s11423-020-09807-z
- Bai, Hew & Huang 2020 — https://www.semanticscholar.org/paper/4baea6e6ca74597feaa6ce691c41577a67e87b54
- Huang & Ritzhaupt 2020 — https://eric.ed.gov/?id=EJ1266144
- SDT gamification meta 2023 — https://link.springer.com/article/10.1007/s11423-023-10337-7
- Deci, Koestner & Ryan 1999/2001 — https://home.ubalt.edu/tmitch/642/articles%20syllabus/Deci%20Koestner%20Ryan%20meta%20IM%20psy%20bull%2099.pdf ; https://www.selfdeterminationtheory.org/SDT/documents/2001_DeciKoestnerRyan.pdf
- Cameron/Pierce exchange — https://journals.sagepub.com/doi/10.3102/00346543071001029 ; https://journals.sagepub.com/doi/10.3102/00346543071001043
- Duolingo streaks (company) — https://blog.duolingo.com/how-duolingo-streak-builds-habit/ ; https://blog.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals/
- Peru streak RCT — https://www.nber.org/papers/w34173
- Sharif & Shu — https://journals.sagepub.com/doi/abs/10.1509/jmr.15.0231 ; https://anderson-review.ucla.edu/wp-content/uploads/2021/03/Sharif-Shu_EmergencyReserveFailure_OBHDP2019.pdf
- Silverman & Barasch 2023 (broken streaks) — https://academic.oup.com/jcr/article/49/6/1095/6623414
- Lally & Gardner (habit) — https://www.cykelvaeksthuset.dk/media/az3linp0/promoting-habit-formation.pdf
- Leaderboard rank experiment — https://www.emerald.com/insight/content/doi/10.1108/intr-12-2021-0897/full/html
- Hanus & Fox 2015 — https://www.sciencedirect.com/science/article/abs/pii/S0360131514002000
- Brazilian CS1 novelty study — https://link.springer.com/article/10.1186/s41239-021-00314-6
- Kivetz et al. 2006 (goal gradient) — https://home.uchicago.edu/ourminsky/Goal-Gradient_Illusionary_Goal_Progress.pdf
- Hoernle et al. (phantom steering) — https://arxiv.org/pdf/2002.06160
- Gollwitzer & Sheeran 2006 — https://cancercontrol.cancer.gov/sites/default/files/2020-06/goal_intent_attain.pdf

**Modern apps**

- Duolingo HLR paper — https://research.duolingo.com/papers/settles.acl16.pdf ; repo — https://github.com/duolingo/halflife-regression/blob/master/README.md ; critique — https://papousek.github.io/analysis-of-half-life-regression-model-made-by-duolingo.html
- srs-benchmark — https://github.com/open-spaced-repetition/srs-benchmark ; https://expertium.github.io/Benchmark.html
- Mazal / Lenny's Newsletter — https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth
- Duolingo leagues analysis — https://duolingo.deconstructoroffun.com/mechanics/leagues
- KDD 2020 notification bandit — https://www.kdd.org/kdd2020/accepted-papers/view/a-sleeping-recovering-bandit-algorithm-for-optimizing-recurring-notificatio.html
- Duolingo SEC 10-Q — https://www.sec.gov/Archives/edgar/data/1562088/000156208822000061/duol-20220331.htm ; Statista DAU — https://www.statista.com/statistics/1309604/duolingo-quarterly-dau/
- Freeman et al. 2014 — https://pmc.ncbi.nlm.nih.gov/articles/PMC4060654/
- Brilliant — https://brilliant.org/about/
- Anki cohort — https://pmc.ncbi.nlm.nih.gov/articles/PMC10403443/
- Agarwal retrieval guide — https://pdf.retrievalpractice.org/MetaAnalysisGuide.pdf
- Exercism — https://exercism.org/blog/automated-mentoring-support-project
- freeCodeCamp — https://www.freecodecamp.org/news/freecodecamp-certifications/
- LeetCode critique — https://firecode.io/firelogs/log/why-leetcode-grind-is-broken
- Khan/SRI — https://blog.khanacademy.org/sri-internationals-research-report-shows-positive/
- Boot.dev — https://www.boot.dev/blog/education/state-of-learning-to-code-2024
- 2023 gamification meta (weak, noted) — https://pmc.ncbi.nlm.nih.gov/articles/PMC10591086/

**Web3 market**

- Cyfrin Updraft — https://www.cyfrin.io/updraft ; First Flights docs — https://docs.codehawks.com/first-flights ; https://support.cyfrin.io/en/articles/10060302-what-is-a-codehawks-first-flight
- RareSkills — https://rareskills.io/web3-blockchain-bootcamps ; Course Report — https://www.coursereport.com/schools/rareskills ; SwitchUp — https://www.switchup.org/bootcamps/rareskills
- Buildspace post-mortems — https://www.therunway.ventures/p/buildspace ; https://eightception.com/buildspace-edtech-startup-case-study/ ; Farza letter — https://x.com/FarzaTV/status/1827030900456169849 ; raise — https://tokeninsight.com/en/news/web3-builders-network-buildspace-raises-10m-led-by-a16z
- MOOC pivot (Reich & Ruipérez-Valiente) — https://www.insidehighered.com/digital-learning/article/2019/01/16/study-offers-data-show-moocs-didnt-achieve-their-goals ; https://www.edsurge.com/news/2019-01-10-article-in-journal-science-argues-mooc-participation-is-declining-as-providers-pivot
- Coinbase Earn answer keys — https://rushradar.com/coinbase-learn-and-earn-answers/ ; https://techozu.com/coinbase-earn-quiz-answers/ ; https://www.bitget.com/academy/coinbase-quiz-guide
- Airdrop extraction — https://arxiv.org/abs/2312.02752 ; https://arxiv.org/abs/2503.14316 ; https://coinlaw.io/token-airdrop-statistics/ (low-rigor aggregator, flagged)
- Sybil corrections — https://cointelegraph.com/news/layerzero-concludes-sybil-self-reporting-phase ; https://research.nansen.ai/articles/linea-airdrop-sybil-detection ; https://www.theblock.co/post/335979/linea-filters-over-half-a-million-sybil-addresses-from-upcoming-token-airdrop
- Alchemy University — https://www.alchemy.com/university
- LearnWeb3 — https://learnweb3.io/minis/
- Encode Club — https://www.encodeclub.com/programmes/solana-rust-bootcamp
- Electric Capital 2024 (via secondary) — https://www.chaincatcher.com/en/article/2156880
