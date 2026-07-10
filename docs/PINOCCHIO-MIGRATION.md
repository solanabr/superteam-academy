# Pinocchio Migration — Integration Guide for the Team

The on-chain `onchain-academy` program was rewritten from **Anchor 0.31** to
**Pinocchio 0.11** and the Anchor implementation was **deleted**. The program is
now Pinocchio-only. This doc is the practical "what changed and how to adapt"
for everyone touching the codebase.

**TL;DR:** the wire contract (the IDL) is the same except **three new error
codes** and **one account-meta fix** (`create_course` now needs `config`
writable). Clients that read account metas from the IDL keep working after
pulling the updated IDL. Build/test/deploy commands changed (`cargo build-sbf` /
`solana program deploy` instead of `anchor build` / `anchor deploy`).

Companion docs: [SPEC.md](./SPEC.md) (authoritative program spec),
[PRE-DEPLOY-AUDIT.md](./PRE-DEPLOY-AUDIT.md) (the fixes + threat model),
[DEPLOY-PROGRAM.md](./DEPLOY-PROGRAM.md) (deploy runbook),
[ANCHOR-VS-PINOCCHIO.md](./ANCHOR-VS-PINOCCHIO.md) (implementation deltas).

---

## 1. The live devnet instance

A self-owned instance is deployed and initialized on devnet
(see [`onchain-academy/DEPLOYMENT-LOG.md`](../onchain-academy/DEPLOYMENT-LOG.md)):

| What                       | Value                                          |
| -------------------------- | ---------------------------------------------- |
| Program id                 | `CYneSS6KYx1YA73ZwrxC4vvWKsR2xJKLWpKNJNXC5SnM` |
| Config PDA                 | `F6D5iHRkW7F2zGmmExN3Z2ZqSG1gDTgNjgxKWARYWDsm` |
| XP mint (Token-2022)       | `FGX55QymSietmLs6gnH8SzyvJhPqW9LZ9F43B9NAcStd` |
| Authority = backend_signer | `FGUrXnKtsJaXxZwB2NwiJFx2XqH4KmBdpypqgsskcor2` |

Frontend env: `NEXT_PUBLIC_PROGRAM_ID=CYneSS6…`, `NEXT_PUBLIC_XP_MINT_ADDRESS=FGX55Qym…`.

---

## 2. What did NOT change (safe to rely on)

- **Account byte layouts** — every account decodes exactly as before. The new
  internal fields (`Config.course_nonce`, `Course.generation`,
  `Enrollment.course_gen`) reuse existing reserved bytes at the same offsets, so
  Borsh decoders that read the documented fields are unaffected.
- **All 18 instruction discriminators, 6 account discriminators, 18 event
  discriminators.** `sha256("global:/account:/event:<name>")[..8]`, unchanged.
- **Event log shape** (`Program data: <base64>`), PDA seeds, error-log format
  (`AnchorError occurred. Error Code: … Error Number: … Error Message: …`).
- **The IDL is still the client contract** — the `@coral-xyz/anchor` JS
  `Program` client works unchanged against it.

---

## 3. What DID change — client-facing

### 3a. Three new error codes (add to your error map)

| Code | Name                   | Fires when                                                                                                            |
| ---- | ---------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 6034 | `StaleEnrollment`      | An enrollment from a superseded course generation is used on a recreated course (see 3c).                             |
| 6035 | `OldMinterRoleMissing` | `update_config` rotates the backend signer without passing the previous backend's `["minter", old_backend]` role PDA. |
| 6036 | `EnrollmentInProgress` | `close_enrollment` on an enrollment that has completed ≥1 lesson (see 3b).                                            |

Both committed IDLs (`onchain-academy/idl/onchain_academy.json` and
`apps/web/src/lib/solana/idl/superteam_academy.json`) already carry these.

### 3b. `create_course` now needs `config` WRITABLE ⚠️

The program writes a course-generation counter into `Config` on
`create_course`, so `config` must be passed **writable**. The IDLs are updated
(`create_course.config.writable = true`). **Action:** clients that build the
`create_course` account list from the IDL (Anchor JS `.accounts()` /
`.accountsStrict()`) just need the updated IDL. Anything that hardcodes the
account metas must flip `config` to writable. (Symptom if missed: `ConstraintMut`
/ error `2000`.)

### 3c. Behavior changes to surface in the UI

- **Cannot unenroll after starting** — once a learner completes any lesson,
  `close_enrollment` returns `6036`. Only zero-progress enrollments can be
  closed (after the 24 h cooldown). (Prevents an XP-reset exploit.)
- **Closing + recreating a course invalidates old enrollments** — a recreated
  course id gets a fresh generation; old enrollments return `6034` on
  complete/finalize/credential, and `enroll` re-initializes them into the new
  course. (Prevents replaying XP/credentials across a course recreation.)
- **Backend rotation requires the old minter-role account** — `update_config`
  with a new backend signer must include the previous backend's canonical
  `["minter", old_backend]` PDA (else `6035`). Scripts that rotate the backend
  must pass it (see `scripts/rotate-config-authority.ts` / the differential
  test for the shape).

### 3d. The IDL is now hand-owned; no more `anchor build`

