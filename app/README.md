# Superteam Brazil Academy

A Solana developer education platform built for the Superteam Brazil hackathon. Learn Solana development through structured courses, earn XP tokens on-chain, and receive verifiable credentials as soulbound NFTs.

## Features

- **On-Chain Enrollment** — Students enroll via a Solana wallet transaction (Phantom, Solflare, Backpack)
- **XP Token Rewards** — Completing lessons mints Token-2022 XP tokens to the learner's wallet
- **Verifiable Credentials** — Course completion issues a Metaplex Core soulbound NFT credential
- **Quiz System** — MCQ auto-grading and file-upload assignments with instructor grading
- **Multilingual** — English, Português (Brasil), and Español via next-intl
- **XP Leaderboard** — Rankings across all learners
- **Sanity CMS** — Instructors manage course content through a headless CMS
- **Admin Dashboard** — Course management, student progress, quiz grading

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router, Turbopack) |
| Database | Neon PostgreSQL + Drizzle ORM |
| Auth | NextAuth v5 (Google, GitHub OAuth + OTP email) |
| On-chain | Anchor 0.31 / Solana Devnet |
| Wallet | @solana/wallet-adapter (Phantom, Solflare, Backpack) |
| CMS | Sanity.io |
| Storage | Cloudflare R2 (assignment uploads) |
| i18n | next-intl (EN, PT-BR, ES) |
| Email | Resend |
| Monitoring | Sentry + Google Analytics |

## Quick Start

### Prerequisites

- Node.js 18+
- A Neon PostgreSQL database
- A Sanity project
- Google and/or GitHub OAuth credentials

### 1. Clone and install

```bash
git clone <your-repo-url>
cd Brazil-LMS
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://..."

# Auth
AUTH_SECRET="your-secret-32-chars"
AUTH_GOOGLE_ID="..."
AUTH_GOOGLE_SECRET="..."
AUTH_GITHUB_ID="..."
AUTH_GITHUB_SECRET="..."

# Sanity CMS
NEXT_PUBLIC_SANITY_PROJECT_ID="..."
NEXT_PUBLIC_SANITY_DATASET="production"
SANITY_API_TOKEN="..."

# Solana (Devnet)
NEXT_PUBLIC_SOLANA_RPC_URL="https://api.devnet.solana.com"
NEXT_PUBLIC_SOLANA_NETWORK="devnet"
NEXT_PUBLIC_PROGRAM_ID="CqXdxJwoSGLicykvA23DS8fKtbCX61KnyBoBpddFLoUN"
NEXT_PUBLIC_XP_MINT="BsTNEwkVqug1uULG9hH5tka4i5tgegaK1n3AMR2d2gbA"
BACKEND_SIGNER_KEYPAIR="<base58-private-key>"  # base58 string, not a file path
ADMIN_SECRET_KEY="<base58-private-key>"
CREDENTIAL_COLLECTION_ADDRESS="<metaplex-core-collection-address>"

# Email
RESEND_API_KEY="re_..."
EMAIL_FROM="Superteam Academy <noreply@yourdomain.com>"
```

### 3. Set up the database

```bash
npm run db:generate
npm run db:migrate
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## On-Chain Setup

The Anchor program is deployed on Solana Devnet at `CqXdxJwoSGLicykvA23DS8fKtbCX61KnyBoBpddFLoUN`. To initialize courses on-chain:

```bash
# 1. Assign on-chain IDs to courses in DB (dry run first)
npm run courses:backfill-onchain-ids
npm run courses:backfill-onchain-ids -- --apply

# 2. Create Course PDAs on Devnet (dry run first)
npm run onchain:init-courses
npm run onchain:init-courses -- --apply
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for full on-chain deployment instructions.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run db:migrate` | Run database migrations |
| `npm run db:studio` | Open Drizzle Studio (database GUI) |
| `npm run courses:backfill-onchain-ids` | Assign on-chain IDs to courses |
| `npm run onchain:init-courses` | Create Course PDAs on Devnet |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Sign-in, sign-up, OTP verify
│   ├── (consumer)/         # Student-facing pages
│   │   ├── courses/        # Course catalog + course detail
│   │   ├── dashboard/      # Student dashboard
│   │   ├── leaderboard/    # XP rankings
│   │   ├── profile/        # Public + private profiles
│   │   └── settings/       # Account settings
│   ├── admin/              # Admin panel (courses, progress, quizzes)
│   └── api/                # API routes (lessons, auth, quizzes)
├── features/               # Feature modules (courses, lessons, quizzes, users)
├── components/             # Shared UI components
├── drizzle/                # Database schema and migrations
├── lib/                    # Utilities (auth, Anchor PDAs, Sanity, analytics)
├── messages/               # i18n strings (en.json, pt-BR.json, es.json)
└── services/               # XP and on-chain services
```

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) — System architecture and on-chain deployment guide
- [CMS_GUIDE.md](CMS_GUIDE.md) — How to manage course content with Sanity
- [CUSTOMIZATION.md](CUSTOMIZATION.md) — Theming, branding, and configuration guide
