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
e613276c4c155ce6974e44e6a3a032a3b68ec024365fd6c8fad810949664a83c  onchain_academy_pinocchio.so
```

| Field | Value |
| --- | --- |
| Artifact | `onchain_academy_pinocchio.so` |
| Size (bytes) | `215040` |
| SHA-256 | `e613276c4c155ce6974e44e6a3a032a3b68ec024365fd6c8fad810949664a83c` |
| Program ID | `7NeJaSRyb4Wxay3Tcd9bdpD7T3GWYUQSFyrhG8SgwE8V` |
| Solana | `3.1.10` |
| platform-tools | `v1.54` |
| Source commit | `607f8eaddb4a6ee81a031e384543b7635e0925ac` |
| Build date | `2026-10-21T18:53:28-03:00` |

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
