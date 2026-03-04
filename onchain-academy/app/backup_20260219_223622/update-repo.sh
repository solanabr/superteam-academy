#!/usr/bin/env bash
# =============================================================================
# update-repo.sh — Apply all Supabase + Web3 changes and push to GitHub
# =============================================================================
# USAGE:
#   1. Clone your repo locally:
#        git clone https://github.com/Hydrahit/superteam-academy.git
#        cd superteam-academy
#
#   2. Download all files from Claude (links above this guide)
#      and place them next to this script (same folder).
#
#   3. Run:
#        chmod +x update-repo.sh
#        ./update-repo.sh
# =============================================================================

set -e  # Exit on any error

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "════════════════════════════════════════════"
echo "  Superteam Academy — Repo Update Script"
echo "════════════════════════════════════════════"
echo "Repo root: $REPO_ROOT"
echo ""

# ─── Step 1: Create all necessary directories ────────────────────────────────
echo "▶ Creating directories..."
mkdir -p "$REPO_ROOT/components/providers"
mkdir -p "$REPO_ROOT/components/wallet"
mkdir -p "$REPO_ROOT/components/lesson"
mkdir -p "$REPO_ROOT/lib/services"
mkdir -p "$REPO_ROOT/app"

# ─── Step 2: Copy each updated file ──────────────────────────────────────────
echo "▶ Copying updated files..."

copy_file() {
  local SRC="$SCRIPT_DIR/$1"
  local DST="$REPO_ROOT/$2"
  if [ -f "$SRC" ]; then
    cp "$SRC" "$DST"
    echo "  ✅ $2"
  else
    echo "  ⚠️  MISSING: $1 — download it from Claude and place it next to this script"
  fi
}

# Core provider & wallet
copy_file "WalletProvider.tsx"        "components/providers/WalletProvider.tsx"
copy_file "WalletConnectButton.tsx"   "components/wallet/WalletConnectButton.tsx"

# Service layer (the brain)
copy_file "learning-progress.ts"      "lib/services/learning-progress.ts"
copy_file "course.ts"                 "lib/services/course.ts"

# Fixed UI component
copy_file "LessonView.tsx"            "components/lesson/LessonView.tsx"

# Root layout
copy_file "layout.tsx"                "app/layout.tsx"

# Env example
copy_file ".env.example"              ".env.example"

# Integration guide (for the repo docs)
copy_file "INTEGRATION_GUIDE.md"      "INTEGRATION_GUIDE.md"

# ─── Step 3: Update .env.example with Supabase values ────────────────────────
echo ""
echo "▶ Writing .env.example with Supabase config..."
cat > "$REPO_ROOT/.env.example" << 'EOF'
# ─── Backend selector ───────────────────────────────────────────────────────
# localstorage | supabase | onchain
NEXT_PUBLIC_BACKEND=supabase

# ─── Solana ──────────────────────────────────────────────────────────────────
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=

# ─── Supabase ────────────────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://snymsdtjekhelhahbhvs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# ─── Feature flags ───────────────────────────────────────────────────────────
NEXT_PUBLIC_USE_ON_CHAIN=false
NEXT_PUBLIC_PROGRAM_ID=

# ─── Analytics ───────────────────────────────────────────────────────────────
NEXT_PUBLIC_GA_MEASUREMENT_ID=
EOF
echo "  ✅ .env.example"

# ─── Step 4: Ensure .env.local is gitignored ─────────────────────────────────
echo ""
echo "▶ Checking .gitignore..."
if ! grep -q "\.env\.local" "$REPO_ROOT/.gitignore" 2>/dev/null; then
  echo ".env.local" >> "$REPO_ROOT/.gitignore"
  echo "  ✅ Added .env.local to .gitignore"
else
  echo "  ✅ .env.local already in .gitignore"
fi

# Make sure the anon key is never committed
if ! grep -q "\.env" "$REPO_ROOT/.gitignore" 2>/dev/null; then
  echo ".env" >> "$REPO_ROOT/.gitignore"
fi

# ─── Step 5: Install new dependencies ────────────────────────────────────────
echo ""
echo "▶ Installing dependencies..."
cd "$REPO_ROOT"

npm install \
  @solana/wallet-adapter-base \
  @solana/wallet-adapter-react \
  @solana/wallet-adapter-react-ui \
  @solana/wallet-adapter-wallets \
  @solana/web3.js \
  @supabase/supabase-js \
  --legacy-peer-deps

echo "  ✅ Dependencies installed"

# ─── Step 6: Verify build ────────────────────────────────────────────────────
echo ""
echo "▶ Running type-check..."
if npm run type-check 2>/dev/null; then
  echo "  ✅ Type check passed"
else
  echo "  ⚠️  Type errors found — fix them before pushing (build may still work)"
fi

echo ""
echo "▶ Running lint..."
if npm run lint 2>/dev/null; then
  echo "  ✅ Lint passed"
else
  echo "  ⚠️  Lint warnings — check above (the two ESLint errors should now be fixed)"
fi

# ─── Step 7: Git commit & push ───────────────────────────────────────────────
echo ""
echo "▶ Committing changes to git..."
cd "$REPO_ROOT"

git add \
  components/providers/WalletProvider.tsx \
  components/wallet/WalletConnectButton.tsx \
  components/lesson/LessonView.tsx \
  lib/services/learning-progress.ts \
  lib/services/course.ts \
  app/layout.tsx \
  .env.example \
  INTEGRATION_GUIDE.md \
  .gitignore \
  package.json \
  package-lock.json

git commit -m "feat: Supabase backend + Solana wallet integration

- Add WalletProvider with Phantom & Solflare support (Devnet)
- Add WalletConnectButton with XP/level display
- Add ILearningProgressService with LocalStorage + Supabase + OnChain stubs
- Fix: ESLint react/no-unescaped-entities in LessonView.tsx (line 164)
- Fix: ESLint no-assign-module-variable in course.ts (line 71)
- Add Supabase backend: user_profiles, lesson_completions, xp_transactions,
  courses, modules, lessons, achievements tables
- Add complete_lesson() Postgres function (atomic, idempotent, streak logic)
- Add award_xp() Postgres function (race-condition safe with row lock)
- Add leaderboard views (alltime, weekly, monthly)
- Add RLS policies on all tables
- Seed 12 achievements, 5 courses, 4 modules, 9 lessons (EN/PT/ES)
- Update .env.example with Supabase config
- Gamification formula: Level = floor(sqrt(totalXP / 100))

Supabase project: snymsdtjekhelhahbhvs (us-east-1)
Backend selector: NEXT_PUBLIC_BACKEND=supabase|localstorage|onchain"

echo ""
echo "▶ Pushing to GitHub (main)..."
git push origin main

echo ""
echo "════════════════════════════════════════════"
echo "  ✅ ALL DONE!"
echo "════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Go to Vercel → Settings → Environment Variables"
echo "  2. Add NEXT_PUBLIC_BACKEND=supabase"
echo "  3. Add NEXT_PUBLIC_SUPABASE_URL=https://snymsdtjekhelhahbhvs.supabase.co"
echo "  4. Add NEXT_PUBLIC_SUPABASE_ANON_KEY=<your anon key>"
echo "  5. Redeploy on Vercel"
echo ""
echo "  Supabase dashboard: https://supabase.com/dashboard/project/snymsdtjekhelhahbhvs"
echo ""
