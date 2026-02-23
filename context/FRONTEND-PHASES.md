# Frontend Implementation Guidelines

Last updated: February 23, 2026 (phases F0–F5 implemented)

## 1. Bounty-Aligned Objective

Build a production-ready Solana LMS frontend in the `app/` folder that satisfies bounty requirements while preserving clean abstractions for future backend/on-chain evolution.

## 2. Non-Negotiable Constraints

## 2.1 Security boundary

- Backend `/academy/*` requires `BACKEND_API_TOKEN` or generated API key.
- This token must remain server-side only.
- Browser calls must go through Next server routes (`app/api/*`) for backend-signed actions.

## 2.2 Implementation split (per bounty)

Fully implement on devnet:
- Wallet auth (multi-wallet)
- XP balance display
- Credential display/verification
- Leaderboard UX + integration
- Course enrollment (wallet-signed)

Stub behind clean service abstraction (even if backend exists):
- Lesson completion flow
- Course finalization and credential issuance trigger orchestration
- Achievement claiming UX orchestration
- Streak persistence strategy (frontend-managed)

## 2.3 Required stack alignment

- Next.js App Router + TypeScript strict mode
- Tailwind CSS + design tokens
- Accessible component primitives (current shadcn/ui base)
- Headless CMS integration (later phase)
- i18n (PT-BR, ES, EN)
- Analytics + error monitoring

## 3. Architecture Blueprint

## 3.1 Route groups

- Public: `/`
- Learner: `/(app)/*`
- Admin: `/(admin)/*`
- BFF: `/api/*`

## 3.2 BFF route policy

Create server handlers in `app/api/academy/*` to proxy secured backend calls.

- Server route validates input.
- Server route attaches `X-API-Key` using server env.
- Server route normalizes response (`{ ok, data, error }`).

## 3.3 Service interface policy

Define interfaces so implementation can swap between local/CMS/backend/on-chain.

- `LearningProgressService`
- `CredentialService`
- `LeaderboardService`
- `StreakService`
- `ContentService`

## 4. Delivery Phases

## Phase F0: Platform Foundation ✅

Deliverables:
- `/(app)` shell layout, sidebar, header, wallet guard
- shared primitives: `PageHeader`, `EmptyState`, `XpBadge`, `ProgressBar`
- BFF route scaffolding for backend-signed actions
- shared service contracts + adapters (mock + real)

Done criteria:
- protected routes gated by wallet
- backend token never exposed to client
- all new UI strings externalized for i18n

## Phase F1: Core Learning Surfaces ✅

Deliverables:
- `/courses`
- `/courses/[slug]`
- enrollment UX (wallet signed)
- learner progress indicators

Done criteria:
- user can browse, filter, search, and enroll in courses
- prerequisite messaging clear

## Phase F2: Lesson + Challenge UX ✅

Deliverables:
- `/courses/[slug]/lessons/[id]`
- split content/editor layout (resizable)
- challenge block with run/test feedback model
- completion UX with autosave state

Done criteria:
- lesson flow usable end-to-end in UI
- completion states persist through service layer abstraction

## Phase F3: Dashboard + Gamification UI ✅

Deliverables:
- `/dashboard`
- XP + level visualization
- streak calendar UI
- recent achievements/activity modules

Done criteria:
- dashboard surfaces current course, progress, XP, streaks, and recommendations

## Phase F4: Credentials + Leaderboard + Profiles ✅

Deliverables:
- `/certificates/[id]`
- `/leaderboard` with timeframe filters
- `/profile` and `/profile/[username]`

Done criteria:
- credential cards show verification links
- leaderboard supports weekly/monthly/all-time filters

## Phase F5: Settings + Admin (partial — settings done, admin pending)

Deliverables:
- `/settings`
- `/(admin)` layout and pages for courses/minters/achievements/config

Done criteria:
- authority-only guards for admin actions
- account linking and preference UX scaffolded

## Phase F6: CMS Integration (Later Phase)

Deliverables:
- integrate Sanity (recommended) as headless CMS
- content schema: course -> module -> lesson (content/challenge)
- draft/publish workflow + media handling
- content adapters replacing mock content service

Done criteria:
- non-dev author can create/update/publish course content without code changes
- frontend consumes CMS content through typed mapper layer

## Phase F7: Analytics, i18n, and Performance Hardening (Later Phase)

Deliverables:
- GA4 events
- heatmap provider (PostHog/Clarity/Hotjar)
- Sentry integration
- PT-BR, ES, EN switcher and externalized strings
- Lighthouse/CWV optimization pass

Done criteria:
- Lighthouse targets near bounty requirements
- critical user events tracked
- language switching works across core pages

## 5. Bounty Page Coverage Matrix

Must cover these pages in implementation plan:
- `/`
- `/courses`
- `/courses/[slug]`
- `/courses/[slug]/lessons/[id]`
- `/dashboard`
- `/profile`, `/profile/[username]`
- `/leaderboard`
- `/settings`
- `/certificates/[id]`

## 6. Quality Gates

Per merged feature:
- typed inputs/outputs (no `any`)
- loading/empty/error states
- wallet-disconnected handling
- mobile and desktop verification
- transaction feedback + retry UX

## 7. Immediate Next Steps

1. Implement BFF academy proxy routes.
2. Build app shell and wallet guard.
3. Build `/courses` and `/courses/[slug]`.
4. Build lesson + challenge interface with service abstractions.
5. Defer CMS integration to F6 after core flow stabilizes (do not start CMS first).
