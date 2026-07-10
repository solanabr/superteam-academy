# Anchor vs Pinocchio — Implementation Differences

> **Historical record.** The Anchor build has since been **retired** — the
> program is now Pinocchio-only (see [PINOCCHIO-MIGRATION.md](./PINOCCHIO-MIGRATION.md)).
> This document captures the port that produced the current program: how each
> Anchor mechanism was replaced and how equivalence was proven at the time.
> References below to the Anchor crate / dual-VM differential / `test:anchor`
> describe that (now-removed) setup.

The port produced two implementations of the same wire contract
([SPEC.md](./SPEC.md)):

- **Anchor** — `onchain-academy/programs/onchain-academy` (anchor-lang 0.31.1);
  the original build and the differential-testing oracle (now removed).
- **Pinocchio** — `onchain-academy/programs/onchain-academy-pinocchio`
  (pinocchio 0.11.2, `#![no_std]`, no allocator); the CU-optimized rewrite,
  now the sole implementation.

This document catalogues **every difference** between them: what is
byte-identical by construction, how each Anchor mechanism was replaced, the
few accepted observable divergences, and the measured results.

---

## 1. What is byte-identical (the wire contract)

| Surface                          | Guarantee                                                                                                                                                              | Proven by                                                                                                                             |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Program id                       | `7NeJaSRyb4Wxay3Tcd9bdpD7T3GWYUQSFyrhG8SgwE8V` in both                                                                                                                 | `tests/discriminator_parity.rs`                                                                                                       |
| Instruction discriminators       | all 18, `sha256("global:<name>")[..8]`                                                                                                                                 | discriminator parity tests                                                                                                            |
| Instruction args                 | identical Borsh encodings incl. `Option`/`String`                                                                                                                      | differential suite                                                                                                                    |
| Account discriminators + layouts | all 6 types byte-identical, incl. variable-offset Borsh (`String`, `Option`) and the Enrollment None→Some grow transitions                                             | `tests/layout_parity.rs` (init + every mutation vs Anchor `try_serialize`) + account-byte parity after every differential transaction |
| Events                           | `Program data:` payloads byte-identical (disc ++ Borsh)                                                                                                                | differential log parity                                                                                                               |
| Error codes                      | program errors 6000–6033 and the framework codes (101/102/2000/2006/2012/3001/3002/3003/3005/3007/3008/3010/3012/4100) with identical _first-failing-check_ precedence | differential error paths + the unmodified TS suite                                                                                    |
| Error log lines                  | `AnchorError occurred. Error Code: … . Error Number: … . Error Message: … .` per failure (see §4 for the origin-variant caveat)                                        | error-log parity tests                                                                                                                |
| CPI shapes                       | inner instructions to System/Token-2022/mpl-core have identical program ids, account metas (order, writability, signers) and data bytes                                | builder byte-compare tests vs the real `spl-token-2022` / `mpl-core` crates + differential inner-log parity                           |
| Lamport flows                    | rent funding, close refunds, drains                                                                                                                                    | account/lamport parity after every differential tx                                                                                    |
| PDA seeds + canonical bumps      | identical                                                                                                                                                              | layout + differential                                                                                                                 |

The committed IDL (`apps/web/src/lib/solana/idl/superteam_academy.json`)
therefore describes both builds; no client, webhook decoder, or script needed
any change.

**Verification layers** (all in-repo):

1. `cargo test -p onchain-academy-pinocchio` — host byte-parity: state
   serialization vs the Anchor crate across permutations, all 42
   discriminators, all 34 error numbers/messages/log lines, `CONFIG_PDA`
   consts, mint space, and every hand-rolled CPI byte layout vs the real
   builder crates.
2. `pnpm test:diff` — dual-LiteSVM differential: 17 scenarios replay all 18
   instructions (happy + error paths, kill-switch sweep, prerequisite
   enrollment, 24h-cooldown clock warp, hostile token accounts, legacy
   192-byte close) on both `.so`s and assert identical results, normalized
   logs, and account bytes after every transaction.
