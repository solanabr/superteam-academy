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
- Postman collection/environment created and endpoint suite validated for:
  - `/health`
  - `/academy/create-course`
  - `/academy/complete-lesson`
  - `/academy/finalize-course`
  - `/academy/issue-credential`

## In Progress

- Frontend implementation execution (planning baseline complete).

## Next Up

1. Build frontend BFF routes (`app/api/academy/*`) to call backend securely with server token.
2. Build learner app shell + wallet-guarded routes.
3. Implement courses -> lessons -> finalize -> credential frontend flow.
4. Integrate Sanity CMS in later phase (after core pages are functional).
5. Add rate limiting and route-level backend tests.

## Risks / Gaps

- No formal route test suite yet.
- Frontend learner/admin app pages are not yet built.
- Frontend currently cannot call backend directly from browser due to secret token requirements; BFF layer is mandatory.
