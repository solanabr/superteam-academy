# Superteam Academy

![Superteam Academy](public/images/cover/superteam-theme.png)

Superteam Brazil is building the ultimate learning platform for Solana-native developers -- an open-source, interactive education hub that takes builders from zero to deploying production-ready dApps.

Think a complete and engaging learning experience for Solana: gamified progression, interactive coding challenges, on-chain credentials, and a community-driven hub built for crypto natives.

## Screenshots

<div align="center">
  <img src="public/images/cover/dark-theme.png" alt="Dark Theme" width="45%" />
  <img src="public/images/cover/light-theme.png" alt="Light Theme" width="45%" />
</div>

## Overview

This platform is a production-ready learning management system (LMS) for Solana development. Features include:

1. **Interactive Code Editor:** Split-pane Markdown mixed with live code challenge validation for Rust, TypeScript, and JSON.
2. **Robust Authentication:** Powered by Better Auth allowing wallet linking to Web2 identities (Google/GitHub).
3. **Multi-Wallet Support:** Full integration with Solana Wallet Adapter to connect any Solana wallet.
4. **On-chain Credentials (cNFTs):** Soulbound Metaplex Core NFTs represent the completion of courses mapping to the user's progress.
5. **Gamification (XP System):** Earn on-chain XP tokens (Token-2022) as you progress through lessons and challenges.
6. **Dynamic Badges & Achievements:** Unlock custom Metaplex Core NFT achievements based on platform activity.
7. **Streak Tracking:** Build up consecutive daily coding streaks to earn multipliers and maintain engagement.
8. **CMS Managed Content:** Completely flexible and dynamic courses managed via Sanity CMS.
9. **Bounties Integration:** Directly integrate and display active developer bounties for learners to tackle.
10. **Internationalization (i18n):** Deep translation support for 15 languages across the entire UI (English, Portuguese, Spanish, German, French, Hindi, Indonesian, Italian, Japanese, Korean, Nepali, Russian, Turkish, Vietnamese, and Chinese).
11. **Local Environment Support:** Easy integration for running local Solana validators and mimicking mainnet/devnet environments.
12. **Live Execution Feedback:** Real-time terminal emulation and pass/fail feedback for embedded coding exercises.
13. **Global Leaderboards:** Competitive ranking system filtering by week, month, or all-time XP earned.
14. **User Dashboards:** Comprehensive user profiles mapping connected wallets, completed courses, and skill graphs.
15. **Dark Mode by Default:** A polished, developer-focused aesthetic built on Tailwind CSS v4 and Shadcn UI.

## Project Structure

```text
superteam-academy/
├── app/               # Next.js 16 App Router pages and API routes
├── components/        # Reusable React UI components (Shadcn, custom)
├── i18n/              # Internationalization configuration
├── lib/               # Shared utilities, constants, and database schemas
├── locales/           # Translation JSON files for 15 languages (EN, PT-BR, ES, DE, FR, HI, ID, IT, JA, KO, NE, RU, TR, VI, ZH)
├── public/            # Static assets and images
├── sanity/            # Sanity CMS schemas and studio configuration
├── scripts/           # Utility scripts (e.g., collection generation)
└── wallets/           # Local wallet keypairs for on-chain scripting
```

## Tech Stack

Our technical implementation has been fully optimized to leverage the latest ecosystem tools:

- **Frontend Framework**: React 19 + Next.js 16 (App Router)
- **Language**: Strict TypeScript
- **Styling**: Tailwind CSS v4, PostCSS, Shadcn UI, Framer Motion
- **Headless CMS**: Sanity CMS
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Better Auth, Solana Wallet Adapter
- **Blockchain**: Solana Web3.js, Anchor Framework, Metaplex Core
- **Analytics**: PostHog, Google Analytics
- **Error Tracking**: Sentry

## On-Chain Gamification System

The platform's logic connects to an Anchor program at [github.com/solanabr/superteam-academy](https://github.com/solanabr/superteam-academy).

- **XP**: A soulbound fungible token (Token-2022). Level = `floor(sqrt(xp / 100))`.
- **Credentials**: Metaplex Core NFTs, soulbound via PermanentFreezeDelegate. They upgrade as the learner progresses.
- **Achievements**: Represented on-chain through `AchievementType` and `AchievementReceipt` PDAs, backing soulbound Metaplex Core NFTs.
- **Streaks**: A frontend-managed daily activity tracker.

## Setup Instructions

### Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v20 or higher) - [Download](https://nodejs.org/)
- **Bun** (latest version) - [Install Guide](https://bun.sh/)
- **Rust & Cargo** - [Install via rustup](https://rustup.rs/)
- **Solana CLI** - [Installation Guide](https://docs.solana.com/cli/install-solana-cli-tools)
- **Anchor CLI** (v0.32+) - [Installation Guide](https://www.anchor-lang.com/docs/installation)
- **PostgreSQL** (v14+) - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/)

### Step-by-Step Setup Guide

#### 1. Clone the Repository

```bash
git clone https://github.com/exyreams/superteam-academy.git
cd superteam-academy
```

#### 2. Install Dependencies

```bash
bun install
```

This will install all required npm packages including Next.js, React, Solana libraries, and development tools.

#### 3. Set Up PostgreSQL Database

Create a new PostgreSQL database for the project:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE superteam_academy;

# Exit psql
\q
```

#### 4. Configure Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env.local
```

Open `.env.local` and configure the following required variables:

**Database Configuration:**

```env
DATABASE_URL="postgresql://user:password@localhost:5432/superteam_academy"
```

**Solana Configuration:**

```env
NEXT_PUBLIC_PROGRAM_ID="YOUR_PROGRAM_ID"
NEXT_PUBLIC_XP_MINT="YOUR_XP_MINT_ADDRESS"
NEXT_PUBLIC_AUTHORITY="YOUR_AUTHORITY_ADDRESS"
NEXT_PUBLIC_CLUSTER="devnet"
```

**Backend Signer (Required for on-chain operations):**

```env
BACKEND_SIGNER_KEYPAIR="[124,56,12,...]"  # Your wallet private key as JSON array
XP_MINT_KEYPAIR="[124,56,12,...]"  # XP mint authority keypair
```

**Sanity CMS:**

```env
NEXT_PUBLIC_SANITY_PROJECT_ID="YOUR_SANITY_PROJECT_ID"
NEXT_PUBLIC_SANITY_DATASET="production"
SANITY_API_TOKEN="YOUR_SANITY_API_TOKEN"
```

**Better Auth:**

```env
BETTER_AUTH_SECRET="YOUR_BETTER_AUTH_SECRET"  # Generate with: openssl rand -base64 32
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_TRUSTED_ORIGINS="http://localhost:3000"
```

**OAuth Providers (Optional):**

```env
GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"
GITHUB_CLIENT_ID="YOUR_GITHUB_CLIENT_ID"
GITHUB_CLIENT_SECRET="YOUR_GITHUB_CLIENT_SECRET"
```

**Admin Access:**

```env
ADMIN_WALLETS="YOUR_WALLET_ADDRESS"
ADMIN_EMAILS="your-email@example.com"
```

**Analytics (Optional):**

```env
NEXT_PUBLIC_POSTHOG_KEY="YOUR_POSTHOG_KEY"
NEXT_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com"
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID="G-XXXXXXXXXX"
```

#### 5. Generate Solana Keypairs

Create a `wallets` directory and generate keypairs for local development:

```bash
mkdir -p wallets
solana-keygen new --outfile wallets/signer.json --no-bip39-passphrase
```

Convert the keypair to the format needed for environment variables:

```bash
# Display keypair as JSON array
cat wallets/signer.json
```

Copy the output array and paste it into your `.env.local` for `BACKEND_SIGNER_KEYPAIR`.

#### 6. Initialize Database Schema

Push the Drizzle ORM schema to your PostgreSQL database:

```bash
bun run db:push
```

This creates all necessary tables and relationships in your database.

#### 7. Set Up Sanity CMS (Optional but Recommended)

If you want to manage course content:

1. Create a Sanity project at [sanity.io](https://www.sanity.io/)
2. Copy your project ID and dataset name to `.env.local`
3. Generate an API token with write permissions
4. Navigate to the Sanity studio (if included) or use the Sanity CLI

#### 8. Initialize the Platform

Run the initialization endpoint to set up on-chain accounts:

```bash
# Start the dev server first
bun run dev

# In another terminal, call the init endpoint
curl http://localhost:3000/api/init
```

This creates the necessary on-chain accounts for XP tokens and achievements.

#### 9. Start the Development Server

```bash
bun run dev
```

The application will be available at `http://localhost:3000`.

#### 10. Verify Setup

1. Open your browser to `http://localhost:3000`
2. Connect a Solana wallet (Phantom, Backpack, etc.)
3. Sign in with wallet or OAuth provider
4. Check that the dashboard loads correctly

### Additional Setup Commands

**Database Management:**

```bash
bun run db:studio      # Open Drizzle Studio to view/edit database
bun run db:generate    # Generate migration files
bun run db:migrate     # Run migrations
bun run db:pull        # Pull schema from database
```

**Code Quality:**

```bash
bun run check          # Run Biome checks (format + lint)
bun run format         # Format code with Biome
bun run lint           # Lint code with Biome
bun run lint:fix       # Fix linting errors automatically
bun run typecheck      # Run TypeScript type checking
```

**Production Build:**

```bash
bun run build          # Build for production
bun run start          # Start production server
```

## Course Collections Generation Guide

For the credentialing system to work correctly, Metaplex Core collections must be generated for each Learning Track in our system. We provide an easy-to-use script for this.

**Before running the script**, ensure you have a standard keypair file configured as the signer:

1. Create a `wallets` folder in the root project directory (if it doesn't already exist).
2. Save your wallet's `signer.json` byte array inside `wallets/signer.json`.
   ```bash
   # Example format
   [54, 21, 65, ...]
   ```

**To generate the track collections:**

Run the script using Bun from the root of your project:

```bash
bun run scripts/create-track-collections.ts
```

_Output:_

- The script will connect to the Solana Devnet.
- It derives the needed authority PDA and issues collections using your explicit signer.
- The derived track-to-address mapping is logged to the console and simultaneously written to `track-collections-output.json` in your root directory.
- Use this mapping to update the `TRACK_COLLECTIONS` object in `lib/constants/leaderboard.ts` with your newly generated collection public keys.

## Development Scripts

- `bun run check`: Check code formatting and linting (Biome).
- `bun run typecheck`: Run strict TypeScript checks.
- `bun run format`: Auto-format codebase.
- `bun run lint:fix`: Fix linting errors.

## Repositories & Contacts

- **Repository URL**: [https://github.com/exyreams/superteam-academy](https://github.com/exyreams/superteam-academy)
- **Contact Email**: [exyreams@gmail.com](mailto:exyreams@gmail.com)
- **Twitter**: [@SuperteamBR](https://twitter.com/SuperteamBR)
- **Discord**: [discord.gg/superteambrasil](https://discord.gg/superteambrasil)

## Contributing & Security

Feel free to read through our [Contributing Guidelines](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md).

If you discover a security vulnerability, please refer to our [Security Policy](SECURITY.md) and email us at exyreams@gmail.com.

## License

This project is distributed under the MIT License. See `LICENSE` for more information.
