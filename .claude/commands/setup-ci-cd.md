---
description: "Change or extend the existing GitHub Actions CI without breaking its guards"
disable-model-invocation: true
---

CI already exists. Use this to add a job, change a workflow, or check a workflow change, as
described in $ARGUMENTS. Workflow changes are high risk in `REVIEW.md`: they need an adversarial
review and the owner's explicit OK.

## What's there (`.github/workflows/`)

- `ci.yml`: Frontend (lint, typecheck, unit tests, content-bundle freshness), E2E, On-chain (fmt,
  clippy, both `cargo test` flavors), Build server, Dependency audit, Integration (LiteSVM), and the
  verifiable build that publishes the program hash.
- `action-pin-guard.yml` (SHA-pin guard) and `root-dir-guard.yml` (top-level directory allowlist).
- `fuzz.yml` (nightly), `lighthouse.yml`, `validate-content.yml`, `content-release.yml`, and
  `bcb-561-reverify-alarm.yml`.

Required checks on `main`: "Frontend (lint · typecheck · test)", "On-chain (fmt · clippy · cargo
test)" and "SHA-pin guard". Dependabot batches action bumps monthly (`.github/dependabot.yml`).

## Rules

- Pin every `uses:` to a full 40-character commit SHA with the version in a comment. The SHA-pin
  guard rejects anything else.
- No workflow-level `on.paths` filter on a workflow that provides a required check: the check stays
  pending and blocks unrelated merges. Filter inside the job (the `changes` job in `ci.yml`).
- Least privilege: `permissions: contents: read` at the top, widened per job only when needed.
- Never use `pull_request_target` with a checkout of PR code, and never expose secrets to fork PRs.
- A new top-level directory needs a line in `scripts/check-root-dirs.sh`.
- Pin toolchains (Rust, Solana CLI and platform-tools `v1.54`, Node, pnpm) to the versions CI uses.

## Check before opening the PR

```bash
actionlint .github/workflows/*.yml
./scripts/__tests__/check-action-pins.test.sh && ./scripts/check-action-pins.sh
./scripts/__tests__/check-root-dirs.test.sh && ./scripts/check-root-dirs.sh
```

After merge, confirm the changed workflow ran on the merge SHA and that every required check still
reports.