There is no Anchor crate to regenerate `target/idl` / `target/types` from. The
committed IDL lives at:

- `onchain-academy/idl/onchain_academy.json` — runtime IDL (loaded by the deploy
  scripts)
- `onchain-academy/idl/onchain_academy.ts` — the `OnchainAcademy` TypeScript type
- `apps/web/src/lib/solana/idl/superteam_academy.json` — the frontend copy

If you change the program's wire contract, update these by hand and keep them in
sync. Deploy scripts resolve the program via `scripts/lib/academy.ts`
(`academyProgram()`), which loads the committed JSON IDL and honors
`ACADEMY_PROGRAM_ID` — **not** `anchor.workspace`.

---

## 4. What changed — build / test / deploy

| Task                        | Before (Anchor)                             | Now (Pinocchio)                                                                                                                   |
| --------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Build                       | `anchor build`                              | `cargo build-sbf --manifest-path programs/onchain-academy-pinocchio/Cargo.toml --tools-version v1.54` (or `pnpm build:pinocchio`) |
| Build a self-owned instance | edit `Anchor.toml` + `update-program-id.sh` | `pnpm build:pinocchio:fresh` (`--features fresh-id`; id baked in `consts.rs`)                                                     |
| Unit/parity tests           | `tests/rust` (`cargo test`)                 | `pnpm test:layout` (`cargo test -p onchain-academy-pinocchio`) — 36 host tests                                                    |
| Integration tests           | `anchor test` (`tests/onchain-academy.ts`)  | `pnpm test:integration` (`cargo test --manifest-path tests/differential/Cargo.toml`) — 31 LiteSVM tests                           |
| CU profiling                | `anchor run cu`                             | `pnpm cu:pinocchio` / `pnpm cu:compare`                                                                                           |
| Deploy                      | `anchor deploy`                             | `solana program deploy … --program-id wallets/<program-keypair>.json`                                                             |
| Program id                  | `declare_id!()` in the Anchor crate         | `consts.rs` `ID` (selected by the `fresh-id` cargo feature)                                                                       |

**Toolchain note:** Pinocchio 0.11.2 needs rustc ≥ 1.89 → platform-tools
**v1.54** (`cargo build-sbf --tools-version v1.54`; any Agave 2.x/3.x CLI
fetches it on demand).

**Deleted** (don't reference these): `programs/onchain-academy/` (Anchor crate),
`onchain-academy/Anchor.toml`, `onchain-academy/tests/rust/`,
`onchain-academy/tests/onchain-academy.ts`, and the `build:anchor` /
`test:anchor` / `cu:anchor` package scripts. `scripts/update-program-id.sh` is
deprecated (it patched the deleted crate).

**CI** (`.github/workflows/ci.yml`, `fuzz.yml`): the `differential` job is now a
Pinocchio-only integration job, the `anchor-localnet` job was removed, and
`verifiable-build` uses `cargo build-sbf`. The `onchain-rust` host-test job and
`frontend`/`build-server`/`audit` jobs are unchanged.

---

## 5. The program `src/` layout (for program devs)

```
programs/onchain-academy-pinocchio/src/
  lib.rs          entrypoint + u64 discriminator dispatch + program-id self-check
  consts.rs       ids (fresh-id feature), PDA seeds, discriminators, limits, sizes
  errors.rs       AcademyError (0..=36 → 6000+n) + framework errors + pre-baked logs
  events.rs       18 emit_* fns (Borsh over stack buffers → sol_log_data)
  state/          per-account "offset view" parsers + in-place writers
  validation.rs   Cursor arg reader + account/PDA/signer/token checks
  cpi/            hand-rolled System / Token-2022 / mpl-core CPI byte builders
  instructions/   18 handlers, 1:1 with the IDL
```

The audit fixes ([PRE-DEPLOY-AUDIT.md](./PRE-DEPLOY-AUDIT.md)) live in
`state/{config,course,enrollment}.rs` (the generation field) + the
`create_course`/`enroll`/`complete_lesson`/`finalize_course`/`issue_credential`/
`upgrade_credential`/`close_enrollment`/`update_config` handlers. Regression
tests: `tests/differential/tests/fix_regressions.rs`.

---

## 6. Migration checklist

- [ ] **Frontend/client:** pull the updated IDL(s); add `6034/6035/6036` to your
      error map; make sure `create_course` passes `config` writable (auto if you
      derive metas from the IDL); surface the 3b behavior changes in the UI.
- [ ] **Backend:** if you rotate the backend signer, pass the old minter-role
      PDA (3c). Point at the deployed instance env (§1).
- [ ] **Program devs:** use `cargo build-sbf --tools-version v1.54` +
      `cargo test -p onchain-academy-pinocchio`; stop using `anchor build/test`.
- [ ] **CI/ops:** the pipeline is already updated; deploys use
      `solana program deploy` (§4) — see [DEPLOY-PROGRAM.md](./DEPLOY-PROGRAM.md)
      § "Fresh devnet instance".
- [ ] **Credential/achievement (mpl-core) leg:** not yet smoked on devnet — the
      `create-mock-track.ts` umi wallet needs funding (client tooling, tracked in
      DEPLOYMENT-LOG.md).
