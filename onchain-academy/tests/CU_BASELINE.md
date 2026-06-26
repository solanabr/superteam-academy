# Per-instruction Compute-Unit (CU) Baseline (#121 / P1-5)

Captured with an in-process **LiteSVM** harness (`tests/cu-measurement.ts`)
against a release SBF build. Deterministic; no validator required.

| Instruction            |    CU |
| ---------------------- | ----: |
| initialize             | 29454 |
| update_config (pause)  |  3826 |
| update_config (resume) |  3826 |
| create_course          | 12449 |

Measured 4/4 attempted. Mint/Metaplex-Core
instructions that need Token-2022 ATA / umi collection setup are added
incrementally; see the issue for the remaining coverage plan.
