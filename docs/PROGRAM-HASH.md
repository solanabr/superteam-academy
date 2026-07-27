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
00f677df54fbb40285acbb0e0c61be47c0cd2a1aae84fdf39f91f2a8b3beb28b  onchain_academy_pinocchio.so
```

| Field | Value |
| --- | --- |
| Artifact | `onchain_academy_pinocchio.so` |
| Size (bytes) | `210464` |
| SHA-256 | `00f677df54fbb40285acbb0e0c61be47c0cd2a1aae84fdf39f91f2a8b3beb28b` |
| Program ID | `7NeJaSRyb4Wxay3Tcd9bdpD7T3GWYUQSFyrhG8SgwE8V` |
| Solana | `3.1.10` |
| platform-tools | `v1.54` |
| Source commit | `766be344e71a3f2c71880f7f1ce3f31231c5711a` |
| Build date | `2026-07-27T18:11:44-03:00` |

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
