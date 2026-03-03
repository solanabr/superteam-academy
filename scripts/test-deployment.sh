#!/bin/bash

# Solana Academy - Comprehensive Testing Guide
# This script you through testing your deployment step-by-step

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

print_header() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC} $1"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    echo -e "${CYAN}[$((STEP)).$1]${NC} $2"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}!${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

STEP=0

print_header "SOLANA ACADEMY - DEPLOYMENT TESTING GUIDE"

echo "This guide will test each phase of your deployment:"
echo "  1. Build Verification"
echo "  2. Devnet Configuration"
echo "  3. Wallet Funding"
echo "  4. Program Deployment"
echo "  5. Program Initialization"
echo "  6. Integration Testing"
echo ""

# Phase 1: Build Verification
print_header "PHASE 1: BUILD VERIFICATION"

((STEP++))
print_step "1" "Fixing compilation errors"

if cd "$PROJECT_ROOT" && node "./scripts/fix-compilation.js" 2>&1; then
    print_success "Compilation fixes applied"
else
    print_warning "Fix script had issues - check manually"
fi

((STEP++))
print_step "2" "Building program to WebAssembly"
echo ""
echo "This may take 1-3 minutes. Building..."
echo ""

if cd "$PROJECT_ROOT/programs/academy" && cargo build --target wasm32-unknown-unknown --release 2>&1 | tail -20; then
    print_success "Program built successfully!"
    BUILD_SUCCESS=true
else
    print_error "Build failed - check errors above"
    BUILD_SUCCESS=false
fi

if [ "$BUILD_SUCCESS" = true ]; then
    print_success "WebAssembly artifact created at:"
    echo "  target/wasm32-unknown-unknown/release/academy.so"
fi

# Phase 2: Configuration Verification
print_header "PHASE 2: CONFIGURATION VERIFICATION"

cd "$PROJECT_ROOT"

((STEP++))
print_step "1" "Verifying Solana CLI configuration"

CURRENT_CLUSTER=$(solana config get | grep "RPC URL" | awk -F': ' '{print $2}')
if [[ "$CURRENT_CLUSTER" == *"devnet"* ]]; then
    print_success "Cluster configured for devnet"
else
    print_warning "Cluster is: $CURRENT_CLUSTER"
    print_info "Configuring for devnet..."
    solana config set --url devnet
    print_success "Updated to devnet"
fi

((STEP++))
print_step "2" "Verifying wallet configuration"

CURRENT_KEYPAIR=$(solana config get | grep "Keypair Path" | awk -F': ' '{print $2}')
if [[ "$CURRENT_KEYPAIR" == *"signer.json"* ]]; then
    print_success "Keypair configured correctly"
else
    print_info "Updating keypair..."
    solana config set --keypair "$PROJECT_ROOT/wallets/signer.json"
    print_success "Keypair updated"
fi

((STEP++))
print_step "3" "Displaying deployment addresses"

echo ""
SIGNER_PUBKEY=$(node -e "const pk = require('fs').readFileSync('$PROJECT_ROOT/wallets/signer.json', 'utf-8'); const kp = require('@solana/web3.js').Keypair.fromSecretKey(new Uint8Array(JSON.parse(pk))); console.log(kp.publicKey.toString())")
PROGRAM_PUBKEY=$(node -e "const pk = require('fs').readFileSync('$PROJECT_ROOT/wallets/program-keypair.json', 'utf-8'); const kp = require('@solana/web3.js').Keypair.fromSecretKey(new Uint8Array(JSON.parse(pk))); console.log(kp.publicKey.toString())")
XP_MINT_PUBKEY=$(node -e "const pk = require('fs').readFileSync('$PROJECT_ROOT/wallets/xp-mint-keypair.json', 'utf-8'); const kp = require('@solana/web3.js').Keypair.fromSecretKey(new Uint8Array(JSON.parse(pk))); console.log(kp.publicKey.toString())")

echo "  Signer/Authority: $SIGNER_PUBKEY"
echo "  Program ID:      $PROGRAM_PUBKEY"
echo "  XP Mint:         $XP_MINT_PUBKEY"
echo ""

# Phase 3: Wallet Funding
print_header "PHASE 3: WALLET FUNDING"

((STEP++))
print_step "1" "Checking wallet balance"

BALANCE=$(solana balance "$SIGNER_PUBKEY" 2>/dev/null | awk '{print $1}')
echo "  Current balance: $BALANCE SOL"
echo ""

if (( $(echo "$BALANCE >= 3" | bc -l) )); then
    print_success "Sufficient balance for deployment ($BALANCE SOL)"
else
    print_warning "Low balance. Need 3-5 SOL for smooth deployment"
    echo ""
    print_info "Getting devnet SOL. Attempting airdrop..."
    
    if solana airdrop 2 "$SIGNER_PUBKEY" 2>&1 | tail -3; then
        sleep 2
        NEW_BALANCE=$(solana balance "$SIGNER_PUBKEY" 2>/dev/null | awk '{print $1}')
        echo "  New balance: $NEW_BALANCE SOL"
        
        if (( $(echo "$NEW_BALANCE >= 3" | bc -l) )); then
            print_success "Sufficient balance"
        else
            print_warning "Still low after airdrop"
            echo ""
            echo "  Get more SOL from: https://faucet.solana.com"
        fi
    else
        print_warning "Airdrop may have failed or been rate-limited"
        echo ""
        echo "  Use web faucet: https://faucet.solana.com"
        echo "  Wallet: $SIGNER_PUBKEY"
    fi
