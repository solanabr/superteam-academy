# Frontend Services Overview

**Status**: Next.js 14+ frontend implementation. Integrates with deployed devnet program.

## Devnet Program

| | Address | Explorer |
|---|---|---|
| **Program ID** | `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf` | [View](https://explorer.solana.com/address/ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf?cluster=devnet) |
| **XP Mint** | `xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3` | [View](https://explorer.solana.com/address/xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3?cluster=devnet) |

**Integration Docs**: [INTEGRATION.md](../../docs/INTEGRATION.md) - PDA derivation, instruction usage, events

---

## Module Structure

The frontend consists of the following service modules:

### Core Services
| # | Module | File | Description |
|---|--------|------|-------------|
| 01 | Wallet Service | `01-wallet.md` | Wallet connection and authentication |
| 02 | Program Service | `02-program.md` | Anchor program interactions |
| 03 | Auth Service | `03-auth.md` | Authentication UI and account linking |

### Learning Services
| # | Module | File | Description |
|---|--------|------|-------------|
| 03 | Course Service | `03-course.md` | Course browsing and details |
| 04 | Enrollment Service | `04-enrollment.md` | Enrollment management |
| 06 | Lesson Service | `06-lesson.md` | Lesson content and progress |
| 07 | Code Editor | `07-editor.md` | Monaco code editor integration |

### Gamification Services
| # | Module | File | Description |
|---|--------|------|-------------|
| 05 | XP Service | `05-xp.md` | XP balance queries |
| 08 | XP & Level | `08-xp-level.md` | XP display and level calculation |
| 06 | Credential Service | `06-credential.md` | Credential NFT display |
| 11 | Achievement Service | `11-achievement.md` | Achievement display |
| 09 | Streak Service | `09-streak.md` | Daily streak tracking (frontend-only) |
| 12 | Leaderboard Service | `12-leaderboard.md` | Rankings display |

### Platform Services
| # | Module | File | Description |
|---|--------|------|-------------|
| 13 | i18n Service | `13-i18n.md` | Multi-language support |
| 14 | Analytics | `14-analytics.md` | User behavior tracking |
| 16 | CMS Integration | `16-cms.md` | Sanity CMS content |
| 15 | Notifications | `15-notification.md` | Push/in-app notifications |
| 17 | Admin Dashboard | `17-admin.md` | Platform management UI |
| 18 | Community | `18-community.md` | Forum/discussion |
| 19 | E2E Testing | `19-e2e-testing.md` | Playwright tests |
| 20 | PWA | `20-pwa.md` | Progressive Web App features |

**Note**: File numbering has some gaps/duplicates that will be cleaned up in future refactoring.

## Dependencies

```json
{
  "next": "^16.1",
  "react": "^19",
  "@solana/wallet-adapter-react": "^0.15",
  "@solana/wallet-adapter-react-ui": "^0.9",
  "@solana/wallet-adapter-wallets": "^0.19",
  "@solana/web3.js": "^1.98",
  "@solana/spl-token": "^0.4",
  "@metaplex-foundation/mpl-core": "^1.0",
  "next-auth": "^4.24",
  "@supabase/supabase-js": "^2.96",
  "@supabase/ssr": "^0.8",
  "@upstash/redis": "^1.36",
  "@upstash/ratelimit": "^2.0",
  "bs58": "^6.0",
  "tweetnacl": "^1.0",
  "zod": "^3"
}
```

**Auth Stack**: NextAuth.js (OAuth + Wallet Credentials) + Supabase (Database)

## Project Structure

```
app/
├── (auth)/
│   └── login/
├── (dashboard)/
│   ├── courses/
│   │   ├── page.tsx              # /courses - Course Catalog
│   │   └── [slug]/
│   │       ├── page.tsx          # /courses/[slug] - Course Detail
│   │       └── lessons/
│   │           └── [id]/
│   │               └── page.tsx   # /courses/[slug]/lessons/[id] - Lesson View
│   ├── dashboard/
│   │   └── page.tsx              # /dashboard - User Dashboard
│   ├── profile/
│   │   ├── page.tsx              # /profile - User Profile
│   │   └── [username]/
│   │       └── page.tsx          # /profile/[username] - Public Profile
│   ├── leaderboard/
│   │   └── page.tsx              # /leaderboard
│   ├── achievements/
│   │   └── page.tsx              # /achievements
│   └── settings/
│       └── page.tsx              # /settings
├── (public)/
│   ├── page.tsx                  # / - Landing Page
│   ├── certificates/
│   │   └── [id]/
│   │       └── page.tsx          # /certificates/[id]
│   └── about/
│       └── page.tsx              # /about
├── (admin)/
│   └── admin/
│       ├── courses/
│       │   ├── page.tsx          # Admin course management
│       │   └── create/
│       │       └── page.tsx
│       ├── achievements/
│       │   └── page.tsx
│       └── config/
│           └── page.tsx
├── api/                          # Next.js API routes
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── wallet/
│   ├── course/
│   ├── lesson/
│   ├── editor/
│   ├── credential/
│   ├── achievement/
│   ├── xp/
│   └── streak/
├── hooks/
├── lib/
├── services/                     # Service layer
├── stores/
├── types/
├── i18n/                        # Translations
└── styles/
```

## Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing Page | Hero, CTAs, features |
| `/courses` | Course Catalog | Filterable course grid |
| `/courses/[slug]` | Course Detail | Course info, enrollment |
| `/courses/[slug]/lessons/[id]` | Lesson View | Content + code editor |
| `/dashboard` | User Dashboard | Progress, XP, streaks |
| `/profile` | User Profile | Private profile |
| `/profile/[username]` | Public Profile | Public profile view |
| `/leaderboard` | Leaderboard | XP rankings |
| `/achievements` | Achievements | Badge showcase |
| `/settings` | Settings | Account settings |
| `/certificates/[id]` | Certificate View | Credential display |
| `/login` | Login | Auth page |
| `/admin/*` | Admin Dashboard | Platform management |

## State Management

- **Zustand** - Global state (wallet, user, UI)
- **React Query** - Server state (courses, enrollments)
- **React Context** - Theme, locale

## API Integration

- **Next.js API Routes** - Backend proxy
- **Helius DAS API** - NFT queries
- **Arweave** - Course content
- **CMS** - Course metadata
