#!/usr/bin/env bash
# First step of cloudbuild.yaml: validates the substitutions before anything is
# built or deployed. It reads them from the environment, so it runs the same
# under Cloud Build and in deploy/__tests__/preflight.test.mjs.
set -euo pipefail

failed=0
err() {
  echo "ERROR: $*" >&2
  failed=1
}

min="${MIN_INSTANCES-}"
signoff="${MIN_INSTANCES_SIGNOFF-}"
count_re='^(0|[1-9][0-9]*)$'
if ! [[ "${min}" =~ ${count_re} ]]; then
  err "_MIN_INSTANCES must be a whole number (got '${min}')."
elif [[ "${min}" != "0" ]]; then
  if [[ -z "${signoff//[[:space:]]/}" ]]; then
    err "_MIN_INSTANCES=${min} keeps instances running between builds." \
      "Set _MIN_INSTANCES_SIGNOFF to who approved it and when."
  else
    echo "min instances ${min}, signed off: ${signoff}"
  fi
fi

# An empty value here would deploy without the VPC, or with a tag that no
# firewall rule targets.
name_re='^[^[:space:],]+$'
for var in VPC_NETWORK VPC_SUBNET VPC_EGRESS_TAG; do
  value="${!var-}"
  if ! [[ "${value}" =~ ${name_re} ]]; then
    err "_${var} must be set to a resource name (got '${value}')." \
      "See deploy/HARDENING.md."
  fi
done

# The server matches the Origin header exactly, so this is scheme and host
# only: no path, no trailing slash.
origin_re='^https://[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?(:[0-9]+)?$'
if ! [[ "${ALLOWED_ORIGIN-}" =~ ${origin_re} ]]; then
  err "_ALLOWED_ORIGIN must be the web app's origin, like" \
    "https://academy.example.com (got '${ALLOWED_ORIGIN-}')."
fi

if [[ "${failed}" -ne 0 ]]; then
  exit 1
fi
echo "preflight ok"
