# Architecture

## Overview

Superteam Brazil Academy is a Next.js 15 application with a Solana on-chain layer. The off-chain layer handles authentication, course content, and user data via a PostgreSQL database. The on-chain layer handles enrollment, XP token minting, and credential issuance on Solana Devnet.

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│  Next.js Client Components + @solana/wallet-adapter     │
└─────────────────────┬───────────────┬───────────────────┘
                      │               │
          HTTP/RSC    │               │  Solana RPC
                      ▼               ▼
┌─────────────────────────┐   ┌───────────────────────┐
│   Next.js Server        │   │   Solana Devnet        │
│                         │   │                       │
│  App Router + Actions   │   │  Anchor Program       │
│  NextAuth v5            │   │  CqXdxJwo...          │
│  Drizzle ORM            │   │                       │
│  Sanity Client          │   │  - Config PDA         │
│                         │   │  - Course PDAs        │
└──────────┬──────────────┘   │  - Enrollment PDAs    │
           │                  │  - XP Mint (Token-2022)│
           ▼                  └───────────────────────┘
┌─────────────────────────┐
│   Neon PostgreSQL        │
│                         │
│  users, courses,        │
│  lessons, quizzes,      │
│  enrollments, xp_events │
└─────────────────────────┘
```

## Database Schema

Managed with Drizzle ORM. Key tables:

| Table | Purpose |
|-------|---------|
| `users` | User accounts (xp, streak, walletAddress, username) |
| `courses` | Course catalog (slug, difficulty, track, xpReward, onchainCourseId) |
| `course_sections` | Sections within a course |
| `lessons` | Individual lessons (videoUrl, content) |
| `user_course_progress` | Lesson completion tracking |
| `user_course_access` | Enrollment records |
| `assignments` | Quizzes and file-based assignments |
| `assignment_submissions` | Student quiz answers and scores |
| `xp_events` | XP award audit log |
| `achievements` | Achievement definitions + user awards |

Run migrations:
```bash
npm run db:generate   # generate SQL from schema changes
npm run db:migrate    # apply migrations
npm run db:studio     # open Drizzle Studio GUI
```

## Authentication

NextAuth v5 with three providers:

1. **Google OAuth** — `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET`
2. **GitHub OAuth** — `AUTH_GITHUB_ID` + `AUTH_GITHUB_SECRET`
3. **OTP Email** — via Resend, 6-digit code at `/sign-in/verify`

Session is stored in the database via `@auth/drizzle-adapter`. The `getCurrentUser()` helper at `src/lib/current-user.ts` returns the current session user with all profile fields.

## On-Chain Architecture

### Anchor Program

- **Program ID:** `CqXdxJwoSGLicykvA23DS8fKtbCX61KnyBoBpddFLoUN`
- **Source:** `~/superteam-academy/onchain-academy/`
- **Network:** Solana Devnet

### Accounts

| Account | Seed | Description |
|---------|------|-------------|
| Config PDA | `["config"]` | Program config, authority, XP mint |
| Course PDA | `["course", courseId]` | Per-course data (lessonCount, xpPerLesson) |
| Enrollment PDA | `["enrollment", courseId, learner]` | Per-learner enrollment + completion bitmap |
| Minter Role PDA | `["minter", minter]` | Authorized XP minters |

### On-Chain Flows

**Enrollment (learner-signed):**
```
Browser → Anchor enroll() → Enrollment PDA created → DB synced via enrollInCourse()
```

**Lesson Completion (backend-signed):**
```
Lesson complete → userLessonComplete() → /api/lessons/complete → completeLesson() → XP minted
```

**XP Token:**
- Standard: Token-2022 (non-transferable / soulbound)
- Mint: `BsTNEwkVqug1uULG9hH5tka4i5tgegaK1n3AMR2d2gbA`
- ATA is created automatically by the backend if it doesn't exist

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/anchor-pda.ts` | Client-safe PDA helpers (browser-importable) |
| `src/lib/anchor-program.ts` | Server-only keypair loading + Anchor program client |
| `src/app/api/lessons/complete/route.ts` | Backend-signed lesson completion endpoint |
| `src/app/(consumer)/courses/[slug]/EnrollButton.tsx` | Client-side enrollment component |
| `scripts/initialize-onchain-courses.ts` | Create Course PDAs on Devnet |
| `scripts/backfill-onchain-course-ids.ts` | Assign onchainCourseId to DB courses |

### Deploying Your Own Program Instance

1. **Install toolchain:**
   ```bash
   brew install rust solana rustup
   rustup-init -y && source "$HOME/.cargo/env"
   cargo install --git https://github.com/coral-xyz/anchor --tag v0.31.1 anchor-cli --locked --force
   ```

