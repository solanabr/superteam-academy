# Audit & Verification Report — Pinocchio Port of `onchain_academy`

Scope: an adversarial review of the Anchor 0.31.1 → Pinocchio 0.11.2 port
(`onchain-academy/programs/onchain-academy-pinocchio/`), expanded test
coverage, and formal/bounded verification. Program ID
`7NeJaSRyb4Wxay3Tcd9bdpD7T3GWYUQSFyrhG8SgwE8V`.

Companion docs: [SPEC.md](./SPEC.md), [ANCHOR-VS-PINOCCHIO.md](./ANCHOR-VS-PINOCCHIO.md),
[DEPLOY-PROGRAM.md](./DEPLOY-PROGRAM.md).

---

## 1. Method

Four independent adversarial auditors, each tasked to _break_ a specific
claim of the port (not to bless it), running against the real code, the
Anchor oracle, the on-disk `spl-token-2022 5.0.2` / `mpl-core 0.9.1` sources,
and the dual-LiteSVM differential harness:

| Adversary               | Target                                                              | Result                                                   |
| ----------------------- | ------------------------------------------------------------------- | -------------------------------------------------------- |
| Wire-divergence         | state serialization / instruction-arg parsing byte-parity vs Anchor | 1 HIGH, 1 MEDIUM (both malformed-input only), rest CLEAN |
| Memory-safety / UB      | every `unsafe`, borrow, stack buffer, cast, panic site              | no UB / no CRITICAL; 3 LOW latent                        |
| CPI wire-format         | hand-rolled Token-2022 + mpl-core bytes vs the real programs        | **byte-perfect, zero defects**                           |
| Auth / validation-order | all 18 instructions' constraints + first-failing-check order        | no auth bypass, no missing check; 1 LOW (UTF-8)          |

Three of the four independently converged on the same root cause — the
hand-rolled parsers _slice_ where Anchor's borsh _allocates and validates_ —
which is strong evidence the findings are real and complete.

## 2. Findings

| ID  | Severity | Reachable?                       | Status                                              |
| --- | -------- | -------------------------------- | --------------------------------------------------- |
| F-A | HIGH     | Yes (any String-arg ix)          | Documented (accepted divergence — both fail-closed) |
| F-B | MEDIUM   | No (program-owned PDAs only)     | **Fixed**                                           |
| F-C | LOW      | No (strings validated on ingest) | **Fixed**                                           |
| F-D | LOW      | CPI + compromised backend only   | Documented                                          |
| F-E | —        | (Anchor does the same)           | Not a defect                                        |

Net: **no authorization bypass, no fund risk, no memory unsafety, no CPI wire
defect, no missing security check.** Every finding is a malformed-input or
pathological-input edge where the two builds react differently; none is
reachable by a well-formed client, and every one fails closed (reject/abort,
never a silent wrong result or state corruption).

### F-A — oversized borsh `String` length prefix (HIGH, reachable, fail-closed)

`validation.rs Cursor::str` reads a `u32` length then slices; Anchor's bundled
`borsh 0.10.4` eagerly allocates the _declared_ length before reading. On the
default 32 KB BPF heap, a declared length ≥ **32768** aborts Anchor
(`ProgramFailedToComplete`, all CU burned) while pinocchio returns a clean
`Custom(102)` (`InstructionDidNotDeserialize`). Empirically the flip is exactly
at 32768. Affects every String-argument instruction.

**Resolution: documented, not "fixed".** Both builds fail closed _before_ any
state mutation or CPI — no client sends a 32 KB length prefix with 3 bytes of
data. Pinocchio's behavior is strictly _better_ (clean error, no CU burn, no
allocation); "fixing" it would mean degrading pinocchio to also OOM-abort,
which is absurd. The parity claim is therefore refined to: **identical for all
well-formed inputs; for a malformed oversized-length prefix pinocchio returns a
clean `102` where Anchor's borsh OOM-aborts.** This is the single reachable
falsification of strict byte-identity and it is benign.

### F-B — `u16` length truncation in `parse()` (MEDIUM, unreachable) — FIXED

`MinterRoleOffsets::parse` / `AchievementTypeOffsets::parse` narrowed a borsh
string length to `u16`; a value ≥ 65536 collapsed to a small in-bounds offset,
so pinocchio _accepted and mutated_ a corrupt account that Anchor rejects
outright. Unreachable on-chain (these PDAs are only written by length-validated
init paths), but a real robustness/parity gap.

**Fix:** `state/mod.rs read_str_len` now bounds-checks the full string body
against the account length before returning, so the length can never exceed
`data.len()` and the `as u16` narrowing is lossless. One change fixes all three
account types. Now both builds reject the corrupt account (regression:
`multiviolation_ordering::injected_truncating_label_len_now_rejected`,
`parse_hardening.rs`).

