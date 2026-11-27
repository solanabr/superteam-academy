#!/usr/bin/env bash
set -euo pipefail

# One-time GCP setup for the build server. Safe to run again.
#
# Usage: ./setup-gcp.sh <PROJECT_ID> [REGION]
#
# Creates what cloudbuild.yaml expects to exist: the image repository, the
# runtime service account, the API key secret, and the VPC, subnet and
# firewall rule the service's egress goes through. Needs gcloud and node.
#
# The first API key is read from stdin, so it never sits in a file, an
# argument or shell history:
#
#   openssl rand -hex 32 | ./setup-gcp.sh <PROJECT_ID>
#
# Without a pipe the script prompts for it. Once the secret has a version the
# script takes no key: piping one is an error, and replacing the key is the
# rotation procedure in HARDENING.md.
#
# Optional environment:
#   BUILD_SA      the account Cloud Build runs as. Prefer a dedicated one
#                 (default: the Compute Engine default service account)
#   SUBNET_RANGE  IPv4 range for a new subnet (default: 10.8.0.0/26)

PROJECT_ID="${1:?Usage: setup-gcp.sh <PROJECT_ID> [REGION]}"
REGION="${2:-southamerica-east1}"

# cloudbuild.yaml, check-service.mjs and HARDENING.md use these names.
REPO_NAME="academy-images"
SA_NAME="academy-build-sa"
SECRET_NAME="academy-build-api-key"
VPC_NETWORK="build-server-vpc"
VPC_SUBNET="build-server-subnet"
VPC_EGRESS_TAG="build-server-no-egress"
FIREWALL_RULE="build-server-deny-egress"
SUBNET_RANGE="${SUBNET_RANGE:-10.8.0.0/26}"

SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

command -v node >/dev/null || {
  echo "ERROR: node is required (it checks the firewall rule)." >&2
  exit 1
}

# A key piped in is read once, here. Every gcloud call below gets no stdin.
PIPED_KEY=""
if [[ ! -t 0 ]]; then
  IFS= read -r -t 10 PIPED_KEY || true
fi

gc() { gcloud --project "${PROJECT_ID}" --quiet "$@" </dev/null; }
exists() { gc "$@" >/dev/null 2>&1; }

echo "==> Enabling APIs"
gc services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  compute.googleapis.com

# Decide what to do with the key before changing anything else.
ENABLED_VERSION=""
if exists secrets describe "${SECRET_NAME}"; then
  ENABLED_VERSION="$(gc secrets versions list "${SECRET_NAME}" \
    --filter='state=ENABLED' --limit=1 --format='value(name)')"
fi
if [[ -n "${ENABLED_VERSION}" && -n "${PIPED_KEY}" ]]; then
  echo "ERROR: ${SECRET_NAME} already has an enabled version. The key on stdin was not stored." >&2
  echo "       To replace the key, follow \"Rotating the API key\" in deploy/HARDENING.md." >&2
  echo "       To re-run setup, run it without piping a key." >&2
  exit 1
fi

echo "==> Artifact Registry repository ${REPO_NAME}"
if ! exists artifacts repositories describe "${REPO_NAME}" --location "${REGION}"; then
  gc artifacts repositories create "${REPO_NAME}" \
    --repository-format=docker \
    --location="${REGION}" \
    --description="Superteam Academy Docker images"
fi

echo "==> Runtime service account ${SA_EMAIL}"
if ! exists iam service-accounts describe "${SA_EMAIL}"; then
  gc iam service-accounts create "${SA_NAME}" \
    --display-name="Superteam Academy Build Server"
fi
# The runtime account holds no project-level roles. Remove these two if the
# project has them bound, then stop if any role is left.
for ROLE in roles/run.invoker roles/iam.serviceAccountUser; do
  gc projects remove-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="${ROLE}" \
    --condition=None >/dev/null 2>&1 || true
done
PROJECT_ROLES="$(gc projects get-iam-policy "${PROJECT_ID}" \
  --flatten='bindings[].members' \
  --filter="bindings.members:serviceAccount:${SA_EMAIL}" \
  --format='value(bindings.role)')"
if [[ -n "${PROJECT_ROLES}" ]]; then
  echo "ERROR: ${SA_EMAIL} must hold no project-level roles, but has:" >&2
  echo "${PROJECT_ROLES}" >&2
  echo "       Remove each with: gcloud projects remove-iam-policy-binding ${PROJECT_ID} \\" >&2
  echo "         --member=serviceAccount:${SA_EMAIL} --role=<ROLE>" >&2
  echo "       then run this script again." >&2
  exit 1
