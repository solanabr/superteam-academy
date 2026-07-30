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

| Event                        | Payload                                                                                                         | Fires from                                                                                                                                                                                                                                                                                                       |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `$pageview`                  | `{ $current_url }`                                                                                              | `trackPageView()` facade                                                                                                                                                                                                                                                                                         |
| `auth_method_selected`       | `{ method: "solana" \| "github" \| "google" }`                                                                  | `components/auth/auth-modal.tsx`                                                                                                                                                                                                                                                                                 |
| `enrollment_onchain`         | `{ courseId, signature }`                                                                                       | `hooks/use-on-chain-enroll.ts` after the enroll tx confirms (tx signature = public chain data)                                                                                                                                                                                                                   |
| `unenrollment_onchain`       | `{ courseId, signature }`                                                                                       | `hooks/use-on-chain-unenroll.ts` after the unenroll tx confirms                                                                                                                                                                                                                                                  |
| `lesson_completed`           | `{ lessonId, courseId, signature }`                                                                             | `lessons/[id]/lesson-client.tsx` on completion API success                                                                                                                                                                                                                                                       |
| `review_completed`           | `{ gradable, itemsShown }`                                                                                      | `components/review/review-session.tsx` — every gradable item in a spaced-review session graded (LX-B5, #873). Fires once per session; `gradable` excludes due lessons with no authored quiz, which can never be graded                                                                                           |
| `earn_handoff_click`         | `{ category: "development" \| "content" \| "grants", source: "mint_success" \| "certificate_page", courseId? }` | `components/certificates/earn-handoff-card.tsx` (E8, #625)                                                                                                                                                                                                                                                       |
| `credential_share_click`     | `{ channel: "x" \| "linkedin_add", source: "mint_success" \| "certificate_page", courseId? }`                   | `lib/credentials/share.ts` → certificate share surfaces (#629)                                                                                                                                                                                                                                                   |
| `credential_minted`          | `{ courseId, source: "manual_mint" \| "realtime" }`                                                             | `trackCredentialMinted()` — manual mint success (`course-completion-mint.tsx`) **and** the Realtime certificates INSERT (`use-gamification-events.ts`). Session-deduped per course so one mint = one event (#558)                                                                                                |
| `quiz_checked`               | `{ lessonId, courseId, questionId, correct }`                                                                   | `trackQuizChecked()` — one per quiz Check press; `correct` is the client-side verdict (server re-grades at completion). Every press fires, so retries are visible (#836)                                                                                                                                         |
| `challenge_started`          | `{ lessonId, challengeKind, courseId? }`                                                                        | `trackChallengeStarted()` — first genuine interaction with a challenge (first editor keystroke or first run, never a page view); session-deduped per lesson (#558)                                                                                                                                               |
| `challenge_run`              | `{ lessonId, challengeKind, courseId? }`                                                                        | `trackChallengeRun()` — each execution, any outcome (#558)                                                                                                                                                                                                                                                       |
| `challenge_failed`           | `{ lessonId, challengeKind, courseId?, consecutiveFails }`                                                      | `trackChallengeFailed()` — per failing run; `consecutiveFails` is the fail streak feeding the encouragement threshold + LX-C4 (#558)                                                                                                                                                                             |
| `challenge_solved`           | `{ lessonId, challengeKind, courseId?, postNudge? }`                                                            | `trackChallengeSolved()` — per passing run; `postNudge: true` present only when the LX-C4 stuck-nudge had surfaced this attempt (#558, #576)                                                                                                                                                                     |
| `stuck_nudge_shown`          | `{ lessonId, challengeKind, courseId?, consecutiveFails }`                                                      | `trackStuckNudgeShown()` — the authored-hint stuck-nudge became visible after ≥`ENCOURAGEMENT_THRESHOLD` failed runs; session-deduped per lesson so it is the stable denominator for acceptance/solve rates (#576)                                                                                               |
| `stuck_nudge_accepted`       | `{ lessonId, challengeKind, courseId?, hintIndex }`                                                             | `trackStuckNudgeAccepted()` — learner revealed an authored hint from the nudge; `hintIndex` is the zero-based hint position, never the hint text (#576)                                                                                                                                                          |
| `solution_revealed`          | `{ lessonId, challengeKind, courseId? }`                                                                        | `trackSolutionRevealed()` — learner deliberately opened the reference solution behind the LX-C6 soft-gate; session-deduped per lesson. XP path untouched; the reveal also reschedules the lesson into review (#582)                                                                                              |
| `next_lesson_plan_committed` | `{ day }`                                                                                                       | `trackNextLessonPlanCommitted()` — learner committed the LX-A6 session-end if-then plan (`day` is a closed-set weekday id, never the exact time or any PII). v1 is display-only; delivery waits for a notification workstream. Its return effect is a **pre-registered null** in `experiment-registry.ts` (#582) |

`challengeKind` is `"js" | "rust" | "buildable"` (`challengeKindFor()` in
`events.ts`).

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

## Planned (not reserved-blocked, just future)

- `review_completed` — SHIPPED (#873). See the inventory table above.
