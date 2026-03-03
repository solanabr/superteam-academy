# 17 — Testing Documentation

> Comprehensive unit and end-to-end testing suite for Superteam Academy.

## Overview

The application includes a full test suite with **Vitest** for unit/integration tests and **Playwright** for end-to-end (E2E) tests. Tests are organized in a `test/` directory at the application root.

```
test/
├── unit/              # 33 files, 196 tests — Vitest
│   ├── setup.ts       # Global env stubs + framework mocks
│   ├── backend/       # Backend module tests
│   ├── context/       # Context & Solana tests
│   ├── api/           # API route handler tests
│   └── lib/           # Library tests
├── e2e/               # 5 specs, 24 tests — Playwright
│   ├── landing.spec.ts
│   ├── login.spec.ts
│   ├── health-api.spec.ts
│   ├── public-api.spec.ts
│   └── navigation.spec.ts
└── reports/           # Test output + coverage
    ├── unit-test-report.md
    ├── e2e-test-report.md
```

---

## Quick Start

### Run Unit Tests

```bash
# Run all unit tests
npm test

# Run in watch mode (re-runs on file changes)
npm run test:watch

# Run with coverage report
npm run test:coverage
```

### Run E2E Tests

```bash
# Install Playwright browsers (first time only)
npx playwright install chromium

# Run all E2E tests
npm run test:e2e

# View HTML report after a run
npm run test:e2e:report
```

> **Note:** E2E tests auto-start the dev server via `npm run dev`. The first page load may take 3–7 minutes due to Next.js cold compilation. Timeouts are set to 8 minutes to accommodate this.

---

## Unit Tests (Vitest)

