#!/usr/bin/env bash
# Active-slot installer: everything downstream (Trident, the CU harness) loads
# target/deploy/onchain_academy.so. This script installs the pinocchio build
# into that slot.
#
#   select-program.sh   copy the pinocchio build into the slot, print its sha256
#
# Run after `pnpm build:pinocchio`.
set -euo pipefail

DEPLOY_DIR="$(cd "$(dirname "$0")/.." && pwd)/target/deploy"
SLOT="$DEPLOY_DIR/onchain_academy.so"
PINO_SO="$DEPLOY_DIR/onchain_academy_pinocchio.so"

if [ ! -f "$PINO_SO" ]; then
  echo "error: $PINO_SO missing — run 'pnpm build:pinocchio' first" >&2
  exit 1
fi

cp "$PINO_SO" "$SLOT"
shasum -a 256 "$SLOT"
