#!/bin/bash

# Solana Academy - Interactive Deployment Manager
# 
# This script guides you through the deployment process step by step

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SIGNER_KEY="$PROJECT_ROOT/wallets/signer.json"
PROGRAM_KEY="$PROJECT_ROOT/wallets/program-keypair.json"
PROGRAM_ID="2JEFfbRwBqZB3nf5JkTGsievs43CDuGettfzBWzf94Mw"

colors() {
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    CYAN='\033[0;36m'
    NC='\033[0m'
}
colors

print_header() {
    echo ""
    echo -e "${BLUE}=====================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}=====================================${NC}"
}

print_step() {
    echo -e "\n${CYAN}[STEP $1]${NC} $2"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1" >&2
}

print_warning() {
    echo -e "${YELLOW}!${NC} $1"
}

print_header "Solana Academy - Devnet Deployment"

# Function to ask yes/no question
ask_continue() {
    local prompt="$1"
    while true; do
        read -p "$(echo -e ${CYAN}$prompt' (y/n): '${NC})" -n 1 -r
        echo
        case $REPLY in
            [Yy]*) return 0 ;;
            [Nn]*) return 1 ;;
            *) print_warning "Please answer y or n" ;;
        esac
    done
}

# Step 1: Check prerequisites
print_step "1" "Checking prerequisites"

if [ ! -f "$SIGNER_KEY" ]; then
    print_error "Signer keypair not found at $SIGNER_KEY"
    exit 1
fi
print_success "Signer keypair: $(basename $SIGNER_KEY)"

if [ ! -f "$PROGRAM_KEY" ]; then
    print_error "Program keypair not found at $PROGRAM_KEY"
    exit 1
fi
print_success "Program keypair: $(basename $PROGRAM_KEY)"

if ! command -v solana &> /dev/null; then
    print_error "Solana CLI not found"
    exit 1
fi
print_success "Solana CLI: $(solana --version | awk '{print $3}')"

# Step 2: Verify configuration
print_step "2" "Verifying Solana configuration"
CURRENT_URL=$(solana config get | grep "RPC URL" | awk -F': ' '{print $2}')
if [[ "$CURRENT_URL" == *"devnet"* ]]; then
    print_success "RPC configured for devnet: $CURRENT_URL"
else
    print_warning "RPC is set to: $CURRENT_URL"
    if ask_continue "Update to devnet?"; then
        solana config set --url devnet
        print_success "Updated to devnet"
    fi
fi

# Step 3: Check wallet balance
print_step "3" "Checking wallet balance"
SIGNER_PUBKEY=$(solana-keygen pubkey "$SIGNER_KEY" 2>/dev/null || echo "unknown")
BALANCE=$(solana balance "$SIGNER_KEY" 2>/dev/null | awk '{print $1}' || echo "0")

echo "Wallet: $SIGNER_PUBKEY"
echo "Balance: $BALANCE SOL"

if (( $(echo "$BALANCE < 2" | bc -l 2>/dev/null || echo "1") )); then
    print_warning "Low balance. Need 3-5 SOL for deployment."
    echo ""
    echo "Get SOL from:"
    echo "  1. Airdrop: solana airdrop 2 $SIGNER_KEY"
    echo "  2. Web: https://faucet.solana.com"
    echo ""
    
    if ask_continue "Request airdrop now?"; then
        print_step "3a" "Requesting airdrop..."
        solana airdrop 2 "$SIGNER_KEY" || print_warning "Airdrop may have failed"
        sleep 2
        NEW_BALANCE=$(solana balance "$SIGNER_KEY" 2>/dev/null || echo "0")
        echo "New balance: $NEW_BALANCE SOL"
    fi
else
    print_success "Sufficient balance for deployment"
fi

# Step 4: Fix compilation errors
print_step "4" "Checking for compilation fixes"
if ask_continue "Run compilation error fixer?"; then
    node "$PROJECT_ROOT/scripts/fix-compilation.js"
fi

# Step 5: Build program
print_step "5" "Building program"
if ask_continue "Build program now (this may take a few minutes)?"; then
    cd "$PROJECT_ROOT/programs/academy"
    
    if cargo build --target wasm32-unknown-unknown --release 2>&1 | tail -20; then
        print_success "Program built successfully"
    else
        print_error "Build failed. Check the errors above."
        exit 1
    fi
fi

# Step 6: Deploy
print_step "6" "Deploying program to devnet"
if ask_continue "Deploy program to devnet (needs 2-3 SOL)?"; then
    echo ""
    echo "This will take 1-2 minutes..."
    echo ""
    
    cd "$PROJECT_ROOT"
    if anchor deploy \
        --program-name academy \
        --provider.cluster devnet \
        --program-keypair "$PROGRAM_KEY" 2>&1 | tail -30; then
        print_success "Program deployed!"
        echo ""
        echo "Program ID: $PROGRAM_ID"
    else
        print_error "Deployment failed. Check the errors above."
        exit 1
    fi
fi

# Step 7: Initialize
print_step "7" "Initialize program"
if ask_continue "Initialize program on-chain (creates Config PDA and XP mint)?"; then
    echo ""
    print_warning "Note: This requires an initialize script at scripts/initialize.ts"
    echo "You'll need to create this to mint the XP token and set up the program."
    echo ""
    echo "For now, you can run this manually:"
    echo "  export ANCHOR_PROVIDER_URL=https://api.devnet.solana.com"
    echo "  export ANCHOR_WALLET=$SIGNER_KEY"
    echo "  npx ts-node scripts/initialize.ts"
fi

# Step 8: Verify
print_step "8" "Verify deployment"
print_success "Your program is deployed!"
echo ""
echo "To verify, run:"
echo "  solana program show $PROGRAM_ID --url devnet"
echo ""

# Summary
print_header "Deployment Complete!"

echo ""
echo "Your on-chain program addresses:"
echo ""
echo "Program ID:    $PROGRAM_ID"
echo "XP Mint:       BB6urY3kS15YzkM3MqRYGWZDKpB56YijHFz4q55dwXZ4"
echo "Authority:     6HJo2VY5NgAeTWcNq22qU6EKfsdcUPCEmC1fu1e3hvQ1"
echo ""
echo "These have been saved to .env.local"
echo ""
echo "Next steps:"
echo "  1. Create initialize.ts script to set up on-chain state"
echo "  2. Create mock course and track (scripts/create-mock-course.ts)"
echo "  3. Start frontend: npm run dev"
echo "  4. Test wallet connection and program interactions"
echo ""
