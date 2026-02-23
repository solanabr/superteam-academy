# PR Checklist

Use this before pushing or opening a PR.

## 1. Scope and Intent

- [ ] Change is in scope (backend productionization or frontend app pages).
- [ ] No on-chain program changes included unless explicitly requested.
- [ ] PR description states: problem, solution, and impacted routes/pages.

## 2. Code Quality

- [ ] Code is modular and follows separation of concerns.
- [ ] No dead code, debug logs, or commented-out blocks left behind.
- [ ] Error handling is consistent and returns actionable messages.
- [ ] Validation is explicit for user input and public keys.

## 3. Backend Checks

- [ ] `pnpm -C backend lint` passes.
- [ ] `pnpm -C backend build` passes.
- [ ] Endpoint behavior remains backward compatible unless intentionally changed.
- [ ] New/changed routes are reflected in backend docs.
- [ ] Security basics are preserved:
- [ ] API auth enforced for protected routes (if enabled in this phase).
- [ ] CORS config matches target environment.
- [ ] Rate limiting is applied where required.

## 4. Frontend Checks (if frontend changed)

- [ ] `pnpm -C app lint` passes.
- [ ] `pnpm -C app build` passes.
- [ ] Wallet-required routes are guarded.
- [ ] Loading, empty, and error states are implemented for new pages.
- [ ] Responsive behavior verified for mobile and desktop.

## 5. Testing and Verification

- [ ] Added or updated tests for changed behavior.
- [ ] Manual test run for core happy path and at least one failure path.
- [ ] Devnet validation done for transaction-related backend/frontend changes.

## 6. Docs and Context

- [ ] `context/STATUS.md` updated with what changed.
- [ ] `context/PLAN.md` updated if priorities or order changed.
- [ ] Relevant context files updated (`BACKEND-PRODUCTION.md`, `FRONTEND-PHASES.md`, `DECISIONS.md`).
- [ ] README/docs updated for any setup/config changes.

## 7. Git Hygiene

- [ ] PR contains only relevant files.
- [ ] No secrets, keypairs, or private data committed.
- [ ] Commit messages are clear and scoped.
- [ ] `git diff` reviewed end-to-end before push.
