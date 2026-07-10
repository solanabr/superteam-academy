# Pre-Deploy Security Audit — Superteam Academy (Pinocchio build)

Date: 2026-07-08. Target: `onchain-academy/programs/onchain-academy-pinocchio/`
(the build to be deployed as the self-owned devnet instance
`CYneSS6KYx1YA73ZwrxC4vvWKsR2xJKLWpKNJNXC5SnM`; see
[DEPLOY-PROGRAM.md](./DEPLOY-PROGRAM.md) § "Fresh devnet instance").

This round differs from [AUDIT-REPORT.md](./AUDIT-REPORT.md): that one proved
the port is **byte/behavior-faithful to the Anchor oracle**. This one judges
the program on its **own** security merits — a fresh instance the operator
owns — so a flaw is a flaw even when the Anchor version shares it
("Anchor does the same" is not a defense here).

## Method

- **qedgen** (`qedgen probe` Pinocchio mode, `qedgen readiness` on the IDL,
  `qedgen check` on the spec).
- **Four parallel adversarial auditors**, each a distinct lens, reading the
  real code against the spec + Anchor oracle: (1) economic/business-logic,
  (2) authorization & trust boundaries, (3) state machine / replay / lifecycle,
  (4) Pinocchio memory-safety / arithmetic / the fresh-id change.
- **Independent re-verification** of every material finding against the source
  before it appears here.

## Bottom line

**No CRITICAL. No fund loss, no authorization bypass, no memory unsafety, no
CPI-wire defect, no unchecked arithmetic.** The program is safe to deploy to a
**single-operator devnet instance for end-to-end testing.**

