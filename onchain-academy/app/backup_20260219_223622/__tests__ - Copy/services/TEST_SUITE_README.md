# Superteam Academy — Complete Test Suite

## Overview

| File | Type | Tests | What it covers |
|------|------|-------|----------------|
| `__tests__/lib/utils.test.ts` | Unit | 55 | `cn`, `formatXP`, `calculateLevel`, `xpForNextLevel`, `levelProgress`, `truncateAddress`, `formatDuration`, `formatRelativeTime`, `isValidSolanaAddress`, `getDifficultyColor`, `getDifficultyVariant` |
| `__tests__/lib/auth-service.test.ts` | Unit | 38 | `getAuthRedirectURL`, `buildWalletLinkMessage`, `AuthService` (all methods), `getAuthService` singleton |
| `__tests__/services/mock-learning-progress.test.ts` | Unit | 52 | `MockLearningProgressService` — XP, idempotency, level-up, streaks, achievements, getProgress, leaderboard, concurrency |
| `__tests__/services/supabase-progress.test.ts` | Unit | 35 | `SupabaseProgressService` — all 7 methods, constructor guard, singleton |
| `__tests__/middleware.test.ts` | Unit | 28 | `stripLocale`, `isProtectedPath`, route protection decision table, locale extraction |
| `__tests__/api/link-wallet.test.ts` | Unit | 25 | OPTIONS preflight, body validation (8 cases), JWT auth, message binding, Ed25519 verification, DB RPC, CORS headers |
| `__tests__/contexts/AuthContext.test.tsx` | Unit | 24 | `useAuth` guard, all 5 `authStage` transitions, `isLinked`, `signInWithGoogle`, `linkWallet`, `signOut`, `clearError`, wallet mirroring |
| `__tests__/integration/learning-flow.test.ts` | Integration | 26 | Gamification math consistency, full lesson progression pipeline, leaderboard competition, auth URL binding, wallet display pipeline, service isolation |

**Total: ~283 tests**

---

## Installation

The new tests require one additional dev dependency:

```bash
npm install --save-dev @vitest/coverage-v8
```

> `tweetnacl` and `bs58` are already in `dependencies` (added with the auth system). No other new packages needed.

---

## File Placement

All 8 test files belong in `__tests__/` at the project root:

```
superteam-academy/
├── __tests__/
│   ├── lib/
│   │   ├── utils.test.ts
│   │   └── auth-service.test.ts
│   ├── services/
│   │   ├── mock-learning-progress.test.ts
│   │   └── supabase-progress.test.ts
│   ├── api/
│   │   └── link-wallet.test.ts
│   ├── middleware.test.ts
│   ├── contexts/
│   │   └── AuthContext.test.tsx
│   └── integration/
│       └── learning-flow.test.ts
├── vitest.config.ts          ← replace the existing one
└── vitest.setup.ts           ← unchanged
```

---

## Running Tests

### All tests (fast)
```bash
npm test
```

### Watch mode (development)
```bash
npm run test:ui
```

### Specific test file
```bash
npm test -- utils                     # run utils tests
npm test -- auth-service              # run auth-service tests
npm test -- mock-learning-progress    # run MockLearningProgressService tests
npm test -- supabase-progress         # run SupabaseProgressService tests
npm test -- middleware                # run middleware tests
npm test -- link-wallet               # run API route tests
npm test -- AuthContext               # run AuthContext tests
npm test -- learning-flow             # run integration tests
```

### With coverage report
```bash
npm run test:coverage
```
Opens `coverage/index.html` in your browser for the full HTML report.

### Only unit tests (exclude integration)
```bash
npm test -- --ignore="__tests__/integration"
```

### Only integration tests
```bash
npm test -- __tests__/integration
```

---

## Coverage Targets

