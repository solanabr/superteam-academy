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

## Current Snapshot

| Area | Status | Notes |
|---|---|---|
| Backend route coverage | Done | All 13 academy routes implemented |
| Backend modular refactor | Done | Handlers split by domain + shared libs |
| Backend production hardening | In progress | Auth, rate limits, observability, deployment guardrails pending |
| Frontend app pages | Not started | Only landing + `/test` page currently |

## Workstream A: Backend Productionization

Detailed checklist: `context/BACKEND-PRODUCTION.md`

### A1. Contract and Validation
- [x] Route split by domain
- [x] Shared request validation helpers
- [x] Consistent error responses
- [ ] Document full request/response schemas for every route

### A2. Security and Access
- [ ] Add API auth middleware (service token or signature-based)
- [ ] Add request rate limiting
- [ ] Restrict CORS origins by environment
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

Detailed phase list: `context/FRONTEND-PHASES.md`

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

1. Finish Workstream A (backend hardening)
2. Build Workstream B1 + B2 (core learner flow)
3. Build Workstream B3 (credentials/leaderboard/achievements)
4. Build Workstream B4 (admin/settings)
5. End-to-end QA + deployment checklist

## Definition of Done

- Backend has auth, rate limit, structured logs, and route-level tests.
- Frontend delivers end-to-end learner flow using existing backend routes.
- Critical paths validated on devnet with real wallets.
- Runbook and env setup docs complete for handoff.
