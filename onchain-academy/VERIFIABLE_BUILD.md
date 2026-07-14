# Verifiable Build Record (#140)

**Date:** 2026-07-13
**Program:** `onchain-academy`
**Program ID:** `7NeJaSRyb4Wxay3Tcd9bdpD7T3GWYUQSFyrhG8SgwE8V`

## Status: verifiable build NOT reproducible in this local environment (documented fallback)

`anchor build --verifiable` requires Docker to pull the `solanafoundation/anchor:v0.31.1`
image (Anchor CLI derives the tag as `v` + `anchor_version` from `Anchor.toml`) and run
the build inside it. In this local environment, Docker Desktop's daemon is reachable
(`docker info` succeeds), but the daemon cannot reach the Docker Hub registry: three
independent pull attempts — `solanafoundation/anchor:0.31.1`, `solanafoundation/anchor:v0.31.1`
(via `anchor build --verifiable` itself), and a control pull of the trivial public
`hello-world` image — all stalled indefinitely past the first line of output
(`Using default tag: latest`) and never progressed to `Pulling from ...` or an explicit
error, even after several minutes. This points to registry egress being blocked/unavailable
from this sandbox, not a problem with the `onchain-academy` build itself. No `.so` was
produced under `target/verifiable/`.

**This must be re-run in a clean CI/deploy environment with Docker Hub egress** to
produce the authoritative, reproducible verifiable hash:

```bash
cd onchain-academy
anchor build --verifiable
sha256sum target/verifiable/onchain_academy.so
```

(`solana-verify` was not installed and was not used here, per instructions — the
canonical on-chain verification flow is `solana-verify build` / `solana-verify verify-from-repo`
against the same Docker image; that step is deferred to whoever runs the command above
with registry access.)

## Recorded instead: non-reproducible local build hash

The sha256 below is from a **plain `anchor build`** (no Docker, no verifiable pipeline) run
locally against this branch's source. It is **not** a verifiable-build hash — it depends on
this machine's toolchain and is not guaranteed to reproduce elsewhere. It is recorded only
as a known-good reference point for this specific checkout, not as proof of reproducibility.

- **Binary:** `target/deploy/onchain_academy.so`
- **SHA256:** `152758ffa896300a8eff28c2552473c9dec99dfed93773999bec8f0a025a8446`
- **Build command:** `anchor build` (from `onchain-academy/`)

## Toolchain (this local build)

- `anchor-cli 0.31.1`
- `solana-cli 3.0.1 (src:77d31b70; feat:806317788, client:Agave)`
- `rustc 1.92.0 (ded5c06cf 2025-12-08)`
- `cargo 1.92.0 (344c4567c 2025-10-21)`
- Docker: 20.10.12 (daemon reachable; registry egress unavailable — see above)

## Toolchain pinned for the authoritative verifiable build (CI)

- Anchor Docker image: `solanafoundation/anchor:v0.31.1` (per `Anchor.toml`
  `anchor_version = "0.31.1"`)
- Command: `anchor build --verifiable` (from `onchain-academy/`)
- Output path: `target/verifiable/onchain_academy.so`
