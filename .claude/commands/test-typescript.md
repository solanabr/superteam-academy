---
description: "Run the TypeScript tests: Vitest unit tests, Playwright e2e, and typecheck"
---

Run the TypeScript tests for what changed, then report pass/fail with the failing test names and
the first relevant error for each.

## Web app (`apps/web`)

```bash
pnpm --filter web test                              # Vitest, all unit tests
pnpm --filter web exec vitest run src/lib/foo       # one folder or file
pnpm --filter web typecheck
pnpm --filter web e2e                               # Playwright, builds and starts the app (slow)
```

- Unit tests sit next to the code in `__tests__/` folders. Playwright specs live in `apps/web/e2e/`
  and are excluded from Vitest.
- First run of e2e: `pnpm --filter web exec playwright install chromium`.
- The i18n parity test fails when `en.json`, `pt-BR.json` and `es.json` don't share the same keys.
- Content tests run on a fixed golden fixture; a content release never needs a test edit. If a
  golden snapshot changes, the compiler changed.

## Whole workspace

```bash
pnpm typecheck && pnpm lint && pnpm -r test    # what CI's Frontend job runs
pnpm test:scripts                              # root scripts/ tests
pnpm test:hooks                                # .claude/hooks guards
```

## Program CU harness

`onchain-academy/tests/cu-measurement.ts` is the only ts-mocha suite (`pnpm cu:pinocchio` from
`onchain-academy/`). Program behaviour is tested in Rust; see `/test-rust`.

Don't weaken an assertion or skip a test to get green. If a test is wrong, say why and fix the test
in its own commit.
