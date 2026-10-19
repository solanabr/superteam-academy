---
description: "Build the Pinocchio program (onchain-academy) and check the artifact"
---

Build the on-chain program. It is Pinocchio only: there is no `Anchor.toml`, and `anchor build`
does not apply.

## Build

From `onchain-academy/`:

```bash
pnpm build:pinocchio         # cargo build-sbf --tools-version v1.54, upstream program id
pnpm build:pinocchio:fresh   # fresh-id artifact for the self-owned devnet instance
```

`build:pinocchio:fresh` runs `scripts/build-pinocchio-deploy.sh`, which first gates on
`cargo test --features fresh-id`, then writes `target/deploy/onchain_academy_pinocchio_fresh.so` and
restores the default artifact.

## Check

```bash
ls -l target/deploy/*.so
shasum -a 256 target/deploy/onchain_academy_pinocchio*.so
cargo fmt --all --check
cargo clippy --all-targets -- -D warnings
pnpm test:layout
```

The binary is about 213 KB. A large jump in size or CU (compare with
`tests/CU_BASELINE.pinocchio.md` via `pnpm cu:pinocchio`) needs an explanation in the PR.

## Reproducible build

CI's `verifiable-build` job builds the program reproducibly and publishes the SHA-256 to the
`program-hash` branch (`docs/PROGRAM-HASH.md`). For a deploy, the artifact's hash must match it.

## Common failures

- `edition2024` or dependency-resolution errors: pin the crates listed in `docs/DEPLOY-PROGRAM.md`
  §4 (`blake3`, `rmp`, `rmp-serde`) and rebuild.
- Platform tools missing: `cargo build-sbf --tools-version v1.54` downloads them on first use.
- Rust older than 1.89: Pinocchio 0.11.2 needs 1.89+.
