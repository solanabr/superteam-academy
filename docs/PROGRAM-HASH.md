<!--
  CI-MAINTAINED — DO NOT EDIT BY HAND.
  The live, machine-updated copy of this file is published by the `publish-hash`
  job in .github/workflows/ci.yml to the dedicated `program-hash` branch, once per
  push to `main` (only when the program hash actually changes). See "Where the live
  record lives" below.
  This copy on `main` is the human-readable spec + entry point; it is intentionally
  NOT updated by CI, because branch protection on `main` ("Require a pull request
  before merging") forbids the github-actions bot from pushing to `main`.
-->

# Verifiable build — program hash (feeds #140 / G-3)

This file records the SHA-256 of the toolchain-reproducible build of the on-chain
program `onchain_academy_pinocchio.so`, so that anyone can independently verify the
bytes deployed on-chain match the audited source at a known commit.

The **build** is the guarantee; the **hash** is the comparable artifact.

## Current record

> **PENDING FIRST CI RUN.** No canonical hash has been published yet. This seed
> was committed with a placeholder rather than a locally-produced hash on purpose:
> a hash is only meaningful if it comes from the _pinned_ toolchain the CI job uses
> (Solana `3.1.10` + platform-tools `v1.54` on Ubuntu). A build from any other
> toolchain would not match the deployed program and must not be recorded here.
> The first push to `main` after this lands publishes the real values to the
> `program-hash` branch (see below).

<!-- The line below is the machine-readable checksum, in `sha256sum` format
     (`<64-hex>  <filename>`). CI regenerates it; tooling greps `^[0-9a-f]{64}`. -->

```
0000000000000000000000000000000000000000000000000000000000000000  onchain_academy_pinocchio.so
```

| Field          | Value                                          |
| -------------- | ---------------------------------------------- |
| Artifact       | `onchain_academy_pinocchio.so`                 |
| Size (bytes)   | _pending first CI run_                         |
| SHA-256        | _pending first CI run_                         |
| Program ID     | `7NeJaSRyb4Wxay3Tcd9bdpD7T3GWYUQSFyrhG8SgwE8V` |
| Solana         | `3.1.10`                                       |
| platform-tools | `v1.54`                                        |
| Source commit  | _pending first CI run_                         |
| Build date     | _pending first CI run_                         |

## Where the live record lives

Branch protection on `main` requires every change to go through a pull request, so
CI cannot commit an updated hash back to `main`. Instead, the `publish-hash` CI job
(a separate job from the build, holding the only `contents: write` token and running
only on trusted main) publishes the live record to a dedicated **`program-hash`**
branch (unprotected,
CI-owned — analogous to a `gh-pages` branch). Every distinct program hash ever built
from `main` is one commit on that branch, giving a tamper-evident audit trail.

Read the current published record:

```bash
git fetch origin program-hash
git show origin/program-hash:docs/PROGRAM-HASH.md
```

Or via the raw URL:
`https://raw.githubusercontent.com/solanabr/superteam-academy/program-hash/docs/PROGRAM-HASH.md`

## Reproduce the build

The hash is reproducible from source with the pinned toolchain the CI job uses:

```bash
# Solana CLI 3.1.10 (Agave); platform-tools v1.54 is fetched by --tools-version.
cargo build-sbf \
  --manifest-path onchain-academy/programs/onchain-academy-pinocchio/Cargo.toml \
  --tools-version v1.54
sha256sum onchain-academy/target/deploy/onchain_academy_pinocchio.so
# must equal the SHA-256 recorded on the program-hash branch
```

## Verify against the deployed program

```bash
solana program dump 7NeJaSRyb4Wxay3Tcd9bdpD7T3GWYUQSFyrhG8SgwE8V onchain.so
sha256sum onchain.so   # must equal the recorded SHA-256
```
