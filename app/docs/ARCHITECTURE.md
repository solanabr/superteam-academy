# Architecture

System architecture for the Superteam Academy frontend application.

## System Overview

```
┌──────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 16)                   │
│                                                            │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Wallet   │  │   Service    │  │    Providers      │  │
│  │  Adapter   │  │   Layer      │  │  Theme/Auth/i18n  │  │
│  │ (Phantom,  │  │  8 services  │  │  Wallet/Analytics │  │
│  │  Solflare) │  │  interfaces  │  │  SolanaProgram    │  │
│  └─────┬──────┘  └──────┬───────┘  └──────────────────┘  │
│        │                │                                  │
│        ▼                ▼                                  │
│  ┌──────────────────────────────────────┐                 │
│  │         API Routes (10 endpoints)    │                 │
│  │   Auth · Lessons · Credentials       │                 │
│  │   Achievements · Leaderboard · Users │                 │
│  └──────────┬───────────────────────────┘                 │
└─────────────┼─────────────────────────────────────────────┘
              │
     ┌────────┼────────────────────┐
     ▼        ▼                    ▼
┌─────────┐ ┌──────────┐  ┌──────────────┐
│ Solana  │ │ Supabase │  │  Sanity CMS  │
│ Devnet  │ │ (users)  │  │  (courses)   │
└─────────┘ └──────────┘  └──────────────┘
```

## Provider Hierarchy

Providers wrap the app in `layout.tsx`. Order matters — each layer depends on those above it.

```
<html>
  <ThemeProvider>                  next-themes (dark/light/system, default: dark)
    <SessionProvider>              NextAuth session (Google/GitHub JWT)
      <WalletProvider>             Solana Wallet Adapter + ConnectionProvider
        <SolanaProgramProvider>    Anchor program instance (set when wallet connects)
          <AuthProvider>           User profile from Supabase + wallet linking
            <LocaleProvider>      i18n context (en, pt-BR, es) persisted to localStorage
              <AnalyticsProvider>  GA4 + PostHog + Sentry initialization
                <Header />
                <main>{children}</main>
                <Footer />
```

### Provider Details

| Provider | Source | State Stored | Depends On |
|----------|--------|-------------|------------|
| `ThemeProvider` | `next-themes` | `localStorage` (theme) | — |
| `SessionProvider` | `next-auth` | JWT cookie | — |
| `WalletProvider` | `@solana/wallet-adapter-react` | Wallet connection | — |
| `SolanaProgramProvider` | Custom | Anchor `Program` instance | WalletProvider |
| `AuthProvider` | Custom | User profile (Supabase) | SessionProvider, WalletProvider |
| `LocaleProvider` | Custom | `localStorage` (locale) | — |
| `AnalyticsProvider` | Custom | GA4/PostHog/Sentry scripts | — |

## Page Architecture

### Landing Page (`/`)

Hero section with animated code terminal, course catalog preview, social proof testimonial marquee, platform features grid, and bottom CTA. Background: `bg-hero` gradient + animated floating blur orbs (`animate-drift`, `animate-float`).

### Course Catalog (`/courses`)

Filterable grid of `CourseCard` components. Filters by difficulty (Beginner/Intermediate/Advanced), topic (Core/Framework/DeFi/Security), and duration. Includes 4 predefined learning path sections. Data: Sanity CMS → hardcoded fallback.

### Course Detail (`/courses/[slug]`)

Two-column layout:
- **Left**: Breadcrumb, course metadata, expandable module sections (`ModuleSection` components), student reviews
- **Right**: Sticky enrollment card with progress bar, stats grid, CTA button, instructor info

Enrollment flow: wallet check → `progressService.enroll()` → analytics event → UI update.

Data loading: synchronous `getCourseBySlug()` from hardcoded data (instant render), then async `getCourse()` from Sanity overlays if available. Progress merged via `useMemo`.

### Lesson Viewer (`/courses/[slug]/lessons/[id]`)

Three distinct layouts based on lesson type:

| Type | Layout | Components |
|------|--------|------------|
| `reading` | Full-width markdown | react-markdown + rehype-highlight |
| `video` | Video player + markdown notes | Embedded player + markdown |
| `challenge` | Resizable split panel | Monaco editor (left) + test runner (right) |

Challenge features:
- Monaco editor with Rust/TypeScript language support
- Auto-save drafts to `localStorage` (key: `code_draft_{courseSlug}_{lessonId}`)
- Client-side test runner with pass/fail results
- Progressive hint reveal
- Solution code toggle
- `canvas-confetti` animation on all tests passing
- Sidebar navigation between lessons/modules

### Dashboard (`/dashboard`)

Stats cards (XP, level, streak, courses), activity feed, skill radar chart, achievement badge grid. All data from localStorage services.

### Leaderboard (`/leaderboard`)

Paginated XP rankings. Time filters: weekly/monthly/all-time. Course filter. Current user highlighted. Data: `leaderboardService.getEntries()`.

### Profile (`/profile`, `/profile/[username]`)

