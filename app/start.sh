#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Superteam Academy Frontend Setup...${NC}"

# Check for .env.local
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠️  .env.local not found! Creating from example...${NC}"
    cp .env.local.example .env.local
    echo -e "${GREEN}✅ Created .env.local. Please edit it with your API keys.${NC}"
else
    echo -e "${GREEN}✅ .env.local found.${NC}"
fi

# Install dependencies if node_modules is missing
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install --legacy-peer-deps
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Dependency installation failed.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Dependencies already installed.${NC}"
fi

# Run the development server
echo -e "${GREEN}🌟 Starting Next.js Development Server...${NC}"
npm run dev
