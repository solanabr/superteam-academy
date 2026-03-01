#!/bin/bash

# Lint script for Superteam Academy
# Usage: ./scripts/lint.sh

set -e

echo "🔍 Running lint checks..."
echo ""

# Rust formatting
echo "📦 Checking Rust formatting..."
cargo fmt -- --check

# Rust clippy
echo "🔍 Running Clippy..."
cargo clippy -- -W clippy::all -D warnings

# Frontend linting (if app directory exists)
if [ -d "app" ]; then
    echo "💻 Checking frontend..."
    cd app
    
    if [ -f "package.json" ]; then
        echo "📦 Installing frontend dependencies..."
        npm install
        
        echo "🔍 Running ESLint..."
        npm run lint
        
        echo "🔍 Running TypeScript check..."
        npm run typecheck
    fi
    cd ..
fi

echo ""
echo "✅ All lint checks passed!"
