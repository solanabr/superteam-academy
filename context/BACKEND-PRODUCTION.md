# Backend Productionization Checklist

## Objectives

- Keep backend simple.
- Keep API behavior predictable.
- Improve security and operability without overengineering.

## Phase P1: API Contract and Validation

- [x] Split route logic by domain
- [x] Shared request validation helpers
- [x] Shared error mapper
- [x] Publish request/response contract examples for each endpoint
- [x] Add versioning approach (`/v1` or header versioning)

## Phase P2: Security

- [x] API auth middleware
  - Option A: static service token (fastest)
  - Option B: signed nonce workflow (stronger)
- [x] Admin JWT + API key generation
  - `ADMIN_SECRET` + `ADMIN_PASSWORD` enable `/v1/admin/login`, `/v1/admin/generate-api-key`
  - Generated keys work for academy endpoints
- [x] Rate limiting middleware (per IP + per wallet where possible)
- [x] Environment-based CORS allowlist
- [x] Max body size and malformed body guards

## Phase P3: Reliability

- [x] Structured logging (`requestId`, route, status, duration)
- [x] Timeout + retry strategy for non-transaction RPC calls
- [x] Distinguish retriable vs non-retriable failures
- [x] Health and readiness endpoints

## Phase P4: Testing

- [x] Unit tests for validation helpers
- [x] Route tests for all 13 endpoints (happy + invalid payload)
- [x] Smoke test script for critical flows:
  - create-course
  - complete-lesson
  - finalize-course
  - issue-credential

## Phase P5: Deployment Readiness

- [ ] Production `.env` template
- [ ] Log redaction policy (never leak key material)
- [ ] Process manager / container setup
- [ ] CI checks (lint/build/tests)
- [ ] Rollback plan

## Minimum Production Bar

Before release, complete at least:

- P2 auth + rate limit + CORS
- P3 structured logging + readiness
- P4 route tests for critical endpoints
- P5 CI checks