fi

# Phase 4: Deployment
print_header "PHASE 4: PROGRAM DEPLOYMENT"

((STEP++))
print_step "1" "Deploying program to devnet"
echo ""
echo "This will take 1-2 minutes..."
echo ""

if anchor deploy \
    --program-name academy \
    --provider.cluster devnet \
    --program-keypair wallets/program-keypair.json 2>&1 | tail -20; then
    print_success "Program deployed!"
    DEPLOY_SUCCESS=true
else
    print_error "Deployment failed"
    DEPLOY_SUCCESS=false
fi

# Phase 5: Initialization
print_header "PHASE 5: PROGRAM INITIALIZATION"

if [ "$DEPLOY_SUCCESS" = true ]; then
    ((STEP++))
    print_step "1" "Preparing for initialization"
    
    print_info "About to create the Config PDA and XP token mint"
    print_info "Note: You'll need to create scripts/initialize.ts first"
    echo ""
    
    cat > "$PROJECT_ROOT/scripts/initialize-template.ts" << 'INIT_TEMPLATE'
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { Academy, IDL } from "../target/types/academy";

const PROGRAM_ID = new PublicKey("2JEFfbRwBqZB3nf5JkTGsievs43CDuGettfzBWzf94Mw");

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = new anchor.Program<Academy>(IDL, PROGRAM_ID, provider);

  // PDA derivation
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    PROGRAM_ID
  );

  // Load XP mint keypair from file
  const fs = require("fs");
  const xpMintSecret = JSON.parse(
    fs.readFileSync("./wallets/xp-mint-keypair.json", "utf-8")
  );
  const xpMint = Keypair.fromSecretKey(new Uint8Array(xpMintSecret));

  console.log("Initializing program...");
  console.log("Config PDA:", configPda.toString());
  console.log("XP Mint:", xpMint.publicKey.toString());
  console.log("Authority:", provider.publicKey.toString());

  try {
    const tx = await program.methods
      .initialize()
      .accountsPartial({
        config: configPda,
        xpMint: xpMint.publicKey,
        authority: provider.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .signers([xpMint])
      .rpc();

    console.log("✓ Program initialized!");
    console.log("Tx:", tx);
  } catch (error) {
    console.error("Error initializing:", error);
    throw error;
  }
}

main().catch(console.error);
INIT_TEMPLATE

    print_success "Template created at scripts/initialize-template.ts"
    echo ""
    echo "To initialize:"
    echo "  1. Review the template: cat scripts/initialize-template.ts"
    echo "  2. Create your initialize script: cp scripts/initialize-template.ts scripts/initialize.ts"
    echo "  3. Run: export ANCHOR_PROVIDER_URL=https://api.devnet.solana.com"
    echo "         export ANCHOR_WALLET=wallets/signer.json"
    echo "         npx ts-node scripts/initialize.ts"
else
    print_warning "Skipping initialization - deployment failed"
fi

# Phase 6: Verification
print_header "PHASE 6: VERIFICATION & NEXT STEPS"

((STEP++))
print_step "1" "Verifying deployment"

echo "To verify your deployment is live:"
echo ""
echo "  solana program show $PROGRAM_PUBKEY --url devnet"
echo ""
echo "Check on Solana Explorer:"
echo "  https://explorer.solana.com/address/$PROGRAM_PUBKEY?cluster=devnet"

((STEP++))
print_step "2" "Test Workflow"

echo ""
echo "Once initialized, test the full workflow:"
echo ""
echo "  1. Create a test course:"
echo "     npx ts-node scripts/create-mock-course.ts"
echo ""
echo "  2. Start frontend:"
echo "     npm run dev"
echo ""
echo "  3. Test enrollment and lesson completion:"
echo "     - Connect wallet to http://localhost:3000"
echo "     - Enroll in course"
echo "     - Wait for backend to complete a lesson"
echo "     - Verify XP increased"

((STEP++))
print_step "3" "Integration Testing"

echo ""
echo "Test endpoints and services:"
echo ""
echo "  Verify XP token account:"
echo "    spl-token display $XP_MINT_PUBKEY --owner $SIGNER_PUBKEY"
echo ""
echo "  Check Config account:"
echo "    anchor account academy.Config <CONFIG_PDA>"

# Final Summary
print_header "TESTING SUMMARY"

echo "Configuration:"
echo "  Program ID: $PROGRAM_PUBKEY"
echo "  XP Mint:    $XP_MINT_PUBKEY"
echo "  Authority:  $SIGNER_PUBKEY"
echo "  Network:    devnet"
echo ""

if [ "$BUILD_SUCCESS" = true ] && [ "$DEPLOY_SUCCESS" = true ]; then
    echo -e "${GREEN}✓ Deployment Complete!${NC}"
    echo ""
    echo "Next: Initialize the program:"
    echo "  npx ts-node scripts/initialize.ts"
else
    echo -e "${YELLOW}! Some tests had issues${NC}"
    echo ""
    echo "Review the output above and fix any errors"
fi

echo ""
echo "Documentation:"
echo "  - DEPLOYMENT_GUIDE.md     (Complete guide)"
echo "  - DEVNET_DEPLOYMENT.md    (Step reference)"
echo "  - DEPLOYMENT_CHECKLIST.md (Quick checklist)"
echo ""
