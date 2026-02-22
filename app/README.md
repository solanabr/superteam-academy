# Superteam Academy Frontend

Decentralized learning platform on Solana. Learn, earn XP tokens, collect soulbound credentials.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16, React 19 |
| **Styling** | Tailwind CSS 4, shadcn/ui |
| **i18n** | next-intl (en, pt-BR, es) |
| **Auth** | NextAuth v5 beta (Google, GitHub, Solana SIWS) |
| **CMS** | Sanity (course content) |
| **Database** | Supabase (user progress, gamification) |
| **Blockchain** | Solana devnet, Anchor, Token-2022 XP, Metaplex Core |
| **Analytics** | PostHog, GA4, Sentry |
| **Testing** | Playwright, Jest |
| **PWA** | next-pwa |

## Prerequisites

- Node.js 20+
- pnpm 9+
- Solana CLI 1.18+
- Supabase account
- Sanity account

## Quick Start

```bash
# Clone
git clone https://github.com/solanabr/superteam-academy.git
cd superteam-academy/app

# Install
pnpm install

# Environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

**Supabase:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Sanity:**
- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET`
- `SANITY_WEBHOOK_SECRET`

**Auth (NextAuth v5):**
- `AUTH_SECRET` (generate: `openssl rand -base64 32`)
- `GITHUB_ID`, `GITHUB_SECRET`
- `GOOGLE_ID`, `GOOGLE_SECRET`

**Solana:**
- `NEXT_PUBLIC_SOLANA_RPC_URL` (Helius devnet)
- `NEXT_PUBLIC_PROGRAM_ID=GuBhF6hk5yKhnvU5712LZwUPaoAmoxtJf9GTh4CHTxsF`
- `NEXT_PUBLIC_XP_MINT`
- `NEXT_PUBLIC_BACKEND_SIGNER`

**Analytics:**
- `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`
- `NEXT_PUBLIC_GA_ID`
- `SENTRY_DSN`

## Scripts

```bash
pnpm dev              # Development server (localhost:3000)
pnpm build            # Production build
pnpm start            # Serve production build
pnpm lint             # ESLint
pnpm lint:fix         # Auto-fix lint issues
pnpm format           # Prettier formatting
pnpm test             # Run tests
pnpm test:e2e         # Playwright E2E tests
pnpm type-check       # TypeScript validation
```

## Project Structure

```
app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── [locale]/           # i18n routes (en, pt-BR, es)
│   │   ├── api/                # API routes (auth, webhooks)
│   │   └── layout.tsx          # Root layout
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui primitives
│   │   ├── course/             # Course-related components
│   │   ├── lesson/             # Lesson viewer, code challenges
│   │   └── dashboard/          # Dashboard widgets
│   ├── lib/
│   │   ├── services/           # Service layer (5 interfaces + implementations)
│   │   ├── solana/             # On-chain integration, PDA helpers
│   │   ├── sanity/             # CMS queries, schemas
│   │   └── supabase/           # Database client
│   ├── hooks/                  # Custom React hooks
│   ├── utils/                  # Helper functions
│   └── messages/               # i18n message files (en.json, pt-BR.json, es.json)
├── public/                     # Static assets
├── .env.example                # Environment template
├── next.config.mjs             # Next.js config
├── tailwind.config.ts          # Tailwind config
├── playwright.config.ts        # E2E test config
├── README.md                   # This file
├── ARCHITECTURE.md             # System architecture
├── CMS_GUIDE.md                # Sanity Studio guide
└── CUSTOMIZATION.md            # Theming and extensions
```

## Service Layer

All external integrations use dual mock/real implementations with runtime fallback:

- **LearningProgressService**: User progress tracking (Supabase)
- **GamificationService**: XP, achievements, daily challenges (Supabase)
- **LeaderboardService**: Global/track XP rankings (Helius DAS API)
- **CredentialService**: Metaplex Core NFT queries (Helius DAS API)
- **CodeExecutionService**: Code challenge validation (future: sandboxed runtime)

See `ARCHITECTURE.md` for details.

## Data Flow

**Content**: Sanity CMS → frontend queries
**User Data**: Supabase (progress, gamification, off-chain state)
**XP Tokens**: Solana Token-2022 (soulbound, non-transferable)
**Credentials**: Metaplex Core NFTs (soulbound, on-chain attributes)
**Enrollments**: Program PDAs (on-chain enrollment records)

## Backend Service

Separate Hono server at `/backend/` holds `backend_signer` keypair for:
- Lesson completion verification
- Course finalization signatures
- Credential issuance

Frontend sends requests → backend validates → backend signs → frontend submits to Solana.

## Deployment

**Vercel (recommended):**

```bash
# Connect to Vercel
pnpm vercel

# Set environment variables in Vercel dashboard
# Deploy
pnpm vercel --prod
```

**Docker:**

```bash
docker build -t superteam-academy .
docker run -p 3000:3000 superteam-academy
```

## Testing

**Unit tests:**
```bash
pnpm test
```

**E2E tests:**
```bash
pnpm test:e2e
```

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture, data flow, on-chain integration
- [CMS_GUIDE.md](./CMS_GUIDE.md) - Sanity Studio content management
- [CUSTOMIZATION.md](./CUSTOMIZATION.md) - Theming, i18n, gamification extensions

## Program Documentation

On-chain program docs:
- [docs/SPEC.md](../docs/SPEC.md) - Program specification
- [docs/INTEGRATION.md](../docs/INTEGRATION.md) - Frontend integration guide
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) - Program architecture

## License

MIT