User profile with credential NFT display, achievement badges, course completion history. Public profiles accessible by username via Supabase lookup.

### Settings (`/settings`)

Account management: OAuth linking (Google/GitHub via NextAuth), Solana wallet connection, locale selection (3 languages), theme toggle, profile editing (name, bio, username, social links), data export, account deletion.

### Certificates (`/certificates/[id]`)

NFT credential viewer with metadata display and shareable link.

### Sanity Studio (`/studio`)

Embedded Sanity Studio at `/studio/[[...tool]]` for content editors.

## Service Layer

### Architecture

```
┌───────────────────────────────────────────────┐
│               Components                       │
│   import { progressService } from "@/services" │
└─────────────────────┬─────────────────────────┘
                      │
┌─────────────────────▼─────────────────────────┐
│           Service Factory                      │
│   createServices() in service-factory.ts       │
│                                                │
│   Checks env vars:                             │
│   HELIUS_RPC_URL + SOLANA_RPC_URL + XP_MINT    │
│     → set:   Devnet services (4 on-chain)      │
│     → unset: All localStorage stubs            │
└─────────────────────┬─────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
┌───────────────┐         ┌───────────────────┐
│ Local Services │         │  Devnet Services   │
│ (localStorage) │         │  (Solana RPC)      │
│                │         │                    │
│ All 7 services │         │ ProgressService    │
│                │         │ XpService          │
│                │         │ CredentialService  │
│                │         │ LeaderboardService │
└───────────────┘         └───────────────────┘

Always local (frontend-only per spec):
  StreakService, AchievementService, ActivityService
```

### Service Interfaces

Defined in `services/interfaces.ts`. Each service has a clear contract:

| Service | Methods | Storage (Local) | Storage (On-Chain) |
|---------|---------|-----------------|-------------------|
| **ProgressService** | `getProgress`, `getAllEnrollments`, `enroll`, `completeLesson`, `finalizeCourse`, `closeEnrollment` | localStorage | Enrollment PDAs via RPC |
| **XpService** | `getBalance`, `getLevel` | localStorage | Token-2022 ATA balance |
| **CredentialService** | `getCredentials`, `getCredentialByMint`, `issueCredential`, `upgradeCredential` | localStorage | Helius DAS API (Metaplex Core) |
| **LeaderboardService** | `getEntries`, `getRank` | Hardcoded mock | Helius DAS token holders |
| **StreakService** | `getStreak`, `recordActivity`, `useFreeze`, `checkMilestones` | localStorage | — |
| **AchievementService** | `getAchievements`, `getAllAchievementTypes`, `claimAchievement`, `checkEligible` | localStorage | — |
| **ActivityService** | `getActivity`, `recordActivity` | localStorage | — |
| **AuthService** | `getCurrentUser`, `updateProfile`, `linkWallet`, `deleteAccount`, `exportData` | Supabase | — |
| **CourseContentService** | `getLessonContent`, `getSkillScores` | Sanity CMS + hardcoded | — |

### Devnet Progress Flow

```
User clicks "Enroll"
    │
    ├─ Wallet connected?
    │   ├─ No  → Open wallet modal
    │   └─ Yes → DevnetProgressService.enroll()
    │       │
    │       ├─ Check course PDA on-chain (getAccountInfo)
    │       │   ├─ Not found → fallback to LocalProgressService
    │       │   └─ Found → build Anchor transaction
    │       │       → program.methods.enroll(courseId)
    │       │       → accountsPartial({ course, enrollment, learner, systemProgram })
    │       │       → .rpc() (user signs)
    │       │       → also persist locally for instant UI
    │       │
    │       └─ Return { txSignature }
    │
User completes lesson
    │
    └─ progressService.completeLesson()
       → Local: update localStorage, return stub XP
       → On-chain: POST /api/lessons/complete
           → Backend validates → signs complete_lesson tx
           → XP minted via Token-2022 CPI
```

## Data Flow

### Course Content Pipeline

```
Page Mount
    │
    ├─ Synchronous: getCourseBySlug(slug)     ← hardcoded data (instant)
    │   → setCourse(data)                       → immediate render
    │
    └─ Async: getCourse(slug)                 ← Sanity CMS fetch
        → if (data) setCourse(data)             → overlay CMS data
        → if (!sanityClient) returns null       → keeps hardcoded data

Lesson Content
    │
    ├─ getLesson(courseSlug, lessonId, locale) ← Sanity CMS
    │   → GROQ query filters by _key
    │   → mapLesson() normalizes to LessonContent
    │
    └─ Fallback: lesson-content.ts            ← hardcoded per locale
        → lesson-content-pt-BR.ts
        → lesson-content-es.ts
```

### Authentication Flow

