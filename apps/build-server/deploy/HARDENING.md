# Build server isolation hardening

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

## What the deploy sets on Cloud Run

`deploy/cloudbuild.yaml` is the only deploy path. It states every setting below in one
`gcloud run deploy`, and its last step reads the service back and fails the build if any of
them is missing (`deploy/check-service.mjs`). `deploy/setup-gcp.sh` creates the resources once.

| Resource                | Name                       |
| ----------------------- | -------------------------- |
| Runtime service account | `academy-build-sa`         |
| Secret Manager secret   | `academy-build-api-key`    |
| VPC network             | `build-server-vpc`         |
| Subnet                  | `build-server-subnet`      |
| Network tag             | `build-server-no-egress`   |
| Firewall rule           | `build-server-deny-egress` |

### 1. Egress lockdown (required)

Cloud Run has no "disable egress" flag. Egress is blocked by sending all of it through a VPC
and denying it there with a firewall rule on the service's network tag. `setup-gcp.sh` runs
the equivalent of:

```bash
gcloud compute networks create build-server-vpc --subnet-mode=custom
gcloud compute networks subnets create build-server-subnet \
  --network=build-server-vpc --region=southamerica-east1 --range=10.8.0.0/26

# Deny all egress for the tag. With no allow rule above it, the tagged service has none.
gcloud compute firewall-rules create build-server-deny-egress \
  --network=build-server-vpc --direction=EGRESS --action=DENY \
  --rules=all --destination-ranges=0.0.0.0/0 \
  --target-tags=build-server-no-egress --priority=1000
```

The subnet must be `/26` or larger: Direct VPC egress does not accept a smaller one. To grow
an existing subnet, use `gcloud compute networks subnets expand-ip-range`.

The deploy then attaches the service with Direct VPC egress:

```
--network=build-server-vpc
--subnet=build-server-subnet
--network-tags=build-server-no-egress
--vpc-egress=all-traffic
```

`--vpc-egress=all-traffic` sends every outbound packet through the VPC, where the firewall
rule drops it. The four flags are in the same `gcloud run deploy` as the image, so no revision
is published without them, and the build fails before deploying if a VPC substitution is
empty. A tag that no firewall rule targets would attach the VPC without denying anything, so
keep the tag and the rule's `--target-tags` identical.

Direct VPC egress can delay outbound connections by a minute or more after an instance
starts. The server makes no outbound connections (`cargo-build-sbf` runs `--offline`), so
this does not affect serving.

### 2. Runtime identity

The service runs as `academy-build-sa`, which has no project-level roles. Its only grant is
`roles/secretmanager.secretAccessor` on the one secret below. The account Cloud Build runs as
has `roles/iam.serviceAccountUser` on `academy-build-sa` alone, so it can deploy revisions
that run as this account and as no other.

### 3. API key in Secret Manager

`ACADEMY_API_KEY` reaches the container as a reference to the latest version of
`academy-build-api-key` (`--set-secrets`). The value is not in the deploy config, in a
substitution, or in the service definition. Cloud Run resolves it when an instance starts.

#### Rotating the API key

The server accepts one key, and an instance reads the latest version when it starts. From
step 1 until step 3 is done, builds from the web app can fail with `401`, so do the steps back
to back.

1. Add a new version. The value goes from the generator to Secret Manager without being
   printed. `tr` drops the trailing newline: the server compares the header to the exact
   secret payload.

   ```bash
   openssl rand -hex 32 | tr -d '\n' \
     | gcloud secrets versions add academy-build-api-key --data-file=-
   ```

2. Deploy through `cloudbuild.yaml` (`deploy.sh`). The new revision replaces every running
   instance, so all of them hold the new version.
3. Set the web app's `BUILD_SERVER_API_KEY` to the same value in its hosting environment and
   redeploy the web app. Read the value with
   `gcloud secrets versions access latest --secret=academy-build-api-key`, piped to where it
   is needed rather than to the terminal.
4. Check that a build from the web app succeeds.
5. Disable the previous version:

   ```bash
   gcloud secrets versions list academy-build-api-key
   gcloud secrets versions disable <OLD_VERSION> --secret=academy-build-api-key
   ```

   Destroy it once nothing has needed it back.

### 4. Scaling

The service scales to zero (`--min-instances 0`, `--max-instances 2`) with CPU allocated only
while a request is served (`--cpu-throttling`, plus `--cpu-boost` for startup). A deploy with
`_MIN_INSTANCES` above 0 fails unless `_MIN_INSTANCES_SIGNOFF` says who approved it and when;
the value is kept in the build record.

### 5. Read-only root filesystem and dropped capabilities

Cloud Run (fully managed) runs containers under a fixed contract: no privileged mode, no host
mounts, a minimal Linux capability set, and `no-new-privileges`. `--cap-drop` and
`securityContext` settings (as on GKE or Knative) are not exposed as `gcloud run` flags, so
they cannot live in this deploy config.

What the image contributes: the server only writes to `/tmp`, runs as non-root UID 10001, and
has all setuid bits stripped. If migrating to GKE or Knative, add
`readOnlyRootFilesystem: true`, `allowPrivilegeEscalation: false`,
`capabilities: { drop: ["ALL"] }`, and a writable `emptyDir` volume at `/tmp`.

### 6. Ingress

The service is deployed with `--no-invoker-iam-check`: the caller, the web app's API routes
(`apps/web/src/app/api/build-program`, `.../api/deploy/[uuid]`), authenticates with
`X-API-Key`, not GCP IAM, and the server checks the key on every route except `/health`.

To also require IAM at the edge, replace `--no-invoker-iam-check` with
`--no-allow-unauthenticated` and have the caller present a Google-signed ID token. That needs
a service-account credential or Workload Identity Federation on the caller's side.

## Verification

- The last step of every deploy checks the live service: min instances, CPU throttling,
  service account, VPC egress and network tag, and that `ACADEMY_API_KEY` is a secret
  reference. Run it by hand with:

  ```bash
  gcloud run services describe academy-build-server --region southamerica-east1 --format=json \
    | EXPECT_SERVICE_ACCOUNT=academy-build-sa@<PROJECT_ID>.iam.gserviceaccount.com \
      EXPECT_SECRET=academy-build-api-key EXPECT_MIN_INSTANCES=0 \
      EXPECT_NETWORK=build-server-vpc EXPECT_SUBNET=build-server-subnet \
      EXPECT_NETWORK_TAG=build-server-no-egress \
      node apps/build-server/deploy/check-service.mjs
  ```

- `node --test apps/build-server/deploy/__tests__/*.test.mjs` (also run in CI) checks that
  `cloudbuild.yaml` still declares these settings, and tests `preflight.sh` and
  `check-service.mjs`.
- `/metrics` without the key returns `401 Unauthorized`; with `X-API-Key: <key>` it returns
  `200` and a Prometheus body.
- A build whose source attempts a network call cannot reach it, and a normal `--offline`
  build is unaffected.
