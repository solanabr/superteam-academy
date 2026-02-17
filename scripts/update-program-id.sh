#!/bin/bash
# Reads pubkey from wallets/program-keypair.json and updates declare_id + Anchor.toml
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

KEYPAIR_PATH="$ROOT_DIR/wallets/program-keypair.json"

if [ ! -f "$KEYPAIR_PATH" ]; then
  echo "Error: $KEYPAIR_PATH not found"
  echo "Place your vanity keypair at wallets/program-keypair.json first"
  exit 1
fi

PUBKEY=$(solana-keygen pubkey "$KEYPAIR_PATH")
echo "Program ID: $PUBKEY"

# Update lib.rs
LIB_RS="$ROOT_DIR/onchain-academy/programs/onchain-academy/src/lib.rs"
sed -i '' "s/declare_id!(\"[^\"]*\")/declare_id!(\"$PUBKEY\")/" "$LIB_RS"
echo "Updated $LIB_RS"

# Update Anchor.toml
ANCHOR_TOML="$ROOT_DIR/onchain-academy/Anchor.toml"
sed -i '' "s/superteam_academy = \"[^\"]*\"/superteam_academy = \"$PUBKEY\"/" "$ANCHOR_TOML"
echo "Updated $ANCHOR_TOML"

echo "Done. Run 'anchor build' to rebuild with the new program ID."
