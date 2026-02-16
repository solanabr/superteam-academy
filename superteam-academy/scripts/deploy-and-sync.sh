#!/usr/bin/env bash
set -euo pipefail

CLUSTER="${1:-devnet}"
RPC_URL="${2:-https://api.devnet.solana.com}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="${ROOT_DIR}/../superteam-frontend"
IDL_PATH="${ROOT_DIR}/target/idl/superteam_academy.json"
FRONTEND_GENERATED_DIR="${FRONTEND_DIR}/lib/generated"
FRONTEND_MANIFEST="${FRONTEND_GENERATED_DIR}/academy-program.ts"
FRONTEND_IDL="${FRONTEND_GENERATED_DIR}/superteam_academy.idl.json"

export PATH="${HOME}/.cargo/bin:${HOME}/.local/share/solana/install/active_release/bin:${PATH}"

echo "==> Building program"
cd "${ROOT_DIR}"
anchor build

echo "==> Deploying program to ${CLUSTER}"
anchor deploy --provider.cluster "${CLUSTER}"

echo "==> Initializing config PDA (idempotent)"
export ANCHOR_PROVIDER_URL="${RPC_URL}"
export ANCHOR_WALLET="${HOME}/.config/solana/id.json"
npx ts-node ./scripts/init-config.ts

if [[ ! -f "${IDL_PATH}" ]]; then
  echo "IDL not found at ${IDL_PATH}" >&2
  exit 1
fi

PROGRAM_ID="$(node -e "const fs=require('fs');const idl=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));process.stdout.write(idl.address);" "${IDL_PATH}")"

mkdir -p "${FRONTEND_GENERATED_DIR}"
cp "${IDL_PATH}" "${FRONTEND_IDL}"

cat > "${FRONTEND_MANIFEST}" <<EOF
export const ACADEMY_PROGRAM_ID = "${PROGRAM_ID}" as const
export const ACADEMY_CLUSTER = "${CLUSTER}" as const
export const ACADEMY_RPC_URL = "${RPC_URL}" as const
EOF

echo "==> Synced frontend artifacts:"
echo "    - ${FRONTEND_IDL}"
echo "    - ${FRONTEND_MANIFEST}"
echo "==> Program deployed: ${PROGRAM_ID}"
