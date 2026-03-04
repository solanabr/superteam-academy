#!/bin/bash
# Script to add all environment variables to Vercel
# ⚠️  Fill in real values before running — never commit secrets to git!
cd /Users/saif/Desktop/solana-academy-platform

add_env() {
  local name=$1
  local value=$2
  printf '%s' "$value" | vercel env add "$name" production --force 2>&1
  echo "  -> $name done"
}

# NextAuth
add_env "NEXTAUTH_SECRET" "$(openssl rand -base64 32)"

# Google OAuth
add_env "GOOGLE_CLIENT_ID" "<YOUR_GOOGLE_CLIENT_ID>"
add_env "GOOGLE_CLIENT_SECRET" "<YOUR_GOOGLE_CLIENT_SECRET>"

# GitHub OAuth
add_env "GITHUB_CLIENT_ID" "<YOUR_GITHUB_CLIENT_ID>"
add_env "GITHUB_CLIENT_SECRET" "<YOUR_GITHUB_CLIENT_SECRET>"

# Supabase
add_env "SUPABASE_URL" "<YOUR_SUPABASE_URL>"
add_env "NEXT_PUBLIC_SUPABASE_URL" "<YOUR_SUPABASE_URL>"
add_env "SUPABASE_ANON_KEY" "<YOUR_SUPABASE_ANON_KEY>"
add_env "SUPABASE_SERVICE_ROLE_KEY" "<YOUR_SUPABASE_SERVICE_ROLE_KEY>"

# JWT
add_env "JWT_SECRET" "$(openssl rand -base64 32)"

# Solana RPC
add_env "NEXT_PUBLIC_SOLANA_RPC_URL" "https://api.devnet.solana.com"
add_env "NEXT_PUBLIC_SOLANA_RPC_URL_DEVNET" "https://api.devnet.solana.com"
add_env "NEXT_PUBLIC_SOLANA_RPC_URL_MAINNET" "https://api.mainnet-beta.solana.com"

# On-Chain
add_env "NEXT_PUBLIC_ANCHOR_PROGRAM_ID" "<YOUR_PROGRAM_ID>"
add_env "NEXT_PUBLIC_XP_TOKEN_MINT" "<YOUR_XP_MINT_ADDRESS>"
add_env "NEXT_PUBLIC_HELIUS_API_KEY" "<YOUR_HELIUS_API_KEY>"
add_env "NEXT_PUBLIC_BACKEND_SIGNER" "<YOUR_BACKEND_SIGNER_PUBKEY>"

# Wallet
add_env "NEXT_PUBLIC_SOLANA_NETWORK" "devnet"
add_env "NEXT_PUBLIC_WALLET_ADAPTERS" "phantom,backpack,brave,solflare"

# Analytics
add_env "NEXT_PUBLIC_POSTHOG_HOST" "https://eu.i.posthog.com"

# Feature flags
add_env "NEXT_PUBLIC_ENABLE_WALLET_CONNECTION" "true"
add_env "NEXT_PUBLIC_ENABLE_ON_CHAIN_XP" "true"
add_env "NEXT_PUBLIC_ENABLE_LEADERBOARD" "true"

# Sanity CMS
add_env "NEXT_PUBLIC_SANITY_PROJECT_ID" "<YOUR_SANITY_PROJECT_ID>"
add_env "NEXT_PUBLIC_SANITY_DATASET" "production"
add_env "NEXT_PUBLIC_SANITY_API_VERSION" "2024-02-13"
add_env "SANITY_API_TOKEN" "<YOUR_SANITY_API_TOKEN>"

echo ""
echo "✅ All environment variables added to Vercel production!"
