#!/usr/bin/env bash
set -euo pipefail

# First-time GCP setup for Superteam Academy Build Server
# Usage: ./setup-gcp.sh <PROJECT_ID> [REGION]

PROJECT_ID="${1:?Usage: setup-gcp.sh <PROJECT_ID> [REGION]}"
REGION="${2:-southamerica-east1}"
REPO_NAME="academy-images"
SA_NAME="academy-build-sa"

echo "==> Setting project to ${PROJECT_ID}"
gcloud config set project "${PROJECT_ID}"

echo "==> Enabling required APIs"
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com

echo "==> Creating Artifact Registry repository"
gcloud artifacts repositories create "${REPO_NAME}" \
  --repository-format=docker \
  --location="${REGION}" \
  --description="Superteam Academy Docker images" \
  2>/dev/null || echo "Repository already exists"

echo "==> Creating service account"
gcloud iam service-accounts create "${SA_NAME}" \
  --display-name="Superteam Academy Build Server" \
  2>/dev/null || echo "Service account already exists"

SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "==> Granting service account permissions"
for ROLE in roles/run.invoker roles/iam.serviceAccountUser; do
  gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="${ROLE}" \
    --quiet
done

# Regional Cloud Build uses the Compute Engine default SA for pushing images
PROJECT_NUMBER=$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

echo "==> Granting Compute Engine SA artifact registry access"
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${COMPUTE_SA}" \
  --role="roles/artifactregistry.writer" \
  --quiet

echo ""
echo "Setup complete!"
echo "  Artifact Registry: ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}"
echo "  Service Account:   ${SA_EMAIL}"
echo "  Compute Engine SA: ${COMPUTE_SA} (for Cloud Build image push)"
echo ""
echo "Next steps:"
echo "  1. Generate an API key: openssl rand -hex 32"
echo "  2. Deploy: ACADEMY_API_KEY=<key> ./deploy.sh ${PROJECT_ID} ${REGION}"
