# 🚀 Superteam Academy - Deployment Guide

Complete step-by-step guide to deploy and launch the platform.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Step 1: Deploy Program to Devnet](#step-1-deploy-program-to-devnet)
3. [Step 2: Update Program IDs](#step-2-update-program-ids)
4. [Step 3: Generate Backend Signer](#step-3-generate-backend-signer)
5. [Step 4: Set Up Database](#step-4-set-up-database)
6. [Step 5: Initialize On-Chain State](#step-5-initialize-on-chain-state)
7. [Step 6: Upload Content](#step-6-upload-content)
8. [Step 7: Configure Helius](#step-7-configure-helius)
9. [Step 8: Launch Everything](#step-8-launch-everything)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:
- [ ] Solana CLI installed (`solana --version`)
- [ ] Anchor CLI installed (`anchor --version`)
- [ ] Rust installed (`rustc --version`)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] Git installed (`git --version`)
- [ ] A Solana wallet with devnet SOL

### Quick Setup Check

```bash
# Verify installations
solana --version        # Should show 1.18.x or higher
anchor --version        # Should show 0.31.x or higher
rustc --version         # Should show 1.75.x or higher
node --version          # Should show v18.x or higher
```

### Configure Solana for Devnet

```bash
# Set Solana CLI to devnet
solana config set --url devnet

# Check your configuration
solana config get

# Verify you have a keypair
solana address

# Get devnet SOL (2 SOL should be enough)
solana airdrop 2
```

---

## Step 1: Deploy Program to Devnet

**Why:** Your program code exists but isn't on the blockchain yet. Deployment creates a Program ID that everything else uses.

**Time:** ~30 minutes

### 1.1 Navigate to Program Directory

```bash
# From project root
cd D:\superteam-academy\programs\superteam-academy

# Verify you're in the right place (should see Cargo.toml)
ls
```

### 1.2 Build the Program

**⚠️ WINDOWS USERS:** You may encounter "Can't get home directory path" error.

**Fix for Windows:**
```powershell
# Set HOME environment variable temporarily
$env:HOME = $env:USERPROFILE

# Now build
cargo build-sbf
```

**For Mac/Linux:**
```bash
cargo build-sbf
```

**Expected output:**
```
Compiling superteam-academy v0.1.0
Finished release [optimized] target(s) in 45s
```

### 1.3 Deploy to Devnet

```bash
# Deploy with higher compute budget (helps on devnet)
anchor deploy --provider.cluster devnet -- --with-compute-unit-price 5000
```

**Success output:**
```
Deploying workspace: https://api.devnet.solana.com
Upgrade authority: <YOUR_WALLET_ADDRESS>
Deploying program "superteam-academy"...
Program path: .../target/deploy/superteam_academy.so
Program Id: <YOUR_PROGRAM_ID>

Deploy success
```

**📝 SAVE THIS PROGRAM ID!** (Looks like: `H8pK7x...xyz`)

### 1.4 Verify Deployment

```bash
# Check on Solana Explorer
# Open: https://explorer.solana.com/address/YOUR_PROGRAM_ID?cluster=devnet
# Should show your deployed program
```

---

## Step 2: Update Program IDs

**Why:** Frontend and backend need to know where your program is on-chain.

**Time:** ~5 minutes

### 2.1 Update Anchor.toml

```bash
# Open in VS Code or any editor
code D:\superteam-academy\Anchor.toml
```

**Find and replace:**
```toml
# OLD
[programs.devnet]
superteam_academy = "Acad111111111111111111111111111111111111111"

# NEW
[programs.devnet]
superteam_academy = "YOUR_ACTUAL_PROGRAM_ID"
```

### 2.2 Update Backend Environment

```bash
# Open server environment file
code D:\superteam-academy\server\.env
```

**Update:**
```env
SOLANA_PROGRAM_ID="YOUR_ACTUAL_PROGRAM_ID"
SOLANA_RPC_URL="https://api.devnet.solana.com"
```

### 2.3 Update Frontend Environment

Create file: `D:\superteam-academy\app\.env.local`

```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=YOUR_ACTUAL_PROGRAM_ID
```

---

## Step 3: Generate Backend Signer

**Why:** This keypair signs lesson completions, preventing cheating.

**Time:** ~2 minutes

### 3.1 Generate Keypair

```bash
cd D:\superteam-academy\server

# Install dependencies first
npm install

# Generate keypair
npm run generate:keypair
```

**Output:**
```
[12, 34, 56, ... 64 numbers total]
```

### 3.2 Save to Environment

Edit `D:\superteam-academy\server\.env`:

```env
BACKEND_SIGNER_PRIVATE_KEY="[12, 34, 56, ... 64 numbers from above]"
```

### 3.3 Save Public Key

The script also outputs a public key. **Save this** - you'll need it in Step 5.

Example:
```
Public Key: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
```

---

## Step 4: Set Up Database

**Why:** Store user progress, enrollments, and leaderboard cache.

**Time:** ~10 minutes

### Option A: Railway (Recommended - Free)

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Database" → "Add PostgreSQL"
4. Wait for database to provision
5. Click on the PostgreSQL service → "Variables" tab
6. Copy `DATABASE_URL`
7. Paste into `D:\superteam-academy\server\.env`:

```env
DATABASE_URL="postgresql://postgres:xxxxx@containers-xxxxx.railway.app:5432/railway"
```

### Option B: Local PostgreSQL

```bash
# Install PostgreSQL if not installed
# https://www.postgresql.org/download/windows/

# Create database
createdb superteam_academy

# Or use psql
psql -U postgres -c "CREATE DATABASE superteam_academy;"
```

Update `.env`:
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/superteam_academy"
```

### 4.1 Initialize Database Schema

```bash
cd D:\superteam-academy\server

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Verify (optional)
npx prisma studio
# This opens a GUI at http://localhost:5555
```

---

## Step 5: Initialize On-Chain State

**Why:** Create Config PDA, first season, and courses on the blockchain.

**Time:** ~15 minutes

### 5.1 Create Initialization Script

Create file: `D:\superteam-academy\scripts\init-devnet.ts`

```typescript
import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';

// CONFIGURATION - UPDATE THESE
const PROGRAM_ID = new PublicKey("YOUR_PROGRAM_ID_HERE");
const BACKEND_SIGNER = new PublicKey("YOUR_BACKEND_SIGNER_PUBLIC_KEY_HERE");

// Load your wallet
const keypairPath = path.join(process.env.HOME || process.env.USERPROFILE!, '.config', 'solana', 'id.json');
const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));
const wallet = Keypair.fromSecretKey(Uint8Array.from(keypairData));

console.log("Using wallet:", wallet.publicKey.toString());

async function main() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  
  // Load IDL
  const idlPath = path.join(__dirname, '..', 'target', 'idl', 'superteam_academy.json');
  const idl = JSON.parse(fs.readFileSync(idlPath, 'utf-8'));
  
  const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(wallet), {
    commitment: "confirmed"
  });
  
  const program = new anchor.Program(idl, PROGRAM_ID, provider);
  
  console.log("\n🚀 Initializing Superteam Academy on Devnet...\n");
  
  // 1. Initialize Config
  console.log("1️⃣  Initializing Config PDA...");
  try {
    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      PROGRAM_ID
    );
    
    await program.methods
      .initialize(10000, 5000) // max_daily_xp: 10000, max_achievement_xp: 5000
      .accounts({
        authority: wallet.publicKey,
        config: configPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    
    console.log("   ✅ Config initialized");
    console.log("   📍 Config PDA:", configPda.toString());
  } catch (e) {
    console.log("   ⚠️  Config may already exist:", (e as Error).message);
  }
  
  // 2. Create Season 1
  console.log("\n2️⃣  Creating Season 1...");
  try {
    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      PROGRAM_ID
    );
    
    // Get config to find current mint
    const config = await program.account.config.fetch(configPda);
    
    await program.methods
      .createSeason(1)
      .accounts({
        authority: wallet.publicKey,
        config: configPda,
        mint: config.currentMint,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();
    
    console.log("   ✅ Season 1 created");
  } catch (e) {
    console.log("   ⚠️  Season may already exist:", (e as Error).message);
  }
  
  // 3. Create Courses
  console.log("\n3️⃣  Creating Courses...");
  
  const courses = [
    {
      id: "anchor-fundamentals",
      track: "Development",
      difficulty: "Beginner",
      lessons: 12,
      xp: 1200,
    },
    {
      id: "token-2022-mastery",
      track: "Advanced",
      difficulty: "Intermediate",
      lessons: 8,
      xp: 1500,
    },
    {
      id: "zk-compression",
      track: "Infrastructure",
      difficulty: "Advanced",
      lessons: 10,
      xp: 2000,
    },
    {
      id: "security-auditing",
      track: "Security",
      difficulty: "Advanced",
      lessons: 15,
      xp: 2500,
    },
    {
      id: "defi-primitives",
      track: "DeFi",
      difficulty: "Intermediate",
      lessons: 14,
      xp: 2200,
    },
    {
      id: "nft-infrastructure",
      track: "NFTs",
      difficulty: "Intermediate",
      lessons: 11,
      xp: 1800,
    },
  ];
  
  for (const course of courses) {
    try {
      const [coursePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("course"), Buffer.from(course.id)],
        PROGRAM_ID
      );
      
      await program.methods
        .createCourse({
          courseId: course.id,
          track: course.track,
          difficulty: course.difficulty,
          lessonCount: course.lessons,
          xpTotal: course.xp,
          contentTxId: Buffer.alloc(32), // Empty for now
          prerequisite: null,
        })
        .accounts({
          authority: wallet.publicKey,
          course: coursePda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      
      console.log(`   ✅ ${course.id}`);
    } catch (e) {
      console.log(`   ⚠️  ${course.id}:`, (e as Error).message);
    }
  }
  
  // 4. Update Config with Backend Signer
  console.log("\n4️⃣  Setting Backend Signer...");
  try {
    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      PROGRAM_ID
    );
    
    await program.methods
      .updateConfig({
        newAuthority: null,
        newBackendSigner: BACKEND_SIGNER,
        newMaxDailyXp: null,
        newMaxAchievementXp: null,
      })
      .accounts({
        authority: wallet.publicKey,
        config: configPda,
      })
      .rpc();
    
    console.log("   ✅ Backend signer set to:", BACKEND_SIGNER.toString());
  } catch (e) {
    console.log("   ⚠️  Failed to update config:", (e as Error).message);
  }
  
  console.log("\n✨ Devnet initialization complete!");
  console.log("\nNext steps:");
  console.log("  1. Start backend: cd server && npm run dev");
  console.log("  2. Start frontend: cd app && npm run dev");
  console.log("  3. Open http://localhost:3000");
}

main().catch((e) => {
  console.error("❌ Error:", e);
  process.exit(1);
});
```

### 5.2 Run Initialization

```bash
cd D:\superteam-academy

# Install ts-node if not installed
npm install -g ts-node typescript

# Run the script
npx ts-node scripts/init-devnet.ts
```

**Expected output:**
```
🚀 Initializing Superteam Academy on Devnet...

1️⃣  Initializing Config PDA...
   ✅ Config initialized
   📍 Config PDA: 7xKX...

2️⃣  Creating Season 1...
   ✅ Season 1 created

3️⃣  Creating Courses...
   ✅ anchor-fundamentals
   ✅ token-2022-mastery
   ✅ zk-compression
   ✅ security-auditing
   ✅ defi-primitives
   ✅ nft-infrastructure

4️⃣  Setting Backend Signer...
   ✅ Backend signer set to: 7xKX...

✨ Devnet initialization complete!
```

---

## Step 6: Upload Content

**Why:** Lesson content must be stored somewhere accessible.

**Time:** ~20 minutes

### Quick Solution (For Hackathon)

Instead of Arweave, use **GitHub raw URLs** temporarily:

1. Create a GitHub repository
2. Upload lesson content as JSON files
3. Use raw.githubusercontent.com URLs

**Example structure:**
```
your-repo/
  lessons/
    anchor-fundamentals/
      lesson-1.json
      lesson-2.json
      ...
```

**Update course content URLs:**
```bash
# In your database or initialization script, set:
# content_tx_id = "https://raw.githubusercontent.com/YOUR_USERNAME/REPO/main/lessons/anchor-fundamentals/lesson-1.json"
```

### Full Arweave Solution (Production)

```bash
# Install Bundlr
npm install -g @bundlr-network/client

# Fund your Bundlr wallet
bundlr fund 1000000000 -h https://devnet.bundlr.network -w ~/.config/solana/id.json -c solana

# Upload a file
bundlr upload lesson-1.json -h https://devnet.bundlr.network -w ~/.config/solana/id.json -c solana
```

---

## Step 7: Configure Helius

**Why:** Query XP token balances for real-time leaderboard.

**Time:** ~5 minutes

1. Go to https://helius.xyz
2. Create a free account
3. Click "Add a Network" → Select "Devnet"
4. Copy your API key
5. Update `D:\superteam-academy\server\.env`:

```env
HELIUS_API_KEY="your-actual-api-key"
HELIUS_RPC_URL="https://devnet.helius-rpc.com/?api-key=your-actual-api-key"
```

---

## Step 8: Launch Everything

**Time:** ~5 minutes

### 8.1 Terminal 1 - Backend

```bash
cd D:\superteam-academy\server

# If first time
npm install

# Start server
npm run dev

# Should show:
# 🚀 Server running on port 3001
# 📊 Environment: development
# 🔗 Solana RPC: https://api.devnet.solana.com
```

### 8.2 Terminal 2 - Frontend

```bash
cd D:\superteam-academy\app

# If first time
npm install

# Start development server
npm run dev

# Should show:
# Ready on http://localhost:3000
```

### 8.3 Open in Browser

1. Open Chrome/Edge
2. Go to: http://localhost:3000
3. Connect your Phantom wallet (make sure it's on Devnet!)
4. Test enrolling in a course
5. Complete a lesson

---

## ✅ Verification Checklist

Before presenting, verify:

- [ ] **Program deployed** - Check on https://explorer.solana.com (devnet)
- [ ] **Config initialized** - Can fetch Config PDA
- [ ] **Season created** - Season 1 exists
- [ ] **Courses created** - All 6 courses visible
- [ ] **Backend signer set** - Config shows correct backend signer
- [ ] **Database connected** - Prisma shows green in logs
- [ ] **Backend running** - Shows "Server running on port 3001"
- [ ] **Frontend running** - No console errors
- [ ] **Wallet connects** - Phantom connects successfully
- [ ] **Can enroll** - Clicking "Enroll" creates enrollment
- [ ] **Can complete lesson** - Lesson completion works
- [ ] **XP updates** - XP balance increases after completion

---

## 🚨 Troubleshooting

### Error: "Can't get home directory path"

**Windows Fix:**
```powershell
$env:HOME = $env:USERPROFILE
anchor build
```

### Error: "Program failed to deploy"

**Solutions:**
```bash
# Get more SOL
solana airdrop 5

# Or use higher compute budget
anchor deploy --provider.cluster devnet -- --with-compute-unit-price 10000

# Check your wallet balance
solana balance
```

### Error: "Cannot find id.json"

**Fix:**
```bash
# Generate a new keypair if needed
solana-keygen new

# Or specify path
solana config set --keypair D:\path\to\your\keypair.json
```

### Error: "Port already in use"

**Fix:**
```bash
# Find and kill process on port 3000/3001
# Or let Next.js use different port (it auto-detects)

# For backend, change port in server/.env
PORT=3002
```

### Error: "Database connection failed"

**Fix:**
```bash
# Check if PostgreSQL is running
# Windows: Services app → PostgreSQL → Start
# Mac: brew services start postgresql

# Verify DATABASE_URL format
# Should be: postgresql://user:pass@host:port/database
```

### Error: "Prisma schema not found"

**Fix:**
```bash
cd D:\superteam-academy\server
npx prisma generate
npx prisma db push
```

### Error: "Transaction simulation failed"

**Common causes:**
- Not enough SOL in wallet: `solana airdrop 2`
- Wrong program ID: Check Anchor.toml
- Account not created: Run init-devnet.ts first

---

## 🎯 Quick Commands Reference

```bash
# Build program
cd programs/superteam-academy && cargo build-sbf

# Deploy
anchor deploy --provider.cluster devnet

# Get program logs
solana logs --url devnet | grep YOUR_PROGRAM_ID

# Check account
solana account ACCOUNT_PUBKEY --url devnet

# Get airdrop
solana airdrop 2

# Check balance
solana balance
```

---

## 📞 Support

If stuck:
1. Check this guide's Troubleshooting section
2. Look at error messages carefully
3. Verify each step was completed
4. Check logs in both terminals

---

## 🎉 Success!

Once all steps complete, you have a **fully functional decentralized learning platform** on Solana devnet!

**What you built:**
- ✅ Solana program deployed
- ✅ Backend API running
- ✅ Frontend website live
- ✅ Database storing progress
- ✅ 6 courses with 69 lessons
- ✅ XP token system working
- ✅ Leaderboard tracking

**Time to demo!** 🚀
