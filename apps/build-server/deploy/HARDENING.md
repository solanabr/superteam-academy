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

`deploy/cloudbuild.yaml` is the only deploy path. It states the settings below in one
`gcloud run deploy`. `deploy/setup-gcp.sh` creates the resources once. The names are fixed in
`cloudbuild.yaml`, `setup-gcp.sh` and `check-service.mjs`; none is a substitution.

| Resource                | Name                       |
| ----------------------- | -------------------------- |
| Runtime service account | `academy-build-sa`         |
| Secret Manager secret   | `academy-build-api-key`    |
| VPC network             | `build-server-vpc`         |
| Subnet                  | `build-server-subnet`      |
| Network tag             | `build-server-no-egress`   |
| Firewall rule           | `build-server-deny-egress` |

### What the deploy checks

The first step validates the substitutions. After the deploy, the last two steps read the
service and the project's VPC firewall rules back (`read-live.sh`) and fail the build
(`check-service.mjs verify`) unless all of this holds:

- One container, running the image reference (repository and tag) this build pushed.
- 4 CPU, 8 GiB, request timeout 300 s, concurrency 2, max instances 2.
- Min instances equal to `_MIN_INSTANCES`, no service-level minimum, and scaling mode not
  manual.
- CPU allocated only while a request is served.
- The service account is `academy-build-sa`.
- VPC egress is `all-traffic`, through one interface on `build-server-vpc` /
  `build-server-subnet` that carries the tag `build-server-no-egress` and no other tag.
- The literal environment is exactly what the deploy sets, `ALLOWED_ORIGIN` and
  `BUILD_TIMEOUT_SECS=240` included: nothing missing, nothing extra.
- `ACADEMY_API_KEY` is a reference to `academy-build-api-key:latest`, not a literal.
- The latest revision is ready and takes 100% of traffic, and no traffic entry, tagged or
  not, names another revision.
- On `build-server-vpc`, an enabled EGRESS DENY rule for all protocols to `0.0.0.0/0` targets
  the tag, and no enabled EGRESS ALLOW rule that targets the tag, targets any service
  account, or has no target at all sits at the same or a higher priority.

It checks nothing else. In particular it does not read the ingress setting, the invoker IAM
setting, CPU boost, the image digest, or firewall policies attached above the VPC
(organization, folder or network firewall policies). The firewall check covers IPv4 only and
assumes an IPv4-only subnet, which is what `setup-gcp.sh` creates: a dual-stack subnet would
also need an IPv6 deny rule, and nothing here looks for one.

The image is matched by tag, so give each build its own: `deploy.sh` passes the short commit
SHA as `_TAG`, and a trigger should too (`docs/DEPLOYMENT.md`). A revision then names the
commit its image was built from.

`deploy/__tests__/cloudbuild.test.mjs` pins the whole of `cloudbuild.yaml`: the top-level
keys, the options, the timeout, every step with its keys, arguments and environment, every
deploy flag, and every substitution with its default. Apart from comments, nothing in that
file can be added, repeated, removed or changed without that test failing, and the file may
hold only printable ASCII and line feeds. The scripts the
steps run have their own tests in the same directory.

### 1. Egress lockdown (required)

Cloud Run has no "disable egress" flag. Egress is blocked by sending all of it through a VPC
and denying it there with a firewall rule on the service's network tag. `setup-gcp.sh` runs
the equivalent of:

```bash
gcloud compute networks create build-server-vpc --subnet-mode=custom
gcloud compute networks subnets create build-server-subnet \
  --network=build-server-vpc --region=southamerica-east1 --range=10.8.0.0/26

# Deny all egress for the tag.
gcloud compute firewall-rules create build-server-deny-egress \
  --network=build-server-vpc --direction=EGRESS --action=DENY \
  --rules=all --destination-ranges=0.0.0.0/0 \
  --target-tags=build-server-no-egress --priority=1000
```

If the rule already exists, `setup-gcp.sh` compares it with that shape and stops on a
difference. It also stops if an allow rule could let the tag out ahead of it.

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
is published without them.

Direct VPC egress can delay outbound connections by a minute or more after an instance
starts. The server makes no outbound connections (`cargo-build-sbf` runs `--offline`), so
this does not affect serving.

### 2. Runtime identity

The service runs as `academy-build-sa`, which has no project-level roles: `setup-gcp.sh`
stops if it finds one. Its only grant is `roles/secretmanager.secretAccessor` on the one
secret below.

The account Cloud Build runs as gets `roles/iam.serviceAccountUser` on `academy-build-sa`,
not on the project. Whether it can also deploy as other accounts depends on what else that
account holds, and a default service account can hold broad roles. Use a dedicated build
account that holds only the grants below. Give the same `BUILD_SA` to `setup-gcp.sh` and to
`deploy.sh`: `deploy.sh` has no default and runs the build as that account.

| Needed for                              | Grant                                                                        |
| --------------------------------------- | ---------------------------------------------------------------------------- |
| Pushing the image                       | `roles/artifactregistry.writer` (set by `setup-gcp.sh`)                      |
| Deploying as the runtime account        | `roles/iam.serviceAccountUser` on `academy-build-sa` (set by `setup-gcp.sh`) |
| Deploying and reading back the service  | `roles/run.admin`                                                            |
| Reading the firewall rules (last steps) | `compute.firewalls.list`, for example through `roles/compute.networkViewer`  |
| Build logs                              | `roles/logging.logWriter`                                                    |

### 3. API key in Secret Manager

`ACADEMY_API_KEY` reaches the container as a reference to the latest version of
`academy-build-api-key` (`--set-secrets`). The value is not in the deploy config, in a
substitution, or in the service definition. Cloud Run resolves it when an instance starts.

`setup-gcp.sh` stores the first key and takes none after that. When a service that held the
key as a literal variable moves to the secret, do not copy the old value into the secret:
earlier revisions and build records keep a literal in their configuration. Generate a new key
with the procedure below.

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

- Every deploy runs the checks listed under "What the deploy checks". To run them by hand,
  from the repo root:

  ```bash
  gcloud run services describe academy-build-server --region southamerica-east1 \
    --format=json > service.json
  gcloud compute firewall-rules list --format=json > firewall-rules.json

  PROJECT_ID=<PROJECT_ID> REGION=southamerica-east1 REPO=academy-images \
    SERVICE=academy-build-server TAG=<DEPLOYED_TAG> \
    ALLOWED_ORIGIN=https://www.st.academy MIN_INSTANCES=0 \
    node apps/build-server/deploy/check-service.mjs verify \
    service.json firewall-rules.json
  ```

- `node --test apps/build-server/deploy/__tests__/*.test.mjs` (also run in CI) tests those
  checks against fixtures and checks that `cloudbuild.yaml` still declares the settings.
- `/metrics` without the key returns `401 Unauthorized`; with `X-API-Key: <key>` it returns
  `200` and a Prometheus body.
- A build whose source attempts a network call cannot reach a host outside the instance, and
  a normal `--offline` build is unaffected. Firewall rules do not filter `169.254.169.254`,
  so the metadata server still answers and DNS names still resolve.