```
┌────────────────┐     ┌──────────────┐     ┌──────────────┐
│ Wallet Adapter │     │   NextAuth   │     │   Supabase   │
│ Phantom/       │     │ Google/      │     │  users table │
│ Solflare/      │     │ GitHub       │     │              │
│ Coinbase       │     │ (JWT)        │     │              │
└───────┬────────┘     └──────┬───────┘     └──────┬───────┘
        │                     │                     │
        └─────────┬───────────┘                     │
                  ▼                                 │
           ┌──────────────┐                         │
           │ AuthProvider  │── POST /api/auth/ ──────┘
           │               │   upsert-user
           │ Merges wallet │
           │ + OAuth into  │
           │ single profile│
           └──────────────┘

Supabase users table columns:
  wallet_address, email, google_id, github_id,
  name, username, bio, initials, avatar_url,
  locale, theme, is_public, social_links
```

## API Routes

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/[...nextauth]` | GET/POST | — | NextAuth OAuth handlers (Google, GitHub) |
| `/api/auth/upsert-user` | POST | — | Upsert user profile in Supabase |
| `/api/lessons/complete` | POST | Wallet | Mark lesson complete, award XP |
| `/api/courses/finalize` | POST | Wallet | Finalize course, award bonus XP |
| `/api/credentials/issue` | POST | Wallet | Issue Metaplex Core credential NFT |
| `/api/credentials/upgrade` | POST | Wallet | Upgrade credential attributes |
| `/api/achievements/claim` | POST | Wallet | Claim achievement badge |
| `/api/leaderboard` | GET | — | Paginated leaderboard with time/course filters |
| `/api/streaks` | GET/POST | Wallet | Get or update streak data |
| `/api/users/by-username` | GET | — | Public profile lookup |

Backend-signed endpoints (lessons/complete, courses/finalize, credentials/*, achievements/claim) will build Solana transactions signed by the backend signer keypair when the on-chain program is connected.

## PDA Derivation

Frontend helpers in `lib/solana/constants.ts`:

| PDA | Seeds | Helper |
|-----|-------|--------|
| Config | `["config"]` | `deriveConfigPda()` |
| Course | `["course", course_id]` | `deriveCoursePda(courseId)` |
| Enrollment | `["enrollment", course_id, learner]` | `deriveEnrollmentPda(courseId, learner)` |
| AchievementType | `["achievement", achievement_id]` | `deriveAchievementTypePda(achievementId)` |
| AchievementReceipt | `["achievement_receipt", achievement_id, recipient]` | `deriveAchievementReceiptPda(achievementId, recipient)` |

Program ID: `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf`
XP Mint: `xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3`

## XP & Leveling System

Defined in `types/index.ts`:

```
Level       = floor(sqrt(xp / 100))
XP for L    = L^2 * 100

Level  0:       0 XP
Level  1:     100 XP
Level  2:     400 XP
Level  3:     900 XP
Level  5:   2,500 XP
Level 10:  10,000 XP
```

`xpProgress(xp)` returns `{ level, currentLevelXp, xpToNextLevel, progress }` — used by progress bars across dashboard, profile, and leaderboard.

XP sources:
- Lesson completion: 100 XP (stub)
- Course completion bonus: 500 XP (stub)
- Achievement rewards: varies by achievement type

## Analytics

Initialized in `AnalyticsProvider`, event helpers in `lib/analytics.ts`.

| Service | Purpose | Initialization |
|---------|---------|----------------|
| GA4 | Page views, custom events | `initGA4()` — injects gtag script |
| PostHog | Session recordings, heatmaps | `initPostHog()` — injects PostHog script |
| Sentry | Error monitoring (0.1 sample rate) | `initSentry()` — dynamic import |

### Custom Events

| Event | Category | Triggered By |
|-------|----------|-------------|
| `wallet_connected` | auth | Wallet adapter connection |
| `course_enrolled` | engagement | Course enrollment |
| `lesson_completed` | engagement | Lesson completion |
| `course_completed` | engagement | Course finalization |
| `code_submitted` | engagement | Code challenge submission |
| `tests_passed` | engagement | All test cases passing |
| `achievement_earned` | gamification | Achievement claim |
| `language_changed` | preferences | Locale switch |
| `theme_changed` | preferences | Theme toggle |
| `credential_viewed` | engagement | Certificate page visit |

## Type System

All types in `types/index.ts`:

| Type | Key Fields |
|------|-----------|
| `CourseDetail` | slug, title, difficulty, topic, accent, xp, modules[], reviews[], instructor |
| `Module` | id, title, lessons[] |
| `Lesson` | id, title, duration, type (video/reading/challenge), completed |
| `LessonContent` | markdown, starterCode, solutionCode, hints[], testCases[] |
| `CourseProgress` | courseId, enrolledAt, completedAt, completedLessons[], credentialAsset |
| `UserProfile` | walletAddress, email, googleId, githubId, name, username, locale, theme |
| `StreakData` | currentStreak, longestStreak, freezesRemaining, todayCompleted, history |
| `Achievement` | id, title, rarity (common/rare/epic/legendary), xpReward, mintAddress |
| `Credential` | track, level, accent, mintAddress, coursesCompleted, totalXp |
| `LeaderboardEntry` | rank, name, username, level, xp, streak |
| `ActivityItem` | type, title, courseName, xp, timestamp |
| `SkillScore` | name, value (0-100) |
