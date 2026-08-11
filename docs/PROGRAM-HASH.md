<!--
  CI-MAINTAINED — DO NOT EDIT BY HAND. Published by .github/workflows/ci.yml
  (publish-hash job) on every push to main whose program hash changed.
  The human-readable spec + reproduction guide lives on main at
  docs/PROGRAM-HASH.md.
-->

# Verifiable build — program hash (feeds #140 / G-3)

SHA-256 of the toolchain-reproducible `onchain_academy_pinocchio.so`,
published by CI so the deployed bytes can be independently verified.

```
b199a9c7b89a37c45e2ddc44c011e870392abbedaa343edee67b1080cf56a81f  onchain_academy_pinocchio.so
```

| Field | Value |
| --- | --- |
| Artifact | `onchain_academy_pinocchio.so` |
| Size (bytes) | `210480` |
| SHA-256 | `b199a9c7b89a37c45e2ddc44c011e870392abbedaa343edee67b1080cf56a81f` |
| Program ID | `7NeJaSRyb4Wxay3Tcd9bdpD7T3GWYUQSFyrhG8SgwE8V` |
| Solana | `3.1.10` |
| platform-tools | `v1.54` |
| Source commit | `1ad6ae4df1cf215df7fca8a88a24e3e9756b38ee` |
| Build date | `2026-08-11T16:05:45-03:00` |

## Reproduce

```bash
cargo build-sbf --manifest-path onchain-academy/programs/onchain-academy-pinocchio/Cargo.toml --tools-version v1.54
sha256sum onchain-academy/target/deploy/onchain_academy_pinocchio.so
```

## Verify against the deployed program

```bash
solana program dump 7NeJaSRyb4Wxay3Tcd9bdpD7T3GWYUQSFyrhG8SgwE8V onchain.so
sha256sum onchain.so   # must equal the SHA-256 above
```
