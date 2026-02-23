# Backend Productionization Checklist

## Objectives

- Keep backend simple.
- Keep API behavior predictable.
- Improve security and operability without overengineering.

## Phase P1: API Contract and Validation

- [x] Split route logic by domain
- [x] Shared request validation helpers
- [x] Shared error mapper
- [ ] Publish request/response contract examples for each endpoint
- [ ] Add versioning approach (`/v1` or header versioning)

## Phase P2: Security

- [ ] API auth middleware
  - Option A: static service token (fastest)
  - Option B: signed nonce workflow (stronger)
- [ ] Rate limiting middleware (per IP + per wallet where possible)
- [ ] Environment-based CORS allowlist
- [ ] Max body size and malformed body guards

## Phase P3: Reliability

- [ ] Structured logging (`requestId`, route, status, duration)
- [ ] Timeout + retry strategy for non-transaction RPC calls
- [ ] Distinguish retriable vs non-retriable failures
- [ ] Health and readiness endpoints

## Phase P4: Testing

- [ ] Unit tests for validation helpers
- [ ] Route tests for all 13 endpoints (happy + invalid payload)
- [ ] Smoke test script for critical flows:
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
