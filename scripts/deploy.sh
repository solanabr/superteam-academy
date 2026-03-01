#!/bin/bash

# Superteam Academy Deployment Script
# Usage: ./scripts/deploy.sh [network]
# Networks: localnet (default), devnet, mainnet

set -e

NETWORK="${1:-localnet}"
PROGRAM_NAME="superteam_academy"

echo "🚀 Deploying Superteam Academy to $NETWORK"
echo "=========================================="

# Validate network
if [[ ! "$NETWORK" =~ ^(localnet|devnet|mainnet)$ ]]; then
    echo "❌ Invalid network: $NETWORK"
    echo "Usage: ./scripts/deploy.sh [localnet|devnet|mainnet]"
    exit 1
fi

# Set Solana config
echo "📡 Setting Solana config to $NETWORK..."
solana config set --url $NETWORK

# Build program
echo "🔨 Building program..."
anchor build

# Run tests before deployment
echo "🧪 Running tests..."
anchor test --skip-local-validator || {
    echo "❌ Tests failed! Aborting deployment."
    exit 1
}

# Deploy
echo "📤 Deploying to $NETWORK..."
DEPLOY_OUTPUT=$(anchor deploy --provider.cluster $NETWORK 2>&1)

# Extract program ID
PROGRAM_ID=$(echo "$DEPLOY_OUTPUT" | grep "Program Id:" | awk '{print $3}')

if [ -z "$PROGRAM_ID" ]; then
    echo "❌ Failed to get program ID from deployment"
    exit 1
fi

echo "✅ Program deployed successfully!"
echo "Program ID: $PROGRAM_ID"

# Update Anchor.toml
echo "📝 Updating Anchor.toml..."
sed -i.bak "s/\[programs\.$NETWORK\]/[programs.$NETWORK]/" Anchor.toml
sed -i.bak "/\[programs\.$NETWORK\]/,/^\[/ { s/$PROGRAM_NAME = \"[^\"]*\"/$PROGRAM_NAME = \"$PROGRAM_ID\"/; }" Anchor.toml

# Update IDL
echo "📝 Updating IDL with program ID..."
find . -name "idl.ts" -exec sed -i.bak "s/address: \"[^\"]*\"/address: \"$PROGRAM_ID\"/g" {} \;

echo ""
echo "🎉 Deployment complete!"
echo "Program ID: $PROGRAM_ID"
echo "Network: $NETWORK"
echo ""
echo "Next steps:"
echo "1. Update frontend config with new program ID"
echo "2. Copy target/idl to app/src/idl"
echo "3. Test on $NETWORK"
