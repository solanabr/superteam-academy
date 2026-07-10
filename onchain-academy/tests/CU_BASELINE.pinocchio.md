# Per-instruction Compute-Unit (CU) Baseline (#121 / P1-5)

Captured with an in-process **LiteSVM** harness (`tests/cu-measurement.ts`)
against a release SBF build. Deterministic; no validator required.

| Instruction                 |    CU |
| --------------------------- | ----: |
| initialize                  | 18321 |
| update_config (pause)       |   729 |
| update_config (resume)      |   727 |
| create_course               |  4634 |
| update_course               |  2821 |
| register_minter             |  4359 |
| update_minter               |  2588 |
| revoke_minter               |  2612 |
| enroll                      |  6091 |
| complete_lesson             |  7595 |
| finalize_course             | 10888 |
| reward_xp                   |  6002 |
| close_enrollment            |  4416 |
| create_achievement_type     | 12729 |
| award_achievement           | 40172 |
| deactivate_achievement_type |  2943 |
| issue_credential            | 34614 |
| upgrade_credential          | 46552 |
| close_course                |  2558 |

**Measured 19 transactions across all 18 instructions.**
`update_config` is measured for both pause and resume; every other
instruction contributes one row.

## Coverage

- **No-CPI** — `initialize`, `update_config`, `create_course`, `update_course`,
  `register_minter`, `update_minter`, `revoke_minter`, `enroll`, `close_course`.
- **Token-2022 XP mint** — `complete_lesson`, `finalize_course`, `reward_xp`
  (XP mint + recipient ATAs; Config PDA is the mint authority).
- **close_enrollment** — incomplete enrollment closed after warping the LiteSVM
  clock past the 24h unenroll cooldown (finalized enrollments are replay-guarded).
- **mpl_core collection (CPI)** — `create_achievement_type` (creates the
  collection via CPI), `award_achievement`, `deactivate_achievement_type`.
- **mpl_core asset (CPI)** — `issue_credential`, `upgrade_credential` against a
  pre-bootstrapped collection whose update authority is the Config PDA.
