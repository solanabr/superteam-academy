# Superteam Academy Frontend

The Next.js frontend for Superteam Academy - a decentralized learning platform on Solana with gamified progression and on-chain credentials.

## Features

- **Interactive Courses**: Hands-on coding exercises with Monaco editor
- **Multi-language Support**: Portuguese, Spanish, and English
- **Gamification**: XP, streaks, achievements, and leaderboards
- **Wallet Integration**: Solana Wallet Adapter (Phantom, Solflare, etc.)
- **On-chain Credentials**: ZK compressed NFT credentials via Light Protocol
- **Content Management**: Sanity CMS integration (optional)

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 16+ (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS + shadcn/ui |
| Blockchain | Solana Wallet Adapter, @solana/web3.js |
| CMS | Sanity (optional, falls back to mock data) |
| i18n | next-intl (PT/ES/EN) |
| Analytics | Google Analytics 4 |

## Quick Start

```bash
cd app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with hero, features, CTAs |
| `/courses` | Course catalog with filters |
| `/courses/[slug]` | Course detail with lessons |
| `/courses/[slug]/[lessonId]` | Lesson view with code editor |
| `/dashboard` | User progress, enrolled courses |
| `/leaderboard` | XP rankings, streaks |
| `/challenges` | Daily/weekly coding challenges |
| `/profile/[address]` | User profile, credentials |
| `/settings` | Wallet, theme, notifications |

## Environment Variables

```env
# Optional: Sanity CMS
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production

# Optional: Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

## Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Foptimus-fulcria%2Fsuperteam-academy)

### Manual

```bash
npm run build
npm run start
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md) - System design and data flow
- [CMS Guide](docs/CMS_GUIDE.md) - Sanity CMS setup and content modeling

## Integration with On-chain Program

The frontend integrates with the Superteam Academy Anchor program:

- **Wallet Connection**: Multi-wallet support via @solana/wallet-adapter
- **Progress Tracking**: API routes call program instructions
- **Credentials**: Display ZK compressed credentials from Light Protocol
- **Leaderboard**: Real-time XP rankings from on-chain data

See the [root SPEC.md](../docs/SPEC.md) for program details.
