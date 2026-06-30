# Per-instruction Compute-Unit (CU) Baseline (#121 / P1-5)

Captured with an in-process **LiteSVM** harness (`tests/cu-measurement.ts`)
against a release SBF build. Deterministic; no validator required.

| Instruction                 |    CU |
| --------------------------- | ----: |
| initialize                  | 27954 |
| update_config (pause)       |  3826 |
| update_config (resume)      |  3826 |
| create_course               | 12449 |
| update_course               |  7487 |
| register_minter             | 12709 |
| update_minter               |  6474 |
| revoke_minter               |  6116 |
| enroll                      | 12386 |
| complete_lesson             | 14298 |
| finalize_course             | 20257 |
| reward_xp                   | 11877 |
| close_enrollment            |  6530 |
| create_achievement_type     | 23607 |
| award_achievement           | 55756 |
| deactivate_achievement_type |  7734 |
| issue_credential            | 45394 |
| upgrade_credential          | 57545 |
| close_course                |  6160 |

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
