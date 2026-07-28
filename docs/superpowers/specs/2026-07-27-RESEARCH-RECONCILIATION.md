# Research Reconciliation — the 2026-07-25 program vs what actually shipped

**Date:** 2026-07-28 (covering work through the night of 2026-07-27).
**What this is:** the owner-requested second pass over the 2026-07-25 research program — a per-item
reconciliation of every recommendation/claim in the corpus against GitHub + code reality, plus the
misses that survived. Method: 7 parallel extractors (one per corpus doc, claim-level granularity) →
**742 extracted items** → 42 verification agents reconciling each against issue/PR state and the
code snapshot (rule: _no DONE on vibes_ — every status carries evidence) → synthesis. Three
claims from the two verification batches that ran without the safety classifier were independently
re-verified by hand (all held). Per-item statuses live in the machine-readable appendix
[`2026-07-27-RESEARCH-RECONCILIATION-items.tsv`](./2026-07-27-RESEARCH-RECONCILIATION-items.tsv).

**Corpus:** `2026-07-25-UNIFIED-LAUNCH-SPEC.md` (plan of record), `…-launch-experience-master-spec.md`,
`…-catalog-redesign-spec.md`, `…-learning-experience-research.md`, `…-learning-uiux-research.md`,
`…-personalization-launch-research.md`, `…-ai-tutor-economics.md`.

---

## 1. Coverage ledger

| Doc                                      | items   | DONE    | PARTIAL | NOT-DONE | SUPERSEDED | OWNER-PARKED | UNVERIFIED |
| ---------------------------------------- | ------- | ------- | ------- | -------- | ---------- | ------------ | ---------- |
| UNIFIED-LAUNCH-SPEC (plan of record)     | 142     | 81      | 48      | 8        | —          | 4            | 1          |
| launch-experience master spec            | 121     | 98      | 11      | 1        | 7          | 4            | —          |
| catalog-redesign spec                    | 150     | 100     | 34      | 10       | 3          | 3            | —          |
| learning-experience research (PED-\*)    | 64      | 44      | 15      | 3        | 2          | —            | —          |
| learning-uiux research (UIU-\*)          | 88      | 47      | 37      | 2        | 2          | —            | —          |
| personalization-launch research (MAS-\*) | 85      | 42      | 21      | 1        | 19         | 1            | 1          |
| ai-tutor-economics                       | 92      | 67      | 9       | 10       | 1          | 5            | —          |
| **Total**                                | **742** | **479** | **175** | **35**   | **34**     | **17**       | **2**      |

Reading: **65% of everything the research program asked for is verifiably done with cited
evidence** (479/742), and most PARTIALs are single missing legs of shipped features, not absent
features. The UNVERIFIED column is now just the 2 structurally UNVERIFIABLE items — the
session-limit gap of the first pass (114 items) was **closed by the 2026-07-28 completion pass
(§8)**; this table reflects the completed audit.

---

## 2. The headline finding: one whole workstream fell through — the AI wall

The single biggest genuine drop is **unified spec items 32/32a/32b/33 + 3b — the AI-wall/AI-cost
workstream. Item 32 was never filed as an issue at all**, and greps + issue searches confirm none
of its members exist in code:

- **32 — wall boundaries re-derivation** (Socratic tier, degrade-before-deny, Tier-0 authored
  hints, São Paulo windows): zero `Socratic`/tier hits outside spec docs; no issue ever filed.
- **32a — attempt-gate nudge** ("run the tests once first", free one-tap override, override-rate
  logged as a metric): no nudge, no override event in `analytics/events.ts`.
- **32b — comprehension check on propose patch-apply** (its first-attempt accuracy is _the
  primary AI metric_): no check, no `trackEvent` in `use-ai-partner.ts`, metric not flowing.
- **33 — AI-off in the capstone via the SAME constant as the credential gate (item 14)**: no code
  reads a capstone constant in the AI path; the only AI gate is `aiSuppressed` for quizzes. The
  item-14 shared-constant clause is unmet on the AI side.
- **3b — per-action model routing + Flex-tier spike**: not built.
- **Gemini curls (AIE-04/AIE-05)** — _minutes of work_, launch-critical, gating item 3b, the O-1
  budget confidence, and the **external cost-quote embargo** (which is technically still in force:
  no recorded curl results anywhere).

