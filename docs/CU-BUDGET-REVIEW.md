# Compute-Unit (CU) Budget Review

Feeds **#141 [G-4] CU budget reviewed**. This is the explicit written ruling the
gate asks for: every on-chain instruction is measured, checked against the
transaction compute ceiling, and shown to have ample headroom. A CI drift gate
(see the last section) keeps the measured numbers honest so this ruling cannot
silently rot.

Prior art: issues #121 (original CU measurement harness) and #222; PRs #221 and
#240.

## The budget

The budget is the **Solana per-transaction compute limit of 200,000 CU** — the
default a transaction gets per instruction when it does not request a limit. A
transaction can request its own limit, up to 1,400,000 CU, with
`ComputeBudgetProgram.SetComputeUnitLimit`.

Every transaction the web app sends or hands to a wallet requests a limit
**below** that default, because the priority fee it also sets is charged on the
requested limit (`apps/web/src/lib/solana/compute-budget.ts`). Learner-signed
`enroll` and `close_enrollment` size it from their preflight simulation;
everything else uses a fixed per-kind limit (`COMPUTE_UNIT_LIMITS`) of a few
times what that transaction has consumed on devnet, ATA creation included. No
academy instruction needs more than the default, so these numbers are measured
against the 200,000 CU ceiling and the limits must stay above them with room
for bump-search variance.

`packages/deploy` sets its own limit and price on the BPF-loader write
transactions that upload a learner's compiled `.so`. That is the learner deploy
flow, a separate concern from the academy program's instruction budget.

## Per-instruction measurement

Source of truth: [`onchain-academy/tests/CU_BASELINE.rust.md`](../onchain-academy/tests/CU_BASELINE.rust.md),
captured by the **litesvm 0.12 (Agave 3.x) Rust harness**
(`onchain-academy/tests/differential/tests/cu_budget.rs`) against a release SBF
build of the pinocchio program. The table below is derived directly from that
baseline; the CI drift gate guarantees they stay in sync. `update_config` is
measured twice (pause + resume), so the file lists 19 rows across the 18
instructions.

| Instruction                   |     CU | % of 200k ceiling | Headroom |
| ----------------------------- | -----: | ----------------: | -------: |
| `initialize`                  | 18,780 |             9.39% |   90.61% |
| `update_config (pause)`       |    729 |             0.36% |   99.64% |
| `update_config (resume)`      |    727 |             0.36% |   99.64% |
| `create_course`               |  4,617 |             2.31% |   97.69% |
| `update_course`               |  2,865 |             1.43% |   98.57% |
| `register_minter`             |  4,323 |             2.16% |   97.84% |
| `update_minter`               |  2,604 |             1.30% |   98.70% |
| `revoke_minter`               |  2,628 |             1.31% |   98.69% |
| `enroll`                      |  8,980 |             4.49% |   95.51% |
| `complete_lesson`             |  7,703 |             3.85% |   96.15% |
| `finalize_course`             |  8,436 |             4.22% |   95.78% |
| `reward_xp`                   |  6,103 |             3.05% |   96.95% |
| `close_enrollment`            |  4,524 |             2.26% |   97.74% |
| `create_achievement_type`     | 11,106 |             5.55% |   94.45% |
| `award_achievement`           | 36,449 |            18.22% |   81.78% |
| `deactivate_achievement_type` |  2,926 |             1.46% |   98.54% |
| `issue_credential`            | 31,135 |            15.57% |   84.43% |
| `upgrade_credential`          | 37,009 |            18.50% |   81.50% |
| `close_course`                |  8,682 |             4.34% |   95.66% |

## Ruling

**All 18 instructions are within budget.** The worst case is `upgrade_credential`
at **37,009 CU — 18.50% of the 200,000 CU ceiling** (81.50% headroom).
Every other instruction sits at or below the next-heaviest (`award_achievement`,
18.22%), and the median instruction (6,103 CU) is about
3.1% of the ceiling. No instruction is anywhere near the point where a
`ComputeBudget` bump would be required.

### Heaviest trio — the mpl_core CPI instructions

The three heaviest instructions all make a **cross-program invocation into
`mpl_core`** (`CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d`), which is where
their cost concentrates:

| Instruction          |     CU | % of ceiling | mpl_core CPI               |
| -------------------- | -----: | -----------: | -------------------------- |
| `upgrade_credential` | 37,009 |       18.50% | asset update (V2)          |
| `award_achievement`  | 36,449 |       18.22% | asset mint into collection |
| `issue_credential`   | 31,135 |       15.57% | asset create               |

These are the instructions to watch, because their cost is dominated by a
callee we do not control. Even so, the heaviest leaves **81.50% headroom**, so
there is no action to take today.

### Accepted drift

| When       | Instruction                | Change                      | Why                                                                                                                                                                            |
| ---------- | -------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-08-11 | `enroll`                   | 8,984 → 8,996 CU (+12)      | #1004 split `payer` out of `learner` so the platform can fund a zero-SOL learner's Enrollment PDA. The cost is one extra account to load plus one extra `expect_signer` check. |
| 2026-10-21 | `initialize`               | 15,662 → 18,780 CU (+3,118) | Reads the ProgramData account and derives its address to check the signer is the upgrade authority. One-time instruction.                                                      |
| 2026-10-21 | `update_course`            | 2,696 → 2,865 CU (+169)     | Write-time XP bounds and the non-empty mask check.                                                                                                                             |
| 2026-10-21 | `close_course`             | 8,522 → 8,682 CU (+160)     | Parses the course to refuse one with enrollments.                                                                                                                              |
| 2026-10-21 | `close_enrollment`         | 4,438 → 4,524 CU (+86)      | One more account, and the rent recipient check.                                                                                                                                |
| 2026-10-21 | `create_course` / `enroll` | +21 / −16 CU                | XP bounds at create. `enroll` moved with codegen; its payer write is one 32-byte copy.                                                                                         |

