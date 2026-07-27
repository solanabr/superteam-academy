# Per-instruction Compute-Unit (CU) Baseline — Rust differential harness (#141 / G-4)

Captured by the litesvm 0.12 (Agave 3.x) Rust harness (`tests/differential/tests/cu_budget.rs`) against a release SBF build of
the pinocchio program. Deterministic and crash-free on the CI runner — the
drift gate enforces it in the `Integration (pinocchio · LiteSVM)` job.

Regenerate: `CU_BASELINE_REGEN=1 cargo test --manifest-path tests/differential/Cargo.toml --test cu_budget`.

| Instruction                 |    CU |
| --------------------------- | ----: |
| initialize                  | 15662 |
| update_config (pause)       |   729 |
| update_config (resume)      |   727 |
| create_course               |  4596 |
| update_course               |  2696 |
| register_minter             |  4323 |
| update_minter               |  2604 |
| revoke_minter               |  2628 |
| enroll                      |  8984 |
| complete_lesson             |  7703 |
| finalize_course             |  8436 |
| reward_xp                   |  6103 |
| close_enrollment            |  4438 |
| create_achievement_type     | 11106 |
| award_achievement           | 36449 |
| deactivate_achievement_type |  2926 |
| issue_credential            | 31135 |
| upgrade_credential          | 37009 |
| close_course                |  8522 |

**Measured 19 transactions across all 18 instructions.** `update_config` is
measured for both pause and resume; every other instruction contributes one row.
