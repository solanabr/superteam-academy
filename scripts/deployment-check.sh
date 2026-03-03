#!/bin/bash
#
# Solana Academy Devnet Deployment Guide
# 
# This script provides a checklist for deploying the Onchain Academy program to devnet.
# Prerequisites have been set up automatically.

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." &> /dev/null && pwd)"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     Solana Academy Program - Devnet Deployment Setup           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}=== Checking Prerequisites ===${NC}"
echo ""

# Check Rust
if ! command -v rustc &> /dev/null; then
    echo -e "${RED}✗ Rust not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Rust ${NC}($(rustc --version | awk '{print $2}'))"

# Check Solana CLI
if ! command -v solana &> /dev/null; then
    echo -e "${RED}✗ Solana CLI not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Solana CLI ${NC}($(solana --version | awk '{print $3}'))"

# Check wasm32 target
if ! rustup target list | grep -q "wasm32-unknown-unknown (installed)"; then
    echo -e "${YELLOW}! Installing wasm32 target...${NC}"
    rustup target add wasm32-unknown-unknown
fi
echo -e "${GREEN}✓ wasm32-unknown-unknown target${NC}"

# Check Anchor
if ! command -v anchor &> /dev/null; then
    if command -v avm &> /dev/null; then
        echo -e "${YELLOW}! Anchor CLI not active (avm found). Run: avm install <version> && avm use <version>${NC}"
    else
        echo -e "${RED}✗ Neither anchor nor avm found${NC}"
        exit 1
    fi
else
    if ANCHOR_VERSION=$(anchor --version 2>/dev/null); then
        echo -e "${GREEN}✓ Anchor ${NC}($ANCHOR_VERSION)"
    elif command -v avm &> /dev/null; then
        echo -e "${YELLOW}! Anchor binary exists but no active AVM version. Run: avm install <version> && avm use <version>${NC}"
    else
        echo -e "${RED}✗ Anchor is installed but not runnable${NC}"
        exit 1
    fi
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js ${NC}($(node --version))"

echo ""
echo -e "${BLUE}=== Keypairs Setup ===${NC}"
echo ""

if [ -f "$PROJECT_ROOT/wallets/signer.json" ]; then
    SIGNER_PUBKEY=$(cat "$PROJECT_ROOT/wallets/signer.json" | node -e "const pk = JSON.parse(require('fs').readFileSync(0, 'utf-8')); const { Keypair } = require('@solana/web3.js'); const kp = Keypair.fromSecretKey(new Uint8Array(pk)); console.log(kp.publicKey.toString())")
    echo -e "${GREEN}✓ Signer keypair${NC}"
    echo "  Public Key: $SIGNER_PUBKEY"
else
    echo -e "${RED}✗ Signer keypair not found${NC}"
    echo "  Run: node scripts/generate-keypairs.js"
    exit 1
fi

if [ -f "$PROJECT_ROOT/wallets/program-keypair.json" ]; then
    PROGRAM_PUBKEY=$(cat "$PROJECT_ROOT/wallets/program-keypair.json" | node -e "const pk = JSON.parse(require('fs').readFileSync(0, 'utf-8')); const { Keypair } = require('@solana/web3.js'); const kp = Keypair.fromSecretKey(new Uint8Array(pk)); console.log(kp.publicKey.toString())")
    echo -e "${GREEN}✓ Program keypair${NC}"
    echo "  Program ID: $PROGRAM_PUBKEY"
else
    echo -e "${RED}✗ Program keypair not found${NC}"
    exit 1
fi

if [ -f "$PROJECT_ROOT/wallets/xp-mint-keypair.json" ]; then
    XP_MINT_PUBKEY=$(cat "$PROJECT_ROOT/wallets/xp-mint-keypair.json" | node -e "const pk = JSON.parse(require('fs').readFileSync(0, 'utf-8')); const { Keypair } = require('@solana/web3.js'); const kp = Keypair.fromSecretKey(new Uint8Array(pk)); console.log(kp.publicKey.toString())")
    echo -e "${GREEN}✓ XP Mint keypair${NC}"
    echo "  XP Mint Address: $XP_MINT_PUBKEY"
else
    echo -e "${RED}✗ XP Mint keypair not found${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}=== Solana Configuration ===${NC}"
echo ""

CLUSTER=$(solana config get | grep "RPC URL" | awk -F': ' '{print $2}')
KEYPAIR=$(solana config get | grep "Keypair Path" | awk -F': ' '{print $2}')

if [[ "$CLUSTER" == *"devnet"* ]]; then
    echo -e "${GREEN}✓ Cluster configured for devnet${NC}"
else
    echo -e "${YELLOW}! Cluster is: $CLUSTER${NC}"
    echo "  Consider running: solana config set --url devnet"
fi

if [[ "$KEYPAIR" == *"signer.json"* ]]; then
    echo -e "${GREEN}✓ Keypair set to signer.json${NC}"
else
    echo -e "${YELLOW}! Keypair is: $KEYPAIR${NC}"
    echo "  Consider running: solana config set --keypair wallets/signer.json"
fi

# Check wallet balance
echo ""
echo -e "${BLUE}=== Wallet Status ===${NC}"
echo ""

BALANCE=$(solana balance "$SIGNER_PUBKEY" 2>/dev/null || echo "0")
echo "Wallet Balance: $BALANCE SOL"

if (( $(echo "$BALANCE < 2" | bc -l) )); then
    echo -e "${YELLOW}! Low balance. Need 3-5 SOL for deployment.${NC}"
    echo ""
    echo "Get devnet SOL:"
    echo "  1. CLI: solana airdrop 2 (run twice, may be rate-limited)"
    echo "  2. Web: https://faucet.solana.com"
else
    echo -e "${GREEN}✓ Sufficient balance for deployment${NC}"
fi

echo ""
echo -e "${BLUE}=== Configuration Summary ===${NC}"
echo ""

cat > /tmp/academy-deployment-config.env << EOF
NEXT_PUBLIC_ANCHOR_PROGRAM_ID=$PROGRAM_PUBKEY
NEXT_PUBLIC_XP_TOKEN_MINT=$XP_MINT_PUBKEY
NEXT_PUBLIC_BACKEND_SIGNER=$SIGNER_PUBKEY
NEXT_PUBLIC_CLUSTER=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
EOF

echo "Configuration saved to /tmp/academy-deployment-config.env"
echo ""
echo "Add these to your .env.local:"
echo "  NEXT_PUBLIC_ANCHOR_PROGRAM_ID=$PROGRAM_PUBKEY"
echo "  NEXT_PUBLIC_XP_TOKEN_MINT=$XP_MINT_PUBKEY"
echo "  NEXT_PUBLIC_BACKEND_SIGNER=$SIGNER_PUBKEY"
echo "  NEXT_PUBLIC_CLUSTER=devnet"
echo ""

echo -e "${GREEN}✓ Deployment setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Fix any compilation errors in programs/academy/src/"
echo "  2. Build program: cargo build --target wasm32-unknown-unknown --release"
echo "  3. Deploy: anchor deploy --provider.cluster devnet"
echo "  4. Initialize program: scripts/initialize.ts"
echo "  5. Add config to .env.local and test frontend"
