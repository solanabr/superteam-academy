#!/bin/bash

# Extract public keys from keypairs
echo "Extracting public keys from wallets..."

cd "$(dirname "$0")/.."

# Get signer pubkey
SIGNER_PUBKEY=$(/Users/saif/.cargo/bin/solana address -json wallets/signer.json 2>/dev/null | grep -o '"address":"[^"]*' | cut -d'"' -f4)
PROGRAM_PUBKEY=$(/Users/saif/.cargo/bin/solana address -json wallets/program-keypair.json 2>/dev/null | grep -o '"address":"[^"]*' | cut -d'"' -f4)
XP_MINT_PUBKEY=$(/Users/saif/.cargo/bin/solana address -json wallets/xp-mint-keypair.json 2>/dev/null | grep -o '"address":"[^"]*' | cut -d'"' -f4)

if [ -z "$SIGNER_PUBKEY" ]; then
    # Fallback: use solana-keygen
    SIGNER_PUBKEY=$(solana-keygen pubkey wallets/signer.json 2>/dev/null || echo "")
fi

echo "======================================"
echo "Solana Academy - Deployment Keys"
echo "======================================"
echo ""
echo "NEXT_PUBLIC_ANCHOR_PROGRAM_ID=$PROGRAM_PUBKEY"
echo "NEXT_PUBLIC_XP_TOKEN_MINT=$XP_MINT_PUBKEY"
echo "NEXT_PUBLIC_BACKEND_SIGNER=$SIGNER_PUBKEY"
echo "NEXT_PUBLIC_CLUSTER=devnet"
echo "NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com"
echo ""
echo "Add these to .env.local"
