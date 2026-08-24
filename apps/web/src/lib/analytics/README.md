# Analytics event naming

Canonical inventory of every product analytics event. All events flow through
the `trackEvent(name, properties)` facade in `index.ts`, which fans out to GA4
(`ga4.ts`) and PostHog (`posthog.ts`). Every provider degrades to a silent
no-op when its `NEXT_PUBLIC_*` env vars are unset — **all analytics env vars
are optional today**, so events only reach a backend once
`NEXT_PUBLIC_GA4_MEASUREMENT_ID` / `NEXT_PUBLIC_POSTHOG_KEY` +
`NEXT_PUBLIC_POSTHOG_HOST` are configured in the deployment.

## The 10–12 week evaluation rule — read before reading any metric (#605)

**No mechanic is evaluated before week 10 of learner exposure. Week-3 numbers lie.**

The gamification novelty effect dips at week 4 and only recovers by weeks 6–10
(PED-15, N=756 Brazilian CS1 undergraduates; PED-31 and MAS-29 concur). A read
taken inside that trough will show a mechanic underperforming when it is merely
new, and can trigger a strategy reversal that the week-14 numbers would have
reversed again. The launch KPI (capstone deploys + Earn submissions) and the
north star (weekly return of previously-active learners) are both judged on a
**10–12 week window, never earlier**.

The rule is encoded in code, not just prose: `experiment-registry.ts` holds one
row per shipped mechanic, and each row's **earliest-read date is computed** as
`exposureStart + 10 weeks` (`earliestReadDate()` / `EVALUATION_WINDOW_DAYS = 70`),
never typed. The clock starts at **learner exposure (production launch)**, not at
the merge date — the trough is measured from when a learner first sees the
mechanic. `LAUNCH_DATE` is the single place that date is set; while it is `null`,
every launch-cohort row reports `earliestReadDate === null` and `isReadable()`
returns `false`, so the rule holds by default and a metric cannot be treated as
decision-grade before its window elapses.

PostHog dashboards (config-side, owner territory) must carry the same "do not
evaluate before week 10" note on any tile that charts a mechanic. This module is
the source of truth the dashboards restate.

