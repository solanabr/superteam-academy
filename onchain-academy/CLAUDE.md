# onchain-academy: the Pinocchio program

The program is Pinocchio only (`pinocchio = 0.11.2`), in `programs/onchain-academy-pinocchio/`.
There is no `Anchor.toml` and no `anchor build`, `anchor test` or `anchor deploy`. The Anchor
implementation was deleted; `docs/PINOCCHIO-MIGRATION.md` explains what the port changed.

The program stays wire-compatible with the Anchor-format IDL in `idl/onchain_academy.json`, which the
web client reads through copies in `apps/web/src/lib/solana/idl/`. Account layouts, 8-byte
discriminators, instruction data and CPI bytes must match it. `docs/SPEC.md` is the specification.

## Commands (run from `onchain-academy/`)

```bash
pnpm build:pinocchio          # cargo build-sbf, upstream program id
pnpm build:pinocchio:fresh    # fresh-id artifact for the self-owned devnet instance
pnpm test:layout              # cargo test -p onchain-academy-pinocchio: layouts, discriminators, CPI bytes
cargo test -p onchain-academy-pinocchio --features fresh-id
pnpm test:integration         # tests/differential: every instruction in LiteSVM, happy and error paths
pnpm cu:pinocchio             # CU numbers; compare with tests/CU_BASELINE.pinocchio.md
```

CI runs fmt, clippy (`-D warnings`) and both `cargo test` flavors in the "On-chain" job, the LiteSVM
suite in "Integration", and a nightly fuzz run (`tests/fuzz`, `.github/workflows/fuzz.yml`).

## Rules for program code

- Validate every account: owner, signer, writable and PDA derivation. Check CPI target program ids.
- Checked arithmetic only (`checked_add`, `checked_sub`, `checked_mul`). No `unwrap()` or `expect()`.
- Store canonical bumps in account data and read them back; don't re-derive them on every call.
- Any change to a layout, discriminator, instruction or error keeps the parity tests green and updates
  every IDL copy in the same PR. A new error in `errors.rs` without an IDL entry shows up in the app
  as an unknown code.
- `Course.creator`, `track_id` and `track_level` are set once at `create_course` and have no setter.
  Fixing one means close and recreate, which wipes enrolled learners' progress in that course.

## Deploys

Follow `docs/DEPLOY-PROGRAM.md`.

- Devnet deploys use the `fresh` artifact (`target/deploy/onchain_academy_pinocchio_fresh.so`) and go
  through a Helius devnet RPC, never the public endpoint, which has corrupted large deploys. The
  `guard-solana` hook blocks anything else. Prefer pointing the Solana CLI config at Helius over
  putting the URL on the command line, so the key stays out of the transcript. The user sets that
  config: `solana config set` and `solana config get` both print the URL with its key, and the
  repo's settings deny both to Claude.
- After a deploy, byte-verify: `solana program dump` the program and compare its SHA-256 with the
  local artifact.
- The reproducible-build hash is published by CI to the `program-hash` branch (`docs/PROGRAM-HASH.md`).
- Mainnet deploys, upgrades and authority changes are run by the owner after the pre-mainnet
  checklist in `docs/DEPLOY-PROGRAM.md`. Claude prepares and verifies; it doesn't run them.
