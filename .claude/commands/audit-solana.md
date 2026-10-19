---
description: "Security audit of the Pinocchio program (onchain-academy) or a change to it"
---

Audit the on-chain program, or the program change named in $ARGUMENTS. The program is Pinocchio
(`onchain-academy/programs/onchain-academy-pinocchio/src/`): instructions in `instructions/`,
account layouts in `state/`, checks in `validation.rs`, errors in `errors.rs`. `docs/SPEC.md` is
the intended behaviour. Take your time; a missed finding here costs real funds and learner data.

## 1. Automated checks

From `onchain-academy/`:

```bash
cargo fmt --all --check
cargo clippy --all-targets -- -D warnings
cargo test -p onchain-academy-pinocchio
cargo test -p onchain-academy-pinocchio --features fresh-id
pnpm build:pinocchio && pnpm test:integration
cargo audit
```

Run the fuzzer for at least 10 minutes on a change to instruction logic:
`cd tests/fuzz && cargo run --release --bin fuzz -- <iterations>`.

## 2. Per instruction

Pinocchio does no account validation for you. For every account an instruction takes, check:

- **Owner**: the account is owned by the expected program before its data is read.
- **Discriminator**: the 8-byte discriminator matches the expected type (type confusion).
- **Signer and writable**: `expect_signer` / `expect_writable` wherever the spec needs them.
- **PDA**: re-derived from the right seeds with the stored canonical bump, and compared.
- **Identity**: authority, backend signer, minter and mint addresses compared with what Config or
  the account records, not with what the caller passed.
- **CPI targets**: Token-2022, Metaplex Core and System program ids checked before any CPI.
- **Arithmetic**: checked operations only; no `unwrap()`, `expect()` or `as` casts that truncate.
- **Lifecycle**: init can't run twice; a closed account can't be revived in the same transaction;
  closing drains lamports to the right recipient; generations reject stale enrollments.
- **Bitmaps**: a lesson bit indexes by slot and is bounds-checked against the course's active lessons.

## 3. Program-wide

- **Economics**: XP mints only through registered minters within their caps; creator rewards and
  credentials can't be replayed or farmed by re-enrolling.
- **Immutable fields**: `Course.creator`, `track_id` and `track_level` really have no setter.
- **Errors**: every error in `errors.rs` exists in every IDL copy, with the same code.
- **Parity**: layouts, discriminators, instruction data and events match `idl/onchain_academy.json`.
- **CU**: compare `pnpm cu:pinocchio` with `tests/CU_BASELINE.pinocchio.md`; explain regressions.

## 4. Report

Follow `REVIEW.md`. Each finding gives `file:line`, the attack (which accounts and inputs, in what
order), the impact, and a repro, ideally a failing LiteSVM test in `tests/differential`. Rate it
critical, high, medium or low, and mark pre-existing issues. Start with the count of critical and
high findings.

The repo is public. Write unfixed critical or high findings to the owner privately, not in an issue,
PR or commit.
