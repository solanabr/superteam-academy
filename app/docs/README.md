# Superteam Academy — Frontend

Production-ready LMS for Solana developer education built with Next.js 14, TypeScript, and Tailwind CSS.

## Quick Start

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS + shadcn/ui |
| Blockchain | Solana (Anchor, Token-2022, Metaplex Core) |
| Wallet | Solana Wallet Adapter (Phantom, Solflare, Backpack, Torus) |
| CMS | Sanity (courses, lessons, achievements) |
| Auth & DB | Supabase (profiles, streaks, leaderboard, forum) |
| State | Zustand (client) + TanStack Query (server) |
| i18n | next-intl (EN, PT-BR, ES) |
| Testing | Vitest (unit) + Playwright (E2E) |

## Project Structure

```
app/
├── src/
│   ├── app/[locale]/      # Pages (landing, courses, dashboard, etc.)
│   ├── app/api/           # API routes (backend-signed stubs)
│   ├── components/        # UI components by domain
│   │   ├── ui/            # shadcn/ui primitives (15 components)
│   │   ├── layout/        # Header, Footer, CommandSearch
│   │   ├── course/        # CourseCard, Syllabus, EnrollmentButton
│   │   ├── lesson/        # ContentRenderer, CodeEditor, TestRunner
│   │   ├── gamification/  # XP, Streaks, Levels, Achievements
│   │   ├── wallet/        # WalletGuard, TransactionToast, XpHeader
│   │   ├── auth/          # ConnectPrompt, WalletInfo, Onboarding
│   │   └── providers/     # Theme, Wallet, Query providers
│   ├── lib/
│   │   ├── solana/        # PDA, bitmap, XP, errors, credentials
│   │   ├── services/      # Interface pattern with stubs
│   │   ├── supabase/      # Client + server + types
│   │   └── sanity/        # Client + GROQ queries
│   ├── hooks/             # React hooks per domain
│   ├── stores/            # Zustand (auth, UI)
│   └── types/             # TypeScript types
├── sanity/schemas/        # CMS document schemas
├── supabase/migrations/   # SQL schema + RLS
├── messages/              # Translation files (EN, PT-BR, ES)
├── public/                # Static assets, PWA manifest
└── e2e/                   # Playwright E2E tests
```

## On-Chain Program

Program ID: `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf` (devnet)

The frontend interacts with the on-chain program through:
- **Wallet-signed**: `enroll`, `close_enrollment` (learner signs directly)
- **Backend-signed**: `complete_lesson`, `finalize_course`, `issue_credential` (API route stubs)
- **Read-only**: Course PDAs, enrollment bitmaps, XP balances (Token-2022 ATA), credentials (Helius DAS)

## Environment Variables

See `.env.example` for all required variables.

## Available Scripts

| Script | Description |
|--------|------------|
| `pnpm dev` | Start dev server with Turbopack |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run unit tests |
| `pnpm e2e` | Run Playwright E2E tests |

## Pages

| Path | Description |
|------|------------|
| `/` | Landing page |
| `/courses` | Course catalog with filters |
| `/courses/[slug]` | Course detail + enrollment |
| `/courses/[slug]/lessons/[id]` | Lesson view + code editor |
| `/dashboard` | User stats, XP, streaks, active courses |
| `/profile/[username]` | Public profile + achievements |
| `/leaderboard` | XP rankings |
| `/settings` | Profile, wallet, language, theme |
| `/certificates/[id]` | Credential NFT display |
| `/community` | Forum threads |
| `/admin` | Platform analytics |
| `/admin/studio` | Sanity Studio embed |

## Service Layer Pattern

All on-chain interactions use typed interfaces with swappable implementations:

```typescript
// Toggle between stub and on-chain via NEXT_PUBLIC_USE_STUBS=true
const services = createServices();
const enrollment = await services.enrollment.getEnrollment(courseId, wallet);
```

## i18n

Three locales supported: English, Portuguese (Brazil), Spanish. All UI text is translated via next-intl. On-chain error codes are mapped to user-friendly messages in each locale.