Scope: item 48 seeded the minimal substrate the rule points at; item 45 (LX-F4,
#582) grew it into the full experiment registry — one row per report experiment
(continue-hero, retrieval on/off, anonymous trial, test-out visibility, nudge
threshold, weekly cadence, cohort vs global, LinkedIn nudge, endowed first-tick,
celebration tiering, challenge-first lesson pilot), the pre-registered NULLS
flagged (`preregisteredNull` — the S4 planning-prompt-completion row), and E6
(incentive-graded XP ladder) carried as `infeasible-as-designed` so it is not
re-proposed (xpPerLesson is fixed on-chain; see the LX-C7 justified drop).

## Conventions

- **Event names**: `snake_case`, verb in past tense for outcomes
  (`lesson_completed`), noun_verb for interactions (`earn_handoff_click`).
- **Payload properties**: `camelCase`, lean, closed-set strings and content
  ids only.
- **Zero PII**: never wallet addresses, emails, usernames, or user code
  content in payloads. Identity is attached via `identifyUser()` (PostHog
  identify + Sentry user), not via event properties. Transaction signatures
  (public on-chain data) appear only in the two legacy on-chain events noted
  below.
- **Typed helpers**: events with dedupe or shared shapes have helpers in
  `events.ts` — prefer those over raw `trackEvent` calls at new call sites.

## Active events

| Event                          | Payload                                                                                                         | Fires from                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `$pageview`                    | `{ $current_url }`                                                                                              | `trackPageView()` facade                                                                                                                                                                                                                                                                                                                                                                                                        |
| `auth_method_selected`         | `{ method: "solana" \| "github" \| "google" }`                                                                  | `components/auth/auth-modal.tsx`                                                                                                                                                                                                                                                                                                                                                                                                |
| `enrollment_onchain`           | `{ courseId, signature }`                                                                                       | `hooks/use-on-chain-enroll.ts` after the enroll tx confirms (tx signature = public chain data)                                                                                                                                                                                                                                                                                                                                  |
| `unenrollment_onchain`         | `{ courseId, signature }`                                                                                       | `components/dashboard/current-courses-section.tsx` after the unenroll tx confirms                                                                                                                                                                                                                                                                                                                                                              |
| `lesson_completed`             | `{ lessonId, courseId, signature }`                                                                             | `lessons/[id]/lesson-client.tsx` on completion API success                                                                                                                                                                                                                                                                                                                                                                      |
| `review_completed`             | `{ gradable, itemsShown }`                                                                                      | `components/review/review-session.tsx` — every gradable item in a spaced-review session graded (LX-B5, #873). Fires once per session; `gradable` excludes due lessons with no authored quiz, which can never be graded                                                                                                                                                                                                          |
| `continue_card_shown`          | `{ kind: "lesson" \| "nextCourse" \| "catalog", courseSlug? }`                                                  | `components/dashboard/continue-card.tsx` — the click-through DENOMINATOR (#871, LX-B2); fires per dashboard render, not per session                                                                                                                                                                                                                                                                                             |
| `continue_card_click`          | `{ kind: "lesson" \| "nextCourse" \| "catalog", courseSlug? }`                                                  | `components/dashboard/continue-card.tsx` — the numerator for the same rate (#871)                                                                                                                                                                                                                                                                                                                                               |
| `test_out_started`             | `{ courseId }`                                                                                                  | `components/courses/test-out-challenge.tsx` — fires on a successful challenge LOAD, never on mount, so a failed fetch does not understate the pass rate (#871, #578)                                                                                                                                                                                                                                                            |
| `test_out_graded`              | `{ courseId, passed, correct, total }`                                                                          | `components/courses/test-out-challenge.tsx` — one graded submission. No lessons-credited count: the grading response carries no lesson tally, so the skip size is not knowable client-side (#871)                                                                                                                                                                                                                               |
| `earn_handoff_click`           | `{ category: "development" \| "content" \| "grants", source: "mint_success" \| "certificate_page", courseId? }` | `components/certificates/earn-handoff-card.tsx` (E8, #625)                                                                                                                                                                                                                                                                                                                                                                      |
| `credential_share_click`       | `{ channel: "x" \| "linkedin_add", source: "mint_success" \| "certificate_page", courseId? }`                   | `lib/credentials/share.ts` → certificate share surfaces (#629)                                                                                                                                                                                                                                                                                                                                                                  |
| `credential_minted`            | `{ courseId, source: "manual_mint" \| "realtime" }`                                                             | `trackCredentialMinted()` — manual mint success (`course-completion-mint.tsx`) **and** the Realtime certificates INSERT (`use-gamification-events.ts`). Session-deduped per course so one mint = one event (#558)                                                                                                                                                                                                               |
| `quiz_checked`                 | `{ lessonId, courseId, questionId, correct }`                                                                   | `trackQuizChecked()` — one per quiz Check press; `correct` is the client-side verdict (server re-grades at completion). Every press fires, so retries are visible (#836)                                                                                                                                                                                                                                                        |
| `challenge_started`            | `{ lessonId, challengeKind, courseId? }`                                                                        | `trackChallengeStarted()` — first genuine interaction with a challenge (first editor keystroke or first run, never a page view); session-deduped per lesson (#558)                                                                                                                                                                                                                                                              |
| `challenge_run`                | `{ lessonId, challengeKind, courseId? }`                                                                        | `trackChallengeRun()` — each execution, any outcome (#558)                                                                                                                                                                                                                                                                                                                                                                      |
| `challenge_failed`             | `{ lessonId, challengeKind, courseId?, consecutiveFails }`                                                      | `trackChallengeFailed()` — per failing run; `consecutiveFails` is the fail streak feeding the encouragement threshold + LX-C4 (#558)                                                                                                                                                                                                                                                                                            |
| `challenge_solved`             | `{ lessonId, challengeKind, courseId?, postNudge? }`                                                            | `trackChallengeSolved()` — per passing run; `postNudge: true` present only when the LX-C4 stuck-nudge had surfaced this attempt (#558, #576)                                                                                                                                                                                                                                                                                    |
| `stuck_nudge_shown`            | `{ lessonId, challengeKind, courseId?, consecutiveFails }`                                                      | `trackStuckNudgeShown()` — the authored-hint stuck-nudge became visible after ≥`ENCOURAGEMENT_THRESHOLD` failed runs; session-deduped per lesson so it is the stable denominator for acceptance/solve rates (#576)                                                                                                                                                                                                              |
| `attempt_gate_nudge_shown`     | `{ lessonId, challengeKind, courseId? }`                                                                        | `trackAttemptGateNudgeShown()` — the AI Partner attempt-gate nudge surfaced (an AI action invoked before any test run on the challenge); session-deduped per lesson — the denominator of the override rate (#865)                                                                                                                                                                                                               |
| `solution_revealed`            | `{ lessonId, challengeKind, courseId? }`                                                                        | `trackSolutionRevealed()` — learner deliberately opened the reference solution behind the LX-C6 soft-gate; session-deduped per lesson. XP path untouched; the reveal also reschedules the lesson into review (#582)                                                                                                                                                                                                             |
| `socratic_mode_entered`        | `{ lessonId, challengeKind, courseId? }`                                                                        | `trackSocraticModeEntered()` — the assist ladder moved this (learner, lesson) onto the Socratic tier (lighter, questions-first tutor); session-deduped per lesson — the economics doc's Socratic-tier entry-rate metric (#864)                                                                                                                                                                                                  |
| `comprehension_check_answered` | `{ lessonId, correct, attempt, courseId? }`                                                                     | `trackComprehensionCheckAnswered()` — one per answer to the check gating an AI-proposed patch (`ai-partner/diff-card.tsx`). **The primary AI harm metric**: first-attempt accuracy = `correct` among `attempt = 1`. Never deduped (every answer is signal); `attempt` is per check instance (keyed by the seal token — a new proposal restarts at 1), and `correct` is the server's sealed verdict, not a client compare (#866) |
| `assist_reset_used`            | `{ lessonId, challengeKind, courseId? }`                                                                        | `trackAssistResetUsed()` — the learner spent their one self-serve per-lesson assist reset; fired only on a server-confirmed reset, never on a denied attempt (#864)                                                                                                                                                                                                                                                             |
| `next_lesson_plan_committed`   | `{ day }`                                                                                                       | `trackNextLessonPlanCommitted()` — learner committed the LX-A6 session-end if-then plan (`day` is a closed-set weekday id, never the exact time or any PII). v1 is display-only; delivery waits for a notification workstream. Its return effect is a **pre-registered null** in `experiment-registry.ts` (#582)                                                                                                                |

`challengeKind` is `"js" | "rust" | "buildable"` (`challengeKindFor()` in
`events.ts`).

Retired events (no producer; do not read their absence as a data outage):
`stuck_nudge_accepted` — the stuck-nudge became a no-action auto-reveal, so
there is no accept step left to instrument. `attempt_gate_overridden` — the
attempt gate is now a single line with no override affordance; a pre-run
question is parked and replayed after the first run instead.

Enrollment note: there is no separate `enroll_completed` event — the only
enrollment success moment that exists today is the on-chain path, which
`enrollment_onchain` already covers. If a wallet-less enrollment path ships,
instrument it as `enroll_completed { courseId, method }`.

## Onboarding funnel (E2/E7)

The `/start` intake (#566, LX-A2). Helpers live in `events.ts`
(`trackOnboarding*`); `onboarding_started` is session-deduped to the first
screen-1 tap. Payloads carry only closed-set option ids and the integer daily
goal — never free text (the intake is tap-only).

| Event                       | Payload                                      | Fires from                                                                                                                                   |
| --------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `onboarding_started`        | `{}`                                         | `trackOnboardingStarted()` — first interaction with `/start` screen 1 (not the page view)                                                    |
| `onboarding_step_completed` | `{ step: 1 \| 2 \| 3 \| 4, choice }`         | `trackOnboardingStepCompleted()` — per screen; `choice` is the option id(s)/daily-goal int, `null` when the optional chips screen is skipped |
| `onboarding_goal_committed` | `{ dailyGoal }`                              | `trackOnboardingGoalCommitted()` — E2 implementation-intention substrate (daily-goal picker)                                                 |
| `onboarding_route_accepted` | `{ accepted: boolean, recommendedCourseId }` | `trackOnboardingRouteAccepted()` — E7: recommended entry taken vs "Browse all" override                                                      |
| `onboarding_completed`      | `{ experience, goal, dailyGoal }`            | `trackOnboardingCompleted()` — intake finished; closed-set ids + daily-goal int, never free text                                             |

## Derived metrics

Metrics that are not events but are **computed from** them. Each entry states
its numerator, denominator, window, and the exact PostHog recipe, so the insight
can be rebuilt from this file alone. Every one of them is still subject to the
10–12 week rule above.

### P0D-4 · 14-day post-mint activity (the post-credential-cliff baseline)

The research documents a cliff: learners mint a credential and go inactive. This
is the baseline that cliff is measured against, and the number the Earn handoff
(LX-E4) has to move. Master spec LX-F2; pedagogy #4; RESEARCH-RECONCILIATION §4.

- **Denominator** — distinct users with a `credential_minted` event in the
  cohort period.
- **Numerator** — of those, the users with **at least one activity event**
  strictly after their _first_ `credential_minted` and within 14×24 h of it.
- **Activity** is the closed set `$pageview`, `lesson_completed`,
  `challenge_run`, `review_completed`. Deliberately narrow: it is the smallest
  set that means "came back and did something", and each member already exists
  in the inventory above. `credential_minted` itself is excluded (a second mint
  is a different funnel), and so are the share/Earn clicks — those fire in the
  same session as the mint and would score the cliff as survived.
- **Window anchor** — the `credential_minted` event's own timestamp, per user.
  Not a calendar cohort: the 14 days run from each learner's mint moment.
- **Read as** — `numerator / denominator`, reported per cohort week. The healthy
  direction is up; a value near zero _is_ the cliff.

**PostHog recipe** (dashboard config is owner territory per LX-F2, so this is
the recipe to click through, not a checked-in dashboard):

1. New insight → **Retention**.
2. Cohortizing event: `credential_minted`. Returning event: `$pageview`
   (repeat the insight once per activity event above, or use "Any event" minus
   the exclusions if the cliff needs a single headline tile).
3. Retention type: **first time** (anchors on the learner's first mint).
4. Granularity **Day**, period **14 days**. Day 0 is the mint itself and is
   always 100% — the metric is "any of days 1–14", i.e. the union of the
   non-zero columns, not day 14 alone.
5. Breakdown by the event property `courseId` to see which credential's holders
   fall off; breakdown by `source` only to audit coverage (below), never as a
   learner-facing cut.
6. Pin the tile with the "do not evaluate before week 10" note.

**Substrate audit** (issue #872): no event changes were needed.

- `credential_minted` already carries everything the insight consumes —
  the mint moment (event timestamp), the person (PostHog `distinct_id` from
  `identifyUser()`), and `courseId` for the breakdown.
- The mint address / certificate id is **deliberately not added**. It buys the
  insight nothing — the retention anchor is the timestamp, not the asset — while
  a wallet-adjacent on-chain identifier in a payload cuts against the zero-PII
  rule above. Join `certificates.mint_address` server-side if a specific
  credential ever has to be identified.
- The activity side needs no new events either: all four members of the set
  above already fire.

**Coverage caveat.** `credential_minted` is a client event, but the mint itself
is server-side and lands in `certificates` from four paths (the mint route, the
on-chain retry queue, the Helius webhook handler, admin resync). The client only
observes two of them — the manual-mint success and the Supabase Realtime
`certificates` INSERT — so a mint that completes while the learner has no
subscribed page mounted produces a row with no event, and the PostHog
denominator can undercount. Reconcile periodically against
`count(certificates.minted_at)` for the same period; if the gap is material,
the fix is a server-side capture at the write sites, not a bigger client
payload. Until then, PostHog is the trend and `certificates` is the truth.

## Planned (not reserved-blocked, just future)

- `review_completed` — SHIPPED (#873). See the inventory table above.

## LX-F1 event pass — complete (#873)

Every event on the master spec's LX-F1 list now fires and is covered by a test.
One naming divergence is intentional and should not be re-filed as missing: the
spec's **`linkedin_share_click` shipped as `credential_share_click` with
`channel: "linkedin_add"`**. Per the owner decision on #552, LinkedIn is a
profile-entry action (Add-to-Profile), not a share-post, and X is the actual
social channel — so one event with a `channel` property is the honest shape,
and a separate LinkedIn-only event would have split the same surface in two.
Both click events fire from both surfaces (`mint_success` and
`certificate_page`) and each surface is pinned by a test.

## PostHog pre-init buffering

`posthog.ts` loads posthog-js asynchronously; capture/identify/reset calls made
before the import resolves are buffered (cap 50, drop-oldest) and flushed in
order once the SDK is up — the first pageview of every session used to be
silently dropped by this race. If PostHog is unconfigured or the SDK failed to
load, the first attempted capture logs a single console.warn and subsequent
calls drop quietly. Debugging "my early event never arrived" starts here.
