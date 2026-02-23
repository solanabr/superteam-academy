# Superteam Academy

A production-ready, on-chain learning management system for Solana developers. Complete interactive courses, earn soulbound XP tokens, collect credential NFTs, and compete on leaderboards — all verified on Solana devnet.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router), React 18, TypeScript (strict) |
| Styling | Tailwind CSS with semantic design tokens, CSS custom properties |
| UI Components | Radix UI primitives, custom component library |
| Wallet | @solana/wallet-adapter (Phantom, Solflare, Torus, Ledger) |
| On-Chain | @coral-xyz/anchor, @solana/web3.js, Token-2022, Metaplex Core |
| CMS | Sanity (headless) with @sanity/client + @portabletext/react |
| Auth | Wallet adapter + next-auth (Google, GitHub) |
| Analytics | GA4, PostHog (heatmaps), Sentry (error monitoring) |
| Code Editor | Monaco Editor (@monaco-editor/react) |
| i18n | next-intl (EN, PT-BR, ES) |
| Charts | Recharts (skill radar, progress) |
| Testing | Playwright E2E (76 tests, chromium + mobile) |

## Pages

| Page | Route | Description |
|---|---|---|
| Landing | `/` | Hero section, feature cards, course catalog |
| Course Catalog | `/` (below hero) | Filterable grid with search, difficulty, and track filters |
| Course Detail | `/courses/[courseId]` | Syllabus, enrollment, lesson progress grid |
| Lesson View | `/courses/[courseId]/lessons/[i]` | Split-pane: content + Monaco code editor |
| Dashboard | `/my-learning` | XP stats, courses, streak calendar, recommendations |
| Profile | `/profile` | Skill radar, XP/level, credentials, achievements |
| Leaderboard | `/leaderboard` | XP rankings with weekly/monthly/all-time filters |
| Settings | `/settings` | Theme, language, notifications, privacy, OAuth |
| Certificate | `/certificates/[assetId]` | Visual credential with on-chain verification, share/download |
| Creator Dashboard | `/dashboard` | Course analytics for content creators |

## Quick Start

```bash
# Clone and install
git clone https://github.com/solanabr/superteam-academy.git
cd superteam-academy/app
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your keys (see Environment Variables below)

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Connect a Solana wallet (devnet) to interact with on-chain features.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_HELIUS_URL` | Yes | Helius RPC URL (devnet) |
| `NEXT_PUBLIC_PROGRAM_ID` | Yes | Anchor program address |
| `NEXT_PUBLIC_XP_MINT` | Yes | XP token mint (Token-2022) |
| `NEXT_PUBLIC_TRACK_COLLECTION` | Yes | Metaplex Core collection |
| `BACKEND_SIGNER_KEYPAIR` | Yes | Base58 backend signer private key |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | No | Sanity CMS project ID |
| `NEXT_PUBLIC_SANITY_DATASET` | No | Sanity dataset (default: `production`) |
| `NEXT_PUBLIC_GA_ID` | No | Google Analytics 4 measurement ID |
| `NEXT_PUBLIC_POSTHOG_KEY` | No | PostHog project API key |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Sentry DSN for error monitoring |
| `NEXTAUTH_SECRET` | No | NextAuth session secret |
| `NEXTAUTH_URL` | No | App URL for NextAuth callbacks |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `GITHUB_ID` | No | GitHub OAuth app ID |
| `GITHUB_SECRET` | No | GitHub OAuth app secret |

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint
npx playwright test  # E2E tests (76 tests)
```

## On-Chain Integration

The app interacts with a deployed Anchor program on Solana devnet:

- **Wallet signs**: `enroll`, `close_enrollment`
- **Backend signs**: `complete_lesson`, `finalize_course`, `issue_credential`
- **XP**: Soulbound Token-2022 tokens (NonTransferable, PermanentDelegate)
- **Credentials**: Metaplex Core NFTs with PermanentFreezeDelegate (soulbound)
- **Lesson progress**: 256-bit bitmap per enrollment PDA

See [ARCHITECTURE.md](./ARCHITECTURE.md) for system design and data flow.

## Gamification

- **XP & Levels**: `Level = floor(sqrt(xp / 100))` — displayed everywhere
- **Streaks**: Daily activity tracking with calendar heatmap, freeze tokens, milestones at 3/7/14/30/60/100 days
- **Achievements**: 6 badge categories (Progress, Streaks, Skills, Community, Special)
- **Leaderboard**: On-chain XP rankings with time-based filtering

## CMS

Sanity headless CMS manages course content, lesson bodies (PortableText), code challenges, and quiz questions. See [CMS_GUIDE.md](./CMS_GUIDE.md) for schema documentation and content workflow.

## Theming

Light/dark/system themes via CSS custom properties + `next-themes`. All 35+ components use semantic tokens (`bg-surface`, `text-content`, `border-edge`). See [CUSTOMIZATION.md](./CUSTOMIZATION.md).

## Deployment

Deploy to Vercel:

```bash
npm run build  # Verify build passes
# Push to GitHub, connect repo to Vercel
# Set environment variables in Vercel dashboard
```

The app is fully compatible with Vercel's serverless deployment. API routes handle backend signing without a separate server. An optional standalone Express backend is available in `../backend/` for alternative deployments.

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — System design, component tree, data flow
- [CMS_GUIDE.md](./CMS_GUIDE.md) — Sanity schema, content workflow, seed data
- [CUSTOMIZATION.md](./CUSTOMIZATION.md) — Theming, i18n, gamification extension

## License

MIT
