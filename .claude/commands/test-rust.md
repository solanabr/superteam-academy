---
description: "Run the Rust test suites: the Pinocchio program, its LiteSVM and fuzz suites, and the build server"
---

Run the Rust tests for what changed, then report pass/fail per suite with the failing test names.
This repo has no Anchor, Mollusk or Surfpool tests.

## Program (`onchain-academy/`)

```bash
cd onchain-academy
cargo test -p onchain-academy-pinocchio                     # host tests: layouts, discriminators, CPI bytes, parse hardening
cargo test -p onchain-academy-pinocchio --features fresh-id # same, fresh-id flavor (CI runs both)
pnpm build:pinocchio && pnpm test:integration               # tests/differential: every instruction in LiteSVM
```

- The host tests live in `programs/onchain-academy-pinocchio/tests/` (`layout_parity.rs`,
  `discriminator_parity.rs`, `parse_hardening.rs`, `proofs.rs`). A parity failure means the
  program drifted from the IDL the web client decodes with; fix the program or update every IDL
  copy in the same change.
- The integration suite loads the built `.so`, so rebuild first after any program change.
- Fuzzing (`tests/fuzz`) runs nightly in `.github/workflows/fuzz.yml`. Locally:
  `cd tests/fuzz && cargo run --release --bin fuzz -- <iterations>`.
- CU numbers: `pnpm cu:pinocchio`, compared with `tests/CU_BASELINE.pinocchio.md`.

## Build server (`apps/build-server/`)

```bash
cargo test --manifest-path apps/build-server/Cargo.toml
```

## Before calling it green

CI also runs, and so should you when the code changed:

```bash
cargo fmt --manifest-path onchain-academy/Cargo.toml --all --check
cargo clippy --manifest-path onchain-academy/Cargo.toml --all-targets -- -D warnings
```

Same pair for `onchain-academy/tests/differential/Cargo.toml` and `apps/build-server/Cargo.toml`
when those changed.

Useful flags: `-- --nocapture` for output, `-- <name>` for one test, `RUST_BACKTRACE=1` for panics.
