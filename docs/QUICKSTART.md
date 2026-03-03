# 🚀 Quick Start Guide

Get your Superteam Academy platform up and running in 15 minutes.

## Prerequisites

- Node.js 18+ installed
- Code editor (VS Code recommended)
- Terminal/command line access

## Step 1: Clone & Install (5 min)

```bash
# Navigate to your projects folder
cd ~/projects

# Copy this starter project
# (You already have these files)

# Install dependencies
npm install

# This will take 2-3 minutes
```

## Step 2: Environment Setup (5 min)

```bash
# Copy the example env file
cp .env.example .env.local

# Open .env.local in your editor
# For now, you can use these starter values:
```

```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_HELIUS_API_KEY=get_from_helius_dev
```

**Get a Helius API key** (free):
1. Go to [helius.dev](https://helius.dev)
2. Sign up for free account
3. Create a new project
4. Copy your API key
5. Paste into `.env.local`

## Step 3: Run Development Server (1 min)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

You should see the cyberpunk-themed landing page! ✨

## Step 4: Verify It Works (2 min)

Check that you see:
- ✅ Dark background with grid pattern
- ✅ Neon cyan "Superteam Academy" title with glow
- ✅ Three feature cards
- ✅ CTA buttons
- ✅ Stats section at bottom

## Step 5: Start Building (2 min)

Open the project in VS Code:

```bash
code .
```

**File structure you'll be working with:**
```
├── app/
│   ├── page.tsx          ← Landing page (done!)
│   ├── layout.tsx        ← Root layout (done!)
│   └── globals.css       ← Styles (done!)
├── lib/
│   ├── types/           ← Type definitions (done!)
│   └── utils/           ← Helper functions (done!)
└── docs/                ← Guides (you're here!)
```

## What's Next?

You're ready to start Day 1 of implementation!

### Today's Tasks (Day 1):
1. ✅ Project initialized
2. ✅ Dependencies installed  
3. ✅ Environment configured
4. ✅ Dev server running
5. **Next**: Add wallet adapter
6. **Next**: Create `/courses` page
7. **Next**: Build reusable components

### Read These Next:
1. `docs/IMPLEMENTATION_GUIDE.md` - Step-by-step daily tasks
2. `docs/IMPLEMENTATION_PLAN.md` - Overall strategy
3. `docs/ARCHITECTURE.md` - Technical details

## Troubleshooting

### "Module not found" error
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

### Port 3000 already in use
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use a different port
npm run dev -- -p 3001
```

### TypeScript errors
```bash
# Generate Next.js types
npm run dev
# Wait for dev server to start, then stop it (Ctrl+C)
# Types will be generated in .next/types
```

### Styles not applying
```bash
# Make sure Tailwind is running
# Check tailwind.config.ts exists
# Restart dev server
```

## Quick Commands Reference

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Run production build
npm run lint         # Run ESLint
npm run type-check   # Check TypeScript

# Useful during development
npx kill-port 3000   # Kill process on port 3000
rm -rf .next         # Clear Next.js cache
```

## Project Status Checklist

Track your progress:

### Day 1 ✅
- [x] Project initialized
- [x] Dependencies installed
- [x] Landing page working
- [ ] Wallet adapter added
- [ ] Routes structure created

### Week 1 Goals
- [ ] All 10 pages functional
- [ ] Basic navigation
- [ ] Course catalog
- [ ] Lesson viewer

### Week 2 Goals  
- [ ] Solana integration
- [ ] Polish & optimization
- [ ] Documentation
- [ ] Submission ready

## Need Help?

1. **Check the docs**: Most questions are answered in the implementation guides
2. **Discord**: [discord.gg/superteambrasil](https://discord.gg/superteambrasil)
3. **GitHub Issues**: Check if someone else had the same issue

---

**You're all set! Time to build something amazing! 🎯**
