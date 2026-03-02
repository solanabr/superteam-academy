# Architecture

## System Overview

```
┌──────────────┐     ┌──────────────┐     ┌───────────────────┐
│  Next.js     │────▶│  Supabase    │     │  Solana Devnet    │
│  Frontend    │     │  (auth, DB)  │     │  (program)        │
│              │     └──────────────┘     └───────────────────┘
│              │                                   │
│              │────▶ Sanity CMS ─────▶ Content    │
│              │                                   │
│              │────▶ Helius DAS ─────▶ Credentials│
│              │                                   │
│  wallet signs│──────────────────────────────────▶│ enroll
│  backend stub│────▶ API route ──────────────────▶│ complete_lesson
└──────────────┘                                   │ finalize_course
                                                   │ issue_credential
```

## Data Flow

### Course Content
Sanity CMS → ISR/GROQ → Next.js pages (cached 5 min)

### Enrollment
1. Wallet signs `enroll` transaction → Solana program creates Enrollment PDA
2. Frontend reads Enrollment PDA → bitmap → progress bar
3. Backend API `complete_lesson` → marks bit in bitmap → mints XP

### XP & Levels
- XP = Token-2022 ATA balance (0 decimals, non-transferable)
- Level = floor(sqrt(xp / 100))
- Leaderboard from Helius getTokenAccounts → cached in Supabase

### Credentials
- Metaplex Core NFTs (soulbound via PermanentFreezeDelegate)
- Queried via Helius DAS `getAssetsByOwner`
- Attributes: track_id, level, courses_completed, total_xp

## State Management

| Domain | Solution | Cache TTL |
|--------|----------|-----------|
| On-chain data | TanStack Query | 30s |
| CMS content | TanStack Query | 5 min |
| Client UI state | Zustand | N/A |
| Auth state | Zustand + Supabase | Session |

## Component Architecture

```
Providers (Theme > Query > Wallet)
└── Layout (Header + Footer + CommandSearch + XpAnimation)
    └── Pages
        ├── Landing (SSR)
        ├── Courses (client-side filtered)
        ├── Lesson (split view: content + editor)
        ├── Dashboard (wallet-gated)
        └── ...
```

## Service Interfaces

Every service implements a typed interface:
- `ICourseService` — course CRUD
- `IEnrollmentService` — enrollment + close
- `ILessonService` — complete + finalize
- `IXpService` — balance + leaderboard
- `ICredentialService` — NFT queries

Stub implementations for development; on-chain implementations for production.

## PDA Schema

| PDA | Seeds | Purpose |
|-----|-------|---------|
| Config | `["config"]` | Singleton platform config |
| Course | `["course", courseId]` | Course metadata |
| Enrollment | `["enrollment", courseId, learner]` | Progress bitmap |
| MinterRole | `["minter", minter]` | XP minting permissions |
| AchievementType | `["achievement", achievementId]` | Achievement definition |
| AchievementReceipt | `["achievement_receipt", achievementId, recipient]` | Earned achievement |

## Error Handling

26 on-chain error codes are mapped to i18n keys in `lib/solana/errors.ts`. The `resolveErrorKey()` function extracts the error code from Anchor error objects and returns the appropriate translation key.
