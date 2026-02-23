# Project Status

Last updated: February 23, 2026

## Done

- On-chain program and tests already available in repo (out of scope for current build work).
- Backend has full academy route coverage (13 routes).
- Backend refactored into modular structure:
  - Route composer
  - Domain route files
  - Shared Solana helpers
  - Shared validation and error handling
- Backend lint/build pass.
- Backend critical security fixes shipped:
  - API token auth enforced on `/academy/*`
  - CORS moved from `*` to environment-based allowlist
- Context docs moved into `/context`.
- Frontend planning docs aligned to bounty scope:
  - `context/FRONTEND-PHASES.md`
  - `context/DESIGN-GUIDELINES.md`
  - `context/BOUNTY-MAPPING.md`
- Postman collection/environment created and endpoint suite validated.
- **Frontend BFF layer complete**:
  - Catch-all proxy at `app/api/academy/[action]/route.ts`
  - `BACKEND_API_TOKEN` attached server-side via `X-API-Key`
  - `.env.local` created with token + Solana devnet config
- **Frontend app shell complete**:
  - Global Navbar (persistent across all pages) with wallet connect
  - `(app)` route group with collapsible sidebar + AppHeader (XP badge)
  - `WalletGuard` gating for authenticated pages
  - Shared primitives: `PageHeader`, `EmptyState`, `XpBadge`, `ProgressBar`
- **Frontend learner pages complete (F0–F5)**:
  - `/courses` — catalog with search + difficulty filter
  - `/courses/[slug]` — detail with module/lesson hierarchy + on-chain enrollment
  - `/courses/[slug]/lessons/[id]` — split content/editor lesson player
  - `/dashboard` — XP stats, level progress, streak calendar, recommendations
  - `/leaderboard` — standalone page (no sidebar), dark podium design
  - `/profile` — wallet info, XP, credentials placeholder
  - `/certificates` + `/certificates/[id]` — list + detail with explorer link
  - `/settings` — account, notifications, appearance sections
- **4 courses created on devnet**:
  - `solana-fundamentals` (5 lessons, 100 XP/lesson)
  - `anchor-development` (8 lessons, 150 XP/lesson)
  - `token-extensions` (6 lessons, 200 XP/lesson)
  - `metaplex-core` (5 lessons, 150 XP/lesson)
- **Mock content layer** for UI development (4 courses with modules/lessons).
- `pnpm build` passes with 0 TypeScript errors, 14 routes generated.

## In Progress

- UI polish and refinement based on review.

## Next Up

1. Build admin pages (`(admin)` layout, course/minter/achievement CRUD).
2. Add public profile (`/profile/[username]`).
3. Integrate Sanity CMS in later phase (F6, after core pages stabilize).
4. Add rate limiting and route-level backend tests.
5. Analytics + i18n (Phase F7).

## Risks / Gaps

- No formal frontend test suite.
- Admin pages not yet built.
- Mock content will need CMS replacement in Phase F6.
- No i18n string externalization yet (planned F7).
