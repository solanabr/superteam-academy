# Superteam Academy — Frontend

A production-ready Learning Management System for Solana development education. Built on the [Superteam Academy](https://github.com/solanabr/superteam-academy) on-chain program.

## Features

### ✅ Implemented

- **Wallet Authentication** — Multi-wallet support via Solana Wallet Adapter (Phantom, Solflare, etc.)
- **XP Balance Display** — Real-time Token-2022 soulbound XP token balance from on-chain
- **Course Catalog** — Browse courses with filtering by track and difficulty level
- **Course Enrollment** — Learner-signed enrollment transactions (wallet interaction)
- **Course Detail View** — Full lesson listing, XP breakdown, enrollment flow
- **Credential NFT Display** — Query Helius DAS API for Metaplex Core credentials
- **Leaderboard** — XP-ranked leaderboard from Token-2022 balances
- **Achievement Gallery** — Browse available achievements with XP rewards
- **Profile Dashboard** — XP balance, credentials, streaks, enrolled courses
- **Learning Streak Tracker** — Frontend-only streak tracking with weekly view
- **Interactive Code Editor** — Monaco editor preview for hands-on exercises
- **i18n Ready** — PT-BR (default), ES, EN locale files
- **Responsive Design** — Mobile-first, dark theme with Solana brand colors

### 🔧 Stubbed (Clean Service Interfaces)

- **Lesson Completion** — Requires backend signer; interface at `LessonCompletionService`
- **Course Finalization** — Requires backend signer; interface at `CourseFinalizationService`
- **Credential Issuance** — Requires backend signer; interface at `CredentialIssuanceService`
- **Achievement Claiming** — Requires minter role; documented in achievements page
- **Streak Persistence** — Currently localStorage; production would use backend/PDA

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16+ (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 |
| Wallet | @solana/wallet-adapter-react |
| On-chain | @coral-xyz/anchor, @solana/web3.js |
| Token | @solana/spl-token (Token-2022) |
| NFTs | Helius DAS API (Metaplex Core) |
| Components | Radix UI primitives |
| Icons | Lucide React |
| i18n | next-intl (locale files ready) |

## Architecture

```
app/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Landing page
│   │   ├── courses/            # Course catalog + detail
│   │   ├── leaderboard/        # XP leaderboard
│   │   ├── achievements/       # Achievement gallery
│   │   └── profile/            # User dashboard
│   ├── components/
│   │   ├── layout/             # Navbar, Footer
│   │   ├── wallet/             # WalletProvider, WalletButton
│   │   └── courses/            # CourseCard, etc.
│   ├── lib/
│   │   ├── solana/             # PDA derivation, connection
│   │   ├── services/           # Course, XP, credential, streak services
│   │   └── utils/              # cn(), bitmap helpers
│   └── types/
│       └── academy.ts          # All type definitions + constants
```

### Service Layer Design

All on-chain interactions go through clean service interfaces:

```typescript
// Implemented — works on devnet
getXpBalance(wallet: PublicKey): Promise<number>
fetchAllCourses(): Promise<Course[]>
fetchCredentials(wallet: string): Promise<CredentialNFT[]>
fetchLeaderboard(): Promise<LeaderboardEntry[]>

// Stubbed — requires backend signer
lessonCompletionService.completeLesson(courseId, lessonIndex, learner)
courseFinalizationService.finalizeCourse(courseId, learner)
credentialIssuanceService.issueCredential(courseId, learner)
```

## Setup

```bash
# Clone the monorepo
git clone https://github.com/solanabr/superteam-academy
cd superteam-academy/app

# Install dependencies
pnpm install

# Copy env
cp .env.example .env.local

# Run development server
pnpm dev
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_PROGRAM_ID` | Yes | Deployed program ID |
| `NEXT_PUBLIC_XP_MINT` | Yes | XP Token-2022 mint address |
| `NEXT_PUBLIC_CLUSTER` | Yes | `devnet` or `mainnet-beta` |
| `NEXT_PUBLIC_HELIUS_RPC_URL` | No | Helius RPC for DAS API |

## On-Chain Integration

This frontend integrates with the deployed on-chain program:

- **Program ID:** `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf`
- **XP Mint:** `xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3`
- **Network:** Solana Devnet

See [docs/INTEGRATION.md](../docs/INTEGRATION.md) for full integration guide.

## Demo Flow

1. Visit the landing page — see platform overview and stats
2. Connect your Solana wallet (Phantom recommended on devnet)
3. Browse courses by track and difficulty
4. Click a course to see lessons, XP breakdown
5. Enroll in a course (wallet signs enrollment transaction)
6. View your profile — XP balance, streak, enrolled courses
7. Check the leaderboard for XP rankings
8. Browse achievements gallery

## License

MIT — see [LICENSE](../LICENSE)
