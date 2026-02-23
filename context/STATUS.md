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
- Context docs moved into `/context`.

## In Progress

- Backend production hardening (security, ops, reliability, test coverage).

## Next Up

1. Add backend auth + stricter CORS + rate limits.
2. Add route-level tests for validation and failure paths.
3. Start frontend app shell and wallet-guarded routes.

## Risks / Gaps

- Current backend has no API authentication.
- Current backend has permissive CORS (`*`).
- No formal route test suite yet.
- Frontend learner/admin app pages are not yet built.