3. `pnpm test:pinocchio` — the **unmodified** 5,691-line TS integration suite
   against the pinocchio binary on a local validator (`pnpm test:anchor` runs
   the same suite against the oracle).

---

## 2. Mechanism-by-mechanism replacement

### 2.1 Entrypoint & dispatch

| Anchor                                                                                                 | Pinocchio                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `#[program]` macro generates entry, 8-byte sighash dispatch, `Instruction: X` log, arg deserialization | `program_entrypoint!` + a `match u64::from_le_bytes(disc)` over 18 const discriminators (`src/lib.rs`), hot instructions first; each arm logs the same static `Instruction: X` line, then parses args with a zero-copy `Cursor` |
| `entrypoint` allocates a bump heap (`default_allocator`)                                               | `no_allocator!()` — the program performs **zero heap allocations**; every buffer is stack-based with a documented maximum                                                                                                       |
| std runtime panic machinery                                                                            | `#![no_std]` + `nostd_panic_handler!()`                                                                                                                                                                                         |

### 2.2 Account validation

Anchor's `#[derive(Accounts)]` expands to a two-phase `try_accounts`: all
fields extracted + type-checked in declaration order, then all constraints in
declaration order. The pinocchio instructions reproduce that structure
literally — each `process()` has an "extraction phase" and a "constraint
phase" with the checks in the same order, so the **first failing check (and
its error code) is identical** for any input:

| Anchor constraint                                 | Pinocchio equivalent (`src/validation.rs`)                                                                                                                                                                              |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Account<'info, T>` load                          | `expect_account`: not-initialized (3012) → owner (3007) → discriminator (3001/3002) → offset parse (3003)                                                                                                               |
| `Signer<'info>`                                   | `expect_signer` (3010)                                                                                                                                                                                                  |
| `Program<'info, System>`                          | `expect_system_program` (3008)                                                                                                                                                                                          |
| `#[account(mut)]`                                 | `expect_writable` (2000)                                                                                                                                                                                                |
| `seeds = […], bump = stored`                      | `expect_pda` — one `create_program_address` syscall with the stored bump (2006)                                                                                                                                         |
| `seeds = […], bump` on `init`                     | `expect_found_pda` — canonical `find_program_address` (2006)                                                                                                                                                            |
| `seeds = [b"config"], bump`                       | **compile-time `CONFIG_PDA` constant compare** (see §3)                                                                                                                                                                 |
| `has_one = x @ E` / `constraint = k == v @ E`     | `expect_key` (custom error)                                                                                                                                                                                             |
| `address = X`                                     | `expect_address` (2012)                                                                                                                                                                                                 |
| `init, payer = p, space = N`                      | `cpi::system::create_pda_account` — `CreateAccount`, or Anchor's exact pre-funded fallback (`Transfer` shortfall → `Allocate` → `Assign`, PDA-signed), so re-initialization fails identically inside the system program |
| `close = dest`                                    | `cpi::system::close_account` — drain → assign(System) → truncate to 0, matching anchor-lang 0.31 `common::close` byte-for-byte                                                                                          |
| `UncheckedAccount` + manual checks (close_course) | same manual checks, same order                                                                                                                                                                                          |

### 2.3 State access

