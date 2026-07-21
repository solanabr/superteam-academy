# Devnet Deployment Log — Pinocchio build (fresh self-owned instance)

Deployed 2026-07-21 from the **v2** Pinocchio build (`--features fresh-id`) — the
`active_lessons` 256-bit-mask migration (253-byte `Course`, flat creator reward).
Supersedes the 2026-07-09 `CYneSS6…` testbed (v1 `lesson_count` layout), which is
retained below under "Superseded instance" for provenance.
Runbook: [docs/DEPLOY-PROGRAM.md § Fresh devnet instance](../docs/DEPLOY-PROGRAM.md#fresh-devnet-instance-self-owned-id).

## Addresses

| What                       | Value                                                              |
| -------------------------- | ------------------------------------------------------------------ |
| Program id                 | `Dsro2Cd9Mhgk8L71imh3LLPwYU5PU8hvBY5HEcPrcx5u`                     |
| ProgramData                | `EyGthtUAGVxsQWndn43Wod87zSpyZoebQ9mZJWJJhASW`                     |
| Upgrade authority          | `ATNY5zWeTFnU5AyVdaMJA4AJ91vTmVb1KhU5F985R5oB` (deployer wallet)   |
| Config PDA                 | `E9GVGKbyoWNSf9B1iR8gNVecwDwqnzNbUxcBzVCVSXan` (bump 254)          |
| XP mint (Token-2022)       | `BUk5izZcRompFe2da1yv9BLcMLBEEyg7JCvS8nQYoHHd`                     |
| Authority = backend_signer | `ATNY5zWeTFnU5AyVdaMJA4AJ91vTmVb1KhU5F985R5oB`                     |
| Artifact sha256            | `0b8521931c7191dd1bd1aaa33bffa271e3f8ee634f88df30b6d83e8920626b67` |
| Binary size                | 213,024 bytes (~1.48 SOL rent)                                     |

Keypairs (gitignored): program `wallets/pinocchio-program-devnet-v2.json`, XP
mint `wallets/xp-mint-keypair.json` (both under `onchain-academy/`).

## Transactions

| Step                             | Signature                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------ |
| Deploy                           | `451Y7BEsxh3JYNwExstdXTe1wCBstUxQs3PqfYfTcjDmqz9rXkSKDofWEBb1gdfzyhSXHSUfF8oxRiu2DyyQh49N`  |
| Initialize                       | `3uzsyj9kPH3kkx8sEoTFYSrnQs9ifA2688U4pti3cnS7RAEhRdXD8msVq3hHnU6tkv46DNNPMGCnT2nBXYmuXEm8`  |

`initialize` created the `Config` PDA + the Token-2022 XP mint (hand-rolled
`InitializeMint2` / `InitializeNonTransferableMint` / `InitializePermanentDelegate`
/ MetadataPointer CPIs) and auto-registered the backend `MinterRole`. Config read
back on-chain: authority = backend_signer = deployer, xp_mint = above, bump 254. ✓

## Pending on this instance

Course creation + the learner-journey smoke (create_course → enroll →
complete_lesson → finalize_course) run via the **`/admin` Publish/Sync** panel
against the new program id — the instance is empty until then. The full journey
was already proven byte-for-byte on the superseded instance (below) and in the
LiteSVM/differential suites at the v2 layout.

## Known follow-ups (client tooling — deferred to the frontend/client teammate)

- **Credential + achievement (mpl-core) leg not smoked on devnet.** Blocked by a
  client-side issue in `scripts/create-mock-track.ts`: its umi identity is
  unfunded ("Attempt to debit an account but found no record of a prior
  credit"). This is the mpl-core **JS client**, not the program. The program's
  hand-rolled mpl-core CPIs (`CreateV2`, `CreateCollectionV2`, `UpdateV1`,
  `UpdatePluginV1`) are proven byte-exact in the LiteSVM suite against the real
  dumped `mpl_core.so`. To smoke on devnet later: fund the umi identity in
  `create-mock-track.ts`, create a course with that collection, then run
  `issue_credential`.

---

## Superseded instance — 2026-07-09 (v1 `lesson_count` layout, testbed)

| What                       | Value                                                              |
| -------------------------- | ------------------------------------------------------------------ |
| Program id                 | `CYneSS6KYx1YA73ZwrxC4vvWKsR2xJKLWpKNJNXC5SnM`                     |
| ProgramData                | `5vsNcBm83W5YN2KruhVXwbrMZTE131Xpqjr4ZzMHqu1`                      |
| Upgrade authority          | `FGUrXnKtsJaXxZwB2NwiJFx2XqH4KmBdpypqgsskcor2` (deployer wallet)   |
| Config PDA                 | `F6D5iHRkW7F2zGmmExN3Z2ZqSG1gDTgNjgxKWARYWDsm` (bump 255)          |
| XP mint (Token-2022)       | `FGX55QymSietmLs6gnH8SzyvJhPqW9LZ9F43B9NAcStd`                     |

Full learner journey succeeded against that instance: initialize → create_course
`solana-mock-test` (5 lessons, 100 XP/lesson) → enroll → complete_lesson × 5
(+100 XP each) → finalize_course (+250 bonus) → **XP balance 750, Level 2**. The
generation fix (H-1) was exercised across the whole flow. During that e2e the
committed IDL marked `create_course`'s `config` read-only while the H-1 fix
writes `Config.course_nonce`; fixed by setting `config.writable = true` on
`create_course` in all three IDL copies (`idl/onchain_academy.json`,
`idl/onchain_academy.ts`, `apps/web/src/lib/solana/idl/superteam_academy.json`).
