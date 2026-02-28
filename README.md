# Superteam Academy

A decentralized learning platform built on Solana. Learners enroll in courses, complete lessons to earn soulbound XP tokens, receive Metaplex Core credential NFTs, collect achievements, and participate in a community forum. Course creators earn XP rewards. The platform is governed by a multisig authority.

**Live:** [superteam-academy-ten.vercel.app](https://superteam-academy-ten.vercel.app)

## Table of Contents

- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [On-Chain Program](#on-chain-program)
- [Testing](#testing)
- [Deployment](#deployment)

## Architecture

```
superteam-academy/
├── lms/                 Next.js frontend (LMS application)
├── onchain-academy/     Anchor workspace (Solana program)
├── docs/                Specification, architecture, integration guides
├── scripts/             Helper scripts
└── wallets/             Keypairs (gitignored)
```

The LMS communicates with a Solana program deployed on devnet. Course content is stored on Arweave for immutability. MongoDB serves as the primary database with on-chain state as the source of truth for XP balances, enrollments, and credentials.

## Features

### Course System

- Course catalog with filtering by track, difficulty, and search
- Five learning tracks: Standalone, Anchor Framework, Rust for Solana, DeFi Development, Program Security
- Three difficulty levels: Beginner, Intermediate, Advanced
- Module-based course structure with ordered lessons
- Lesson types: content lessons and code challenges
- Course prerequisites (must complete prerequisite before enrolling)
- On-chain enrollment and lesson completion tracking
- Course finalization with XP rewards for both learner and creator
- Arweave-backed immutable course content

### XP and Level System

- Soulbound XP tokens (Token-2022 with NonTransferable and PermanentDelegate extensions)
- XP awarded per lesson completion, course finalization, achievements, and practice challenges
- Quadratic leveling system (level squared times 100 XP per level)
- Visual progress bar showing current XP toward next level
- Daily XP cap enforced on-chain

### Credential NFTs

- Metaplex Core NFTs issued on course completion (soulbound via PermanentFreezeDelegate)
- Track-based credentials that upgrade as more courses in a track are completed
- Metadata uploaded to Arweave with course, track, XP, and completion attributes
- Viewable in wallet and on profile page

### Practice Arena

- 75 hardcoded challenges across 10 categories: Accounts, Transactions, PDAs, Tokens, CPI, Serialization, Security, Anchor, DeFi, Advanced
- Three difficulty tiers: Easy (10 XP), Medium (25 XP), Hard (50 XP)
- Rust and TypeScript challenge support
- Monaco code editor with syntax highlighting
- Starter code, hints, and full solution reference per challenge
- Pattern-matching test runner
- Milestone rewards with on-chain SOL payouts:
  - 15 solved: Bronze (0.05 SOL)
  - 30 solved: Silver (0.1 SOL)
  - 50 solved: Gold (0.25 SOL)
  - 75 solved: Diamond (0.5 SOL)

### Daily Challenges

- AI-generated daily challenge (one per day, rotating difficulty and category)
- Daily streak tracking with current and longest streak
- Streak milestones at 7, 30, and 100 days
- Archive of past daily challenges
- Fallback to practice challenge pool when AI is unavailable

### Achievements

- 15 achievements with dynamic eligibility checks
- Categories include: First Steps, Scholar, On Fire, Consistency, Unstoppable, track-specific completions, Referral Pro, Speed Runner
- On-chain claiming with XP rewards
- Achievement badges displayed on profile and dashboard

### Streak System

- Daily activity tracking (lesson or challenge completion)
- Current streak and longest streak counters
- 30-day calendar visualization
- Streak freeze tokens (awarded as achievement rewards)
- Streak milestones tied to achievements

### Community

- Discussion threads with two types: Discussion and Question
- Thread creation with optional SOL bounty
- Reply system with syntax-highlighted code blocks (Rust, TypeScript)
- Upvoting on threads and replies
- Solution marking for question threads (bounty paid to solver)
- Peer endorsement system with community points
- Thread filtering: Recent, Popular, Unsolved
- Tagged organization and pinned threads

### Leaderboard

- Top 100 ranking by XP
- Three timeframes: Weekly, Monthly, All-Time
- Displays rank, avatar, display name, XP, level, and streak

### User Profile

- Customizable display name, bio, and avatar (preset avatar library)
- Public stats: XP, level, streak, achievements, completed courses
- Credential display
- Community points and endorsement count
- Wallet connection info

### AI Features (Powered by [Lyzr AI](https://www.lyzr.ai/))

- Learning assistant chatbot powered by Lyzr AI agent API for Solana, Anchor, and Rust questions
- AI-generated daily challenges using Lyzr AI with deduplication and retry logic
- AI code improvement suggestions on challenge editors
- Graceful fallback when AI services are unavailable

### Admin Panel

- Platform statistics dashboard (users, enrollments, completions)
- Program configuration management (authority, XP mint, backend signer)
- Season management (create, close)
- Minter role registration and revocation
- Manual XP rewards
- Achievement type creation and management
- Course management with Sanity CMS sync
- Bulk Arweave content upload

### Internationalization

- Four languages: English, Portuguese (Brazil), Spanish, Hindi
- 400+ localized strings covering all pages, buttons, tooltips, and error messages
- Locale-prefixed routing with automatic browser detection
- Language switcher in header

### Analytics

- PostHog integration for page views and custom events
- Event tracking for enrollments, completions, and achievement claims
- Proxied through Next.js rewrites to avoid ad blockers

### Wallet Integration

- Multi-wallet support: Phantom, Solflare, and others via adapter
- Connect, disconnect, and display wallet address
- Automatic learner profile initialization on first connection

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| State | Zustand, TanStack React Query |
| Solana Client | @coral-xyz/anchor, @solana/web3.js, @solana/spl-token |
| Wallet | @solana/wallet-adapter-react |
| CMS | Sanity v5 |
| Database | MongoDB (Mongoose) |
| Content Storage | Arweave via Irys SDK |
| XP Tokens | Token-2022 (NonTransferable, PermanentDelegate) |
| Credentials | Metaplex Core NFTs |
| Code Editor | Monaco Editor |
| AI | [Lyzr AI](https://www.lyzr.ai/) Agent API |
| Analytics | PostHog |
| i18n | next-intl |
| Testing | Playwright (E2E) |
| Deployment | Vercel |
| On-Chain Program | Anchor 0.31+, Rust |

## Getting Started

### Prerequisites

- Node.js 20+
- bun or npm
- Solana CLI (for on-chain interactions)
- MongoDB instance
- Sanity project (for course content)

### Installation

```bash
# Clone the repository
git clone https://github.com/krishvsoni/superteam-academy.git
cd superteam-academy

# Install LMS dependencies
cd lms
bun install

# Copy environment variables
cp .env.example .env
# Fill in the required values (see Environment Variables section)

# Run development server
bun dev
```

The app will be available at `http://localhost:3000`.

### On-Chain Program

```bash
# Build the Anchor program
cd onchain-academy
anchor build

# Run Rust unit tests
cargo test --manifest-path tests/rust/Cargo.toml

# Run TypeScript integration tests
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

## Environment Variables

Create `lms/.env` with the following:

```
# Solana RPC (use Helius for production)
NEXT_PUBLIC_RPC_ENDPOINT=https://devnet.helius-rpc.com/?api-key=YOUR_KEY

# Program
NEXT_PUBLIC_PROGRAM_ID=FBL7RFCfVd5MG3wrcjcrcYC5tht8nNi1QeGebtdFichD

# Database
DATABASE_URL=mongodb+srv://...

# Backend signer (JSON array format)
BACKEND_SIGNER_PRIVATE_KEY=[1,2,3,...]
WALLET_ADDRESS=YourBackendWalletAddress

# Admin
ADMIN_SECRET=your-setup-secret

# Sanity CMS
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-01-01
SANITY_API_TOKEN=your-token

# Analytics (optional)
NEXT_PUBLIC_POSTHOG_KEY=your-key
NEXT_PUBLIC_POSTHOG_HOST=/ingest

# AI (optional)
LYZR_API_KEY=your-key
```

All `NEXT_PUBLIC_` variables are exposed to the browser. Server-only variables (DATABASE_URL, BACKEND_SIGNER_PRIVATE_KEY, SANITY_API_TOKEN) are only available in API routes.

## Project Structure

### LMS (`lms/`)

```
lms/
├── app/
│   ├── [locale]/(app)/          Authenticated app pages
│   │   ├── courses/             Course catalog and detail pages
│   │   ├── dashboard/           User dashboard
│   │   ├── practice/            Practice arena and daily challenges
│   │   ├── community/           Discussion threads
│   │   ├── leaderboard/         XP leaderboard
│   │   ├── profile/             User profile
│   │   ├── settings/            User settings
│   │   └── certificates/        Track certificates
│   ├── admin/                   Admin panel
│   ├── api/                     50+ REST API routes
│   └── (studio)/                Sanity CMS studio
├── components/
│   ├── layout/                  Header, footer, sidebar
│   ├── landing/                 Landing page sections
│   ├── admin/                   Admin panel components
│   ├── shared/                  Reusable UI components
│   └── ui/                      Primitives (Radix UI based)
├── lib/
│   ├── solana/                  Connection, PDA, transactions, readers
│   ├── db/                      MongoDB models and helpers
│   ├── hooks/                   React hooks for API calls
│   ├── data/                    Practice challenges, sample data
│   └── services/                Sanity, AI service clients
├── i18n/                        Routing and request config
├── messages/                    Locale JSON files (en, pt-BR, es, hi)
├── public/                      Static assets
└── types/                       TypeScript type definitions
```

### On-Chain Program (`onchain-academy/`)

```
onchain-academy/
├── programs/onchain-academy/src/
│   ├── lib.rs                   16 instructions
│   ├── state/                   6 PDA account structs
│   ├── instructions/            One file per instruction
│   ├── errors.rs                26 error variants
│   ├── events.rs                15 events
│   └── utils.rs                 Shared helpers
└── tests/
    ├── onchain-academy.ts       TypeScript integration tests
    └── rust/                    Rust unit tests
```

## On-Chain Program

The Solana program manages all core state: learner profiles, course registrations, enrollments, XP minting, credential issuance, and achievements.

### Instructions

| Instruction | Description |
|-------------|-------------|
| `initialize` | Set up program config, XP mint, and backend minter role |
| `init_learner` | Create LearnerProfile PDA for a wallet |
| `enroll` | Enroll learner in a course |
| `unenroll` | Remove enrollment |
| `complete_lesson` | Mark lesson complete and mint XP |
| `finalize_course` | Finalize course completion, reward creator |
| `issue_credential` | Mint soulbound Metaplex Core NFT |
| `upgrade_credential` | Update credential metadata for track progression |
| `claim_achievement` | Claim achievement and receive XP |
| `register_referral` | Link referee to referrer |
| `award_streak_freeze` | Grant streak freeze token |
| `create_course` | Admin: register course on-chain |
| `update_course` | Admin: modify course parameters |
| `update_config` | Admin: rotate backend signer, update limits |
| `register_minter` | Admin: add minter role |
| `reward_xp` | Minter: award XP to any wallet |

### PDA Accounts

| Account | Seeds |
|---------|-------|
| Config | `["config"]` |
| Course | `["course", course_id]` |
| Enrollment | `["enrollment", course_id, learner]` |
| LearnerProfile | `["learner", wallet]` |
| MinterRole | `["minter", minter_pubkey]` |
| AchievementType | `["achievement_type", achievement_id]` |

## Testing

### E2E Tests (Playwright)

```bash
cd lms

# Run all tests
npx playwright test

# Run a specific test file
npx playwright test landing

# Run with interactive UI
npx playwright test --ui

# Run headed (visible browser)
npx playwright test --headed

# View last test report
npx playwright show-report
```

### On-Chain Tests

```bash
cd onchain-academy

# Rust unit tests
cargo test --manifest-path tests/rust/Cargo.toml

# TypeScript integration tests
anchor test
```

## Deployment

### LMS (Vercel)

The root `vercel.json` points to `lms/` as the root directory. Vercel auto-detects Next.js.

1. Connect the repository to Vercel
2. Set all environment variables in Vercel project settings
3. Deploy (branch deploys are automatic)

Ensure the backend signer wallet has SOL on devnet for transaction fees.

### On-Chain Program

```bash
cd onchain-academy
anchor build
anchor deploy --provider.cluster devnet
```

For mainnet deployment, see the pre-mainnet checklist in `CLAUDE.md`.

## Author
- [Krish Soni](https://krishsoni.co) 

## License

See [LICENSE](LICENSE) for details.
