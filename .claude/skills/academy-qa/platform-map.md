# Platform map — where to look

Read this before auditing so you spend the run evaluating rather than
rediscovering the repo. Treat every path as a starting point, not gospel: the
platform moves, and part of each run's value is noticing when this map has gone
stale (say so in the report if it has).

## Learner-facing routes

All app routes are locale-prefixed (`/en`, `/pt-BR`, `/es`) under
`apps/web/src/app/[locale]/`.

| Surface           | Route                             | Notes                                               |
| ----------------- | --------------------------------- | --------------------------------------------------- |
| Landing           | `/`                               | Hero CTA resolves via `lib/courses/entry-lesson.ts` |
| Onboarding funnel | `/start`                          | Segment/goal intake                                 |
| Catalogue         | `/courses`                        | Listing, gated (see visibility below)               |
| Course page       | `/courses/[slug]`                 | Enrol lives here                                    |
| Lesson            | `/courses/[slug]/lessons/[id]`    | Prose, quizzes, code challenges                     |
| Dashboard         | `/dashboard`                      | Continue, streaks, quests                           |
| Leaderboard       | `/leaderboard`                    | League / Global / Referrals boards                  |
| Credentials       | `/certificates/...`               | The employer-facing artefact                        |
| Profile           | `/profile`, `/profile/[username]` | Public profile is the shareable one                 |
| Community         | `/community`                      | Forum                                               |
| Review            | `/review`                         | Spaced repetition                                   |
| Settings          | `/settings`                       | Account, links, email consent                       |

Admin (`/admin`) is out of scope for QA runs — it is not a learner or employer
surface and it triggers on-chain writes.

## Content

Courses ship as a **committed bundle**, compiled from the `solanabr/academy-courses`
repo pinned by `apps/web/content.lock`:

- `apps/web/src/content/generated/courses.json` — courses, modules, lesson refs
- `apps/web/src/content/generated/lessons.json` — lesson bodies and blocks
- `apps/web/src/content/generated/paths.json` — learning paths
- Read them directly with `node -e` for content audits; do not hand-edit.

Lesson **block types** currently in the bundle: `prose`, `quiz`, `code`.

Shapes worth knowing (`apps/web/src/lib/content/project.ts` is the projector):

- **quiz** → `questions[]` with `prompt`, `options[]`, `multiSelect`,
  `explanation`. Each option carries a `correct` boolean in the bundle.
- **code** → `starter`, `solution`, `tests`, `hints`, `language`, `buildType`,
  `deployable`.

Because the bundle holds answers and solutions, "what reaches the browser" is a
first-order question for the employer pass — see `employer-pass.md`. The
projector has both a full (`projectLesson`) and a summary
(`projectLessonSummary`) shape; which one a given route uses is the thing to
check, not assume.

## Visibility gates

A course renders publicly only when it is **synced + active** on-chain
(`lib/content/deployments.ts` → `isSynced`). Beyond that,
`lib/courses/unlisted.ts` holds courses that are reachable by direct link but
hidden from the catalogue, landing count, sitemap, recommendations, and the
landing hero. When a course seems "missing", check both before filing it.

## Server routes that decide what a credential means

Full table in `apps/web/src/app/api/CLAUDE.md`. The ones that matter here:

| Route                             | Why it matters                                                                                                                                            |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/lessons/complete`           | The completion write: XP award, auto-finalize, achievements. This is where completion is _gated_ — challenge validation alone does not complete a lesson. |
| `/api/lessons/validate-challenge` | Server-side challenge check (UX pass/fail)                                                                                                                |
| `/api/ai/partner/verify`          | Server-side grading of comprehension checks                                                                                                               |
| `/api/certificates/mint`          | Credential mint + retry queue                                                                                                                             |
| `/api/certificates/metadata`      | The metadata an explorer/employer resolves                                                                                                                |
| `/api/enroll/sponsor`             | Platform-sponsored enrolment (learner is read from the session, never the body)                                                                           |

Server-side limits that already exist (verify they hold rather than
re-proposing them): max 100 XP per lesson completion, max 2000 per generic
award; level = `floor(sqrt(totalXP / 100))`.

## On-chain layer

XP is a soulbound Token-2022 balance; credentials are Metaplex Core NFTs
(soulbound via a permanent freeze delegate); enrolment and lesson completion are
PDAs. Credential metadata is pinned to Arweave via Irys when configured. For the
employer pass, the relevant question is what an outsider can independently
verify from an address — see `docs/ARCHITECTURE.md` for the account model.

## Code execution sandbox

Learner code runs in the browser via `new Function()` with a blocked-pattern
list (`eval`, `Function`, `document`, `window`, `fetch`, `XMLHttpRequest`,
`import()`), a mock console, no DOM, no network. Relevant to the employer pass
in one direction only: whether passing a challenge means anything, not whether
the sandbox is escapable (that's a security review, not a QA run).

## Localisation

Three locales — `en`, `es`, `pt-BR` — in `apps/web/src/messages/`. All three
files must carry identical key structures or the app throws
`MISSING_MESSAGE` at runtime. The primary audience is Brazilian, so PT-BR is a
happy path, not a translation afterthought: audit it as a first-class
experience, including the course content itself.

## Running the app

```bash
cd apps/web && pnpm dev        # needs env vars; see apps/web/CLAUDE.md
```

Chromium is preinstalled for Playwright (`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`);
never run `playwright install`. The repo's `run` skill knows how to launch the
app if you need it. Test the small viewport (≈375px) explicitly — a large share
of the audience arrives on a phone, often from a QR code at an event.

## Useful existing checks

- `/api/health/schema` — reports DB objects the current release expects but that
  are missing from the database. A 503 here explains a surprising number of
  "feature looks broken" symptoms and is worth hitting before filing them.
- `pnpm test` in `apps/web` — the suite is large and green; if you touch code
  while investigating, keep it that way.
