#!/bin/bash

# Solana Academy - Quick Deployment Guide
# This script summarizes the deployment setup

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  Solana Academy Program - Devnet Deployment Setup Complete     ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "📋 DEPLOYMENT SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "✅ Generated Keys:"
echo "   Signer/Authority: 6HJo2VY5NgAeTWcNq22qU6EKfsdcUPCEmC1fu1e3hvQ1"
echo "   Program ID:      2JEFfbRwBqZB3nf5JkTGsievs43CDuGettfzBWzf94Mw"
echo "   XP Mint:         BB6urY3kS15YzkM3MqRYGWZDKpB56YijHFz4q55dwXZ4"
echo ""

echo "✅ Configuration Updated:"
echo "   • Anchor.toml - cluster set to devnet"
echo "   • Program ID injected into lib.rs"
echo "   • .env.local - added program addresses"
echo ""

echo "⚠️  NEXT STEPS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "1️⃣  FIX COMPILATION ERRORS"
echo "   The program has struct name mismatches. Two ways to fix:"
echo ""
echo "   Option A - Run auto-fix:"
echo "   $ node scripts/fix-compilation.js"
echo ""
echo "   Option B - Manual fix:"
echo "   • Open: programs/academy/src/instructions/close_enrollment.rs"
echo "   • Change: pub struct CloseEnrollmentAccounts"
echo "   • To:     pub struct CloseEnrollment"
echo ""

echo "2️⃣  BUILD THE PROGRAM"
echo "   $ cd programs/academy"
echo "   $ cargo build --target wasm32-unknown-unknown --release"
echo ""

echo "3️⃣  FUND YOUR WALLET"
echo "   $ solana airdrop 2 wallets/signer.json  # Run twice"
echo "   Or: https://faucet.solana.com"
echo ""

echo "4️⃣  DEPLOY TO DEVNET"
echo "   $ anchor deploy --program-name academy \\"
echo "       --provider.cluster devnet \\"
echo "       --program-keypair wallets/program-keypair.json"
echo ""

echo "5️⃣  INITIALIZE PROGRAM"
echo "   $ export ANCHOR_PROVIDER_URL=https://api.devnet.solana.com"
echo "   $ export ANCHOR_WALLET=wallets/signer.json"
echo "   $ npx ts-node scripts/initialize.ts"
echo ""

echo "6️⃣  VERIFY DEPLOYMENT"
echo "   $ solana program show 2JEFfbRwBqZB3nf5JkTGsievs43CDuGettfzBWzf94Mw"
echo ""

echo "📝 REFERENCE DOCUMENTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Read DEVNET_DEPLOYMENT.md for full instructions and troubleshooting"
echo ""

echo "🗂️  GENERATED FILES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   wallets/"
echo "   ├── signer.json              (Authority/payer - 🔐 SECURE)"
echo "   ├── program-keypair.json     (Program ID - 🔐 SECURE)"
echo "   └── xp-mint-keypair.json     (XP mint - 🔐 SECURE)"
echo ""
echo "   scripts/"
echo "   ├── generate-keypairs.js     (Generated keypair script)"
echo "   ├── update-program-id.js     (Program ID updater)"
echo "   ├── fix-compilation.js       (Compilation error fixer)"
echo "   └── show-keys.sh             (Display key addresses)"
echo ""

echo "⚙️  CONFIGURATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat "$PROJECT_ROOT/.env.local" | grep "^NEXT_PUBLIC_ANCHOR_PROGRAM_ID\|^NEXT_PUBLIC_XP_TOKEN_MINT\|^NEXT_PUBLIC_BACKEND_SIGNER\|^NEXT_PUBLIC_CLUSTER\|^NEXT_PUBLIC_SOLANA_RPC_URL" | sed 's/^/   /'
echo ""

echo "✨ Ready for deployment! Check DEVNET_DEPLOYMENT.md for details."
echo ""
