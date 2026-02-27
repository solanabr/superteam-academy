#!/bin/bash
# Update program ID across the project
# Usage: ./scripts/update-program-id.sh <NEW_PROGRAM_ID>

if [ -z "$1" ]; then
  echo "Usage: $0 <NEW_PROGRAM_ID>"
  exit 1
fi

NEW_ID=$1
OLD_ID=$(grep -oP 'onchain_academy = "\K[^"]+' onchain-academy/Anchor.toml)

echo "Updating program ID from $OLD_ID to $NEW_ID"

# Update Anchor.toml
sed -i "s/$OLD_ID/$NEW_ID/g" onchain-academy/Anchor.toml

# Update lib.rs
sed -i "s/$OLD_ID/$NEW_ID/g" onchain-academy/programs/onchain-academy/src/lib.rs

echo "Done. Run 'anchor build' to verify."
