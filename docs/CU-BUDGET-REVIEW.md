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
default a transaction gets when it does not request more. A transaction can raise
its own ceiling up to 1,400,000 CU with a `ComputeBudgetProgram.SetComputeUnitLimit`
instruction, but **the academy program never requests a bump**, so 200,000 CU is
the real ceiling for every academy instruction.

That "no bump" claim is verified, not assumed. Grepping the client and
instruction builders for `setComputeUnitLimit` / `ComputeBudgetProgram` across
the repo returns hits in exactly one place — `packages/deploy` — and those are
the **BPF-loader program-upload path**, not academy instructions:

- `packages/deploy/src/deploy.ts` sets `WRITE_CU_LIMIT = 10_000` on the _write_
  transactions that upload the compiled `.so` to the chain in ~900-byte chunks
  (`BpfLoaderUpgradeable` writes), plus a `SetComputeUnitPrice` for priority. This
  is the learner/creator **course-deploy flow** uploading program bytecode — a
  separate concern from the academy program's own instruction budget, and it is
  a _floor_ raised for cheap loader writes, not the academy ceiling.

No academy instruction builder (enroll, complete_lesson, issue_credential, …)
attaches a `ComputeBudget` instruction. Therefore each academy instruction must
fit inside the 200,000 CU default, and the numbers below are measured against
that ceiling.

## Per-instruction measurement

Source of truth: [`onchain-academy/tests/CU_BASELINE.pinocchio.md`](../onchain-academy/tests/CU_BASELINE.pinocchio.md),
captured by the LiteSVM harness (`onchain-academy/tests/cu-measurement.ts`)
against a release SBF build of the Pinocchio program. The table below is derived
directly from that baseline; the CI drift gate guarantees they stay in sync.
`update_config` is measured twice (pause + resume), so the file lists 19 rows
across the 18 instructions.

| Instruction                   |     CU | % of 200k ceiling | Headroom |
| ----------------------------- | -----: | ----------------: | -------: |
| `initialize`                  | 18,321 |             9.16% |   90.84% |
| `update_config` (pause)       |    729 |             0.36% |   99.64% |
| `update_config` (resume)      |    727 |             0.36% |   99.64% |
| `create_course`               |  4,634 |             2.32% |   97.68% |
| `update_course`               |  2,821 |             1.41% |   98.59% |
| `register_minter`             |  4,359 |             2.18% |   97.82% |
| `update_minter`               |  2,588 |             1.29% |   98.71% |
| `revoke_minter`               |  2,612 |             1.31% |   98.69% |
| `enroll`                      |  6,091 |             3.05% |   96.95% |
| `complete_lesson`             |  7,595 |             3.80% |   96.20% |
| `finalize_course`             | 10,888 |             5.44% |   94.56% |
| `reward_xp`                   |  6,002 |             3.00% |   97.00% |
| `close_enrollment`            |  4,416 |             2.21% |   97.79% |
| `create_achievement_type`     | 12,729 |             6.36% |   93.64% |
| `award_achievement`           | 40,172 |            20.09% |   79.91% |
| `deactivate_achievement_type` |  2,943 |             1.47% |   98.53% |
| `issue_credential`            | 34,614 |            17.31% |   82.69% |
| `upgrade_credential`          | 46,552 |            23.28% |   76.72% |
| `close_course`                |  2,558 |             1.28% |   98.72% |

## Ruling

**All 18 instructions are within budget.** The worst case is `upgrade_credential`
at **46,552 CU — 23.28% of the 200,000 CU ceiling** (76.72% headroom). Every
other instruction sits below 21%, and the median instruction is under 4%. No
instruction is anywhere near the point where a `ComputeBudget` bump would be
required, and none requests one.

For context, the Pinocchio rewrite cut total measured CU from 347,367 (Anchor) to
211,351 (−39.2%) — see
[`CU_COMPARISON.md`](../onchain-academy/tests/CU_COMPARISON.md) — so the current
budget is already the post-optimization figure.

### Heaviest trio — the mpl_core CPI instructions

The three heaviest instructions all make a **cross-program invocation into
`mpl_core`** (`CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d`), which is where
their cost concentrates:

| Instruction          |     CU | % of ceiling | mpl_core CPI               |
| -------------------- | -----: | -----------: | -------------------------- |
| `upgrade_credential` | 46,552 |       23.28% | asset update (V2)          |
| `award_achievement`  | 40,172 |       20.09% | asset mint into collection |
| `issue_credential`   | 34,614 |       17.31% | asset create               |

These are the instructions to watch, because their cost is dominated by a
callee we do not control. Even so, the heaviest leaves **76.72% headroom**, so
there is no action to take today.

### When to re-review

Re-run this review (and expect the drift gate below to force it) when any of:

- **A new CPI** is added to any instruction, or an existing CPI target changes
  (e.g. an mpl_core major-version bump) — CPI cost is the dominant term and the
  least under our control.
- **An instruction starts touching materially more accounts** (rule of thumb:
  any instruction whose account list grows past ~12, or any new
  `remaining_accounts` fan-out), since account loading and serialization scale
  with account count.
- **The CI drift gate fails** — any measured-CU change against the committed
  baseline, from a program-logic change or a toolchain bump, forces a deliberate
  baseline update and a look back at this ruling.

## Measurement procedure & determinism

Reproduce locally:

```bash
cd onchain-academy
pnpm build:pinocchio        # cargo build-sbf --tools-version v1.54
pnpm cu:pinocchio           # select-program.sh + ts-mocha harness → writes CU_BASELINE.pinocchio.md
pnpm cu:compare             # optional: regenerate CU_COMPARISON.md vs the Anchor baseline
```

The harness runs the program in an **in-process LiteSVM** (no validator), which
reports `computeUnitsConsumed` per transaction directly. It is deterministic for
a fixed build.

**Determinism caveat (this is what the drift gate exists to catch).** The
measured numbers are a function of the compiled bytecode and the LiteSVM
runtime, so they move when the toolchain moves:

- the **SBF platform-tools** version (`--tools-version v1.54`, pinned) and the
  Solana CLI / `cargo-build-sbf` version that produce the `.so`;
- the `litesvm` / `anchor-litesvm` / `solana-program` npm versions the harness
  runs against.

Concretely: building this same program with an _older_ toolchain
(solana-cli 3.0.1 / platform-tools v1.51) instead of the pinned CI toolchain
(solana 3.1.10 / platform-tools v1.54) shifts several instructions by hundreds
to a couple-thousand CU (`initialize` 18,321→15,321, `enroll` 6,091→7,700). None
of that moves any instruction near the ceiling, but it does mean **the committed
baseline is only reproducible under the pinned toolchain**, which is precisely
why the drift gate runs inside the pinned `Integration (pinocchio · LiteSVM)` CI
lane and not on an arbitrary developer machine.

## CI drift gate

`.github/workflows/ci.yml`, job `Integration (pinocchio · LiteSVM)`, step
**"CU drift gate"**: after the pinocchio `.so` is built, the step runs
`pnpm cu:pinocchio` and then `git diff --exit-code
onchain-academy/tests/CU_BASELINE.pinocchio.md`. Any change in measured CU makes
the diff non-empty and **fails CI loudly**, forcing a deliberate baseline
regeneration and a review touch (this document) rather than silent drift. The
job — and therefore the gate — runs whenever `onchain-academy/**` or `ci.yml`
changes, which includes any edit to the baseline itself.
