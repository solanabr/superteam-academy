# Devnet Deployment Log — Pinocchio build (fresh self-owned instance)

Deployed 2026-07-09 from the Pinocchio build (`--features fresh-id`) after the
pre-deploy audit fixes ([docs/PRE-DEPLOY-AUDIT.md](../docs/PRE-DEPLOY-AUDIT.md)).
Runbook: [docs/DEPLOY-PROGRAM.md § Fresh devnet instance](../docs/DEPLOY-PROGRAM.md#fresh-devnet-instance-self-owned-id).

## Addresses

| What                       | Value                                                              |
| -------------------------- | ------------------------------------------------------------------ |
| Program id                 | `CYneSS6KYx1YA73ZwrxC4vvWKsR2xJKLWpKNJNXC5SnM`                     |
| ProgramData                | `5vsNcBm83W5YN2KruhVXwbrMZTE131Xpqjr4ZzMHqu1`                      |
| Upgrade authority          | `FGUrXnKtsJaXxZwB2NwiJFx2XqH4KmBdpypqgsskcor2` (deployer wallet)   |
| Config PDA                 | `F6D5iHRkW7F2zGmmExN3Z2ZqSG1gDTgNjgxKWARYWDsm` (bump 255)          |
| XP mint (Token-2022)       | `FGX55QymSietmLs6gnH8SzyvJhPqW9LZ9F43B9NAcStd`                     |
| Authority = backend_signer | `FGUrXnKtsJaXxZwB2NwiJFx2XqH4KmBdpypqgsskcor2`                     |
| Artifact sha256            | `d0eece0c915a96520b1622f03cc3b932740bba2ca8c129e8fc02d017ebdd62c9` |
| Binary size                | 207,880 bytes (~1.45 SOL rent)                                     |

## Transactions

| Step                             | Signature                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------ |
| Deploy                           | `MtjF9jUxneQct34ev7WbqdJPAEtdkoWcGdqdAkFsGiToaHhz7EznuxshhNg3Mu3ySZwC43VTwVUNTRcmBSZLSZo`  |
| Initialize                       | `pDMGts8oHGS83iz2vzG4R59hf7MM4yWnymVEVgHdKVNFEaF63CZkAGCFbxrmbPQMuocfrfkPue9KQtP5EaoVHjj`  |
| create_course `solana-mock-test` | `rorbWh7MMsFedrpAtYnsCpc2QpU1UNdYc9qPzobY4Yf9R8W6yGenRRuRUGwtHYoypCKUDvBLNHL18CXFRqho9dD`  |
| enroll                           | `27WCi1t7oScM7Fh7RxnjANe9GGYUkWiB5r8KhYp7smoJBH24UKEpWvmTJrp6gjLMEoq1oinwhLqYZjXz5F6jfQjP` |
| finalize_course                  | `KQpthicZzNmEfrkMCV1yGBLLdjnbnaTUxhjdxs6vd3mv1jStDCQxARJXU6X9xhrdCgWpSRbfLpzuU3acS6j7XZd`  |

## End-to-end result

Full learner journey against the live program succeeded:

- **initialize** → created the `Config` PDA + the Token-2022 XP mint (exercises
  the hand-rolled Token-2022 CPIs: `InitializeMint2`, `InitializeNonTransferableMint`,
  `InitializePermanentDelegate`, MetadataPointer init) + auto-registered the
  backend `MinterRole`.
- **create_course** `solana-mock-test` (5 lessons, 100 XP/lesson) → stamped
  `generation` from `Config.course_nonce` (the H-1 fix path).
- **enroll** → recorded `course_gen` on the enrollment.
- **complete_lesson × 5** → +100 XP each via the Token-2022 `mint_to` CPI.
- **finalize_course** → +250 bonus XP.
- **XP balance = 750** (500 + 250 bonus), Level 2. ✓

The generation fix (H-1) was exercised implicitly and correctly across the whole
flow (create_course wrote it, enroll stamped it, complete/finalize checked it).

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

## Fix applied during e2e

The committed IDL marked `create_course`'s `config` account read-only; the H-1
fix makes the program write `Config.course_nonce` there, so the client hit
`ConstraintMut` (2000). Fixed by setting `config.writable = true` on
`create_course` in all three IDL copies (`idl/onchain_academy.json` — the
runtime source used by `scripts/lib/academy.ts`; `idl/onchain_academy.ts`; and
`apps/web/src/lib/solana/idl/superteam_academy.json`).