| Anchor                                                                                                                                                                           | Pinocchio                                                                                                                                                                                                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Account<T>` Borsh-deserializes the **whole struct into stack copies** on load, and re-serializes the **whole struct** back into the account on exit — even for untouched fields | `src/state/*`: per-account **offset views**. `parse()` walks the variable-length fields once (validating exactly where Anchor's deserializer would fail), then reads return scalars/slices at computed offsets and writes patch only the changed bytes |
| `Option` transitions handled by full rewrite                                                                                                                                     | `Enrollment::set_completed_at` / `set_credential_asset` shift the ≤ 70-byte tail on the stack — provably byte-identical because both options only ever grow (write-once), verified against Anchor serialization in `layout_parity.rs`                  |
| `String` fields as heap `String`s                                                                                                                                                | strings stay borrowed `&[u8]` slices of account/instruction data                                                                                                                                                                                       |

This is where most of the CU and binary-size win comes from: no
deserialize-everything on entry, no serialize-everything on exit, no heap.

### 2.4 CPIs

| Anchor                                                                      | Pinocchio                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `anchor_lang::system_program::{create_account, transfer, allocate, assign}` | `pinocchio-system` instruction structs                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `spl_token_2022::instruction::*` builders (pull in the spl crate)           | `src/cpi/token2022.rs` hand-rolled wire bytes: `MintTo=[7,amount]`, `InitializeMint2=[20,…]`, `InitializeNonTransferableMint=[32]`, `InitializePermanentDelegate=[35,…]`, `MetadataPointer::Initialize=[39,0,…]` — byte-compared against the real spl builders in tests                                                                                                                                                                                         |
| `mpl_core::*CpiBuilder` (pulls in mpl-core + solana-program)                | `src/cpi/mpl_core.rs` hand-rolled: `CreateV2` (disc 20), `CreateCollectionV2` (21), `UpdateV1` (15), `UpdatePluginV1` (6), plugin Borsh (`PermanentFreezeDelegate`=5, `Attributes`=6, authority `UpdateAuthority`=2) and the builders' exact optional-account conventions (unset optionals = read-only mpl-core program id; UpdateV1's collection is read-only while UpdatePluginV1's is writable) — all byte-compared against the real mpl-core 0.9.1 builders |
| `.to_string()` for numeric NFT attributes (heap)                            | `itoa_u64` into a stack buffer (identical decimal output, tested)                                                                                                                                                                                                                                                                                                                                                                                               |
| `invoke_signed(&[&[b"config", &[config.bump]]])`                            | `pinocchio::cpi::invoke_signed` with the same seeds; large CPI data buffers live in `#[inline(never)]` frames (SVM 4 KB stack discipline)                                                                                                                                                                                                                                                                                                                       |

On-chain dependency count: Anchor build = anchor-lang + spl-token-2022 +
mpl-core (+ their trees). Pinocchio build = `pinocchio`, `pinocchio-system`
— the spl/mpl/anchor crates appear only as **host-side dev-dependencies**
used to _prove_ the hand-rolled bytes.

### 2.5 Events & errors

| Anchor                                                        | Pinocchio                                                                                                                                                                                                     |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `emit!(Struct { .. })` → borsh to a heap Vec → `sol_log_data` | `events.rs`: `BorshWriter` over a sized stack buffer per event → `sol_log_data`; identical bytes                                                                                                              |
| `#[error_code]` enum + runtime `format!` of the error line    | `errors.rs`: same 34 variants; each failure logs a **pre-baked static** `AnchorError occurred…` line (compile-time `concat!`) and returns `Custom(6000+n)`; failure formatting costs nothing on success paths |
| Anchor framework errors raised by macros                      | the same codes/messages pre-baked and returned from the equivalent hand-written checks                                                                                                                        |

### 2.6 Sysvars

| Anchor                           | Pinocchio                                                                                                                                                                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Clock::get()`                   | `pinocchio::sysvars::clock::Clock::get()` (same syscall)                                                                                                                                                                                         |
| `Rent::get().minimum_balance(n)` | **NOT** pinocchio's `Rent::get()` — see §5 finding #1. `cpi::system::rent_minimum_balance` reads the rent sysvar account's classic 17-byte layout via the generic `get_sysvar` syscall and applies `solana_program::Rent`'s exact f64 arithmetic |

---

## 3. Optimizations that have no Anchor counterpart

1. **Compile-time Config PDA** — `["config"]` with a fixed program id derives
   exactly one address, so `CONFIG_PDA` / `CONFIG_BUMP` are constants
   (host-test-pinned to `find_program_address`). Every instruction replaces
   Anchor's ~1,500 CU `create_program_address` verification of the config
   account with a 32-byte compare, and every Config-signed CPI reuses the
   constant bump. (Behavioral note: an account _at_ the canonical address
   whose stored bump byte was somehow wrong would pass this check where
   Anchor re-derives — unreachable, since only the program writes that byte,
   once, at initialize.)
2. **Parse-once offset views + targeted writes** instead of full
   deserialize/serialize cycles (§2.3).
3. **Static log strings** — the `Instruction: X` entry line and every error
   line are `&'static str`; no formatting machinery is linked in.
4. **No heap** — `no_allocator!()`; the allocator and its code size are gone.
5. **Stack CPI/event buffers** sized from protocol maxima (name ≤ 64, URI ≤
   128, ids ≤ 32; ix-data-derived strings bounded by the transaction size).

## 4. Accepted observable divergences

These are the only behavior differences an observer can detect; none affect
clients (verified by the unmodified TS suite):

1. **Error-log origin variants.** Anchor sometimes prefixes error lines with
   `AnchorError thrown in programs/…/file.rs:LINE.` (handler `require!`) or
   `AnchorError caused by account: <name>.` (constraint sites). The pinocchio
   build always emits the origin-less `AnchorError occurred.` form.
   `@coral-xyz/anchor`'s `AnchorError.parse` accepts all three shapes; code,
   number, and message are identical.
2. **Compared-values debug lines.** After a failed `require_keys_eq!` /
   `has_one`, Anchor logs the two mismatched pubkeys (and `Left:`/`Right:`
   lines for non-pubkey compares). The pinocchio build does not. These lines
   are not part of any client contract; the differential harness normalizes
   them out on the Anchor side.
3. **CU-consumption log lines** naturally differ — that is the point of the
   port.
4. **Binary identity.** The `.so` files differ, so the on-chain program hash
   changes on upgrade; the CI `verifiable-build` job publishes hashes for
   both artifacts.

Everything else — accounts, events, error codes, lamports, inner
instructions — is asserted identical after every differential transaction.

## 5. Divergences found during the port (and their resolutions)

1. **pinocchio 0.11.2 `Rent::get()` is not portable across runtime
   versions.** Its redesigned 8-byte `Rent { lamports_per_byte }` matches the
   new Agave rent representation; on Agave 3.0 (and today's devnet
   validators) the syscall fills the classic
   `{ lamports_per_byte_year, exemption_threshold, burn_percent }` struct,
   so pinocchio reads the _yearly_ rate and under-funds new accounts by the
   2.0× exemption threshold — `initialize` then failed inside
   `InitializeMint2` with "Lamport balance below rent-exempt threshold" on a
   real validator while passing under LiteSVM (Agave 3.1-line). Resolution:
   `rent_minimum_balance()` reads the sysvar account's classic bytes via the
   generic `get_sysvar` syscall and reproduces `solana_program::Rent`'s f64
   math exactly. This was caught by Gate 3 precisely because the gates run on
   different runtime builds.
2. **`pinocchio-pubkey` 0.3.0 still targets pinocchio 0.9** and would have
   pulled a second pinocchio into the build; dropped in favor of
   `Address::from_str_const` (const base58 in solana-address).
3. **Anchor's two-phase validation order** (all account loads, then all
   constraints) had to be discovered from the anchor-syn codegen and mirrored
   — a naive per-account interleaving changes which error fires first when a
   transaction violates several constraints at once.

## 6. Intentional non-changes (reviewed findings)

The port was also an audit pass; three candidate "fixes" were evaluated and
deliberately **not** made, preserving wire behavior (details in SPEC §9):

1. `finalize_course`'s `saturating_add` for the creator-reward window end —
   saturation is unreachable (`min_completions_for_reward` is u16); a checked
   add would be behaviorally identical. Kept verbatim, documented.
2. `update_config` rotating `backend_signer` without the old MinterRole
   passed leaves that role active. The TS suite relies on the permissive
   path; enforcing it is an instruction-contract change left as follow-up.
3. Two-step (nominate/accept) authority rotation — requires +32 bytes of
   Config state and only 7 reserved bytes remain: a layout migration, out of
   scope for a wire-compatible port.

No other logic bugs were found; the program had recently been
audit-hardened (#303/#306/#315).

## 7. Measured results

Numbers from `pnpm cu:compare` (LiteSVM harness `tests/cu-measurement.ts`,
release builds) — full per-instruction tables in
`onchain-academy/tests/CU_BASELINE.md` (Anchor),
`tests/CU_BASELINE.pinocchio.md`, and `tests/CU_COMPARISON.md`:

| Instruction                 | Anchor CU | Pinocchio CU |    Δ % |
| --------------------------- | --------: | -----------: | -----: |
| initialize                  |     27954 |        15321 | −45.2% |
| update_config (pause)       |      3858 |          729 | −81.1% |
| update_config (resume)      |      3858 |          727 | −81.2% |
| create_course               |     12449 |         4634 | −62.8% |
| update_course               |      7487 |         2675 | −64.3% |
| register_minter             |     11209 |         5859 | −47.7% |
| update_minter               |      6474 |         2438 | −62.3% |
| revoke_minter               |      6123 |         2463 | −59.8% |
| enroll                      |     16886 |         8943 | −47.0% |
| complete_lesson             |     14705 |         7429 | −49.5% |
| finalize_course             |     21041 |        10729 | −49.0% |
| reward_xp                   |     12208 |         5860 | −52.0% |
| close_enrollment            |      6530 |         4203 | −35.6% |
| create_achievement_type     |     23607 |        12729 | −46.1% |
| award_achievement           |     57657 |        39552 | −31.4% |
| deactivate_achievement_type |      7734 |         2468 | −68.1% |
| issue_credential            |     45394 |        34428 | −24.2% |
| upgrade_credential          |     57533 |        46366 | −19.4% |
| close_course                |      6160 |         2558 | −58.5% |

**Total across the measured suite: 348,867 → 210,111 CU (−39.8%).** Pure
program-logic instructions drop 47–81%; instructions dominated by inner
Token-2022/mpl-core CPIs (an irreducible floor shared by both builds) drop
19–52% — in those, the program's own overhead shrinks by the same ~5–13k CU,
but the inner CPI cost dilutes the percentage.

Binary size: Anchor `.so` 672,280 bytes → Pinocchio `.so` 201,896 bytes
(**−70%**), both release SBF builds.

## 8. Operational differences

| Topic              | Anchor                                                                                                                                                                                                                                                                                                                                                                    | Pinocchio                                                                                                                                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build              | `anchor build` (also emits IDL/types)                                                                                                                                                                                                                                                                                                                                     | `cargo build-sbf --manifest-path programs/onchain-academy-pinocchio/Cargo.toml --tools-version v1.54` (pinocchio 0.11.2 needs rustc ≥ 1.89 → platform-tools ≥ v1.54)                                                                  |
| IDL                | generated                                                                                                                                                                                                                                                                                                                                                                 | none generated — the committed IDL is the contract (it was already hand-maintained)                                                                                                                                                   |
| Artifact selection | `target/deploy/onchain_academy.so`                                                                                                                                                                                                                                                                                                                                        | `scripts/select-program.sh {anchor\|pinocchio}` swaps the active slot (genesis for `anchor test`, Trident, CU harness) and records `.active-program`; **`anchor build` silently restores Anchor bytes** — always re-select afterwards |
| Test commands      | `pnpm test:anchor`                                                                                                                                                                                                                                                                                                                                                        | `pnpm test:pinocchio` (same suite), `pnpm test:layout`, `pnpm test:diff`                                                                                                                                                              |
| Verifiable build   | `anchor build --verifiable` (Docker-deterministic)                                                                                                                                                                                                                                                                                                                        | pinned-toolchain `cargo build-sbf` + SHA-256 published by CI (Docker-deterministic `solana-verify` pipeline pending a rustc ≥ 1.89 base image)                                                                                        |
| Deploy             | see [DEPLOY-PROGRAM.md](./DEPLOY-PROGRAM.md) — in-place upgrade of the same program id (the smaller pinocchio binary always fits the existing programdata account; the archived Anchor `.so` is the rollback artifact), or a self-owned fresh devnet instance via the `fresh-id` feature (`pnpm build:pinocchio:fresh`; wrong-flavor deploys self-reject with error 4100) |                                                                                                                                                                                                                                       |
| Fuzzing            | Trident harness unchanged — it is byte-format-based and fuzzes whichever `.so` sits in the active slot                                                                                                                                                                                                                                                                    |                                                                                                                                                                                                                                       |
