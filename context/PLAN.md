# Superteam Academy Plan

Last updated: February 23, 2026

## Goal

Ship a production-ready **backend + frontend app experience** using the existing on-chain program.

## Scope Rules

- On-chain program is out of scope (already provided and tested).
- Focus areas:
  - Backend API productionization
  - Frontend app pages and flows
- Keep implementation simple, modular, and easy to operate.

## Bounty Alignment References

- `context/FRONTEND-PHASES.md` (execution sequence F0-F7)
- `context/DESIGN-GUIDELINES.md` (dark-first UX rules)
- `context/BOUNTY-MAPPING.md` (requirement-to-phase mapping and deliverables)

## Current Snapshot

| Area | Status | Notes |
|---|---|---|
| Backend route coverage | Done | All 13 academy routes implemented |
| Backend modular refactor | Done | Handlers split by domain + shared libs |
| Backend production hardening | In progress | Auth + CORS allowlist complete; rate limits, observability, tests pending |
| Frontend app pages | In progress | Detailed phase/design plan now documented; implementation pending |

## Workstream A: Backend Productionization

Detailed checklist: `context/BACKEND-PRODUCTION.md`

### A1. Contract and Validation
- [x] Route split by domain
- [x] Shared request validation helpers
- [x] Consistent error responses
- [ ] Document full request/response schemas for every route

### A2. Security and Access
- [x] Add API auth middleware (service token)
- [ ] Add request rate limiting
- [x] Restrict CORS origins by environment
- [ ] Add input/body size limits

### A3. Reliability and Operations
- [ ] Structured logs with request IDs
- [ ] Health + readiness checks
- [ ] Retry policy for RPC-dependent reads
- [ ] Configurable timeouts

### A4. Testing
- [ ] Route-level tests for validation and error cases
- [ ] Smoke tests for critical transaction paths
- [ ] CI workflow for lint/build/test

## Workstream B: Frontend App Build

Detailed execution: `context/FRONTEND-PHASES.md`  
Design system and UX rules: `context/DESIGN-GUIDELINES.md`  
Bounty requirement mapping: `context/BOUNTY-MAPPING.md`

### B1. Foundation
- [ ] App shell (`(app)/layout`) + wallet guard
- [ ] Shared UI primitives (page header, empty state, XP badge, progress bar)

### B2. Learner Core Flow
- [ ] Courses list + course detail + enroll
- [ ] Lesson player + complete lesson + finalize course
- [ ] Dashboard progress view

### B3. Credentials and Growth
- [ ] Certifications page
- [ ] Leaderboard page
- [ ] Profile page
- [ ] Achievements view

### B4. Admin and Settings
- [ ] Settings page
- [ ] Admin pages (courses, minters, achievements, config)

## Recommended Execution Order

1. Build BFF API layer in frontend (`app/api/academy/*`) to consume secured backend.
2. Build Workstream B1 + B2 (core learner flow).
3. Build Workstream B3 (credentials/leaderboard/achievements).
4. Build Workstream B4 (admin/settings).
5. Integrate CMS in later phase (F6) after core learner flow stabilizes.
6. Continue remaining Workstream A tasks (rate limits, tests, observability) in parallel.
7. Run F7 analytics/i18n/performance hardening, then end-to-end QA + deployment checklist.

## Definition of Done

- Backend has auth, rate limit, structured logs, and route-level tests.
- Frontend delivers end-to-end learner flow using existing backend routes.
- Critical paths validated on devnet with real wallets.
- Runbook and env setup docs complete for handoff.
