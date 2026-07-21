#!/usr/bin/env bash
# Builds the `fresh-id` deploy artifact (self-owned devnet instance) at
# target/deploy/onchain_academy_pinocchio_fresh.so, then rebuilds the default
# flavor so the shared artifact path keeps holding the upstream-id parity
# build. See docs/DEPLOY-PROGRAM.md § "Fresh devnet instance".
set -euo pipefail
cd "$(dirname "$0")/.."

MANIFEST=programs/onchain-academy-pinocchio/Cargo.toml
OUT=target/deploy/onchain_academy_pinocchio.so
FRESH_OUT=target/deploy/onchain_academy_pinocchio_fresh.so
KEYPAIR=wallets/pinocchio-program-devnet-v2.json

if [[ -f "$KEYPAIR" ]]; then
  echo "fresh-id program id: $(solana-keygen pubkey "$KEYPAIR")"
else
  echo "warn: $KEYPAIR not found — the deploy step needs it:" >&2
  echo "  solana-keygen new --no-bip39-passphrase -o $KEYPAIR" >&2
  echo "  (its pubkey must match consts.rs ID under --features fresh-id)" >&2
fi

# Consistency gate: ID / CONFIG_PDA / CONFIG_BUMP must satisfy
# find_program_address(["config"], ID) for this flavor.
cargo test -p onchain-academy-pinocchio --features fresh-id --test discriminator_parity

cargo build-sbf --manifest-path "$MANIFEST" --tools-version v1.54 --features fresh-id
cp "$OUT" "$FRESH_OUT"

# Restore the default (upstream-id) flavor in the shared artifact path.
cargo build-sbf --manifest-path "$MANIFEST" --tools-version v1.54

echo
echo "deploy artifact (fresh-id): $FRESH_OUT"
shasum -a 256 "$FRESH_OUT"
echo "parity artifact (upstream id, restored): $OUT"
shasum -a 256 "$OUT"
