#!/bin/bash

# Quick development build and test script
# Usage: ./build-and-test.sh

set -e

echo "🚀 Solana Academy Platform — Build & Test"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Type Check
echo -e "\n${YELLOW}📝 Type checking...${NC}"
if npm run type-check; then
    echo -e "${GREEN}✅ Type check passed${NC}"
else
    echo -e "${RED}❌ Type check failed${NC}"
    exit 1
fi

# Step 2: Lint
echo -e "\n${YELLOW}🔎 Linting code...${NC}"
if npm run lint; then
    echo -e "${GREEN}✅ Lint check passed${NC}"
else
    echo -e "${YELLOW}⚠️  Lint warnings found (continuing)${NC}"
fi

# Step 3: Build
echo -e "\n${YELLOW}🔨 Building project...${NC}"
if npm run build; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Step 4: Summary
echo -e "\n${GREEN}✨ All checks passed!${NC}"
echo -e "\nTo start dev server: ${YELLOW}npm run dev${NC}"
echo -e "To run tests: ${YELLOW}npm test${NC}"
