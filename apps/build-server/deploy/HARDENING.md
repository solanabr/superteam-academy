# Build server isolation hardening (P1-8)

The build server compiles **untrusted user-submitted Rust** with `cargo-build-sbf`.
The SBF target is the primary sandbox; everything below is layered defense so a
compromise during compilation cannot reach the network or escalate privileges.

## Threat model

- **Untrusted input:** arbitrary Rust source (proc-macros, `build.rs`) executes on
  the build host during compilation.
- **Goal:** that code must not (a) exfiltrate data / call out to the network, or
  (b) read operational telemetry, or (c) escalate to root.

## What is enforced in-repo (code + Dockerfile)

| Control                                           | Where                         | Effect                                                                                                                                                             |
| ------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/metrics` requires `X-API-Key`                   | `src/middlewares/auth.rs`     | Build telemetry (counts, durations, cache stats) is gated behind the API key. Only `/health` stays open, and it returns status/version/uptime only — no telemetry. |
| Source content filter (`BLOCKED_PATTERNS`)        | `src/build.rs`                | Defense-in-depth only — rejects `std::net`, `std::process`, `Command::new`, `include_*!`, etc. Easily bypassed (macros, obfuscation); **not** the primary control. |
| `cargo-build-sbf --offline`                       | `src/build.rs`                | Build performs no dependency fetches → a correct build needs **zero network egress**.                                                                              |
| Non-root user, fixed UID `10001`, `nologin` shell | `Dockerfile`                  | No root at runtime; satisfies `runAsNonRoot`.                                                                                                                      |
| setuid/setgid bits stripped image-wide            | `Dockerfile`                  | A read-only-rootfs + no-new-privileges sandbox can't be escalated via a stray privileged binary.                                                                   |
| Writes confined to `/tmp` (`BUILDS_DIR`)          | `src/config.rs`, `Dockerfile` | Enables a read-only root filesystem with only `/tmp` writable.                                                                                                     |

## What MUST be set on Cloud Run (deploy config — not enforceable in image alone)

### 1. Egress lockdown (the real "no network" control) — REQUIRED

There is **no single "disable egress" flag** on Cloud Run. Egress is blocked by
routing all traffic through a VPC and denying it with a firewall rule:

```bash
# One-time VPC + deny-egress firewall (run once; pick your own CIDR).
gcloud compute networks create build-server-vpc --subnet-mode=custom
gcloud compute networks subnets create build-server-subnet \
  --network=build-server-vpc --region=southamerica-east1 --range=10.8.0.0/28

# Deny ALL egress for the tagged service. (Default-deny; no allow rule = no egress.)
gcloud compute firewall-rules create build-server-deny-egress \
  --network=build-server-vpc --direction=EGRESS --action=DENY \
  --rules=all --destination-ranges=0.0.0.0/0 \
  --target-tags=build-server-no-egress --priority=1000
```

Then deploy with Direct VPC egress (already wired into `deploy.sh` / `cloudbuild.yaml`
when the VPC vars are provided):

```bash
VPC_NETWORK=build-server-vpc VPC_SUBNET=build-server-subnet \
ACADEMY_API_KEY=<key> ./deploy.sh <PROJECT_ID> southamerica-east1
```

Exact flags applied:

```
--network=build-server-vpc \
--subnet=build-server-subnet \
--network-tags=build-server-no-egress \
--vpc-egress=all-traffic
```

`--vpc-egress=all-traffic` forces every outbound packet through the VPC, where the
deny-egress firewall drops it. Without this, untrusted compilation can reach the
internet even though `--offline` means a legitimate build never needs to.

### 2. Read-only root filesystem + dropped capabilities

Cloud Run (fully managed) runs containers under a **fixed, locked-down contract**:
no privileged mode, no host mounts, a minimal Linux capability set, and
`no-new-privileges` are enforced by the platform. Arbitrary `--cap-drop` /
`securityContext` flags (as on GKE / Knative) are **not exposed** as `gcloud run`
flags, so they cannot live in this repo's deploy config.

What the image contributes (and what to verify): the server only writes to `/tmp`,
runs as non-root UID 10001, and has all setuid bits stripped — so the platform's
read-only-rootfs behavior holds without breaking builds. If migrating to GKE/Knative,
add: `readOnlyRootFilesystem: true`, `allowPrivilegeEscalation: false`,
`capabilities: { drop: ["ALL"] }`, and a writable `emptyDir` volume at `/tmp`.

### 3. (Optional, stronger) Gate ingress at the platform edge

Currently the service uses `--no-invoker-iam-check` (open ingress) because the
caller — the Vercel API route (`apps/web/src/app/api/build-program`,
`.../api/deploy/[uuid]`) — authenticates with `X-API-Key`, **not** GCP IAM. The
in-process API-key gate is therefore the active access control.

To additionally require IAM auth at the edge (so unauthenticated requests get a
403 before reaching the app), replace `--no-invoker-iam-check` with
`--no-allow-unauthenticated` **and** have the caller present a Google-signed ID
token (the Vercel route would need a service-account credential / Workload Identity
Federation to mint one). This is a caller-side change and is intentionally **not**
applied here to avoid breaking the cross-cloud Vercel → Cloud Run call.

## Verification

- `/metrics` without the key → `401 Unauthorized` (was `200`).
- `/metrics` with `X-API-Key: <key>` → `200` + Prometheus body.
- After the egress firewall is applied: a build whose source attempts a network
  call still cannot reach it (and a normal `--offline` build is unaffected).
