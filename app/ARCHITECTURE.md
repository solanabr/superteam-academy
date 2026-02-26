# Architecture — Superteam Academy Frontend

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        User (Browser)                           │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Next.js 16 App     │
                    │   (Vercel Edge)      │
                    └──────┬──────────────┘
                           │
          ┌────────────────┼────────────────────────┐
          │                │                        │
          ▼                ▼                        ▼
   ┌─────────────┐  ┌─────────────┐        ┌──────────────┐
   │  Sanity CMS │  │  Solana RPC │        │  Backend API  │
   │  (content)  │  │  (Helius)   │        │  (signing)   │
   └─────────────┘  └─────────────┘        └──────────────┘
                           │
                    ┌──────▼──────────┐
                    │  On-Chain        │
                    │  Program         │
                    │  (Anchor)        │
                    └─────────────────┘
```

## Data Flow

### Learning Flow

```
1. User connects wallet (Wallet Adapter)
2. Frontend derives enrollment PDA
3. User signs enroll tx (wallet)
4. Backend receives webhook → signs complete_lesson per lesson
5. Frontend polls enrollment.lessonFlags bitmap → renders progress
6. When all lessons done → backend signs finalize_course
7. Backend signs issue_credential → NFT minted in user's wallet
8. User sees credential in profile (Helius DAS query)
```

### XP Flow

```
On-chain:  complete_lesson → Token-2022 mint to learner ATA
Frontend:  connection.getTokenAccountBalance(xpAta) → XP balance
Level:     floor(sqrt(xp / 100)) — pure computation, no on-chain state
```

### Gamification State

| Feature | Storage | Notes |
|---------|---------|-------|
| XP Balance | On-chain (Token-2022 ATA) | Soulbound, non-transferable |
| Credentials | On-chain (Metaplex Core NFT) | 1 per track, upgradeable |
| Achievements | On-chain (AchievementReceipt PDA) | Each has a soulbound NFT |
| Streaks | Local Storage / DB | Frontend-only, no on-chain state |
| Progress | On-chain (Enrollment PDA bitmap) | Backend verifies completion |

## Service Layer

All on-chain interactions go through typed service interfaces.  
Swap the stub implementation for on-chain calls without changing UI code.

```typescript
// src/lib/services/learning-progress.ts
interface LearningProgressService {
  getProgress(userId: string, courseId: string): Promise<CourseProgress>;
  getEnrollment(userId: string, courseId: string): Promise<Enrollment | null>;
  getAllEnrollments(userId: string): Promise<Enrollment[]>;
  completeLesson(userId: string, courseId: string, lessonIndex: number): Promise<void>;
  getXpBalance(walletAddress: string): Promise<XPBalance>;
  getStreakData(userId: string): Promise<Streak>;
  getLeaderboard(timeframe: LeaderboardTimeframe): Promise<LeaderboardEntry[]>;
  getCredentials(walletAddress: string): Promise<Credential[]>;
  getAchievements(userId: string): Promise<Achievement[]>;
}
```

## Component Architecture

```
components/
├── ui/              Pure UI primitives — no business logic
│   ├── Button       Variant system: default, gradient, glass, outline
│   ├── Card         Variants: default, glass, gradient
│   ├── Progress     Variants: xp (animated gradient), green, blue
│   └── ...
│
├── layout/          App-wide structure
│   ├── Navbar       Sticky, scroll-aware, wallet connect, i18n switcher
│   ├── Footer       Links, newsletter, social, gradient border
│   └── PageLayout   Composes Navbar + Footer + main
│
├── landing/         Landing page sections
│   ├── Hero         Aurora BG, floating cards, stats, CTAs
│   ├── Features     9-feature grid with hover gradients
│   ├── CoursePreview Featured courses + learning paths
│   ├── Testimonials  Social proof cards
│   └── CTASection   Final conversion CTA
│
├── courses/         Course-related UI
│   └── (integrated into pages for MVP)
│
├── editor/          Code challenge system
│   └── CodeEditor   Monaco, hints, solution toggle, test runner
│
└── gamification/    XP & progression UI
    ├── XPDisplay    Level badge, progress bar, XP counter
    ├── StreakCalendar 90-day heatmap, milestone badges
    └── AchievementBadge Rarity system, tooltip, lock state
```

## PDA Derivation (Frontend)

```typescript
// All PDAs derived client-side from known seeds
// src/lib/solana/pda.ts

deriveConfigPda()                          // ["config"]
deriveCoursePda(courseId)                  // ["course", courseId]
deriveEnrollmentPda(courseId, learner)     // ["enrollment", courseId, learner]
deriveMinterRolePda(minter)               // ["minter", minter]
deriveAchievementTypePda(achievementId)   // ["achievement", achievementId]
deriveAchievementReceiptPda(id, recipient) // ["achievement_receipt", id, recipient]
```

## Rendering Strategy

| Route | Strategy | Reason |
|-------|----------|--------|
| `/` | Static (ISR 60s) | Landing changes rarely |
| `/courses` | Dynamic | Filter state changes |
| `/courses/[slug]` | Dynamic | Enrollment state |
| `/courses/[slug]/lessons/[id]` | Dynamic | Progress state |
| `/dashboard` | Dynamic | Wallet-specific data |
| `/leaderboard` | Dynamic | Real-time rankings |
| `/profile` | Dynamic | Wallet-specific data |
| `/settings` | Dynamic | User preferences |
| `/certificates/[id]` | Dynamic | NFT data |

## i18n Architecture

- **Library**: next-intl
- **Locales**: `en`, `pt-BR`, `es`
- **Locale detection**: Cookie (`NEXT_LOCALE`) with fallback to `en`
- **Message files**: `src/messages/{locale}.json`
- **Switching**: Cookie update + page reload

## Analytics Events

| Event | Trigger | Category |
|-------|---------|---------|
| `course_enrolled` | Enroll button | Learning |
| `lesson_completed` | Complete lesson | Learning |
| `challenge_completed` | All tests pass | Learning |
| `course_completed` | Finalize course | Learning |
| `level_up` | XP crosses threshold | Gamification |
| `achievement_unlocked` | Award achievement | Gamification |
| `streak_milestone` | 7/30/100 days | Gamification |
| `wallet_connected` | Connect wallet | Authentication |
| `language_changed` | Locale switch | Preferences |

## On-Chain Integration Points

To swap stubbed services for on-chain:

1. **Enrollment** — already calls `program.methods.enroll()` directly via wallet
2. **Lesson completion** — replace localStorage with HTTP call to backend, backend signs and sends `completeLesson` ix
3. **XP balance** — replace mock with `fetchXpBalance(connection, wallet, xpMint)` from `src/lib/solana/xp.ts`
4. **Credentials** — replace mock with `fetchCredentialsByOwner(heliusUrl, walletAddress)` from `src/lib/solana/xp.ts`
5. **Leaderboard** — replace mock with Helius DAS `getTokenAccounts` indexed by XP mint

All service method signatures remain unchanged.