One **HIGH correctness bug** (`close_course` course-reincarnation replay) is
reachable **only by the trusted authority + backend keys** — it is an
operational-integrity landmine, not an external-attacker exploit. It is **not a
devnet-e2e blocker** (you hold both keys and simply won't trigger the sequence),
but it **should be fixed before any production / multi-user deployment.**

> **Update (2026-07-09): H-1, M-1, I-1, and L-2 are now FIXED** in the Pinocchio
> build and covered by regression tests
> (`tests/differential/tests/fix_regressions.rs`). See "Resolution" under each
> finding. L-1 is left as-is (accepted, by-design). The Anchor oracle that
> shared these bugs has been retired; the program is now Pinocchio-only.

## qedgen results

| Tool                | Result                                                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `probe` (pinocchio) | 20 × `offset_overrun` (MEDIUM). All 20 independently re-verified **SAFE** — see below.                                                                                   |
| `readiness` (IDL)   | P001 no `version` field (×6 accounts), P002 no `_reserved` padding (×6), P003 default discriminators (additive). Forward-compat / upgrade-safety — see Attack Surface §. |
| `check` (spec)      | Spec-coverage advisories only (the `.qedspec` is a skeleton). Each guard it asks for is one the program already enforces; not implementation defects.                    |

The 20 `offset_overrun` sites are all either (a) constant slices of fixed-size
stack buffers in the CPI builders, (b) `init_*` writers that run only on an
account just created at the exact `SIZE` by `create_pda_account`, with string
lengths `require!`-bounded before the write, or (c) token-account field reads
gated by a prior `len >= 165` check. None is reachable out-of-bounds on
adversarial data. The deployed profile has `overflow-checks = true`, so any
residual integer overflow aborts (fail-closed) rather than wrapping.

## Findings

| ID  | Severity           | Reachable by                          | Status                                                                                     |
| --- | ------------------ | ------------------------------------- | ------------------------------------------------------------------------------------------ |
| H-1 | HIGH (correctness) | authority + backend (trusted keys)    | **FIXED** — course `generation` field (6034 `StaleEnrollment`)                             |
| M-1 | MEDIUM             | learner, but needs backend to re-sign | **FIXED** — empty-bitmap-to-close (6036 `EnrollmentInProgress`)                            |
| L-1 | LOW (by-design)    | backend + minter                      | Accepted, unchanged                                                                        |
| L-2 | LOW (hardening)    | —                                     | **FIXED** — buffers bumped (`emit_xp_rewarded` 1344, enrollment tail 72)                   |
| I-1 | INFO               | authority / backend                   | **FIXED** — mandatory canonical old-role on backend rotation (6035 `OldMinterRoleMissing`) |

### H-1 — `close_course` orphans live enrollments → course "reincarnation" replays XP / credentials

`close_course` (`instructions/close_course.rs:16-69`) frees a Course PDA after
checking only authority + canonical PDA + owner + discriminator. It **never
checks that the course has no live enrollments** (`total_enrollments == 0`).
Enrollment PDAs are seeded `["enrollment", course_id, learner]` — keyed on
`course_id`, not on any version/nonce — so they survive the close and their
address is unchanged. `create_course` can then recreate a course at the
identical PDA with a fresh (zeroed) counter set and an operator-chosen
`lesson_count`.

`finalize_course` (`instructions/finalize_course.rs:59-140`) binds an
enrollment to a course by (a) canonical PDA over the course's `course_id`,
(b) `enrollment.course == course.key()` (the stored pubkey — unchanged across
reincarnation), (c) `completed_at.is_none()`, and (d)
`popcount(lesson_flags) == lesson_count`. A surviving, partially-completed
enrollment satisfies all four against a recreated course whose new
`lesson_count` ≤ the bits already set.

**Kill chain (unearned completion bonus):** learner enrolls in course "x"
(`lesson_count=10`), completes 5 lessons (backend co-signs each — legitimate),
never finalizes → `completed_at=None`, 5 bitmap bits set. Authority
`close_course("x")` (enrollment untouched) then `create_course("x", lesson_count=5)`
at the same address. `finalize_course` on the surviving enrollment now passes
(`popcount=5 == new lesson_count`, `completed_at=None`) and mints the v2
completion bonus + possibly the creator reward — none earned on v2. Repeatable
for every mid-course learner and every reincarnation.

**Second chain (credential mis-issuance):** an enrollment with
`completed_at=Some, credential_asset=None` survives a close+recreate with a
different `track_id`/`collection`; `issue_credential`
(`instructions/issue_credential.rs:116-124`, checks only
`completed_at.is_some() && credential_asset.is_none()`) then mints a soulbound
credential describing the _new_ track for completion of the _old_ course.

**Why the existing guard misses it:** SPEC §9.4's replay guard ("a finalized or
credentialed enrollment can never be closed") lives in `close_enrollment` and is
correct. `close_course` is an independent deletion path that removes the _other_
half of the (course, enrollment) pair, side-stepping the invariant. The Anchor
oracle has the identical gap and documents it; per this round's trust model that
does not excuse it.

**Severity rationale:** reachable only with the authority key (close + create)
**and** the backend key (finalize) — on the fresh instance, both are the
operator's own wallet. So it is not an outsider exploit; the marginal capability
it grants a key-holder is small (a backend key can already mint XP within caps).
Its real weight is as a **latent correctness landmine**: a routine-looking admin
action ("close and recreate a broken course") silently corrupts XP/credential
accounting for any learner who was mid-course. That is why it must be fixed
before production but does not block controlled devnet testing.

**Resolution (shipped):** the generation-field variant of the second option.
`Config` carries a monotonic `course_nonce` (in its reserved bytes); each
`create_course` stamps the pre-increment value onto the `Course` as
`generation`, and each `Enrollment` records the generation in force at enroll
time. `complete_lesson` / `finalize_course` / `issue_credential` /
`upgrade_credential` reject any enrollment whose `course_gen != course.generation`
with `StaleEnrollment` (6034). A recreated course gets a fresh generation, so
stale enrollments can't earn on it; `enroll` re-initializes a superseded-
generation enrollment in place so the learner can take the new course. All PDA
addresses and client derivation are unchanged (the counter lives in reserved
bytes). `create_course` now takes `Config` writable. Regression:
`fix_regressions::h1_recreated_course_rejects_stale_enrollment`.

### M-1 — Partial-enrollment XP replay via `close_enrollment` → re-enroll → re-complete

`close_enrollment` (`instructions/close_enrollment.rs:66-69`) blocks closing only
when `completed_at.is_some() || credential_asset.is_some()`. A learner who
completed some-but-not-all lessons (`completed_at=None`) can, after the 24 h
cooldown, close the enrollment; re-enrolling writes a fresh zeroed lesson bitmap
(`instructions/enroll.rs` → `state/enrollment::init`). The per-lesson XP replay
guard (the bitmap) therefore does not survive a self-service reset.

Re-completing the lessons requires the **backend to co-sign each
`complete_lesson`** again, so a non-compromised backend that tracks completions
off-chain simply refuses. This is a **missing on-chain backstop**, not an
independently exploitable mint — hence MEDIUM. Note the per-lesson path has no
cumulative cap (only `MAX_XP_PER_MINT=5000` _per lesson_), so if the backend is
tricked/compromised the loop is bounded only by the kill-switch.

**Resolution (shipped):** the empty-bitmap option. `close_enrollment` now also
requires `completed_lessons == 0`, so once a learner completes any lesson the
enrollment can neither be closed nor reset (`EnrollmentInProgress`, 6036); an
unstarted enrollment still closes after the cooldown. Regression:
`fix_regressions::m1_cannot_unenroll_after_starting_lessons` (and the
`m1_unstarted_enrollment_still_closes` boundary).

### L-1 — `reward_xp` recipient token account is bound by mint only, not owner (by design)

`instructions/reward_xp.rs:111` (`require_xp_mint`) validates the destination is
an XP-mint Token-2022 account but does **not** anchor its internal owner to a
recipient (unlike `complete_lesson`/`finalize_course`/`award_achievement`, which
call `require_xp_recipient`). A backend + minter co-signed call can direct XP to
any XP-mint account. Intentional (SPEC §9.5 — `reward_xp` has no on-chain
recipient-identity account), bounded by per-call + per-minter caps + kill-switch,
and XP is non-transferable so misdirected XP cannot be exfiltrated for value.
**Not a blocker.** Changing it would break parity with the oracle.

### L-2 — Two zero-margin stack buffers (defensive hardening only)

`events::emit_xp_rewarded` (`src/events.rs`) has a 1312-byte buffer whose
framing-free content ceiling is 1304 (8-byte cushion; the realistic memo ceiling
leaves ~440 bytes). `state/enrollment::set_completed_at` uses a `[u8;70]` tail
buffer that is exactly filled (70/70) in the worst credential-present case —
proven never to exceed 70. Neither is reachable to overflow. **Resolution
(shipped):** both bumped — `emit_xp_rewarded` to 1344, the enrollment tail to
`[u8;72]` — for an obvious non-zero margin.

### I-1 — `update_config` backend rotation can leave the old MinterRole active

`instructions/update_config.rs:41-70` deactivates the old backend's MinterRole
only if that account is passed in remaining-accounts; omitting it leaves the old
role `is_active=true`. The old key holds no power while it is not
`Config.backend_signer` (every mint path also checks `backend_signer`), so this
is an operational footgun, not an exploit. **Resolution (shipped):** rotating the
backend now REQUIRES the previous backend's canonical `["minter", old_backend]`
role PDA (`OldMinterRoleMissing`, 6035); it is deactivated when live and a no-op
when the old backend never held a role (a freshly appointed backend). Regression:
`fix_regressions::i1_backend_rotation_requires_canonical_old_role`.

## Verified clean (high confidence)

- **All 18 instructions** authorize against the correct stored field (full
  matrix produced by the authorization auditor); no missing/mis-targeted signer
  check; no privilege escalation (minters cannot self-manage their roles; config
  rotation is authority-only and rejects the zero key).
- **XP recipient owner-anchoring** present and correct on all three
  identity-bearing mint paths (complete_lesson, finalize_course ×2,
  award_achievement); negatively tested end-to-end vs the oracle
  (`tests/differential/tests/scenarios.rs` foreign-owner/foreign-mint ATA).
- **Replay/one-shot guards** within a single course/enrollment life are
  persistent and correct: lesson bitmap, `completed_at` one-shot,
  `CredentialAlreadyIssued`, achievement receipt PDA, unenroll cooldown
  (monotonic clock). (The reset paths H-1/M-1 are the exception and are called
  out above.)
- **Init/re-init**: all init paths fail on a live account
  (`AccountAlreadyInUse`), matching Anchor `init`. Close paths re-zero on
  recreate (System `Allocate` zero-fills), so no dirty-byte revival.
- **Account-type confusion**: every typed load checks initialized + owner +
  8-byte discriminator; all six discriminators distinct.
- **Memory safety**: no `transmute`, no `*const T` struct casts, no
  `from_raw_parts`, no unaligned packed-field refs; all 4 `unsafe` blocks sound;
  all 20 qedgen probe sites SAFE; the `read_str_len` `as u16` narrowing is
  provably lossless (F-B fix holds); no exploitable panic (all fail-closed);
  `overflow-checks=true` in the deployed profile.
- **CPIs** target only hardcoded System / Token-2022 / mpl-core ids; no
  user-supplied program is ever invoked → no reentrancy surface.
- **fresh-id feature**: the `ID`/`CONFIG_PDA`/`CONFIG_BUMP` triple is internally
  consistent (verified computationally under `--features fresh-id`); the
  `DeclaredProgramIdMismatch` (4100) self-check is the first statement in the
  entrypoint, before any state mutation; the fresh-id build differs from the
  default **only** in those three identity constants.

## Attack surface & centralization analysis (report only — nothing changed)

You asked where attack surface could be reduced by making parts more
controlled/centralized. The system's security concentrates in **two keys**, and
on the devnet instance they are the **same** wallet:

- **`authority`** — creates/updates/closes courses, registers/revokes/updates
  minters, rotates config, sets the kill-switch. A leaked authority key ⇒ mint
  unlimited XP (register an unlimited minter), un-pause, rotate the backend,
  trigger H-1.
- **`backend_signer`** — co-signs every XP mint, lesson completion, credential,
  and achievement. A leaked backend key ⇒ mint XP within caps, complete lessons,
  issue credentials/achievements. XP is non-transferable (limited value
  exfiltration) but credentials/achievements are reputational.

Concrete ways to tighten control (in rough priority):

1. **Separate `authority` from `backend_signer`, and put `authority` behind a
   multisig (Squads).** Today they can be one key and on devnet are. The
   authority holds the "unlimited" powers (minter registration, un-pause,
   config rotation); isolating it behind a multisig shrinks the blast radius of
   any single key compromise to the capped, kill-switchable backend surface.
2. **Gate or remove `close_course` (fixes H-1).** As a permanent, always-callable
   authority instruction it is the single most dangerous admin capability.
   Require zero live dependents, or drop it in favor of `update_course` +
   nonce-seeded recreation.
3. **Add on-chain length caps to `memo` / `credential_name` / `metadata_uri`.**
   They are currently unbounded (bounded only by the tx size limit); a cap
   removes the F-D CPI edge and the L-2 zero-margin buffers, and gives the
   program (not the caller) control over input size.
4. **Derive credential attributes (`total_xp`, `courses_completed`) from
   on-chain state** instead of trusting client-supplied args, so a buggy/leaked
   backend cannot stamp false stats into a credential NFT.
5. **Bind `reward_xp` to a canonical recipient** (L-1) if/when a recipient
   identity account is available, so XP can't be directed to an arbitrary
   account even by a valid caller.
6. **Two-step authority handoff** (propose/accept) instead of the current
   single-step rotation, so a mis-typed or coerced rotation can't instantly
   surrender control. (Already noted as future work; needs +32 B Config state,
   a layout migration.)

**Strengths worth keeping:** the XP mint authority is the Config **PDA**
(program-controlled, not a raw key) — good centralization; the kill-switch
(`Config.paused`) is a strong single lever that gates all six mint/credential
paths; per-minter caps + the absolute `MAX_XP_PER_MINT` bound the backend
surface.

**Upgrade-safety caveat (qedgen P001/P002):** no account has a leading `version`
field or trailing `_reserved` padding, so fixing H-1/M-1 (or any of the above)
in a way that changes an account layout requires a full migration, not an
additive upgrade. This is inherited from the Anchor design and preserved
deliberately for wire-compatibility; flag it now because the fixes above may
want layout room. On a fresh self-owned instance you are not bound to the
upstream layout, so adding `version` + `_reserved` **now** (before real data
exists) is the cheapest it will ever be — at the cost of diverging from the
committed IDL/frontend decoders.

## Deploy readiness

Cleared for **single-operator devnet end-to-end testing**, and — with H-1, M-1,
I-1, and L-2 now fixed and regression-tested — the correctness landmines that
gated a production/multi-user deployment are closed. `close_course` on a course
with live enrollments is now safe (the recreated course gets a fresh generation;
stale enrollments are rejected with 6034 and re-enroll re-initializes them).

Remaining before a production/multi-user launch (design/ops, not code defects):
adopt the authority ⁄ backend key separation and the multisig authority from the
attack-surface section (§ above), and consider the `version` + `_reserved`
account fields (qedgen P001/P002) while the fresh instance still has no data —
adding them now is the cheapest it will ever be.
