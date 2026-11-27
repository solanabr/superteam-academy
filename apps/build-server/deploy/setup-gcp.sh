#!/usr/bin/env bash
set -euo pipefail

# One-time GCP setup for the build server. Safe to run again.
#
# Usage: ./setup-gcp.sh <PROJECT_ID> [REGION]
#
# Creates what cloudbuild.yaml expects to exist: the image repository, the
# runtime service account, the API key secret, and the VPC, subnet and
# firewall rule the service's egress goes through.
#
# The API key is read from stdin when the secret has no enabled version, so it
# never sits in a file, an argument or shell history:
#
#   openssl rand -hex 32 | ./setup-gcp.sh <PROJECT_ID>
#
# Without a pipe the script prompts for it. Optional environment:
#   BUILD_SA      the account Cloud Build runs as (default: the Compute Engine
#                 default service account)
#   SUBNET_RANGE  IPv4 range for a new subnet (default: 10.8.0.0/26)

PROJECT_ID="${1:?Usage: setup-gcp.sh <PROJECT_ID> [REGION]}"
REGION="${2:-southamerica-east1}"

# cloudbuild.yaml and HARDENING.md use these names.
REPO_NAME="academy-images"
SA_NAME="academy-build-sa"
SECRET_NAME="academy-build-api-key"
VPC_NETWORK="build-server-vpc"
VPC_SUBNET="build-server-subnet"
VPC_EGRESS_TAG="build-server-no-egress"
FIREWALL_RULE="build-server-deny-egress"
SUBNET_RANGE="${SUBNET_RANGE:-10.8.0.0/26}"

SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# Every gcloud call names the project and gets no stdin, so the key piped to
# this script is read only by the `read` in the secret section.
gc() { gcloud --project "${PROJECT_ID}" --quiet "$@" </dev/null; }
exists() { gc "$@" >/dev/null 2>&1; }

echo "==> Enabling APIs"
gc services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  compute.googleapis.com

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
# project has them bound, then show whatever is left.
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
  echo "WARNING: ${SA_EMAIL} has project-level roles; it should have none:" >&2
  echo "${PROJECT_ROLES}" >&2
fi

echo "==> Cloud Build account"
PROJECT_NUMBER="$(gc projects describe "${PROJECT_ID}" --format='value(projectNumber)')"
BUILD_SA="${BUILD_SA:-${PROJECT_NUMBER}-compute@developer.gserviceaccount.com}"
# Push images.
gc projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${BUILD_SA}" \
  --role="roles/artifactregistry.writer" \
  --condition=None >/dev/null
# Deploy revisions that run as the runtime account, and as no other account.
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

ENABLED_VERSION="$(gc secrets versions list "${SECRET_NAME}" \
  --filter='state=ENABLED' --limit=1 --format='value(name)')"
if [[ -n "${ENABLED_VERSION}" ]]; then
  echo "    has an enabled version; left as is (to rotate, see HARDENING.md)"
else
  if [[ -t 0 ]]; then
    read -rs -p "    API key for ${SECRET_NAME} (input hidden): " API_KEY
    echo
  else
    IFS= read -r API_KEY || true
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
# Denies all egress from anything carrying the tag. The VPC has no allow rule
# above it, so the tagged service has no outbound network.
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
gc compute firewall-rules describe "${FIREWALL_RULE}" \
  --format='yaml(name,network,direction,priority,denied,destinationRanges,targetTags,disabled)'

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
  2. Deploy: ALLOWED_ORIGIN=https://<web app host> REGION=${REGION} ./deploy.sh ${PROJECT_ID}
EOF