Every change is well under 2% of the ceiling — the ruling above is unaffected. Worth recording rather than silently regenerating, because the
gate exists precisely so that an account-list change cannot pass unnoticed.

Note for whoever regenerates next: regenerate against the **pinned** toolchain,
or not at all. A bare `cargo build-sbf` (no `--tools-version v1.54`, i.e. not
via `pnpm build:pinocchio` as the procedure below specifies) measured all 19
rows differently — `initialize` 15,662 → 15,722, and `enroll +53` where CI
measured `+12`. Committing that would have rewritten every instruction's
baseline to a machine-specific figure and quietly destroyed the gate. If the
toolchain is not certainly identical, lift the numbers from the failing CI
job's drift table instead and let CI confirm +0.

### When to re-review

Re-run this review (and expect the drift gate below to force it) when any of:

- **A new CPI** is added to any instruction, or an existing CPI target changes
  (e.g. an mpl_core major-version bump) — CPI cost is the dominant term and the
  least under our control.
- **An instruction starts touching materially more accounts** (rule of thumb:
  any instruction whose account list grows past ~15, or any new
  `remaining_accounts` fan-out), since account loading and serialization scale
  with account count.
- **The CI drift gate fails** — any measured-CU change against the committed
  baseline, from a program-logic change or a toolchain bump, requires a
  deliberate baseline regeneration (a review-doc update by convention) and a
  look back at this ruling.

## Measurement procedure & determinism

The gate is a Rust test in the differential suite. Reproduce locally:

```bash
cd onchain-academy
pnpm build:pinocchio    # cargo build-sbf --tools-version v1.54 → target/deploy/onchain_academy_pinocchio.so
# assert against the committed baseline:
cargo test --manifest-path tests/differential/Cargo.toml --test cu_budget
# regenerate the baseline after an intended change:
CU_BASELINE_REGEN=1 cargo test --manifest-path tests/differential/Cargo.toml --test cu_budget
```

The harness runs the program in an **in-process litesvm 0.12** (the Agave 3.x
runtime line; no validator), which reports `compute_units_consumed` per
transaction. It is deterministic: all account addresses are derived from fixed
keypair seeds, because the program derives PDAs on-chain with a canonical-bump
search whose per-address iteration count (each a ~1,500 CU sha256 syscall) would
otherwise make the numbers wander run to run.

**Determinism caveat (this is what the drift gate exists to catch).** The
measured numbers are a function of the compiled bytecode and the runtime, so
they move when the toolchain moves — the SBF platform-tools version
(`--tools-version v1.54`, pinned) and the litesvm / solana-program versions.
That is a feature: a toolchain bump that shifts CU is exactly the kind of drift
the gate should surface for a deliberate re-baseline. When the gate fails in CI,
the failing test prints a full expected-vs-actual table plus a ready-to-commit
baseline block — a maintainer lifts the correct numbers straight from the
failing CI log, commits `CU_BASELINE.rust.md`, and re-runs this doc's generator.

### Why not the TypeScript harness?

A litesvm-**JS** harness also exists at
[`onchain-academy/tests/cu-measurement.ts`](../onchain-academy/tests/cu-measurement.ts)
(`pnpm cu:pinocchio`). It is a **local, macOS-only developer tool and must not be
wired into CI.** Its Linux x86-64 native addon (litesvm-JS 0.3.3) is
memory-unsafe: against a byte-identical `.so` it produces run-to-run CU deltas
and a wandering `std::bad_alloc`/SIGABRT (proven on the ubuntu runner — the same
program, the same toolchain, different numbers every run). macOS/arm64 avoids the
crash because rbpf has no aarch64 JIT, so the bug only surfaces on Linux. The
CI-enforced, deterministic measurement is the Rust gate above; the JS harness
remains only for quick local spot-checks by developers already on macOS.

## CI drift gate

The gate is the `cu_budget_within_baseline` test in the differential suite. It
runs inside the existing **`Integration (pinocchio · LiteSVM)`** CI job with **no
`ci.yml` changes** — that job already runs `cargo test` over the whole
`onchain-academy/tests/differential` crate, which now includes this test. It
measures all 19 rows on the pinocchio `.so` and asserts them against
`CU_BASELINE.rust.md`; any drift fails the test (and the job) loudly, forcing a
deliberate baseline regeneration rather than silent drift. The job runs whenever
`onchain-academy/**` changes, which includes the baseline and the test itself.

> Note on [`CU_COMPARISON.md`](../onchain-academy/tests/CU_COMPARISON.md): its
> Anchor→Pinocchio −39.2% figure was measured under the **litesvm-JS** harness
> and is retained only as a historical migration record. Do not compare its
> numbers against this document's Rust-harness figures — the two runtimes account
> compute differently.
