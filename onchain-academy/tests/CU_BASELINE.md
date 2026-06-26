# Per-instruction Compute-Unit (CU) Baseline (#121 / P1-5)

Captured with an in-process **LiteSVM** harness (`tests/cu-measurement.ts`)
against a release SBF build. Deterministic; no validator required.

| Instruction            |    CU |
| ---------------------- | ----: |
| initialize             | 27954 |
| update_config (pause)  |  3826 |
| update_config (resume) |  3826 |
| create_course          | 12449 |
| update_course          |  7487 |
| register_minter        | 12709 |
| update_minter          |  6474 |
| revoke_minter          |  6116 |
| enroll                 | 12386 |
| close_course           |  6160 |

**Measured 10 transactions across 9 no-CPI instructions** (update_config is measured for both pause and resume).

## Deferred — need Token-2022 mint / Metaplex-Core setup

These mint XP or CPI into mpl_core; add them with the same harness pattern
plus the extra setup noted:

- `reward_xp`, `complete_lesson`, `finalize_course` — mint Token-2022 XP (need an XP mint + recipient ATA)
- `create_achievement_type`, `deactivate_achievement_type`, `award_achievement` — mpl_core collection (CPI)
- `issue_credential`, `upgrade_credential` — mpl_core asset (CPI)
- `close_enrollment` — needs a finalized enrollment (depends on the mint flow)
