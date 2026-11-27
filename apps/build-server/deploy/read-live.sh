#!/usr/bin/env bash
# Second-to-last step of cloudbuild.yaml: reads the deployed service and the
# project's VPC firewall rules into files for `check-service.mjs verify`.
# Read-only. SERVICE and REGION come from the environment; preflight has
# already checked their shape.
set -euo pipefail

: "${SERVICE:?}" "${REGION:?}" "${OUT_DIR:?}"

gcloud run services describe "${SERVICE}" --region "${REGION}" --format=json \
  >"${OUT_DIR}/service.json"

# Every rule in the project; the check keeps the ones on the build server's
# network. Needs compute.firewalls.list.
gcloud compute firewall-rules list --format=json \
  >"${OUT_DIR}/firewall-rules.json"