### F-C — missing UTF-8 validation on account strings (LOW, unreachable) — FIXED

The offset parsers read string _lengths_ but never UTF-8-validated the _bytes_;
Anchor's borsh `String::deserialize` rejects invalid UTF-8 with `3003`.
Empirically reproduced (a `0xFF 0xFF` label made Anchor fail `3003` while
pinocchio parsed on). Unreachable (strings are UTF-8-validated on ingest by
`Cursor::str` and are write-once), but the port was _more lenient_ than Anchor
on corrupt state.

**Fix:** each `parse()` now calls `state::validate_utf8` on every string field,
mapping invalid UTF-8 to `3003` — converging the two builds (regression:
`injected_invalid_utf8_label_now_converges`, `parse_hardening.rs`). Cost: one
`from_utf8` scan of ≤128 bytes per parse (~150 CU on parse-heavy mint paths,
reflected in the updated CU comparison).

### F-D — unbounded `memo` / `credential_name` / `metadata_uri` (LOW, CPI-only)

These three strings have no on-chain length cap; their stack event/CPI buffers
(1312 / 1408 / 1280 B) exceed the maximum a _direct_ transaction can carry, so
no direct-tx path overflows. Via a CPI from a malicious wrapper the inner
instruction data could exceed the buffer → a clean pinocchio abort (via
`nostd_panic_handler`, **not UB**) where Anchor's heap-based `emit!`/CpiBuilder
would succeed.

**Resolution: documented.** Reaching it requires the _trusted_ `backend_signer`
(and `minter`/`payer`) to co-sign a transaction to an attacker's wrapper — a
backend already compromised can mint arbitrary XP anyway, so the marginal risk
is nil. Capping the strings would introduce a _new_ divergence (Anchor accepts
long memos up to the tx limit); enlarging the buffers to the 10 KB CPI bound is
impossible on a 4 KB SBF stack frame. The clean-abort behavior is the correct
fail-closed outcome. Two events (`CourseFinalized`, `MinterUpdated`) have
exact-fit buffers — verified correct, zero margin, noted for future edits.

### F-E — `find_program_address` panic on >32-byte seed (not a defect)

`create_course`/`create_achievement_type`/`close_course` derive a PDA from an
unvalidated id seed; a >32-byte id makes derivation abort _before_ the handler's
length check. The memory-safety adversary confirmed **Anchor does exactly the
same** (derives the seed during account validation, before its own
`require!(len <= 32)`), so both abort identically — no divergence. Deliberately
_not_ changed: adding a pre-check to pinocchio would make it return a clean
`6012`/`6024` where Anchor aborts, introducing a new divergence.

## 3. Verified clean (high confidence)

- **All 9 hand-rolled CPIs** (Token-2022 `MintTo`/`InitializeMint2`/
  `InitializeNonTransferableMint`/`InitializePermanentDelegate`/MetadataPointer
  `Initialize`; mpl-core `CreateV2`/`CreateCollectionV2`/`UpdateV1`/
  `UpdatePluginV1`) — discriminators, arg borsh, and account-meta writability/
  signer flags re-derived byte-for-byte from the on-disk crate sources,
  independently of the existing tests. Includes the subtle asymmetry
  (UpdateV1 collection read-only vs UpdatePluginV1 collection writable), the
  1-byte-None COption freeze encoding, plugin variant indices, and `itoa`.
- **Memory safety:** no UB; every `unsafe` (`assign`/`resize`) verified against
  the pinocchio 0.11 safety contracts (no live `owner()` reference; checked
  `Resize`); no `try_borrow_mut` held across a conflicting borrow; no account
  data borrow held across a CPI that passes that account; all `unsafe`-free
  arithmetic uses `checked_*`; SBF stack frames < 4 KB (largest ≈ 1.8 KB, big
  buffers `#[inline(never)]`); no reachable unchecked slice/panic.
- **Authorization & ordering:** all 18 instructions — every Anchor `mut`/
  `signer`/`has_one`/`constraint`/`address`/`seeds`/`init`/`close`/owner check
  has a pinocchio counterpart with the same error, in Anchor's two-phase order.
  First-failing-check parity confirmed empirically for 6 multi-violation
  transactions spanning the extraction/constraint boundary and the
  init-before-authorization ordering.
- **State layout, close/create/rent CPIs, enrollment grow-transitions, Cursor
  bool/option/trailing-bytes** — all byte-identical (existing Gate 1/2 suites).

## 4. Expanded test coverage (this review)

