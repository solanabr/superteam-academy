# Solana Quest - RPG-Themed Solana Learning Platform

> Your Epic Quest Into Solana Development

Solana Quest is an open-source, RPG-themed learning management system (LMS) for Solana development. It transforms blockchain education into an interactive gaming experience with XP leveling, boss battle coding challenges, on-chain credentials (evolving cNFTs), and a community-driven leaderboard.

Built for [Superteam Brazil](https://superteam.fun) as the foundation for Solana developer education across Latin America and beyond.

## Features

- **10 Core Pages** - Landing, Course Catalog, Course Detail, Lesson View, Code Editor, Dashboard, Profile, Leaderboard, Settings, Certificate Verification
- **RPG Gamification** - XP & Leveling (soulbound tokens), Daily Streaks, 256 Achievements, Skill Tree
- **Boss Battle Challenges** - Interactive coding challenges with real-time test feedback
- **On-Chain Credentials** - Evolving compressed NFTs (cNFTs) via Metaplex Bubblegum
- **Multi-Wallet Auth** - Phantom, Solflare, Torus + Google/GitHub sign-in
- **Integrated Code Editor** - Browser-based code editing with syntax highlighting
- **Multi-Language** - English, Portuguese (PT-BR), Spanish (ES)
- **Dark/Light Themes** - RPG-inspired dark mode as primary
- **Responsive Design** - Mobile-first, works on all screen sizes

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Animations | Framer Motion |
| State | Zustand (persisted) |
| Auth | Solana Wallet Adapter + Supabase |
| Blockchain | @solana/web3.js, SPL Token, Metaplex |
| i18n | next-intl (EN, PT-BR, ES) |
| Analytics | PostHog + GA4 + Sentry |
| Deployment | Vercel |

## Quick Start

### Prerequisites

- Node.js 18+ (recommended: 22)
- npm 9+
- A Solana wallet (Phantom, Solflare, etc.)

### Installation

```bash
# Clone the repository
git clone https://github.com/solanabr/superteam-academy.git
cd superteam-academy/frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

```env
# Solana
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=your_program_id
NEXT_PUBLIC_XP_MINT_ADDRESS=your_xp_mint

# Supabase (optional for MVP)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Analytics (optional)
NEXT_PUBLIC_GA4_ID=G-XXXXXXXXXX
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Scripts

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (app)/              # Authenticated app routes
│   │   ├── courses/        # Course catalog & detail
│   │   ├── dashboard/      # User dashboard
│   │   ├── leaderboard/    # Rankings
│   │   ├── profile/        # User profile
│   │   ├── settings/       # User settings
│   │   └── certificates/   # Credential verification
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Landing page
│   └── globals.css         # Theme & global styles
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── layout/             # Header, Footer
│   └── providers.tsx       # Theme, Wallet, Toast providers
├── config/
│   └── constants.ts        # App config, XP system, achievements
├── i18n/
│   └── messages/           # EN, PT-BR, ES translations
├── lib/
│   └── utils.ts            # Utility functions
├── services/
│   ├── learning-progress.ts # Progress service (stubbed)
│   └── mock-data.ts        # Mock courses, leaderboard, etc.
├── stores/
│   └── user-store.ts       # Zustand user state
└── types/
    └── index.ts            # TypeScript interfaces & service contracts
```

## Service Interfaces

The platform uses clean service interfaces designed for easy swap from local storage to on-chain:

```typescript
interface LearningProgressService {
  getProgress(userId: string, courseId: string): Promise<Progress>;
  completeLesson(userId: string, courseId: string, lessonIndex: number): Promise<void>;
  getXP(userId: string): Promise<number>;
  getStreak(userId: string): Promise<StreakData>;
  getLeaderboard(timeframe: 'weekly' | 'monthly' | 'alltime'): Promise<LeaderboardEntry[]>;
  getCredentials(wallet: PublicKey): Promise<Credential[]>;
}
```

Currently stubbed with localStorage. The on-chain program at `github.com/solanabr/superteam-academy` will be connected via these interfaces.

## XP & Leveling

- **Level Formula**: `Level = floor(sqrt(xp / 100))`
- **XP Sources**: Lesson completion (10-50), Challenges (25-100), Course completion (500-2000), Daily streaks (10), First daily (25)
- **On-Chain**: XP is a soulbound Token-2022 (NonTransferable) fungible token

## On-Chain Integration

| Feature | Status | Details |
|---------|--------|---------|
| Wallet Auth | Implemented | Multi-wallet adapter (Phantom, Solflare, Torus) |
| XP Display | Stubbed | Reads from localStorage, ready for token balance |
| Credentials | Stubbed | Mock cNFT display, ready for Metaplex Read API |
| Leaderboard | Stubbed | Mock data, ready for Helius DAS API indexing |
| Lesson Completion | Stubbed | localStorage, ready for backend-signed txns |
| Enrollment | Stubbed | localStorage, ready for PDA creation |

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in Vercel
3. Set environment variables
4. Deploy

### Manual

```bash
npm run build
npm start
```

## License

MIT License - See [LICENSE](LICENSE) for details.

## Credits

Built with love by the community for [Superteam Brazil](https://superteam.fun).

- [Solana](https://solana.com) - The blockchain
- [Next.js](https://nextjs.org) - The framework
- [shadcn/ui](https://ui.shadcn.com) - The components
- [Framer Motion](https://www.framer.com/motion/) - The animations
