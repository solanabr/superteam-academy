#!/usr/bin/env bash
set -euo pipefail

# Deploy Solarium Build Server to GCP Cloud Run
# Usage: ./deploy.sh <PROJECT_ID> [REGION] [TAG]

PROJECT_ID="${1:?Usage: deploy.sh <PROJECT_ID> [REGION] [TAG]}"
REGION="${2:-southamerica-east1}"
TAG="${3:-latest}"
REPO_NAME="solarium-images"
SERVICE_NAME="solarium-build-server"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${SERVICE_NAME}:${TAG}"

: "${SOLARIUM_API_KEY:?Set SOLARIUM_API_KEY before deploying}"

echo "==> Building Docker image"
docker build -t "${IMAGE}" .

echo "==> Pushing to Artifact Registry"
docker push "${IMAGE}"

echo "==> Deploying to Cloud Run"
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
  --set-env-vars "SOLARIUM_API_KEY=${SOLARIUM_API_KEY},ALLOWED_ORIGIN=${ALLOWED_ORIGIN:-https://solarium.courses},MAX_CONCURRENT_BUILDS=2,BUILD_TIMEOUT_SECS=300,CACHE_TTL_SECS=1800,LOG_FORMAT=json,RUST_LOG=info" \
  --no-invoker-iam-check

SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
  --region "${REGION}" \
  --format="value(status.url)")

echo ""
echo "Deployed successfully!"
echo "  URL: ${SERVICE_URL}"
echo "  Health: curl ${SERVICE_URL}/health"
