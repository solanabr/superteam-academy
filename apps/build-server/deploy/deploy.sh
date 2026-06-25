#!/usr/bin/env bash
set -euo pipefail

# Deploy Superteam Academy Build Server to GCP Cloud Run
# Usage: ./deploy.sh <PROJECT_ID> [REGION] [TAG]

PROJECT_ID="${1:?Usage: deploy.sh <PROJECT_ID> [REGION] [TAG]}"
REGION="${2:-southamerica-east1}"
TAG="${3:-latest}"
REPO_NAME="academy-images"
SERVICE_NAME="academy-build-server"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${SERVICE_NAME}:${TAG}"

: "${ACADEMY_API_KEY:?Set ACADEMY_API_KEY before deploying}"

echo "==> Building Docker image"
docker build -t "${IMAGE}" .

echo "==> Pushing to Artifact Registry"
docker push "${IMAGE}"

echo "==> Deploying to Cloud Run"
# NOTE: ingress stays open because the caller (Vercel API route) authenticates with
# X-API-Key, not GCP IAM. To gate ingress at the platform edge instead, swap
# --no-invoker-iam-check for --no-allow-unauthenticated and have the caller mint a
# Google ID token (see deploy/HARDENING.md).
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE}" \
  --region "${REGION}" \
  --platform managed \
  --cpu 4 \
  --memory 8Gi \
  --timeout 300 \
  --concurrency 2 \
  --min-instances 1 \
  --max-instances 3 \
  --set-env-vars "ACADEMY_API_KEY=${ACADEMY_API_KEY},ALLOWED_ORIGIN=${ALLOWED_ORIGIN:-https://solarium.courses},MAX_CONCURRENT_BUILDS=2,BUILD_TIMEOUT_SECS=300,CACHE_TTL_SECS=1800,LOG_FORMAT=json,RUST_LOG=info" \
  --no-invoker-iam-check

# Egress lockdown (P1-8): route ALL outbound traffic through a VPC so untrusted
# user-code compilation cannot reach the network. Requires a VPC + subnet and a
# firewall rule that DENIES egress for ${VPC_EGRESS_TAG:-build-server-no-egress}
# (see deploy/HARDENING.md). cargo-build-sbf runs --offline, so builds need no egress.
if [[ -n "${VPC_NETWORK:-}" && -n "${VPC_SUBNET:-}" ]]; then
  # Fail loud if the egress tag is empty: passing --network-tags "" attaches the
  # service to the VPC but matches NO deny-egress firewall rule, so egress would
  # be silently UN-restricted while the deploy looks hardened. Never deploy that way.
  EGRESS_TAG="${VPC_EGRESS_TAG:-build-server-no-egress}"
  if [[ -z "${EGRESS_TAG}" ]]; then
    echo "ERROR: VPC_NETWORK/VPC_SUBNET set but VPC_EGRESS_TAG is empty. An empty" >&2
    echo "       --network-tags attaches the VPC without matching any deny-egress" >&2
    echo "       firewall rule, leaving egress UNrestricted. Refusing to deploy." >&2
    echo "       Set VPC_EGRESS_TAG (see deploy/HARDENING.md)." >&2
    exit 1
  fi
  echo "==> Restricting egress via Direct VPC (all-traffic) on ${VPC_NETWORK}/${VPC_SUBNET}"
  gcloud run services update "${SERVICE_NAME}" \
    --region "${REGION}" \
    --network "${VPC_NETWORK}" \
    --subnet "${VPC_SUBNET}" \
    --network-tags "${EGRESS_TAG}" \
    --vpc-egress all-traffic
else
  echo "WARNING: VPC_NETWORK/VPC_SUBNET unset — egress is NOT restricted. Untrusted"
  echo "         compilation can reach the network. See deploy/HARDENING.md."
fi

SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
  --region "${REGION}" \
  --format="value(status.url)")

echo ""
echo "Deployed successfully!"
echo "  URL: ${SERVICE_URL}"
echo "  Health: curl ${SERVICE_URL}/health"