**Framework:** [Vitest](https://vitest.dev/) with `@vitest/coverage-v8`  
**Config:** [`vitest.config.ts`](../vitest.config.ts)  
**Setup:** [`test/unit/setup.ts`](../test/unit/setup.ts) — stubs env vars and mocks Next.js/NextAuth

### Test Summary

| Module | File | Tests | Description |
|--------|------|-------|-------------|
| **Backend — Core** | `errors.test.ts` | 16 | Error hierarchy (`AppError`, `RpcError`, `ValidationError`, `ServiceError`), type guard, safe response |
| | `retry.test.ts` | 15 | `withRetry` exponential backoff, `isTransientError` pattern matching |
| | `redis.test.ts` | 4 | Redis singleton, env validation, graceful fallback |
| | `achievements.test.ts` | 6 | Achievement definitions, unique IDs, valid categories |
| | `prisma.test.ts` | 1 | Prisma module export |
| **Backend — Auth** | `auth/validation.test.ts` | 8 | Solana address validation (Base58, length, invalid chars) |
| | `auth/rate-limit.test.ts` | 2 | Rate limiting with/without Redis in dev/production |
| | `auth/nonce-store.test.ts` | 4 | Nonce CRUD, one-time consumption, TTL expiry |
| | `auth/lockout.test.ts` | 4 | Failed attempt tracking, lockout after 5 failures, clear |
| | `auth/audit.test.ts` | 3 | Audit logging with mocked Prisma, silent failure handling |
| **Backend — Admin** | `admin/utils.test.ts` | 5 | Constants (`PAGE_SIZE`, `ACTIVITY_LIMIT`), `startOfToday()` |
| **Context** | `xp-calculations.test.ts` | 20 | `calculateLevel`, `getXpForLevel`, `getLevelProgress`, `calculateCompletionBonus`, `calculateCreatorReward` |
| | `constants.test.ts` | 21 | All app constants (pagination, content limits, queue, cache, achievements, GDPR) |
| | `env.test.ts` | 8 | `getRequiredEnv`, `safeErrorDetails`, `getRpcUrl` with env-dependent behavior |
| | `utils.test.ts` | 4 | `cn()` classname merge utility |
| **Context — Solana** | `solana/bitmap.test.ts` | 23 | Lesson completion bitmaps (bigint ops, multi-word, progress, indices) |
| | `solana/pda.test.ts` | 12 | PDA derivation (determinism, input sensitivity, type correctness) |
| | `solana/constants.test.ts` | 5 | Program IDs, mint addresses, uniqueness |
| **Lib** | `banner-constants.test.ts` | 7 | Banner image paths, blur data URIs |
| **API Routes** | `api/health.test.ts` | 5 | Health endpoint with mocked services |
| | `api/courses.test.ts` | 1 | Courses route import |
| | `api/leaderboard.test.ts` | 1 | Leaderboard route import |
| | `api/achievements.test.ts` | 1 | Achievements route import |
| | `api/community.test.ts` | 1 | Community threads route import |
| | `api/profile.test.ts` | 1 | Profile route import |
| | `api/xp.test.ts` | 1 | XP route import |
| | `api/streak.test.ts` | 1 | Streak route import |
| | `api/notifications.test.ts` | 1 | Notifications route import |
| | `api/code-execute.test.ts` | 1 | Code execution route import |
| | `api/credentials.test.ts` | 1 | Credentials route import |
| | `api/lessons.test.ts` | 1 | Lessons route import |
| | `api/events.test.ts` | 1 | Events route import |
| | `api/admin/stats.test.ts` | 2 | Admin stats & users route imports |
| **TOTAL** | **33 files** | **196** | **All passing ✅** |

### Mocking Strategy

- **Environment variables:** Stubbed in `test/unit/setup.ts` with test values
- **Prisma/DB:** Mocked with `vi.mock('@/backend/prisma')` per test file
- **Next.js:** `next/headers`, `next-auth/next` mocked globally in setup
- **External APIs:** `fetch` stubbed via `vi.stubGlobal('fetch', ...)`
- **Redis:** Module-level env var deletion forces in-memory fallback

---

## E2E Tests (Playwright)

**Framework:** [Playwright](https://playwright.dev/)  
**Config:** [`playwright.config.ts`](../playwright.config.ts)

### Test Summary

| Spec | Tests | Passed | Description |
|------|-------|--------|-------------|
| `health-api.spec.ts` | 4 | 4 ✅ | Health endpoint status, JSON shape, service checks |
| `landing.spec.ts` | 6 | 6 ✅ | Hero, navbar, CTA, footer, title, console errors |
| `login.spec.ts` | 4 | 4 ✅ | Login page render, Google/GitHub/Wallet auth buttons |
| `navigation.spec.ts` | 6 | 6 ✅ | Page loads (courses, leaderboard, community), responsive viewports |
| `public-api.spec.ts` | 4 | 4 ✅ | Leaderboard, courses, achievements JSON responses, 404 |
| **TOTAL** | **24** | **24 ✅** | **100% pass rate** |

> **Note:** The `/courses` route is auth-protected. The E2E test verifies both behaviors — rendering the page (authenticated) or redirecting to login (unauthenticated).

### Playwright Configuration

- **Browser:** Chromium only
- **Workers:** 1 (sequential to avoid dev server overload)
- **Timeouts:** 8 minutes (test), 8 minutes (navigation), 2 minutes (actions)
- **Web server:** Auto-starts `npm run dev` with 10-minute startup timeout
- **Reports:** HTML report at `test/reports/playwright-report/`

---

## Test Results Summary

> **Unit Tests:** 33 files — 196 tests — **ALL PASSING** ✅ (~9s)  
> **E2E Tests:** 5 specs — 24 tests — **ALL PASSING** ✅ (~18 min)  
> **Total:** 220 tests across 38 files — **100% pass rate**

Detailed reports are available at:
- [`test/reports/unit-test-report.md`](../test/reports/unit-test-report.md) — per-test results for all 196 unit tests
- [`test/reports/e2e-test-report.md`](../test/reports/e2e-test-report.md) — per-test results for all 24 E2E tests

---

## Configuration Files

| File | Purpose |
|------|---------|
| `vitest.config.ts` | Vitest settings — path aliases, coverage config, test inclusion patterns |
| `playwright.config.ts` | Playwright settings — browser, timeouts, web server, reporter |
| `test/unit/setup.ts` | Global test setup — env stubs, Next.js/NextAuth mocks |

## Dependencies

```json
{
  "vitest": "^4.0.18",
  "@vitest/coverage-v8": "^4.0.18",
  "@playwright/test": "^1.51.0"
}
```

## CI/CD Integration

To run tests in CI:

```yaml
# GitHub Actions example
- name: Unit Tests
  run: npm test

- name: E2E Tests
  run: |
    npx playwright install chromium --with-deps
    npm run test:e2e
```

Set `CI=true` in your CI environment to enable:
- Stricter Playwright settings (`forbidOnly: true`)
- Retries for flaky E2E tests (`retries: 2`)
- Single worker to reduce resource usage