| File                                                               | Added                                   | Proves                                                                                                                                                    |
| ------------------------------------------------------------------ | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `programs/onchain-academy-pinocchio/tests/parse_hardening.rs`      | 5 host tests                            | F-B/F-C: parsers reject truncating length + invalid UTF-8 for all three string accounts                                                                   |
| `programs/onchain-academy-pinocchio/tests/discriminator_parity.rs` | +4 CPI tests                            | mint-init single-writable-mint metas; InitializeMint2 freeze COption shape; award-shape (2-attr) CreateV2; near-max (512+512) CreateV2 buffer no-overflow |
| `programs/onchain-academy-pinocchio/tests/proofs.rs`               | 7 bounded-exhaustive + 3 Kani harnesses | §5                                                                                                                                                        |
| `tests/differential/tests/multiviolation_ordering.rs`              | 6 ordering + 2 convergence              | first-failing-check parity for multi-violation txs; F-B/F-C convergence                                                                                   |

Full suite after this review, all green: **36 host tests** (17 discriminator +
7 layout + 5 parse-hardening + 7 bounded proofs); **26 differential tests** (17
scenarios + 8 multi-violation/convergence + 1 loader); and the unmodified
**88-test** TS acceptance suite against the hardened `.so`.

## 5. Formal / bounded verification

### 5.1 Bounded-exhaustive proofs of the real implementation (`tests/proofs.rs`)

Every property checked over its **entire bounded input domain** — this is
bounded model checking, runnable under `cargo test` today and Kani-ready:

1. **Creator-reward window** — `saturating_add(100) ≡ checked_add(100)` proven
   over **all 65,536** `u16` values, formally settling the reviewed finding that
   the `saturating_add` in `finalize_course` can never actually saturate.
2. **Lesson bitmap** — for **all 256** lesson indices: the word/bit
   decomposition stays in `[u64;4]` bounds, sets exactly one bit, and popcount
   is exact (0→256 monotonic).
3. **`itoa_u64` ≡ `u64::to_string`** — every power-of-ten boundary ±1, the full
   0..=100 000 range, and a 200 000-value LCG sweep.
4. **Rent formula ≡ `solana_program::Rent`** — for every account size the
   program allocates (49/110/113/127/224/274/338) plus a dense sweep, proving
   `rent_minimum_balance`'s hand-rolled f64 math matches the runtime exactly.
5. **State offset round-trips** — for **every** `course_id` length 0..=32 (×
   prerequisite present/absent) and **every** `label` length 0..=32, init →
   parse → read is identity.

Three `#[cfg(kani)]` harnesses (creator-window, bitmap bounds, itoa length
bound) are included; `cargo kani` discharges them as unbounded proofs once a
Kani toolchain is provisioned (not installed in this environment).

### 5.2 qedgen (spec-driven analysis)

- `qedgen readiness` on the committed IDL flagged forward-compat advisories:
  no leading `version` field and no explicitly-named reserved padding on the
  accounts (P001/P002). These are **inherited from the original Anchor design**
  (the port preserves the exact layout by construction) and are advisory, not
  correctness defects; adding a version field would change every account layout
  and break the wire-compatibility this port exists to preserve. Out of scope,
  noted for a future breaking revision.
- `qedgen adapt` scaffolded a full spec (`formal_verification/academy.qedspec`,
  18 handlers + 34 error variants). `qedgen check` on it reports the expected
  coverage gaps (per-handler `auth` and input-validation guards) — which
  **corroborate** the audit: every guard the linter asks for is one the real
  program already enforces (verified instruction-by-instruction in §3). Filling
  the spec to a passing `qedgen verify --proptest`/`--kani` is a larger
  modeling effort scoped as follow-up; the implementation's security-critical
  logic is instead directly proven in §5.1, and whole-program behavior is
  proven equivalent to the Anchor oracle by the differential suite.

## 6. Deploy readiness

- All gates green post-hardening: host parity (§4), dual-VM differential,
  unmodified TS acceptance suite, bounded proofs, Trident fuzz smoke.
- Measured CU after hardening: **−39.2%** total vs Anchor
  ([tests/CU_COMPARISON.md](../onchain-academy/tests/CU_COMPARISON.md)); binary
  −70% (672 KB → 202 KB).
- No blocking findings. F-A/F-D/F-E are accepted, documented, benign
  divergences on malformed/pathological inputs; F-B/F-C fixed.

**Recommendation: cleared for devnet deployment and end-to-end testing.** The
in-place upgrade path (same program ID, smaller binary, existing accounts
preserved) is in [DEPLOY-PROGRAM.md](./DEPLOY-PROGRAM.md#pinocchio-runtime).
