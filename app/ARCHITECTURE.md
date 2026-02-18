# 🏗️ Architecture — Superteam Academy LMS

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 14)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │  Pages    │ │Components│ │ Services │ │   i18n     │ │
│  │ (10 core)│ │(Navbar,  │ │(Interfaces│ │(PT-BR,ES, │ │
│  │          │ │ Editor,  │ │ + Local   │ │  EN)       │ │
│  │          │ │ Quiz)    │ │ Impl)     │ │            │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────────┘ │
│       │            │            │                        │
│  ┌────▼────────────▼────────────▼──────────────────────┐ │
│  │              Providers (React Context)                │ │
│  │  Solana Wallet Adapter | TanStack Query | Theme | i18n│
│  └──────────────────────┬───────────────────────────────┘ │
└─────────────────────────┼───────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
    ┌────▼────┐    ┌─────▼─────┐    ┌────▼────┐
    │ Solana  │    │  Prisma   │    │  CMS    │
    │ Devnet  │    │(PostgreSQL│    │(Sanity/ │
    │         │    │ /SQLite)  │    │ Strapi) │
    │- XP     │    │           │    │         │
    │  Token  │    │- Users    │    │- Course │
    │- cNFTs  │    │- Progress │    │  content│
    │- PDAs   │    │- Enroll   │    │- Media  │
    └─────────┘    └───────────┘    └─────────┘
```

## Directory Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Landing page (/)
│   ├── layout.tsx                # Root layout with providers
│   ├── courses/
│   │   ├── page.tsx              # Course catalog (/courses)
│   │   └── [slug]/
│   │       ├── page.tsx          # Course detail (/courses/[slug])
│   │       └── lessons/
│   │           └── [lessonId]/
│   │               └── page.tsx  # Lesson viewer with code editor
│   ├── dashboard/page.tsx        # Student dashboard (/dashboard)
│   ├── leaderboard/page.tsx      # Rankings (/leaderboard)
│   ├── profile/page.tsx          # User profile (/profile)
│   ├── settings/page.tsx         # Settings (/settings)
│   ├── certificates/[id]/page.tsx # Certificate view (/certificates/[id])
│   └── api/
│       ├── courses/route.ts      # Course CRUD
│       ├── progress/route.ts     # Progress tracking
│       └── certificates/route.ts # NFT certificate minting
├── components/
│   ├── navbar.tsx                # Navigation with wallet, i18n, theme
│   ├── providers.tsx             # All context providers
│   └── code-editor.tsx           # Monaco editor wrapper
├── lib/
│   ├── courses-data.ts           # Course catalog & content (mock CMS)
│   ├── i18n/
│   │   ├── translations.ts       # All UI strings (PT-BR, ES, EN)
│   │   └── context.tsx           # I18n React context + LanguageSwitcher
│   ├── theme/
│   │   └── context.tsx           # Dark/light/system theme context
│   ├── services/
│   │   ├── interfaces.ts         # Clean service abstractions
│   │   └── local-progress.ts     # Local implementation (swap for on-chain)
│   └── solana/
│       ├── certificates.ts       # Bubblegum compressed NFT minting
│       └── token-gate.ts         # SPL token verification
├── prisma/
│   └── schema.prisma             # Database schema
└── programs/                     # Anchor smart contract
```

## Service Architecture

The app uses **clean service interfaces** that abstract data access. This allows swapping between local/mock implementations and on-chain Solana program calls without changing UI code.

### Key Interfaces

| Interface | Responsibility | Local Impl | On-Chain Impl |
|-----------|---------------|------------|---------------|
| `LearningProgressService` | Progress, XP, streaks, leaderboard, credentials | localStorage | Token-2022 XP + Bubblegum cNFTs |
| `EnrollmentService` | Course enrollment lifecycle | localStorage | Enrollment PDAs |
| `AchievementService` | Badge tracking (256 bitmap) | localStorage | Learner PDA bitmap |
| `UserProfileService` | Profile CRUD, auth linking | localStorage / Prisma | — |
| `CredentialService` | cNFT minting & verification | Mock | Metaplex Bubblegum |

### XP & Leveling

```
Level = floor(sqrt(totalXP / 100))
```

XP is a soulbound fungible token (Token-2022, NonTransferable). In local implementation, stored in localStorage. In production, the token balance IS the XP.

### Credentials

Evolving compressed NFTs (Metaplex Bubblegum). One cNFT per learning track that upgrades as the learner progresses. Cost: ~$0.001 per certificate.

## Data Flow

### Lesson Completion
```
User clicks "Complete" → LocalProgressService.completeLesson()
  → Updates completed lessons bitmap
  → Awards XP (25-100 based on difficulty)
  → Updates streak (side effect, not separate action)
  → Checks achievement unlock conditions
  → Returns to UI → Progress bar updates
```

### On-Chain Integration Points
1. **Wallet Auth**: Already implemented via wallet-adapter
2. **XP Display**: Read Token-2022 balance → display as XP
3. **Credentials**: Read cNFTs from wallet → display in profile
4. **Leaderboard**: Index XP balances via Helius DAS API
5. **Lesson Completion**: Backend-signed tx → program call (stubbed)
6. **Enrollment**: Program call → creates Enrollment PDA (stubbed)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| Components | Radix UI primitives |
| State | React Context + TanStack Query |
| Blockchain | Solana (wallet-adapter, Metaplex Bubblegum) |
| Database | Prisma + PostgreSQL (optional, works with mock data) |
| Code Editor | Monaco Editor |
| i18n | Custom context (PT-BR, ES, EN) |
| Deployment | Vercel / Netlify |

## Performance Strategy

- Static generation for landing, course catalog
- Dynamic rendering for dashboard, leaderboard
- Image optimization via Next.js `<Image>`
- Code splitting per route (App Router automatic)
- Lazy loading for code editor (heavy dependency)
- Tailwind CSS purging in production
- Target: Lighthouse 90+ across all categories
