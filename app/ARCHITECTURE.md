# Superteam Academy — Architecture Guide

## Overview

The Superteam Academy frontend is a **Next.js 14 App Router** application built with **TypeScript strict mode**. It follows a layered architecture that cleanly separates presentation, business logic, and on-chain interaction concerns.

## Directory Structure

```
app/
├── public/                    # Static assets, PWA manifest
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── api/               # API routes (chat, complete-lesson, finalize-course)
│   │   ├── courses/           # Course catalog, detail, lesson views
│   │   ├── dashboard/         # User dashboard with XP ring
│   │   ├── leaderboard/       # Global/weekly rankings
│   │   ├── profile/           # Public profile with credentials
│   │   ├── settings/          # User preferences
│   │   ├── certificates/      # Verifiable certificate view
│   │   ├── admin/             # Admin dashboard (bonus)
│   │   ├── onboarding/        # Skill assessment quiz (bonus)
│   │   ├── layout.tsx         # Root layout with providers
│   │   ├── page.tsx           # Landing page
│   │   ├── loading.tsx        # Global loading skeleton
│   │   └── globals.css        # Design system tokens
│   ├── components/
│   │   ├── layout/            # Header, Footer
│   │   └── course/            # CourseCard
│   ├── hooks/                 # Custom React hooks (useXP)
│   ├── lib/                   # Utility libraries
│   │   ├── pda.ts             # PDA derivation (6 account types)
│   │   ├── xp.ts              # XP/level calculation engine
│   │   ├── bitmap.ts          # 256-bit lesson completion tracker
│   │   ├── helius.ts          # Helius DAS API client
│   │   ├── courses.ts         # Static course data
│   │   └── services.ts        # LearningProgressService abstraction
│   ├── providers/             # React context providers
│   │   ├── SolanaProvider.tsx  # Wallet adapter config
│   │   └── index.tsx          # Combined providers
│   ├── i18n/                  # next-intl configuration
│   └── messages/              # Locale JSON files (pt-BR, en, es)
```

## Data Flow

```
┌─────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  UI Pages   │───▶│  Custom Hooks    │───▶│  Service Layer   │
│  (app/)     │    │  (useXP, etc.)   │    │  (services.ts)   │
└─────────────┘    └──────────────────┘    └──────────────────┘
                                                    │
                          ┌─────────────────────────┤
                          ▼                         ▼
                   ┌──────────────┐         ┌──────────────┐
                   │  Solana RPC  │         │  Helius DAS  │
                   │  (web3.js)   │         │  API         │
                   └──────────────┘         └──────────────┘
```

## On-Chain Integration

### Program ID
`ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf` (Devnet)

### PDA Accounts (6 types)
| Seed | Account | Purpose |
|------|---------|---------|
| `config` | ConfigAccount | Platform-wide settings |
| `course` + course_id | CourseAccount | Course metadata |
| `enrollment` + course_id + learner | EnrollmentAccount | Student enrollment state |
| `minter_role` + authority | MinterRoleAccount | XP minting authorization |
| `achievement_type` + id | AchievementTypeAccount | Achievement definitions |
| `achievement_receipt` + type_id + earner | AchievementReceiptAccount | Claimed achievements |

### XP System
- **Token**: Token-2022 with `NonTransferable` and `PermanentDelegate` extensions (soulbound)
- **Level formula**: `floor(sqrt(xp / 100))`
- **Progress**: `(xp - currentLevelXP) / (nextLevelXP - currentLevelXP) * 100`

### Lesson Completion Bitmap
Each enrollment stores a `u64[4]` array (256 bits) tracking up to 256 lessons per course. The `bitmap.ts` module provides:
- `isLessonComplete(bitmap, lessonIndex)` — check single bit
- `countCompleted(bitmap)` — popcount across all words
- `getProgress(bitmap, totalLessons)` — percentage complete

## Service Layer

The `LearningProgressService` interface (in `lib/services.ts`) abstracts all on-chain operations:

```typescript
interface LearningProgressService {
  getXpBalance(wallet: PublicKey): Promise<number>;
  getCredentials(wallet: PublicKey): Promise<Credential[]>;
  getLeaderboard(): Promise<LeaderboardEntry[]>;
  enroll(courseId: number): Promise<string>;  // returns tx signature
  completeLesson(courseId: number, lessonIndex: number): Promise<string>;
  finalizeCourse(courseId: number): Promise<string>;
}
```

Currently uses mock implementations that can be swapped for live on-chain calls by changing the service binding.

## Design System

- **Theme**: Dark-first with HSL CSS custom properties
- **Accent colors**: Solana purple (`hsl(263, 80%, 55%)`) and green (`hsl(162, 94%, 45%)`)
- **Typography**: Space Grotesk (headings), Inter (body)
- **Effects**: Glassmorphism (backdrop-blur), gradient text, glow shadows
- **Animations**: Framer Motion for page entrance, CSS keyframes for shimmer/pulse

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/chat` | POST | AI Teaching Assistant (Vercel AI SDK + OpenAI) |
| `/api/complete-lesson` | POST | Server-side lesson completion signing |
| `/api/finalize-course` | POST | Server-side course finalization + credential issuance |

## Extending the Platform

### Adding a new language
1. Create `src/messages/{locale}.json` copying the structure from `en.json`
2. Add the locale to the `LOCALES` array in `src/i18n/request.ts`
3. Add a flag/label to the locale switcher in `Header.tsx`

### Adding a new course
Edit `src/lib/courses.ts` and add a new entry to the `STATIC_COURSES` array. In production, courses are fetched from Sanity CMS.

### Connecting to the real program
1. Set `NEXT_PUBLIC_PROGRAM_ID` in `.env.local`
2. Replace the stub implementations in `lib/services.ts` with Anchor client calls
3. Ensure the backend signer keypair is configured for server-side signing routes
