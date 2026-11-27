#!/usr/bin/env bash
set -euo pipefail

# Deploys the build server by submitting cloudbuild.yaml to Cloud Build. The
# build, the Cloud Run settings and the post-deploy check all live in that
# file; this script only picks the image tag.
#
# Usage: BUILD_SA=<account email> ./deploy.sh <PROJECT_ID> [TAG]
#
# BUILD_SA is the account the build runs as: the one setup-gcp.sh granted the
# deploy roles to and printed as "Cloud Build account". It has no default, so
# a build never runs as the project's default account by omission.
# TAG defaults to the current commit. Set REGION if setup-gcp.sh was run with
# one. The other substitutions (web app origin, min instances and its
# sign-off) keep the defaults in cloudbuild.yaml; to change one, run
# `gcloud builds submit` with --substitutions yourself.

PROJECT_ID="${1:?Usage: BUILD_SA=<account email> deploy.sh <PROJECT_ID> [TAG]}"
BUILD_SA="${BUILD_SA:?Set BUILD_SA to the account the build runs as (see setup-gcp.sh)}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
TAG="${2:-$(git -C "${REPO_ROOT}" rev-parse --short HEAD)}"

# The source is the repo root: its .gcloudignore uploads apps/build-server only.
exec gcloud builds submit "${REPO_ROOT}" \
  --project "${PROJECT_ID}" \
  --service-account "projects/${PROJECT_ID}/serviceAccounts/${BUILD_SA}" \
  --config "${REPO_ROOT}/apps/build-server/deploy/cloudbuild.yaml" \
  --substitutions "_TAG=${TAG}${REGION:+,_REGION=${REGION}}"
