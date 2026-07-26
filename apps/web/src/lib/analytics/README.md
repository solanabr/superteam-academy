# Analytics event naming

Canonical inventory of every product analytics event. All events flow through
the `trackEvent(name, properties)` facade in `index.ts`, which fans out to GA4
(`ga4.ts`) and PostHog (`posthog.ts`). Every provider degrades to a silent
no-op when its `NEXT_PUBLIC_*` env vars are unset — **all analytics env vars
are optional today**, so events only reach a backend once
`NEXT_PUBLIC_GA4_MEASUREMENT_ID` / `NEXT_PUBLIC_POSTHOG_KEY` +
`NEXT_PUBLIC_POSTHOG_HOST` are configured in the deployment.

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

| Event                    | Payload                                                                                                         | Fires from                                                                                                                                                                                                        |
| ------------------------ | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `$pageview`              | `{ $current_url }`                                                                                              | `trackPageView()` facade                                                                                                                                                                                          |
| `auth_method_selected`   | `{ method: "solana" \| "github" \| "google" }`                                                                  | `components/auth/auth-modal.tsx`                                                                                                                                                                                  |
| `enrollment_onchain`     | `{ courseId, signature }`                                                                                       | `hooks/use-on-chain-enroll.ts` after the enroll tx confirms (tx signature = public chain data)                                                                                                                    |
| `unenrollment_onchain`   | `{ courseId, signature }`                                                                                       | `hooks/use-on-chain-unenroll.ts` after the unenroll tx confirms                                                                                                                                                   |
| `lesson_completed`       | `{ lessonId, courseId, signature }`                                                                             | `lessons/[id]/lesson-client.tsx` on completion API success                                                                                                                                                        |
| `earn_handoff_click`     | `{ category: "development" \| "content" \| "grants", source: "mint_success" \| "certificate_page", courseId? }` | `components/certificates/earn-handoff-card.tsx` (E8, #625)                                                                                                                                                        |
| `credential_share_click` | `{ channel: "x" \| "linkedin_add", source: "mint_success" \| "certificate_page", courseId? }`                   | `lib/credentials/share.ts` → certificate share surfaces (#629)                                                                                                                                                    |
| `credential_minted`      | `{ courseId, source: "manual_mint" \| "realtime" }`                                                             | `trackCredentialMinted()` — manual mint success (`course-completion-mint.tsx`) **and** the Realtime certificates INSERT (`use-gamification-events.ts`). Session-deduped per course so one mint = one event (#558) |
| `challenge_started`      | `{ lessonId, challengeKind, courseId? }`                                                                        | `trackChallengeStarted()` — first genuine interaction with a challenge (first editor keystroke or first run, never a page view); session-deduped per lesson (#558)                                                |
| `challenge_run`          | `{ lessonId, challengeKind, courseId? }`                                                                        | `trackChallengeRun()` — each execution, any outcome (#558)                                                                                                                                                        |
| `challenge_failed`       | `{ lessonId, challengeKind, courseId?, consecutiveFails }`                                                      | `trackChallengeFailed()` — per failing run; `consecutiveFails` is the fail streak feeding the encouragement threshold + LX-C4 (#558)                                                                              |
| `challenge_solved`       | `{ lessonId, challengeKind, courseId? }`                                                                        | `trackChallengeSolved()` — per passing run (#558)                                                                                                                                                                 |

`challengeKind` is `"js" | "rust" | "buildable"` (`challengeKindFor()` in
`events.ts`).

Enrollment note: there is no separate `enroll_completed` event — the only
enrollment success moment that exists today is the on-chain path, which
`enrollment_onchain` already covers. If a wallet-less enrollment path ships,
instrument it as `enroll_completed { courseId, method }`.

## Reserved — onboarding funnel (E2/E7), do NOT fire yet

The `/start` intake (#566) is **unbuilt**. These names are reserved so
dashboards and the intake PR agree on shapes; nothing may emit them until the
surface exists:

| Event                       | Payload                                      | Purpose                                                                    |
| --------------------------- | -------------------------------------------- | -------------------------------------------------------------------------- |
| `onboarding_started`        | `{}`                                         | First interaction with `/start` screen 1 (not the page view)               |
| `onboarding_step_completed` | `{ step: 1 \| 2 \| 3 \| 4, choice }`         | Per-screen funnel step (experience fork / goal / value chips / daily goal) |
| `onboarding_goal_committed` | `{ dailyGoal }`                              | E2 implementation-intention substrate (daily-goal picker)                  |
| `onboarding_route_accepted` | `{ accepted: boolean, recommendedCourseId }` | E7 segment-routing acceptance vs "Browse all" override                     |
| `onboarding_completed`      | `{ experience, goal, dailyGoal }`            | Intake finished; values are the closed-set option ids, never free text     |

## Planned (not reserved-blocked, just future)

- `review_completed` — lands with LX-B5 (spaced-review loop).
