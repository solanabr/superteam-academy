#!/bin/bash

# Solana Academy - Simple Testing Guide
# Run from project root: bash scripts/test-deployment.sh

cd "$(pwd)" || exit 1

echo ""
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║        SOLANA ACADEMY - DEPLOYMENT TESTING                         ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

echo "✓ Prerequisites:"
rustc --version
solana --version
node --version
echo ""

echo "✓ Keypairs Generated:"
ls -lh wallets/
echo ""

echo "✓ Configuration:"
grep "NEXT_PUBLIC_ANCHOR_PROGRAM_ID" .env.local
echo ""

SIGNER=$(cat wallets/signer.json | node -e "const pk = JSON.parse(require('fs').readFileSync(0, 'utf-8')); const { Keypair } = require('@solana/web3.js'); console.log(Keypair.fromSecretKey(new Uint8Array(pk)).publicKey.toString())")
PROGRAM=$(cat wallets/program-keypair.json | node -e "const pk = JSON.parse(require('fs').readFileSync(0, 'utf-8')); const { Keypair } = require('@solana/web3.js'); console.log(Keypair.fromSecretKey(new Uint8Array(pk)).publicKey.toString())")
XPMINT=$(cat wallets/xp-mint-keypair.json | node -e "const pk = JSON.parse(require('fs').readFileSync(0, 'utf-8')); const { Keypair } = require('@solana/web3.js'); console.log(Keypair.fromSecretKey(new Uint8Array(pk)).publicKey.toString())")

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║        YOUR DEPLOYMENT ADDRESSES                                   ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""
echo "Authority/Signer: $SIGNER"
echo "Program ID:       $PROGRAM"
echo "XP Mint:          $XPMINT"
echo ""

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║        STEP 1: FIX & BUILD                                         ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""
echo "Run:"
echo ""
echo "  node scripts/fix-compilation.js"
echo "  cd programs/academy"
echo "  cargo build --target wasm32-unknown-unknown --release"
echo ""
echo "Expected: Build finishes with 'Finished release' message"
echo ""

read -p "Continue to Step 2? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Proceeding to Step 2..."
else
    echo "Exiting. Run the build commands above first."
    exit 0
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║        STEP 2: CHECK WALLET BALANCE                                ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

BALANCE=$(solana balance "$SIGNER" 2>/dev/null | awk '{print $1}')
echo "Current balance: $BALANCE SOL"
echo ""

if (( $(echo "$BALANCE >= 3" | bc -l) )); then
    echo "✓ Sufficient balance for deployment"
else
    echo "! Low balance. Need 3-5 SOL"
    echo ""
    echo "Get SOL from:"
    echo "  1. Airdrop: solana airdrop 2 $SIGNER (run 2-3 times)"
    echo "  2. Web faucet: https://faucet.solana.com"
    echo ""
    
    read -p "Attempt airdrop? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        solana airdrop 2 "$SIGNER"
        sleep 2
        NEW_BALANCE=$(solana balance "$SIGNER" 2>/dev/null | awk '{print $1}')
        echo "New balance: $NEW_BALANCE SOL"
    fi
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║        STEP 3: DEPLOY PROGRAM                                      ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""
echo "Run:"
echo ""
echo "  anchor deploy --program-name academy \\"
echo "    --provider.cluster devnet \\"
echo "    --program-keypair wallets/program-keypair.json"
echo ""
echo "This takes 1-2 minutes. Expected output:"
echo "  Program Id: 2JEFfbRwBqZB3nf5JkTGsievs43CDuGettfzBWzf94Mw"
echo "  Deploy success"
echo ""

read -p "Ready to deploy? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    anchor deploy \
        --program-name academy \
        --provider.cluster devnet \
        --program-keypair wallets/program-keypair.json
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║        STEP 4: INITIALIZE PROGRAM                                  ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""
echo "Create initialize script using template:"
echo ""
echo "  cp scripts/initialize-template.ts scripts/initialize.ts"
echo ""
echo "Then run:"
echo ""
echo "  export ANCHOR_PROVIDER_URL=https://api.devnet.solana.com"
echo "  export ANCHOR_WALLET=wallets/signer.json"
echo "  npx ts-node scripts/initialize.ts"
echo ""

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║        STEP 5: VERIFY DEPLOYMENT                                   ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""
echo "Check on Solana Explorer:"
echo ""
echo "  https://explorer.solana.com/address/$PROGRAM?cluster=devnet"
echo ""
echo "Or via CLI:"
echo ""
echo "  solana program show $PROGRAM --url devnet"
echo ""

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║        STEP 6: TEST FRONTEND                                       ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""
echo "Once initialized:"
echo ""
echo "  1. Start frontend:"
echo "     npm run dev"
echo ""
echo "  2. Go to: http://localhost:3000"
echo ""
echo "  3. Connect wallet and test:"
echo "     - Enroll in a course"
echo "     - Backend completes a lesson"
echo "     - Verify XP increased"
echo ""

echo "✓ Testing guide complete!"
echo ""
echo "For more details, see:"
echo "  - DEPLOYMENT_GUIDE.md"
echo "  - DEVNET_DEPLOYMENT.md"
echo "  - DEPLOYMENT_CHECKLIST.md"
echo ""
