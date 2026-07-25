# Personalization & Launch-Catalog Research — Superteam Academy

**Date:** 2026-07-25 · **Status:** Final deliverable (4 pillars, adversarially verified; REFUTED claims dropped, WEAKENED caveats carried inline)
**Evidence tiers:** A = peer-reviewed/meta-analysis or large field experiment · B = platform first-party data with concrete numbers · C = practitioner case study/teardown · D = marketing-tier (anti-citation only)

---

## 1. Executive Summary

The evidence is unambiguous about **where personalization pays**: inside lessons (step-level feedback, retrieval, challenge ladders — ITS effects up to d≈0.66, though the meta-analytic range is ~0.1–0.66), **not** at the catalog level. Independent evaluation of adaptive courseware found **zero of 23 courses moved completion** (SRI/ALMAP), and even Stanford/MIT-grade ML targeting of nudges was statistically indistinguishable from doing nothing (PNAS 2020). For a 6-course catalog, "personalization" collapses to a **3-way segment routing rule plus framing** — no recommender, no mandatory diagnostic, no AI onboarding.

The onboarding design that survives the evidence is small: **lesson 1 before signup** (Duolingo self-reported ~20% DAU lift — the single best-evidenced onboarding change), **two tap-only questions** (verifiable-history experience fork + goal), an **optional value-relevance micro-reflection** (the _only_ nudge that replicated at scale, specifically for learners in less-developed countries — the strongest LATAM-specific finding in the literature), a **daily-goal picker** wired to the existing quest/streak system, and an **optional test-out** instead of placement. Self-rated skill questions are banned (self-assessment correlates r=.29 with actual ability). Question screens are not friction; **data-entry fields and walls before value are** (Duolingo runs a very long question-based onboarding at ~$1.17B ARR).

