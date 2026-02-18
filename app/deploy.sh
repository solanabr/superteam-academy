#!/bin/bash

# Deploy script for Superteam Brazil LMS

set -e

echo "🚀 Deploying Superteam Brazil LMS..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Are you in the project root?"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building the project..."
npm run build

echo "🧪 Running tests..."
npm test

echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"