---
description: "Run the tests for what changed, diagnose failures, fix the cause, and rerun until green"
---

Run the relevant tests, fix what fails, and rerun until green. Fix causes, not symptoms.

## 1. Run what the change touches

- `apps/web`: `pnpm --filter web typecheck` and `pnpm --filter web test` (see `/test-typescript`).
- `onchain-academy`: the host tests and the LiteSVM suite (see `/test-rust`).
- `packages/*`: `pnpm -r test`.
- Lint: `pnpm lint`. Rust: `cargo fmt --check` and clippy with `-D warnings`.

## 2. Diagnose

Read the first failure fully before touching code. Common causes here:

- `MISSING_MESSAGE` or the i18n parity test: a key added to one locale file and not the other two.
- "Content bundle freshness" in CI: `src/content/generated/` doesn't match `content.lock`. Run
  `pnpm --filter web compile-content` and commit the result; never hand-edit the bundle.
- Layout or discriminator parity: the program drifted from the IDL. Fix the program, or update
  every IDL copy in the same change.
- Undefined fields on decoded accounts: snake_case (raw `BorshCoder` in `academy-reads.ts`) versus
  camelCase (`program.account` in `academy-program.ts`).
- Wrong lesson completed or a slot error: a lesson index taken from array position instead of
  `getLessonSlot()`.
- A schema-expectation failure: a migration isn't applied to the target DB yet.

## 3. Fix and rerun

- Format first: `pnpm exec prettier --write <files>`, `cargo fmt`. Then `cargo clippy --fix` for
  the mechanical lints and fix the rest by hand.
- Rerun the failing test alone, then the whole suite for that area.
- Don't delete a test, weaken an assertion, add `.skip`, or widen a type to `any` to get green. If
  the test is wrong, say why and fix it in its own commit.
- After three attempts at the same failure, stop and report what you tried and what you think is
  wrong.

Report what failed, the cause, the fix, and the final test output.