On the catalog: Superteam Earn demand data ($15.15M lifetime, dev bounties scarce-but-rich at $1k–$5k with ≤12 submissions vs content bounties poor-and-crowded; **Superteam Brasil currently the most active dev-bounty sponsor on the platform**) says the flagship is the existing 4-course spine packaged as **one path — "Zero to Deployed Solana Program"** — with **building-your-first-solana-program** polished deepest as the Ackee-style deploy-gated capstone, terminating in an explicit Superteam Earn/grant submission step (Brazil grants avg $5.52k). Biggest catalog gaps: a **JS/TS entry rung for segment 3** (no surviving platform teaches coding-from-scratch via Rust), a **stablecoin-payments module** (90% of Brazil's $318B crypto volume is stablecoins; Solana leads global stablecoin transfer share), and an **AI-agents-on-Solana course** (TS-first, live bounty demand) as fast-follow #1. **defi-on-solana ships trimmed or holds** — protocol deep-dives are everyone's endgame content, never launch content. Do not build: Pinocchio course, ZK, a full security course, or any recommendation infra.

Honest expectations: self-paced completion will be far below Ackee's 13% mentored-cohort ceiling; the 15x MOOC completion gap between drop-ins and committed learners means the commitment devices (cohort leagues, streaks, capstone credential) are the whole game. Launch KPI = **capstone deploys + Earn submissions**, not signups.

---

## 2. Verified Findings by Pillar

### 2.1 Personalization science

| #   | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Tier              | Verdict                  |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------ |
| S1  | Step-level tutoring inside lessons is high-yield: ITS median d=0.66 across 50 controlled evaluations (Kulik & Fletcher 2016). **Caveat (WEAKENED):** 0.66 is the optimistic upper bound — other meta-analyses find g≈0.01–0.42 (Steenbergen-Hu & Cooper; Ma et al. 2014); effects shrink on standardized tests. Treat the range as ~0.1–0.66; the "highest-yield form of personalization" superlative is untested. [https://eric.ed.gov/?id=EJ1090502] [https://journals.sagepub.com/doi/abs/10.3102/0034654315581420] | A                 | WEAKENED                 |
| S2  | Catalog-level adaptive personalization does not move completion: ALMAP (23 courses, 14 institutions, ~19,500 students) — **no course showed completion effects**; 11/15 no grade impact; modest assessment gains in 7 courses (of those with adequate data). Decade-old courseware, but no comparably independent evaluation contradicts it since. [https://www.insidehighered.com/news/2016/06/23/study-finds-inconclusive-results-about-efficacy-adaptive-learning]                                                  | A/B               | CONFIRMED                |
| S3  | Planning prompts raised MOOC completion 29% (14→18pp) in the original 3-course HarvardX experiment (n=2,053). [https://par.nsf.gov/servlets/purl/10164956]                                                                                                                                                                                                                                                                                                                                                             | A                 | CONFIRMED                |
| S4  | …and **failed to replicate at scale**: 247 MOOCs, 269,169 students — completion β=0.19pp, p=0.67; only week-1 activity rose (p<0.05), dissipating within the first few weeks. Never cite 29% as expected effect. [https://par.nsf.gov/servlets/purl/10164956]                                                                                                                                                                                                                                                          | A                 | CONFIRMED                |
| S5  | **Value-relevance writing is the one intervention that replicated at scale**: +2.79pp / +2.74pp completion (two preregistered years) for learners in less-developed countries in courses with a global achievement gap; it _lowered_ completion (−1.6 to −1.7pp) in no-gap courses — target it, don't blanket it. Scaled effect is an order of magnitude smaller than the original 17%→41% result. [https://par.nsf.gov/servlets/purl/10164956]                                                                        | A                 | CONFIRMED                |
| S6  | Implementation intentions (if-then plans) are the mechanism behind goal effects: d=0.65 on goal attainment (94 tests); bare goal declaration is weak (~47% of strong intenders fail to act). Domain-general; moderated downward in MOOCs per S4. [https://cancercontrol.cancer.gov/sites/default/files/2020-06/goal_intent_attain.pdf]                                                                                                                                                                                 | A                 | (carried, caveat inline) |
| S7  | Choice buys motivation (d=0.30), effort (0.22), task performance (0.32) but **not learning** (d=0.10, ns); best as 2–4 guided options, strongest for instructionally irrelevant choices (Patall et al. 2008; heterogeneity significant, pre-online-learning corpus — direction solid, exact d's imprecise for course design). [https://selfdeterminationtheory.org/wp-content/uploads/2019/10/2008_PatallCooperRobinson_PsychBulletin.pdf]                                                                             | A                 | CONFIRMED                |
| S8  | Choice overload is conditional on preference uncertainty and set complexity — exactly the novice condition when all 6 course titles are jargon. Fix = translate the choice into the learner's own vocabulary. [https://chernev.com/wp-content/uploads/2017/02/ChoiceOverload_JCP_2015.pdf]                                                                                                                                                                                                                             | A                 | (carried)                |
| S9  | Expertise reversal is asymmetric: novices with high-guidance instruction d=0.505; experts with low guidance d=−0.428. Guidance helps novices more than it hurts experts → **default to guidance when uncertain**. [https://tipsforteachers.substack.com/p/research-bite-51-a-cornerstone-of]                                                                                                                                                                                                                           | A (via secondary) | (carried)                |
| S10 | Self-placement is unreliable: self-evaluated ability vs objective performance r=.29 across 22 meta-analyses; accuracy improves only for specific, objective, familiar probes → ask verifiable history ("have you shipped a JS app?"), never "rate your Rust skill". [https://pubmed.ncbi.nlm.nih.gov/26173249/]                                                                                                                                                                                                        | A                 | (carried)                |
| S11 | Recommender systems are irrelevant at 6 courses: no credible randomized evidence of course-recsys completion lifts exists; PNAS personalized-policy arm: 13.38% vs 12.81% control vs 13.08% random — all indistinguishable. [https://par.nsf.gov/servlets/purl/10164956]                                                                                                                                                                                                                                               | A + absence       | (carried)                |

### 2.2 Implementation patterns (practitioner consensus — labeled as such)

| #   | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Tier                 | Verdict            |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | ------------------ |
| I1  | Delayed signup after core value: Duolingo self-reports ~20% DAU from moving the signup wall later. **Caveat (WEAKENED):** the 8.2% figure is the _cumulative_ effect of all subsequent wall optimizations over three years, not the "Later"-copy tweak alone; all figures self-reported circa 2017. [https://review.firstround.com/the-tenets-of-a-b-testing-from-duolingos-master-growth-hacker/]                                                                                                                    | A (practitioner A/B) | WEAKENED           |
| I2  | Long question-based onboarding coexists with best-in-class monetization: Duolingo runs a very long guided intake (the exact "38 screens" count is single-sourced; treat qualitatively) at ~$1.17B annualized revenue and **9.1% paid share of MAU** (metric is paid-share, not signup-cohort conversion). Commitment-building tap questions ≠ form friction. [https://tasu.ai/library/duolingo] [https://www.stocktitan.net/sec-filings/DUOL/8-k-duolingo-inc-reports-material-event-6974ab47316e.html]               | B/C                  | WEAKENED           |
| I3  | Form-field friction is real but **use these numbers, not the viral ones**: form conversion falls ~23.1% at 3 fields → 11.4% at 7 (Digital Applied 2026); ~67.8% abandonment past 7 fields (Formstack 2025, n=1,500). The widely-cited "44.7% / 38.4%→24.1% / +29.3% SSO" figures failed provenance checks (untraceable to any primary study) — **do not cite them**. [https://www.digitalapplied.com/blog/form-conversion-rate-benchmarks-2026-data-points] [https://formstory.io/learn/form-abandonment-statistics/] | C (corrected)        | WEAKENED→corrected |
| I4  | Duolingo's personalization payload is small: goal/motivation, experience fork (with optional placement for "know some"), plus a daily-goal commitment; level answer sets the entry point. **Caveat:** the claim that the motivation answer powers messaging is unsupported inference — the confirmed 5% DAU notification win was a generic copy A/B. [https://goodux.appcues.com/blog/duolingo-user-onboarding]                                                                                                       | C                    | WEAKENED           |
| I5  | Placement as optional, reversible skip-ahead is the pattern both Duolingo and Khan chose (Khan: course challenges level skills up/down; district reported 33% higher NWEA MAP growth at 30+min/wk — correlational). No published A/B on any placement step exists; this is convergent design choice, not measured superiority. [https://blog.khanacademy.org/school-district-reports-test-scores-rise-with]                                                                                                           | B/C                  | CONFIRMED          |
| I6  | Boot.dev: one opinionated track, 336,271 users, 18,255 paying, 10.7M lesson completions; drop-off concentrates at **concept-difficulty spikes** (Go structs/interfaces/slices chapters: 24%/14%/22%), not choice points; 11.7% of successful submissions are voluntary re-attempts (retrieval appetite is real). First-party, unaudited; onboarding drop-off out of report scope. [https://www.boot.dev/blog/education/state-of-learning-to-code-2024]                                                                | B                    | CONFIRMED          |
| I7  | Role-based path presentation relieves choice paralysis (Coursera Career Learning Paths — directional enrollment lift, small-n case study; mechanism named by users: "options neatly ranked"). [https://www.nancylee.design/coursera-clp]                                                                                                                                                                                                                                                                              | C                    | (carried)          |
| I8  | Codewars: adaptive difficulty with zero diagnostic — self-selection plus an incentive gradient (solving above rank ≈ up to 30% rank progress; 2 levels below ≈ 0.3%). Directly transplantable to the challenge ladder. [https://docs.codewars.com/gamification/ranks/]                                                                                                                                                                                                                                                | B                    | (carried)          |
| I9  | Zero-personalization control: Exercism (83 tracks, free, no goal/placement/recs) sustains a large community — no one has shown track-choice-only harms retention. Floor option if engineering time runs out. [https://exercism.org/about]                                                                                                                                                                                                                                                                             | B/D                  | (carried)          |
| I10 | Anti-citation: Brilliant's much-imitated quiz onboarding has **no public measured results anywhere**. "Brilliant does it" is pattern-matching, not evidence. [https://trysavvy.com/example/brilliant-onboarding]                                                                                                                                                                                                                                                                                                      | D                    | (carried)          |

### 2.3 Solana skill demand & Superteam Earn

| #   | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Tier                       | Verdict   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | --------- |
| D1  | Superteam Earn lifetime: **$15,152,870 across 3,048 listings** (~$4,971 avg), 201,110 members, 2,600+ sponsors; payout velocity ~$1M/month and accelerating. Side-income scale, not job-replacement scale. Distribution heavily skewed; "66 members/listing" is structural, not an actual competition rate. [https://superteam.fun/earn/all/]                                                                                                                                                                             | B (live scrape 2026-07-25) | CONFIRMED |
| D2  | Dev bounties scarce-but-rich: exactly 6 open dev listings globally ($5k, $5k, $3.9k, $2k, $1k + 1 quote-based; 0–12 submissions). Content/design: ~20 listings, $120–$3,000. **Caveat (WEAKENED):** only the popular content tail draws 14–51 submissions; median content bounty competition overlaps dev range. Asymmetry direction holds; single-day snapshot. [https://superteam.fun/earn/category/development/]                                                                                                       | B                          | WEAKENED  |
| D3  | **Superteam Brasil is the most active dev-bounty sponsor on all of Earn right now**: 2 of 6 global dev bounties (Zeroclaw $5,000 USDG; Privacy-Through-Noise $3,900 USDG) + design/UNICEF listings; World Cup Hackathon Brasil just paid 5 Brazilian winners; Foundation Brazil grants avg **$5.52k** (up to $10k USDG). Ephemeral by nature, but the pipeline is live today. [https://superteam.fun/earn/all/]                                                                                                           | B                          | CONFIRMED |
| D4  | Salaried market: 3,226 Solana-tagged jobs on web3.career, majority frontend/full-stack/non-program (frontend $64–110k, fullstack $160–190k); 87% of web3 roles remote (crypto.jobs, all-web3 figure). Tag count includes noise — discount "large" accordingly. [https://web3.career/solana-jobs] [https://crypto.jobs/most-in-demand-web3-skills-2026]                                                                                                                                                                    | B (market)                 | CONFIRMED |
| D5  | "90% of web3 jobs are web2 skills" has no canonical source — directionally true for job COUNT, **inverted for PAY**: smart-contract security +$110k ("critical shortage"), Rust +$95k, DeFi +$90k (crypto.jobs, n=180 with salary data — direction solid, dollar magnitudes indicative only). [https://crypto.jobs/most-in-demand-web3-skills-2026]                                                                                                                                                                       | B                          | CONFIRMED |
| D6  | Stablecoin payments is the Foundation's loudest strategic push: payments.org (Feb 2026); Solana ~32.6% of weekly adjusted stablecoin transfer volume (> Ethereum 27.8%); $650B Feb-2026 transfer volume; Visa/Stripe/Worldpay/Western Union (USDPT)/PayPal/Fiserv in production. **Caveat:** actual payments ≈ $300M/month — real but 3 orders of magnitude below the transfer-volume headline; don't conflate. [https://solana.com/news/state-of-solana-february-2026] [https://chainstack.com/solana-stablecoins-2026/] | B                          | CONFIRMED |
| D7  | **Brazil is a stablecoin market**: $318.8B received (LatAm's largest, #5 global); BCB chief: ~90% of Brazilian crypto volume is stablecoins; local stablecoin volume +207.7% YoY. Payments integration is THE locally-monetizable skill. [https://www.chainalysis.com/blog/latin-america-crypto-adoption-2025/]                                                                                                                                                                                                           | A/B (secondary)            | (carried) |
| D8  | AI-x-crypto is the fastest new demand wedge and it's **TypeScript-first**: Solana Agent Kit 95k+ npm downloads; 454-submission Colosseum agent hackathon; $500–$5k agent bounties; World Cup Hackathon (incl. Brasil edition) has a trading-agents track. [https://solana.com/news/state-of-solana-february-2026] [https://solanacompass.com/projects/sendai]                                                                                                                                                             | B                          | (carried) |
| D9  | Pinocchio is an elite niche (88–95% CU reductions; used by perf-critical infra); **Anchor remains the hiring default**. Not an earn-ability play at launch. [https://www.helius.dev/blog/pinocchio]                                                                                                                                                                                                                                                                                                                       | C                          | (carried) |
| D10 | Token-2022 extensions and security are the two highest-premium scarce skills the catalog can credibly teach (rate drivers into the $55–90/hr tier; live $2k vulnerability-hunt bounty on Earn). Generic "deploy an SPL token" work clusters at the rate floor — **saturated**. [https://lemon.io/for-developers/solana-developer-jobs/] [https://crypto.jobs/most-in-demand-web3-skills-2026]                                                                                                                             | B/C                        | (carried) |
| D11 | Solana leads all chains in new-developer onboarding (Electric Capital); growth is Asia-led — Brazil's edge is market/payments adoption + PT-BR delivery, **not** existing dev density. Basics won't differentiate; proof-of-work (deploys, bounty wins) will. [https://www.developerreport.com/ecosystems/solana]                                                                                                                                                                                                         | A/B (secondary)            | (carried) |

### 2.4 Launch-catalog strategy (comps)

| #   | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Tier              | Verdict                |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ---------------------- |
| C1  | Cyfrin Updraft: education as top-of-funnel for the audit business; self-reports 200K+ community, 1.5M+ lessons, 12 courses. **Caveat (WEAKENED):** 100% single-source marketing copy; the education→CodeHawks→audit pipeline is narrative, no conversion rates. Cite as "Cyfrin self-reports". [https://www.cyfrin.io/blog/cyfrin-2024-wrapup-growth-education-security]                                                                                                                                                                 | B (self-reported) | WEAKENED               |
| C2  | Updraft catalog = difficulty ladder in **7** career tracks (not 8): beginner basics incl. exactly one beginner Solana course; Foundry as intermediate flagship; Uniswap/Aave/GMX/Curve deep-dives advanced-only. Deep-Solana slot genuinely open. [https://updraft.cyfrin.io/courses]                                                                                                                                                                                                                                                    | B                 | WEAKENED (count fixed) |
| C3  | One free mega-course as acquisition engine: Collins' 30–32h freeCodeCamp course seeded Updraft (lineage plausible, not established); Solana Foundation leads with one 4-module Bootcamp + Crashcourse. **Caveat:** "always ONE" is overgeneralized — Updraft's current surface is a ~30-course free catalog; the "most popular blockchain course" quote belongs to Collins' _previous_ course. [https://www.freecodecamp.org/news/learn-blockchain-solidity-full-stack-javascript-development/] [https://solana.com/developers/bootcamp] | B/C               | WEAKENED               |
| C4  | RareSkills: paid cohorts (3–14 wks) + free SEO artifacts; 60 Days of Solana **explicitly requires EVM/Solidity background** — the best deep-Solana text abandons segments 1 and 3. [https://www.rareskills.io/solana-tutorial]                                                                                                                                                                                                                                                                                                           | B                 | CONFIRMED              |
| C5  | **Ackee School of Solana — closest comp to our credential model**: S7 1,515→197 grads, S8 1,113→142 (~13% both); 2025: 344 certified, 372 new repos; capstone = deploy an ORIGINAL program; credential = on-chain NFT. 13% is the honest ceiling for a selective, mentored, free cohort — expect far less self-paced. [https://ackee.xyz/blog/school-of-solana-2025-recap/]                                                                                                                                                              | B                 | CONFIRMED              |
| C6  | Alchemy University did NOT die; ChainShot's ~$3k bootcamp was acquired (TechCrunch-confirmed) and made a free infra loss-leader: 108K+ students — and **Learn JavaScript (35K+) out-enrolls the Ethereum flagship (28K+)**. Free education survives only as a funnel for something else; beginner web2 demand outstrips web3 flagships even on a web3 platform. [https://www.alchemy.com/university] [https://techcrunch.com/2022/08/25/crypto-developer-infrastructure-alchemy-acquisition-deal-ma-chainshot-coding-bootcamp/]          | B                 | CONFIRMED              |
| C7  | Breadth+gamification wins raw signups but publishes zero competence outcomes (LearnWeb3: 350K students, 336 modules, no outcome metrics; buildspace hit 125K and still shut down). Don't chase module count. [https://learnweb3.io/]                                                                                                                                                                                                                                                                                                     | B (vanity)        | (carried)              |
| C8  | MOOC evidence: completion 3.13%, 52% never start, but **verified/committed learners complete at 46–50%** — a 15x gap. Catalog size is not the retention lever; commitment is. First-lesson activation deserves flagship-level design. [https://www.insidehighered.com/digital-learning/article/2019/01/16/study-offers-data-show-moocs-didnt-achieve-their-goals]                                                                                                                                                                        | A (via secondary) | (carried)              |
| C9  | **No surveyed platform teaches programming-from-scratch through Solana/Rust.** Beginners get routed through JS (Alchemy), no-code intros (Cyfrin), or excluded (RareSkills). Absence-of-survivor evidence: don't market "learn to code via Solana programs" at launch. [https://www.alchemy.com/university] [https://updraft.cyfrin.io/courses]                                                                                                                                                                                          | Teardown          | (carried)              |
| C10 | PT-BR Solana content exists but is stale, translated, unstructured (WEB3DEV guides = 2022 translations; no structured current PT-BR curriculum found). The moat is original + current PT-BR content — staleness is the incumbents' visible weakness. [https://pt.w3d.community/bananlabs/o-guia-completo-para-desenvolvimento-full-stack-solana-com-react-anchor-rust-e-phantom-35bo]                                                                                                                                                    | Teardown          | (carried)              |
| C11 | Norms: flagship = 20–40h build-a-thing course; satellites 1–10h; cohorts 6–9 weeks; **nobody launches wide** (Updraft: beta → flagship → +9 courses over a year; Ackee: seasons of one program). Launch = polished spine + 2 satellites; post-launch cadence is itself marketing. [https://updraft.cyfrin.io/courses] [https://ackee.xyz/blog/school-of-solana-2025-recap/]                                                                                                                                                              | B                 | (carried)              |

---

## 3. DESIGN A — Personalization / Onboarding Flow

**Principle:** personalize the FRAMING and the ENTRY POINT, never the curriculum sequence. All screens tap-only, progress-indicated, no data-entry fields, no account until first XP.

### The flow (in order)

**Screen 0 — Land → "Start learning" (frontend)**
CTA drops the visitor into the intake, not a catalog grid. No email, no wallet. _Justified by:_ I1 (delayed signup ~20% DAU, self-reported), C8 (52% never start — activation is the bottleneck).

**Screen 1 — Experience fork (tap-only, 3 options; step 1 of 3) (frontend + content-schema)**
Phrased as verifiable history in the learner's own vocabulary, never self-rating (S10: self-assessment r=.29):

- "I build web apps (JS/TS)" → **Segment 1 (CORE web2)**
- "I already ship web3 / smart contracts" → **Segment 2 (web3 deepening)**
- "I'm new to programming" → **Segment 3 (beginner)**
  _Justified by:_ S7 (2–4 guided options), S8 (translate jargon into learner vocabulary), I4 (Duolingo's fork pattern). This single answer sets entry course, path, guidance level, and challenge-ladder entry rung.

**Screen 2 — Goal question (tap-only, 3 options; step 2 of 3) (frontend)**

- "Get paid Solana work (Superteam Earn)" / "Ship my first on-chain program" / "Learn to code, with real stakes"
  Consumed by: path framing copy, daily-quest copy, notification copy — **not** by curriculum. _Justified by:_ I4 (payload used for framing/start point; curriculum-reshaping is unsupported), S7 (choice buys motivation, not learning — so spend it where motivation lives).

**Screen 3 — Value-relevance micro-prompt (optional, skippable; step 3 of 3) (frontend)**
One short free-choice reflection: "In a sentence: why does becoming a Solana dev matter to you or people you care about?" Pre-seeded tappable chips (career, family income, building for Brazil) with optional text. _Justified by:_ S5 — the ONLY intervention that replicated at scale, specifically for learners in less-developed countries; the single strongest Brazil-relevant finding. Keep it skippable (it _harmed_ completion where no achievement gap exists — our EN/global users may be that population, so never force it; A/B by locale).

**Screen 4 — Daily-goal picker (frontend)**
"1 lesson/day (chill)" vs "3 lessons/day (serious)" — wired to the existing daily-quest targets, streak thresholds, and notification timing. Only ship because something already consumes the answer (I10 caveat: unconsumed answers are cargo cult). _Justified by:_ I2 (commitment questions ≠ friction), Duolingo's streak-complex wins (practitioner-consensus, self-reported).

**→ Path page ("Your path"), then straight into lesson 1.**
One default linear path per segment rendered from the existing `paths/` content — a sequenced list with one highlighted "start here" card, NOT a 6-card catalog grid (I7, C11, freeCodeCamp linear model). Full catalog remains reachable via a secondary "Browse all" link (S9: don't punish experts).

**Signup moment (frontend/auth):** triggered when the first XP would be minted — "Sign in to claim your XP" (SIWS or Google), with a "Later" escape that banks progress locally. _Justified by:_ I1; progress-at-stake is the value moment.

**End of first session — implementation-intention prompt (frontend):**
If-then form, two taps: "When will you do your next lesson?" (day + time → becomes the notification slot). NOT an aspiration menu. _Justified by:_ S6 (d=0.65 mechanism), S3/S4 (**expect a week-1 engagement lift only, which streaks/quests must catch — never project the 29% number; A/B it**).

### Segment → guidance level, entry rung, path

| Segment       | Entry course                                                         | Guidance (per S9 expertise-reversal asymmetry)             | Challenge-ladder entry rung                          |
| ------------- | -------------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------- |
| 3 — Beginner  | JS/TS pre-rung → solana-fundamentals (concepts/wallets/txs, no Rust) | **Fixed lesson-by-lesson path** (high assistance, d=0.505) | Rung 0: guided JS exercises                          |
| 1 — CORE web2 | solana-fundamentals → spine                                          | Path + visible **skip-ahead** per course                   | Rung 1: TS client challenges                         |
| 2 — web3 dev  | anchor-framework (or rust-for-solana if no Rust history)             | Open access + recommended order                            | Rung 2: program-level challenges; **test-out offer** |

**Test-out (content-schema + frontend):** segment 2 gets "skip solana-fundamentals via a 10-question course challenge" as an _offer, not a gate_; passing awards the lesson XP retroactively so skipping never costs leaderboard position. _Justified by:_ I5 (Duolingo/Khan convergent pattern; labeled design-choice, not measured superiority).

**Incentive-graded ladder instead of any diagnostic (content-schema):** XP per challenge scales with (challenge rung − user level), Codewars-style (I8) — learners self-place through incentives; no placement instrument to build or calibrate.

### What we deliberately DON'T ask

- "Rate your skill level" in any form (S10)
- Free-text required fields, email, or wallet before lesson 1 (I1, I3-corrected)
- Aspiration-only role menus ("I want to be a DeFi dev") — the cargo-cult version of S6
- More than 4 screens / anything a tap can't answer (I3: conversion roughly halves from 3 to 7 fields)
- Anything whose answer nothing consumes (I10)

### Cold-start with 6 courses

Static 3-way routing rule declared in `paths/` metadata (segment → entry course → sequence). Zero inference, zero models, no per-user state beyond the two answers. This IS the whole recommender (S11).

### Defer until catalog >20–30 courses

Recommendation infra of any kind, ML nudge-targeting (S11: 13.38% vs 12.81% — indistinguishable even at 250k users), adaptive sequencing, "AI-personalized onboarding" as a feature. Revisit only when browsing genuinely fails.

### Implementation surface summary

| Piece                                                                | Surface                                         |
| -------------------------------------------------------------------- | ----------------------------------------------- |
| Segment/goal/daily-goal screens, value-relevance prompt, plan prompt | frontend                                        |
| Delayed signup + "Later" local progress banking                      | frontend (auth flow)                            |
| Path page from `paths/` + per-segment entry metadata                 | content-schema + frontend                       |
| Test-out course challenges + retroactive XP                          | content-schema + frontend (+ existing XP route) |
| Incentive-graded challenge XP                                        | content-schema (rung metadata)                  |
| Recommender system                                                   | **none-needed**                                 |

---

## 4. DESIGN B — Launch Catalog Focus

### Course ranking vs demand evidence (earn-ability weighted for Brazil)

1. **building-your-first-solana-program — FLAGSHIP.** The capstone terminus of the spine; polish deepest. Why: the proven model is one build-a-thing flagship ending in proof-of-work (C3, C11); Ackee's deploy-an-original-program capstone is the validated credential shape (C5); Anchor is the hiring default (D9); dev bounties are the highest-EV rung on Earn (D2); a shipped capstone converts directly into a **$5.52k-avg Superteam Brazil grant application** (D3). The course must end with an explicit "submit this to Earn / apply as a grant" step — our Cyfrin-style funnel, with Earn playing the role CodeHawks plays for Updraft (C1, C6: free education survives only as a funnel for something else).
2. **anchor-framework** — spine; employability core (D5: Rust +$95k premium; D9: Anchor = hiring requirement). Differentiator vs RareSkills: aimed at JS/TS devs, no Solidity assumed — say it out loud in the intro (C4).
3. **solana-fundamentals** — spine entry + segment-3 landing (concepts/wallets/txs, Rust-free). Basics don't differentiate (D11) — its job is activation, not marketing.
4. **rust-for-solana** — spine; expect it to be our structs/interfaces/slices difficulty cliff (I6). Invest in smoothing it before any recommendation sophistication; instrument per-lesson drop-off day 1.
5. **solana-frontend** — segment-1 satellite; feeds the largest slice of real openings (D4), remote-eligible from Brazil. **Grow a stablecoin-payments module** (Solana Pay, Token-2022 transfers, on/off-ramp UX) — rides the Foundation's loudest push (D6) and Brazil's actual market (D7: 90% stablecoins).
6. **defi-on-solana — weakest launch case; trim or hold.** Demand data undermines it as conceived: protocol deep-dives are advanced endgame content at every comp (C2), generic token work is rate-floor saturated (D10), and DeFi-speculation topics rank below payments for Brazil (D7). Rescope later as "DeFi patterns + Token-2022 extensions + security capstone thread" — the two highest-premium teachable skills (D10, D5).

### Missing, in value order

1. **JS/TS entry rung for segment 3** (short "JS/TS for future Solana devs" pre-course or path rung, in-browser challenges). Required: no survivor teaches code-from-scratch via Rust (C9), and beginner web2 demand out-enrolls web3 flagships even on web3 platforms (C6: Learn JavaScript 35K > Ethereum Bootcamp 28K).
2. **Stablecoin-payments module** inside solana-frontend (not a separate course at launch) — the Brazil-first wedge (D6, D7).
3. **AI-agents-on-Solana course (TS, Agent Kit) — fast-follow #1.** Shortest bridge from segment-1 JS devs to live bounty/hackathon money (D8); arguably the biggest gap in the catalog, but not worth delaying launch.
4. **PT-BR original content throughout** — the moat: incumbent PT-BR material is stale 2022 translations (C10); consider a long-form PT-BR YouTube cut of the flagship path as the acquisition asset (C3 pattern, hedged: "one mega-course" is the common but not universal engine).

### Explicitly NOT at launch

Pinocchio course (elite niche, later "advanced/performance" module aligned with the platform's own mainnet plan — D9); protocol deep-dives (Uniswap-style endgame content — C2); ZK; a full security course (thread security thinking through the spine instead — C1); wallets/enterprise; "learn to code via Rust" marketing (C9); recommendation infra (S11); module-count chasing (C7).

### Segment ↔ catalog ↔ Earn pipeline map

| Segment     | Path                                                    | Terminal proof-of-work                   | Earn endpoint                                                                                                                                               |
| ----------- | ------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 CORE web2 | fundamentals → frontend (+payments module) → spine      | Deployed dapp + capstone program         | TS plugin/tooling bounties ($1k–$5k, ≤12 subs — D2); AI-agent bounties (D8); frontend jobs (D4)                                                             |
| 2 web3 dev  | rust-for-solana → anchor → capstone (test-outs offered) | Original devnet program + credential NFT | Dev bounties, $5.52k-avg Brazil grants (D3), security bounties (D10)                                                                                        |
| 3 beginner  | JS/TS rung → fundamentals → (later) spine               | First deployed dapp                      | Realistic promise: "first $500–$5,000 of paid Solana work" (D1) — not "a job"; content bounties exist but are the saturated rung we don't optimize for (D2) |

### Launch sequence

- **Day 1:** Flagship path "Zero to Deployed Solana Program" (4-course spine, ~25–40h total learner effort per C11, deploy-gated credential + Earn/grant handoff step) + solana-frontend satellite + JS/TS entry rung + Design-A onboarding. defi-on-solana held or shipped visibly trimmed.
- **Fast-follow cadence (public, dated — the cadence is marketing, C11):** (1) stablecoin-payments module; (2) AI-agents-on-Solana; (3) defi-on-solana rescoped with Token-2022 + security capstone thread; (4) Pinocchio/performance module much later.
- **KPI from day 1:** capstone deploys, credentialed devs, Earn submissions/wins from graduates — not signups (C5, C7, C8). Instrument per-lesson drop-off from day 1 (I6).

---

## 5. Where the Evidence Contradicts Our Current Plan/Assumptions

1. **Personalization will not move completion — stop expecting it to.** Catalog-level adaptivity moved completion in 0 of 23 independently evaluated courses (S2); ML nudge-targeting is indistinguishable from nothing (S11). Sell onboarding personalization internally as friction-reduction and activation, period.
2. **The planning-prompt lift we might be tempted to bank on (29%) is a failed replication.** Expect a week-1 engagement bump that streaks/quests must catch, nothing more (S4).
3. **"Keep onboarding minimal" is the wrong instinct in the wrong place.** Tap-question screens are fine at scale (I2); what kills funnels is fields and walls before lesson 1 (I1, I3). Our real current anti-pattern is the opposite: an unpersonalized catalog grid with (presumably) auth before value.
4. **defi-on-solana is mis-scoped for launch.** Deep-dive DeFi is endgame content at every surviving comp, and basic token work is rate-floor saturated. Brazil's market says payments > DeFi speculation (C2, D7, D10).
5. **Segment 3 as "learn to code via Solana" is unvalidated by any survivor — via Rust it's contradicted by everyone's structure.** Route beginners through JS/TS first; do not market Rust-first beginner learning (C9).
6. **Brazil is not a Solana dev-density hotbed — the wedge is the market, not the devs.** Electric Capital shows Asia-led dev growth (D11); Brazil's edge is stablecoin adoption + PT-BR content staleness of incumbents + live Superteam Brasil bounty supply (D3, D7, C10).
7. **Earn is side-income scale.** $15.15M lifetime / ~$5k avg listing (D1). The honest promise is "first $500–$5,000 of paid Solana work," not employment. Marketing copy must not quote Brazil earnings totals until verified — the region page publishes none.
8. **Ackee's 13% is the ceiling, not the target.** A selective, mentored, free cohort graduates 13%; self-paced will be far lower. Commitment devices (cohort leagues, capstone credential, streaks) are the entire completion strategy (C5, C8).

---

## 6. Experiments Worth Running Post-Launch

| #   | Experiment                                       | Metric                                                          | Expected direction                                                                            |
| --- | ------------------------------------------------ | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| E1  | Delayed signup vs signup-first wall              | Lesson-1 completion rate; D7 retention                          | Up (Duolingo self-reported ~20% DAU analog); our own number, not theirs                       |
| E2  | Implementation-intention prompt on/off           | Week-1 lessons; 30d course completion                           | Week-1 up (p<0.05 analog); completion **null** (preregister the null expectation)             |
| E3  | Value-relevance prompt, PT-BR/ES cohorts vs EN   | Course completion                                               | +2–3pp for PT-BR/ES (gap population); possible small negative for EN — gate rollout by locale |
| E4  | Per-lesson drop-off instrumentation (no variant) | Chapter-level attrition in rust-for-solana/anchor               | Locate our 24%/14%/22%-style cliffs; fix content before any rec infra                         |
| E5  | Test-out offer visibility for segment 2          | Test-out uptake; downstream spine completion of skippers vs non | Uptake >10%; completion non-inferior                                                          |
| E6  | Incentive-graded challenge XP vs flat XP         | Rung progression rate; challenge re-attempts                    | Progression up (Codewars mechanic); re-attempts up (I6: 11.7% voluntary re-attempt baseline)  |
| E7  | Segment-routing acceptance                       | % accepting recommended entry vs overriding via "Browse all"    | >70% accept; low acceptance = fork wording is failing (S8)                                    |
| E8  | Capstone → Earn handoff step on/off              | Graduates submitting to Earn/grants within 30d                  | Up; this is the funnel KPI (C1/C6 analog)                                                     |

---

## 7. Full Source List

**Tier A — peer-reviewed / large field experiments**

- Kulik & Fletcher 2016, ITS meta-analysis — https://eric.ed.gov/?id=EJ1090502 · https://journals.sagepub.com/doi/abs/10.3102/0034654315581420
- Steenbergen-Hu & Cooper; Ma et al. 2014 (ITS counter-estimates) — https://eric.ed.gov/?id=EJ1054449 · https://www.apa.org/pubs/journals/features/edu-a0037123.pdf
- VanLehn 2011 — https://www.tandfonline.com/doi/abs/10.1080/00461520.2011.611369
- Kizilcec, Reich, Yeomans et al., PNAS 2020 (scaled nudge replication; read in full) — https://par.nsf.gov/servlets/purl/10164956
- Yeomans & Reich LAK'17 (via MIT TSL) — https://tsl.mit.edu/research/planning-prompts-increase-and-forecast-course-completion-in-massive-open-online-courses/
- Gollwitzer & Sheeran 2006 — https://cancercontrol.cancer.gov/sites/default/files/2020-06/goal_intent_attain.pdf · https://www.socmot.uni-konstanz.de/publications/implementation-intentions-and-goal-achievement-meta-analysis-effects-and-processes
- Patall, Cooper & Robinson 2008 — https://selfdeterminationtheory.org/wp-content/uploads/2019/10/2008_PatallCooperRobinson_PsychBulletin.pdf
- Chernev, Böckenholt & Goodman 2015 — https://chernev.com/wp-content/uploads/2017/02/ChoiceOverload_JCP_2015.pdf
- Expertise-reversal 2025 meta-analysis (via secondary) — https://tipsforteachers.substack.com/p/research-bite-51-a-cornerstone-of
- Zell & Krizan 2014 — https://pubmed.ncbi.nlm.nih.gov/26173249/
- SRI/ALMAP evaluation — https://www.insidehighered.com/news/2016/06/23/study-finds-inconclusive-results-about-efficacy-adaptive-learning · https://www.sri.com/press/blog-archive/can-adaptive-courseware-technology-positively-impact-student-learning-outcomes/
- Reich & Ruipérez-Valiente, "The MOOC Pivot" (via secondary) — https://www.insidehighered.com/digital-learning/article/2019/01/16/study-offers-data-show-moocs-didnt-achieve-their-goals

**Tier B — platform first-party data**

- Superteam Earn (live scrapes 2026-07-25) — https://superteam.fun/earn/all/ · https://superteam.fun/earn/ · https://superteam.fun/earn/category/development/ · https://superteam.fun/earn/regions/brazil
- Boot.dev State of Learning to Code 2024 — https://www.boot.dev/blog/education/state-of-learning-to-code-2024
- Codewars ranks — https://docs.codewars.com/gamification/ranks/
- Khan Academy district report — https://blog.khanacademy.org/school-district-reports-test-scores-rise-with
- Exercism — https://exercism.org/about
- Cyfrin 2024 wrapup — https://www.cyfrin.io/blog/cyfrin-2024-wrapup-growth-education-security · https://updraft.cyfrin.io/courses · https://updraft.cyfrin.io/career-tracks
- RareSkills — https://www.rareskills.io/ · https://www.rareskills.io/solana-tutorial
- Ackee School of Solana 2025 recap — https://ackee.xyz/blog/school-of-solana-2025-recap/
- Alchemy University — https://www.alchemy.com/university
- LearnWeb3 — https://learnweb3.io/
- Solana Foundation Feb 2026 report — https://solana.com/news/state-of-solana-february-2026 · Bootcamp — https://solana.com/developers/bootcamp
- Duolingo SEC 8-K (Q1 2026) — https://www.stocktitan.net/sec-filings/DUOL/8-k-duolingo-inc-reports-material-event-6974ab47316e.html
- freeCodeCamp blockchain course — https://www.freecodecamp.org/news/learn-blockchain-solidity-full-stack-javascript-development/

**Tier B/C — market data & practitioner sources**

- web3.career Solana jobs — https://web3.career/solana-jobs
- crypto.jobs 2026 skills report — https://crypto.jobs/most-in-demand-web3-skills-2026
- Lemon.io Solana rates — https://lemon.io/for-developers/solana-developer-jobs/
- Chainalysis LatAm 2025 — https://www.chainalysis.com/blog/latin-america-crypto-adoption-2025/ · Brazil framework — https://www.chainalysis.com/blog/brazil-crypto-asset-regulatory-framework-2025/
- Chainstack Solana stablecoins — https://chainstack.com/solana-stablecoins-2026/
- Western Union USDPT — https://www.theblock.co/post/399890/western-union-launches-usdpt-stablecoin-anchorage-solana · https://ir.westernunion.com/news/archived-press-releases/press-release-details/2026/Western-Union-Launches-USDPT-on-Solana-Advancing-Regulated-Digital-Infrastructure-for-Global-Payments/default.aspx
- payments.org coverage — https://www.thestreet.com/crypto/markets/solana-debuts-payments-org-as-stablecoin-payments-move-into-the-mainstream
- Helius Pinocchio — https://www.helius.dev/blog/pinocchio · Blueshift — https://learn.blueshift.gg/en/courses/pinocchio-for-dummies/pinocchio-101
- Electric Capital dev report — https://www.developerreport.com/ecosystems/solana · https://finance.yahoo.com/news/ethereum-leads-16-000-developers-054251913.html
- SendAI/Solana Compass — https://solanacompass.com/projects/sendai · https://solanacompass.com/projects/Superteam
- First Round Review (Duolingo growth) — https://review.firstround.com/the-tenets-of-a-b-testing-from-duolingos-master-growth-hacker/
- Tasu Duolingo teardown — https://tasu.ai/library/duolingo · relaunch.ai — https://relaunch.ai/blog/duolingo-onboarding-teardown-7-b-tests-behind-their-9-conver.html
- Appcues Duolingo teardown — https://goodux.appcues.com/blog/duolingo-user-onboarding
- Coursera CLP case study — https://www.nancylee.design/coursera-clp
- Form benchmarks (replacement figures) — https://www.digitalapplied.com/blog/form-conversion-rate-benchmarks-2026-data-points · https://formstory.io/learn/form-abandonment-statistics/
- ChainShot acquisition — https://techcrunch.com/2022/08/25/crypto-developer-infrastructure-alchemy-acquisition-deal-ma-chainshot-coding-bootcamp/ · https://www.coindesk.com/business/2022/08/25/alchemy-acquires-web3-educational-platform-chainshot-to-onboard-developers
- WEB3DEV PT-BR guide (staleness evidence) — https://pt.w3d.community/bananlabs/o-guia-completo-para-desenvolvimento-full-stack-solana-com-react-anchor-rust-e-phantom-35bo

**Tier D — anti-citations (do not cite as evidence)**

- Brilliant onboarding teardown (no metrics) — https://trysavvy.com/example/brilliant-onboarding
- amraandelma funnel stats (failed provenance; figures untraceable) — https://www.amraandelma.com/funnel-drop-off-rate-statistics/