| Module | Statements | Branches | Functions |
|--------|-----------|----------|-----------|
| `lib/utils.ts` | **100%** | **100%** | **100%** |
| `lib/auth-service.ts` | **~95%** | **~90%** | **100%** |
| `lib/services/learning-progress.ts` | **~90%** | **~85%** | **100%** |
| `lib/services/SupabaseProgressService.ts` | **~95%** | **~90%** | **100%** |
| `middleware.ts` (helpers) | **~85%** | **~90%** | **100%** |
| `app/api/auth/link-wallet/route.ts` | **~95%** | **~95%** | **100%** |
| `contexts/AuthContext.tsx` | **~80%** | **~75%** | **~90%** |
| **Overall** | **~90%** | **~87%** | **~98%** |

> `middleware.ts` edge-runtime logic (the actual middleware function that chains Supabase + next-intl) is not unit-testable without the Next.js Edge Runtime. The helper functions `stripLocale` and `isProtectedPath` are tested 100%. For full E2E middleware coverage, use Playwright (see CI section below).

---

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/test.yml`:

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests with coverage
        run: npm run test:coverage
        env:
          # Tests mock all external services — no real env vars needed
          NEXT_PUBLIC_SUPABASE_URL: https://test.supabase.co
          NEXT_PUBLIC_SUPABASE_ANON_KEY: test-anon-key

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          file: ./coverage/coverage-final.json
          flags: unittests
          fail_ci_if_error: false

      - name: Comment coverage on PR
        if: github.event_name == 'pull_request'
        uses: davelosert/vitest-coverage-report-action@v2
        with:
          json-summary-path: ./coverage/coverage-summary.json
```

### Vercel Preview Deployment

Add to `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:ci": "vitest run --reporter=verbose"
  }
}
```

In Vercel project settings → **Build & Development Settings**:

| Setting | Value |
|---------|-------|
| Build Command | `npm run test:ci && npm run build` |
| Install Command | `npm ci` |

This runs the full test suite before each deployment. A failing test prevents the deploy.

### Pre-commit Hook (optional, with Husky)

```bash
npm install --save-dev husky lint-staged
npx husky init
```

`.husky/pre-commit`:
```bash
#!/bin/sh
npx vitest run --reporter=verbose 2>&1
```

This blocks commits when any test is failing.

---

## Mocking Philosophy

All tests follow the same discipline:

| What | How | Why |
|------|-----|-----|
| Supabase client | `vi.mock('@/lib/supabase/client')` | No network, no cookies |
| Supabase admin | `vi.mock('@supabase/supabase-js')` | Service role key never in test env |
| `fetch()` | `global.fetch = vi.fn()` | Deterministic API responses |
| Wallet adapter | `vi.mock('@solana/wallet-adapter-react')` | No browser wallet extension |
| `next/headers` | `vi.mock('next/headers')` | No Next.js request context |
| `@supabase/ssr` | `vi.mock('@supabase/ssr')` | No Edge Runtime |
| Timers | `vi.useFakeTimers()` | Deterministic streak + relative-time tests |
| Env vars | `vi.stubEnv()` | Isolated priority branch tests |

**We never mock `MockLearningProgressService`** — it is the mock, and we test it directly for 100% confidence in the service contract.

**We never mock `tweetnacl` or `bs58`** in the API route tests — real signatures are generated and verified, proving the cryptographic path works end-to-end.

---

## Adding New Tests

1. Create the file in the appropriate `__tests__/` subdirectory
2. Use `vi.mock()` at the top (before imports) for all external dependencies
3. Follow the Arrange-Act-Assert pattern
4. Each `describe` block owns a single `beforeEach` that resets all mocks via `vi.clearAllMocks()`
5. Test names read as documentation: `"returns null when user is not enrolled in the course"`

---

## Known Limitations

- **`AuthContext.tsx` bootstrap path**: The `onAuthStateChange` subscription callback (fired by Supabase) is not directly invoked in most tests because triggering it requires the mock to call the callback asynchronously. The `loadProfile` path IS tested through the initial `getUser` mock.
- **`middleware.ts` main function**: The `middleware()` export depends on `@supabase/ssr` and `next-intl` middleware chaining, which requires the Edge Runtime. Helper functions are tested 100%. Use Playwright for E2E middleware coverage.
- **`AuthButton.tsx` and `Navbar.tsx`**: React component rendering tests are not included in this suite. Add them with `@testing-library/react` `render()` if UI regression testing is needed.
