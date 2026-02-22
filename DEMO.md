# Superteam Academy — Full Demo Runbook

End-to-end walkthrough: program deploy, backend, frontend, then a complete learner journey through the UI and CLI scripts.

---

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Solana CLI | 1.18+ | `solana --version` |
| Anchor CLI | 0.31+ | `anchor --version` |
| Node.js | 18+ | `node --version` |
| pnpm | 9+ | `pnpm --version` |
| Rust | 1.82+ | `rustc --version` |

**Accounts needed:**
- [Supabase](https://supabase.com) project (free tier works)
- [Sanity](https://sanity.io) project (free tier works)
- Solana devnet wallet with SOL (`solana airdrop 5`)

---

## Phase 1: Deploy On-Chain Program

```bash
cd onchain-academy
```

### 1.1 Build

```bash
anchor build
```

### 1.2 Fund your wallet

```bash
# Check your wallet
solana address -k ../wallets/signer.json

# Airdrop devnet SOL (run multiple times if needed)
solana airdrop 5 -k ../wallets/signer.json --url devnet
solana airdrop 5 -k ../wallets/signer.json --url devnet
```

### 1.3 Deploy to devnet

```bash
anchor deploy --provider.cluster devnet --program-keypair ../wallets/program-keypair.json
```

Expected output: `Program Id: GuBhF6hk5yKhnvU5712LZwUPaoAmoxtJf9GTh4CHTxsF`

### 1.4 Initialize program

Creates Config PDA, XP mint (Token-2022 with NonTransferable + PermanentDelegate), and registers authority as first minter.

```bash
npx ts-node scripts/initialize.ts
```

**Verify:**
```bash
npx ts-node scripts/fetch-config.ts
```

You should see: authority, backendSigner, xpMint addresses.

### 1.5 Create track collection

Creates a Metaplex Core collection for credential NFTs.

```bash
npx ts-node scripts/create-mock-track.ts
```

Save the collection address printed in the output — you'll need it for credential issuance.

### 1.6 Setup backend signer

Registers the backend signer keypair as a minter and updates Config to recognize it.

```bash
npx ts-node scripts/setup-backend-signer.ts
```

**Verify:**
```bash
npx ts-node scripts/fetch-config.ts
```

Confirm `backendSigner` matches the public key from `wallets/backend-signer.json`.

### 1.7 Create courses on-chain

Creates 5 courses with different tracks, difficulties, and XP rewards.

```bash
npx ts-node scripts/create-all-courses.ts
```

| Course ID | Lessons | XP/Lesson | Track | Difficulty |
|-----------|---------|-----------|-------|------------|
| `intro-to-solana` | 10 | 25 | 1 | Beginner |
| `anchor-fundamentals` | 8 | 30 | 4 | Intermediate |
| `defi-on-solana` | 6 | 40 | 2 | Advanced |
| `nft-development` | 7 | 30 | 3 | Intermediate |
| `web3-frontend` | 8 | 25 | 5 | Beginner |

**Verify any course:**
```bash
npx ts-node scripts/fetch-course.ts intro-to-solana
```

---

## Phase 2: Setup Supabase

### 2.1 Create project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Note these values from Settings > API:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

### 2.2 Run migrations

In the Supabase SQL Editor, run these files in order:

1. `app/supabase/migrations/001_initial.sql` — Creates: profiles, accounts, user_stats, enrollments, xp_transactions, community_posts, daily_challenges, daily_challenge_completions, plus RLS policies and avatars bucket
2. `app/supabase/migrations/002_leaderboard_index.sql` — Adds leaderboard index and is_admin column
3. `app/supabase/migrations/002_newsletter.sql` — Newsletter subscribers table

### 2.3 Verify

In Supabase Table Editor, confirm these tables exist: `profiles`, `user_stats`, `enrollments`, `xp_transactions`, `community_posts`.

---

## Phase 3: Setup Sanity CMS

### 3.1 Create project

1. Go to [sanity.io/manage](https://sanity.io/manage)
2. Create a new project
3. Note the **Project ID** → `NEXT_PUBLIC_SANITY_PROJECT_ID`
4. Under API > Tokens, create a token with **Editor** permissions → `SANITY_API_TOKEN`

### 3.2 Seed content

Add `SANITY_API_TOKEN` to `app/.env.local`, then:

```bash
cd /path/to/superteam-academy
npx tsx scripts/seed-sanity.ts
```

This creates 5 tracks, 3 instructors, and 5 full courses with modules, lessons (including markdown content and code challenges).

### 3.3 Deploy Sanity Studio

Deploy the studio to Sanity's CDN so you can manage content via a hosted UI:

```bash
cd app
npx sanity deploy
```

This builds and uploads the studio to **`superteam-academy.sanity.studio`** (or prompts you to pick a hostname if taken).

Then go to [sanity.io/manage](https://sanity.io/manage) → your project → **API** → **CORS Origins** and add:
- `http://localhost:3000` (for dev, with **Allow credentials** checked)
- Your production domain (when ready)

### 3.4 Verify

Open [superteam-academy.sanity.studio](https://superteam-academy.sanity.studio) and confirm courses, tracks, and lessons appear.

---

## Phase 4: Start Backend Service

```bash
cd backend
npm install
```

### 4.1 Configure environment

Create `backend/.env`:

```env
SOLANA_RPC_URL=https://api.devnet.solana.com
BACKEND_SIGNER_KEYPAIR=../wallets/backend-signer.json
AUTH_SECRET=<generate with: openssl rand -base64 32>
PORT=3001
APP_ORIGIN=http://localhost:3000
```

> Use the same `AUTH_SECRET` value for both backend and frontend.

### 4.2 Start

```bash
npm run dev
```

**Verify:**
```bash
curl http://localhost:3001/health
```

Expected: `{"status":"ok"}`

### 4.3 Backend endpoints reference

| Endpoint | Purpose |
|----------|---------|
| `POST /complete-lesson` | Sign lesson completion tx, mint XP |
| `POST /finalize-course` | Sign course finalization tx, bonus XP |
| `POST /issue-credential` | Mint soulbound Metaplex Core NFT |
| `POST /reward-xp` | Arbitrary XP mint |

All POST routes require `Authorization: Bearer <jwt>` (same JWT issued by NextAuth).

---

## Phase 5: Start Frontend

```bash
cd app
pnpm install
```

### 5.1 Configure environment

Create `app/.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production

# Auth (MUST match backend AUTH_SECRET)
AUTH_SECRET=<same value as backend>

# OAuth (optional — skip if testing with wallet only)
GITHUB_ID=...
GITHUB_SECRET=...
GOOGLE_ID=...
GOOGLE_SECRET=...

# Solana
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=GuBhF6hk5yKhnvU5712LZwUPaoAmoxtJf9GTh4CHTxsF
NEXT_PUBLIC_XP_MINT=F1PbQKRkn3UXnhCJErDSAtNmiScKPdMpwJxLLR7F3JQM
NEXT_PUBLIC_BACKEND_SIGNER=<public key from wallets/backend-signer.json>

# Optional
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_GA_ID=
SENTRY_DSN=
SANITY_API_TOKEN=<for seed script, already set above>
SANITY_WEBHOOK_SECRET=
```

### 5.2 Start

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Phase 6: Demo Walkthrough — UI

### 6.1 Sign in

1. Go to [localhost:3000/en/auth/signin](http://localhost:3000/en/auth/signin)
2. Sign in with **GitHub**, **Google**, or **Solana wallet** (Phantom, Backpack, etc.)
3. You'll be redirected to the dashboard

### 6.2 Explore courses

1. Navigate to [localhost:3000/en/courses](http://localhost:3000/en/courses)
2. Browse the 5 seeded courses
3. Click a course to see the detail page with modules and lessons
4. Check that track badges, difficulty levels, XP rewards, and instructor info display correctly

### 6.3 Enroll in a course

1. On a course detail page, click **"Enroll Now"**
2. If your wallet is connected, this sends an on-chain `enroll` transaction (user-signed)
3. The enrollment PDA is created on Solana
4. The `enrolled` event fires and the UI updates in real-time

### 6.4 Complete a lesson

1. Click into a lesson from the course detail page
2. **Content lessons:** Read the material, click "Mark as Complete"
3. **Challenge lessons:** Write code in the Monaco editor, click "Run Code", pass all test cases
4. On completion, the frontend calls `POST /api/progress` (Supabase) and `POST /complete-lesson` (backend → Solana)
5. XP is minted to your Token-2022 ATA
6. The `lessonCompleted` event fires — green "Complete" badge appears

### 6.5 Check dashboard

1. Go to [localhost:3000/en/dashboard](http://localhost:3000/en/dashboard)
2. Verify:
   - **Total XP** updates after lesson completions
   - **Level** progresses
   - **Active Courses** shows your enrolled courses with progress bars
   - **Streak Calendar** tracks daily activity
   - **Recent Activity** shows XP transactions
   - **Achievements** section shows locked/unlocked badges

### 6.6 Check leaderboard

1. Go to [localhost:3000/en/leaderboard](http://localhost:3000/en/leaderboard)
2. Switch between Weekly / Monthly / All Time timeframes
3. Your XP should appear in the rankings

### 6.7 Community

1. Go to [localhost:3000/en/community](http://localhost:3000/en/community)
2. Create a new post
3. Browse existing posts

### 6.8 Profile

1. Go to [localhost:3000/en/profile](http://localhost:3000/en/profile)
2. Edit display name, bio, avatar
3. Link additional accounts (wallet + OAuth)

### 6.9 Admin panel

1. Go to [localhost:3000/en/admin](http://localhost:3000/en/admin)
2. Check the 4 tabs:
   - **Users** — User table (mock data until Supabase is populated)
   - **Courses** — Course stats
   - **Analytics** — Enrollment and XP charts
   - **Live Feed** — Real-time on-chain events (open this in a separate tab while doing other actions to watch events stream in)

---

## Phase 7: Demo Walkthrough — CLI Scripts

For a pure on-chain demo without the UI, use the CLI scripts directly.

### 7.1 Full E2E flow (single command)

Runs the complete learner journey: enroll → complete all lessons → finalize → issue credential → close enrollment.

```bash
cd onchain-academy
npx ts-node scripts/e2e-flow.ts intro-to-solana <collection-address>
```

Replace `<collection-address>` with the address from step 1.5. This script is **resumable** — if it fails partway, re-run and it picks up where it left off.

### 7.2 Step-by-step

```bash
cd onchain-academy

# Enroll
npx ts-node scripts/enroll.ts intro-to-solana

# Complete lessons one by one (0-indexed)
npx ts-node scripts/complete-lesson.ts intro-to-solana 0
npx ts-node scripts/complete-lesson.ts intro-to-solana 1
# ... repeat for all 10 lessons (indices 0-9)

# Finalize course (awards bonus XP)
npx ts-node scripts/finalize-course.ts intro-to-solana

# Issue credential NFT
npx ts-node scripts/issue-credential.ts intro-to-solana <collection-address>

# Check XP balance
npx ts-node scripts/check-xp.ts

# Inspect enrollment state
npx ts-node scripts/fetch-enrollment.ts intro-to-solana
```

### 7.3 Admin operations

```bash
cd onchain-academy

# Create a new course
npx ts-node scripts/create-mock-course.ts

# Register a new minter
# (use Anchor CLI or write a custom script)

# Fetch program config
npx ts-node scripts/fetch-config.ts

# Fetch any course
npx ts-node scripts/fetch-course.ts defi-on-solana
```

---

## Phase 8: Verify Everything

### On-chain state

```bash
cd onchain-academy

# Config PDA
npx ts-node scripts/fetch-config.ts

# Course state (should show totalEnrollments, totalCompletions incremented)
npx ts-node scripts/fetch-course.ts intro-to-solana

# Enrollment state (should show lessonFlags bitmap, completedAt timestamp)
npx ts-node scripts/fetch-enrollment.ts intro-to-solana

# XP balance (Token-2022 ATA)
npx ts-node scripts/check-xp.ts
```

### Supabase

Check in Supabase Table Editor:
- `profiles` — Your user record exists
- `enrollments` — Course enrollment with `progress_pct` and `lesson_flags`
- `xp_transactions` — XP award entries
- `user_stats` — Aggregated stats (total_xp, level, streak)

### Solana Explorer

View your transactions on [explorer.solana.com/?cluster=devnet](https://explorer.solana.com/?cluster=devnet):
- Search your wallet address to see all transactions
- Search the program ID to see all program interactions
- Search the XP mint to see token mints

---

## Quick Reference

### Services to run

| Service | Directory | Command | Port |
|---------|-----------|---------|------|
| Frontend | `app/` | `pnpm dev` | 3000 |
| Backend | `backend/` | `npm run dev` | 3001 |

### Key addresses (devnet)

| What | Address |
|------|---------|
| Program | `GuBhF6hk5yKhnvU5712LZwUPaoAmoxtJf9GTh4CHTxsF` |
| XP Mint | `F1PbQKRkn3UXnhCJErDSAtNmiScKPdMpwJxLLR7F3JQM` |
| Track Collection | `GyTUPBnidX3fWPwAJq7VpQRx5tMhQe3TXk5hbRo8wZS7` |

### Troubleshooting

| Problem | Fix |
|---------|-----|
| `anchor deploy` fails | Airdrop more SOL: `solana airdrop 5 -k ../wallets/signer.json --url devnet` |
| Frontend shows mock data | Check `.env.local` — Supabase and Sanity vars must be set |
| Backend returns 401 | Ensure `AUTH_SECRET` matches between `app/.env.local` and `backend/.env` |
| XP not minting | Verify backend signer is registered as minter: `npx ts-node scripts/fetch-config.ts` |
| Events not showing in Live Feed | WebSocket RPC required — public devnet RPC may not support WebSocket. Use Helius. |
| Lesson completion fails on-chain | Check enrollment exists: `npx ts-node scripts/fetch-enrollment.ts <courseId>` |
| Credential issuance fails | Ensure course is finalized first, and collection address is correct |

---

## What to Test

Checklist for your demo run:

- [ ] Program deploys to devnet
- [ ] `initialize.ts` creates Config + XP Mint
- [ ] `create-all-courses.ts` creates 5 courses
- [ ] Backend starts and `/health` returns ok
- [ ] Frontend starts and course catalog loads from Sanity
- [ ] Sign in works (OAuth or wallet)
- [ ] Course detail page shows modules and lessons
- [ ] Enrollment creates on-chain PDA
- [ ] Lesson completion mints XP
- [ ] Dashboard reflects XP and progress
- [ ] Code challenge editor runs tests correctly
- [ ] Leaderboard shows rankings
- [ ] Admin Live Feed shows events (if WebSocket RPC available)
- [ ] E2E script completes full learner journey
- [ ] Credential NFT is minted and soulbound