The economics doc's 92 items being unverified compounds this: the one corpus doc we could not
audit is the one whose implementation workstream demonstrably slipped. **Recommendation: treat
the AI wall as a single new epic** (file one issue bundling 32/32a/32b/33/3b with the curls as its
step 0), and do not quote AI costs externally until the curls are recorded.

## 3. Verified contradictions and repeated mistakes (each independently re-checked)

1. **C5 ships kit 7.0.0 against the #598 kit-6.10.0 ruling.** The unified spec (item 9) resolved
   the C5 dependency seam as "pin the whole set to the kit-6 shelf"; the shipped C5 pins
   `@solana/kit@7.0.0` throughout (version-stamp headers and prose), merged ~14h _after_ the
   ruling. Either the ruling is formally superseded (the shipped framing may in fact be better —
   it documents the seam in-lesson) or C5 gets repinned — but right now the plan of record and
   the shipped content disagree, silently. **Owner decision required; do not leave implicit.**
2. **All four new courses repeat the immutable-creator mistake** (PB-7): every
   `course.yaml` carries `creator: B7o8Nf…` — the platform authority — despite the catalog spec's
   explicit "do not repeat this" warning. Survivable on devnet (recreate-before-mainnet), but the
   recreate wave must now include creator swaps to real instructor wallets, and `teachers.yaml`
   is still read by nothing.
3. **C5's course description still opens with the false-for-standalone claim** "You have a
   deployed vault app…" — unified item 27(1) required rewriting it before merge; it merged as-is.
4. **The C3-at-trackLevel-3 devnet recreate (catalog chain-2) never executed** and its natural
   batching window (the new-course creation wave) has passed. Still possible pre-mainnet; now it
   is its own operation, and it should batch with the creator-swap recreates from (2).
5. **The spec's own hygiene rule is violated by the spec corpus**: the catalog spec still quotes
   dev-bounty submission counts that personalization corr-1 prohibits optimizing on or quoting.

## 4. Thematic gap clusters (from the 25 NOT-DONE + 105 high/launch-critical PARTIALs)

**C1 (expected, not a miss — the largest single cluster, ~15 items).** Every C1 lesson item
(L1–L8), quiz-2, thesis-1, chain-1, pb-1/2/4 legs, unified-19. All resolve through #673, which
tonight's work unblocked (#599 frozen vault + #600 PB-1). The catalog spec's per-lesson specs are
complete enough to author from directly.