2. **Generate keypairs:**
   ```bash
   mkdir -p wallets
   solana-keygen new --outfile wallets/signer.json --no-bip39-passphrase
   solana config set --url devnet --keypair wallets/signer.json
   solana airdrop 5 $(solana-keygen pubkey wallets/signer.json) --url devnet
   ```

3. **Build and deploy:**
   ```bash
   cd onchain-academy
   anchor build
   anchor deploy --provider.cluster devnet
   anchor idl init --filepath target/idl/onchain_academy.json <PROGRAM_ID> --provider.cluster devnet
   ```

4. **Initialize program:**
   ```bash
   solana-keygen new --outfile wallets/xp-mint-keypair.json --no-bip39-passphrase
   ANCHOR_PROVIDER_URL=https://api.devnet.solana.com \
   ANCHOR_WALLET=$(realpath wallets/signer.json) \
   npx ts-node scripts/initialize.ts
   ```

5. **Update `.env` in Brazil-LMS:**
   ```env
   NEXT_PUBLIC_PROGRAM_ID=<your-program-id>
   NEXT_PUBLIC_XP_MINT=<your-xp-mint>
   BACKEND_SIGNER_KEYPAIR=/absolute/path/to/wallets/signer.json
   ADMIN_SECRET_KEY=/absolute/path/to/wallets/signer.json
   ```

6. **Create Course PDAs:**
   ```bash
   npm run courses:backfill-onchain-ids -- --apply
   npm run onchain:init-courses -- --apply
   ```

7. **Create the credential collection** (required for NFT minting):
   ```bash
   cd ~/superteam-academy/onchain-academy
   npx ts-node scripts/create-brazil-collection.ts
   ```
   Copy the printed address and add it to `.env`:
   ```env
   CREDENTIAL_COLLECTION_ADDRESS=<address-from-above>
   ```
   The collection is created with `updateAuthority = Config PDA` so the program controls it.

## Feature Modules

Each feature under `src/features/` follows this structure:

```
features/
└── courses/
    ├── actions/      # Server actions (create, update, enroll)
    ├── components/   # React components (CourseForm, CourseTable)
    ├── db/           # Database queries
    │   └── cache/    # Cache tag helpers
    ├── permissions/  # Authorization checks
    └── schemas/      # Zod validation schemas
```

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/send-otp` | POST | Send OTP email |
| `/api/lessons/complete` | POST | Backend-signed on-chain lesson completion + XP minting |
| `/api/credentials/mint` | POST | Finalizes course on-chain and mints Metaplex Core NFT credential |
| `/api/credentials/metadata/[courseId]` | GET | Per-credential NFT metadata (name, image, attributes) |
| `/api/credentials/collection-metadata` | GET | Collection-level NFT metadata |
| `/api/quizzes/get-upload-url` | GET | Presigned R2 URL for file submissions |
| `/api/user/wallet` | POST | Link wallet address to user account |

## Caching Strategy

Next.js server-side caching with manual revalidation:

- Course data is cached with `cacheTag("courses")` and `cacheTag("course", courseId)`
- Revalidated via `revalidatePath` / `revalidateTag` after mutations
- Lesson completion uses `unstable_cache` with user-scoped tags

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `AUTH_SECRET` | Yes | NextAuth secret (min 32 chars) |
| `AUTH_GOOGLE_ID` | Optional | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Optional | Google OAuth client secret |
| `AUTH_GITHUB_ID` | Optional | GitHub OAuth client ID |
| `AUTH_GITHUB_SECRET` | Optional | GitHub OAuth client secret |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Yes | Sanity project ID |
| `NEXT_PUBLIC_SANITY_DATASET` | Yes | Sanity dataset (usually `production`) |
| `SANITY_API_TOKEN` | Yes | Sanity write token |
| `NEXT_PUBLIC_PROGRAM_ID` | Yes | Deployed Anchor program ID |
| `NEXT_PUBLIC_XP_MINT` | Yes | Token-2022 XP mint address |
| `BACKEND_SIGNER_KEYPAIR` | Yes | Base58-encoded private key string (not a file path in production) |
| `ADMIN_SECRET_KEY` | Yes | Same as `BACKEND_SIGNER_KEYPAIR` on Devnet |
| `CREDENTIAL_COLLECTION_ADDRESS` | Optional | Metaplex Core collection address — required to mint NFT credentials |
| `RESEND_API_KEY` | Optional | Email (OTP) sending |
| `EMAIL_FROM` | Optional | From address for emails |
| `NEXT_PUBLIC_GA_ID` | Optional | Google Analytics measurement ID |
| `SENTRY_DSN` | Optional | Sentry error tracking DSN |
