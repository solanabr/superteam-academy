#!/bin/bash
# Quick Start Guide for Solana Academy Platform Integration

echo "🚀 Solana Academy Platform - Development Environment"
echo "=========================================="
echo ""

# Check dependencies
echo "📋 Checking dependencies..."
node --version
npm --version
echo ""

# Install frontend deps if needed  
if [ ! -d "node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  npm install
fi

# Install backend deps if needed
if [ ! -d "backend/node_modules" ]; then
  echo "📦 Installing backend dependencies..."
  cd backend
  npm install
  cd ..
fi

echo ""
echo "✅ Environment ready!"
echo ""
echo "📝 Environment Variables (.env.local required):"
echo "   NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com"
echo "   NEXT_PUBLIC_HELIUS_RPC_URL=https://devnet-api.helius.xyz"
echo "   NEXT_PUBLIC_XP_MINT_ADDRESS=<token-2022-xp-mint>"
echo ""

echo "🎯 To start development:"
echo ""
echo "   Terminal 1 (Frontend):"
echo "   $ npm run dev"
echo ""
echo "   Terminal 2 (Backend):"
echo "   $ cd backend && npm run dev"
echo ""
echo "📚 API Documentation:"
echo "   Health:              GET    http://localhost:3001/api/health"
echo "   On-Chain Routes:"
echo "   - Complete Lesson:   POST   http://localhost:3001/api/onchain/complete-lesson"
echo "   - Finalize Course:   POST   http://localhost:3001/api/onchain/finalize-course"
echo "   - Issue Credential:  POST   http://localhost:3001/api/onchain/issue-credential"
echo "   - Upgrade Cred:      POST   http://localhost:3001/api/onchain/upgrade-credential"
echo ""
echo "🧪 Testing:"
echo "   Frontend:  npm run type-check"
echo "   Backend:   cd backend && npm run type-check"
echo ""
echo "For full integration details, see: INTEGRATION_COMPLETE.md"