**Instrumentation shipped features but not their metrics.** Test-out (#578) and the Continue card
(#551) have **zero analytics events**; the 14-day post-mint-cliff metric (P0D-4) doesn't exist;
LX-F1's event pass is partial; the LX-F2/F3 dashboards are owner-territory and unlinked; **prod
PostHog/GA4 env vars are unconfirmed — until set, every analytics call is a silent no-op**, which
would make the day-1 KPI commitment (capstone deploys / credentialed devs / Earn submissions, not
signups) unmeasurable at launch. The unified-18 pre/post credential baseline is destroyed as
warned; the experiment registry's "merged-pre-launch" labels are the accepted mitigation.

**Content governance exists on paper, not in the pipeline.** `versionStamp` frontmatter is opt-in
and used by **zero** lessons (gate 21 checks nothing); courses-academy has **no PR template**, so
the salvage-ledger checklist (19b) and the originality checkbox (31) never operated; the skills
registry migration (retire `wallet-adapter`/`defi`/`amm`/`lending`/`staking`/`oracles`, rename
`rpc`→`rpc-reads`) was never executed — the dead vocabulary is why gate-19b still warns; #676's
warning→error flip correctly waits on C1. Translation staleness gating (l10n-2) is design-only
(#580 design merged; implementation deliberately deferred — an owner timing call, but it must land
before the first translation PR or the rule has no teeth).

**Small verified content defects (cheap, loop-actionable now):**

- C4 has **no `consumes:` keys** and **zero discoverable reference to the dead-end fallback** —
  now fixable properly because the frozen reference vault (#599) exists to link.
- C5 `submit-and-what-you-built` still says "~$100 per competitor"; the corrected figures are
  $62.5/$88.7 (CAT-04).
- C4 L6's npm stats say "at the time of writing" — the spec requires dated stats.
- C3 `add-an-instruction` is code-bearing with no quiz; C2's recap quiz covers 7 questions
  against 25 skill tags (spec: ≥1 per tag).
- C5 entry point (catalog-entry-1) links no reference deployed app/published client.

**UX debt, deliberately deferred but now partially unblocked.** Weekly-cadence streak mode is
explicitly gated on an owner A/B decision (the research called daily-only streaks a confirmed
pathology risk); the 2-minute placement challenge never shipped (segment self-ID stands alone,
against UIU-F26); mobile "review-first" scope + Monaco desktop-handoff absent; **re-engagement
email templates (uiux-R17) became actionable the moment Resend landed (#769/#779)** — templates.ts
has only the course-announcement email; Parsons feedback is verdict-level (no per-line
highlighting). The review-quest content type itself (pedagogy-R1 / uiux-F29's auto-fed review
home) has no review-kind quest in the content repo — the review _spine_ shipped, the _feed_ into
it from content did not.

**Positioning/marketing legs unshipped.** The landing wedge is AI-first; the Brazil-payments
wedge (D7/D11: stablecoins ≈ 90% of Brazilian crypto volume) appears nowhere in marketing copy;
the catalog page states no JS prerequisite and never refers segment 3 out (freeCodeCamp referral:
zero hits); no public dated post-launch cadence exists (C11: "the roadmap is itself marketing").

**Legal/ops with no owner.** unified-54: Brazilian counsel review of the _existing_ on-chain
issuance — no engagement, no bright-lines doc, high priority and genuinely nobody's; unified-53:
the PT-BR +30% width sweep has no named owner; R3/#305 Squads custody: zero movement, gates
mainnet absolutely. BCB-561 re-verification is scheduled (Sept window) — on time, not a miss.

## 5. Owner-decision ledger (parked, correctly — surfacing so none rot)

O-5/#579 (JS/TS rung vs refer-out; #588 close was recommended by unified-26 and is still open),
O-8 (cert verifiability vs profile privacy — verify links silently 404 for private profiles),
O-10 (Spanish promotion — ES-first on C2 is the evidence-backed recommendation), O-12/§8.2
(cargo `test --lib` for C2 vs compile-only + softened copy — note PB-3b's `buildType: unit-tested`
never landed), §8.3/O-13 (missing capability enums vs openEnded), D-5/#580 timing (i18n mechanism
implementation), weekly-cadence streak A/B, prod analytics env vars + dashboards, the Gemini
curls + cost-quote embargo, counsel (§4 above), C5 kit-6-vs-7 ratification (§3.1 above).

## 6. Honest limitations

- ~~**The economics doc (92 items) and 20 personalization items are UNVERIFIED**~~ — **CLOSED
  2026-07-28 by the completion pass (§8)**: all 112 session-limit rows verified with cited
  evidence; the coverage table above reflects the completed audit. Original note kept for the
  record: their verification agents died on a session limit and were deliberately not re-run to
  protect the weekly budget; the AI-wall finding (§2) came from the _unified spec's_ verified
  items and stood regardless — the completion pass confirmed it.
- Two verification batches ran while the safety classifier was unavailable; three of their most
  consequential claims (kit-7 pin, creator fields, C5 opener) were re-verified by hand — all held.
- "DONE" means the item's done-when is satisfied with cited evidence, not that the feature is
  bug-free; UNVERIFIABLE (2 items) means the done-when isn't checkable from repo+GitHub.
- ~~The five planned independent gap-hunt lenses were cut for budget~~ — **CLOSED 2026-07-28
  (§8)**: a dedicated fresh-eyes pass ran over all six raw reports (~70 keyword sweeps against
  this appendix + issue search). Result: **exactly one genuine novel miss** (the C4 indexing
  disposition, §8.3) — the extraction method held up, and the §6-feared miss-class essentially
  does not exist at scale.

## 8. Completion addendum (2026-07-28) — the §6 gaps, closed

Run by the gate session (owner-directed) as three parallel verification agents, same
no-DONE-on-vibes rule, statuses folded into the appendix TSV in place.

**8.1 Economics (92 items verified).** Shape of the result: the **P0 cost/security armor all
genuinely shipped** (refund hole closed, fail-closed spend ledger on São Paulo days, per-IP
buckets, diff-propose @2,048 tok, input cap 8,000 — A-1..A-5 all DONE with file:line evidence);
**every never-build bright line held** (no coin, no referrals, no drip refills, no rollover, no
UTC-day global-only cap, XP stays NonTransferable); the unbuilt remainder is exactly what **#838**
tracks (ladder/free tier, Socratic, routing, community handoff, self-reset). New facts surfaced:
the **AIE-04/05 curls ran 2026-07-28** — all three candidate models reachable on the prod key,
`thinkingBudget:0` verified honored with a control (thoughts 146 → 0), so the ~$280/mo @10k MAU
scenario holds and the cost-quote embargo can lift; **five economics decisions are genuinely
owner-parked** (D-4 free-turn count, D-5 Socratic size, D-6 sponsor attribution, D-7 Flex spike
owner, D-8 self-reset keep/cut) — all forced when #838 item 32 is built; and the shipped **#770
think-first lock is the shape §4.4/G-1 forbids** (hard 3-minute gate, padlock icon, no override) —
now evidence-backed inside #838 item 32a rather than a design preference. Counsel (unified-54)
re-confirmed as high-priority and unowned.

**8.2 Personalization (20 items verified).** The Design-A intake shipped essentially whole: 4
tap-only screens, no self-rating, static cold-start routing, delayed signup with O-4 banking,
test-out as offer-not-gate, path page with one start-here card. Three PARTIALs are each one
missing leg: screen 3 shipped as interest chips, not the value-relevance reflection (no
locale-gated A/B); screen 4's daily goal and the implementation-intention prompt both lack the
**notification channel** that was their second half (no send channel exists at all — this is the
common root). The five retired-course content items are SUPERSEDED by the catalog rebuild, each
with its job traced to where it moved (C5 exceeded B-5's module-level ask by becoming a course).

**8.3 Fresh-eyes gap hunt (the cut lenses).** One genuine novel miss in the entire corpus: the
catalog spec rejected an indexing course _on the promise of_ "one lesson in C4"; shipped C4 has
no indexing lesson, C5 L4 explicitly defers the thread, and CATALOG.md still asserts the coverage
— folded into **#839** as item 6. One caution worth keeping: master-HC2 ("slots.lock reshaping is
safe by design") is DONE as captured, but its premise was partially refuted by the #740/#741
bitmap incident — do not cite HC2 as settled for lesson-level reshapes. Closest-call
non-misses are recorded in the gap-hunt transcript; none survived the novelty filter.

## 7. Recommended next actions (ordered)

1. **File the AI-wall epic** (items 32/32a/32b/33/3b; Gemini curls as step 0; embargo stated in
   the issue). The only whole workstream that fell through.
2. **Surface the C5 kit-6-vs-7 contradiction to the owner** for an explicit ratify-or-repin.
3. **File the cheap content-defect batch** (C4 `consumes:` + dead-end fallback link to the frozen
   vault; C5 $62.5/$88.7 copy; dated npm stats; the two quiz gaps; C5 entry-reference link).
4. **File the content-governance batch** (courses-academy PR template with salvage-ledger +
   originality checkboxes; skills-registry migration; versionStamp adoption for C4/C5 code
   lessons; slot-activation insertion checklist in DEPLOYMENT.md).
5. **File the analytics completion pass** (test-out + Continue-card + comprehension-check +
   override-rate events; 14-day post-mint metric) and ask the owner to confirm prod
   PostHog/GA4 env vars — without them the day-1 KPI commitment is void.
6. **Author C1** (#673) — pending the owner's approach pick; the catalog spec's L1–L8 specs are
   authoring-ready, and the creator wallet must be a real instructor wallet at creation.
7. **Re-engagement email templates** (uiux-R17) — newly unblocked by Resend.
8. Batch the **pre-mainnet on-chain recreate wave**: C3→trackLevel 3 + creator swaps to real
   instructor wallets (§3.2/3.4) + #305 custody — one owner-supervised window.
9. Marketing legs when copy is next touched: payments wedge, JS prerequisite + refer-out,
   dated public roadmap.