fi

echo "==> Cloud Build account"
PROJECT_NUMBER="$(gc projects describe "${PROJECT_ID}" --format='value(projectNumber)')"
BUILD_SA="${BUILD_SA:-${PROJECT_NUMBER}-compute@developer.gserviceaccount.com}"
# Push images.
gc projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${BUILD_SA}" \
  --role="roles/artifactregistry.writer" \
  --condition=None >/dev/null
# Deploy revisions that run as the runtime account.
gc iam service-accounts add-iam-policy-binding "${SA_EMAIL}" \
  --member="serviceAccount:${BUILD_SA}" \
  --role="roles/iam.serviceAccountUser" >/dev/null

echo "==> Secret ${SECRET_NAME}"
if ! exists secrets describe "${SECRET_NAME}"; then
  gc secrets create "${SECRET_NAME}" --replication-policy=automatic
fi
gc secrets add-iam-policy-binding "${SECRET_NAME}" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor" >/dev/null

if [[ -n "${ENABLED_VERSION}" ]]; then
  echo "    has an enabled version; left as is"
else
  API_KEY="${PIPED_KEY}"
  if [[ -z "${API_KEY}" && -t 0 ]]; then
    read -rs -p "    API key for ${SECRET_NAME} (input hidden): " API_KEY
    echo
  fi
  if [[ "${#API_KEY}" -lt 32 ]]; then
    echo "ERROR: the API key must be at least 32 characters." >&2
    echo "       Generate one with: openssl rand -hex 32 | $0 ${PROJECT_ID} ${REGION}" >&2
    exit 1
  fi
  # printf is a shell builtin, so the value is not in any process's arguments.
  printf '%s' "${API_KEY}" |
    gcloud --project "${PROJECT_ID}" --quiet secrets versions add "${SECRET_NAME}" --data-file=- >/dev/null
  unset API_KEY
  echo "    added the first version"
fi
unset PIPED_KEY

echo "==> VPC ${VPC_NETWORK} / ${VPC_SUBNET}"
if ! exists compute networks describe "${VPC_NETWORK}"; then
  gc compute networks create "${VPC_NETWORK}" --subnet-mode=custom
fi
if exists compute networks subnets describe "${VPC_SUBNET}" --region "${REGION}"; then
  # Direct VPC egress needs a /26 or larger.
  CURRENT_RANGE="$(gc compute networks subnets describe "${VPC_SUBNET}" \
    --region "${REGION}" --format='value(ipCidrRange)')"
  if [[ "${CURRENT_RANGE##*/}" -gt 26 ]]; then
    echo "ERROR: subnet ${VPC_SUBNET} is ${CURRENT_RANGE}; Direct VPC egress needs /26 or larger." >&2
    echo "       gcloud compute networks subnets expand-ip-range ${VPC_SUBNET} --region ${REGION} --prefix-length 26" >&2
    exit 1
  fi
else
  gc compute networks subnets create "${VPC_SUBNET}" \
    --network="${VPC_NETWORK}" \
    --region="${REGION}" \
    --range="${SUBNET_RANGE}"
fi

echo "==> Firewall rule ${FIREWALL_RULE}"
# Denies all egress from anything carrying the tag.
if ! exists compute firewall-rules describe "${FIREWALL_RULE}"; then
  gc compute firewall-rules create "${FIREWALL_RULE}" \
    --network="${VPC_NETWORK}" \
    --direction=EGRESS \
    --action=DENY \
    --rules=all \
    --destination-ranges=0.0.0.0/0 \
    --target-tags="${VPC_EGRESS_TAG}" \
    --priority=1000
fi
# New or already there, the rule must have that shape, and no allow rule may
# sit at the same or a higher priority. The deploy runs the same check.
if ! gc compute firewall-rules list --format=json |
  node "${DEPLOY_DIR}/check-service.mjs" firewall -; then
  echo "ERROR: fix or delete the rules named above, then run this script again." >&2
  exit 1
fi

cat <<EOF

Setup complete.
  Artifact Registry:   ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}
  Runtime account:     ${SA_EMAIL}
  Cloud Build account: ${BUILD_SA}
  Secret:              ${SECRET_NAME}
  VPC / subnet / tag:  ${VPC_NETWORK} / ${VPC_SUBNET} / ${VPC_EGRESS_TAG}
  Firewall rule:       ${FIREWALL_RULE}

Next:
  1. Give the web app the same key as BUILD_SERVER_API_KEY (docs/DEPLOYMENT.md).
  2. Deploy: REGION=${REGION} ./deploy.sh ${PROJECT_ID}
EOF
