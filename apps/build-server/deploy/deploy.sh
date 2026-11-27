#!/usr/bin/env bash
set -euo pipefail

# Deploys the build server by submitting cloudbuild.yaml to Cloud Build. The
# build, the Cloud Run settings and the post-deploy check all live in that
# file; this script only picks the image tag.
#
# Usage: ./deploy.sh <PROJECT_ID> [TAG]
#
# TAG defaults to the current commit. Set REGION if setup-gcp.sh was run with
# one. The other substitutions (web app origin, min instances and its
# sign-off) keep the defaults in cloudbuild.yaml; to change one, run
# `gcloud builds submit` with --substitutions yourself.

PROJECT_ID="${1:?Usage: deploy.sh <PROJECT_ID> [TAG]}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
TAG="${2:-$(git -C "${REPO_ROOT}" rev-parse --short HEAD)}"

# The source is the repo root: its .gcloudignore uploads apps/build-server only.
exec gcloud builds submit "${REPO_ROOT}" \
  --project "${PROJECT_ID}" \
  --config "${REPO_ROOT}/apps/build-server/deploy/cloudbuild.yaml" \
  --substitutions "_TAG=${TAG}${REGION:+,_REGION=${REGION}}"
