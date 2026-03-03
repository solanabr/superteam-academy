# Solana Academy Platform — Architecture Reference

**Version:** 2.0.0  
**Last Updated:** March 2026  
**Scope:** Full-Stack Architecture, Data Flows & On-Chain Integration

---

## System Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                           USER BROWSER                                          │
│                    (Next.js 14 Frontend @ academy.io)                            │
│                                                                                 │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                        React Components                                    │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐ ┌────────────┐  │ │
│  │  │  Header  │ │CourseCard│ │CodeEditor│ │Gamification │ │Achievements│  │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └─────────────┘ └────────────┘  │ │
│  │                                                                          │ │
│  │  Pages: Home, Courses, Dashboard, Profile, Leaderboard, Settings,       │ │
│  │         Certificates, Auth (Sign-in, Complete-profile)                   │ │
│  └──────────────────────────┬───────────────────────────────────────────────┘ │
│                             │                                                  │
│  ┌──────────────────────────▼───────────────────────────────────────────────┐ │
│  │                State Management & Hooks                                   │ │
│  │  Zustand (theme) │ TanStack Query │ useI18n │ useAuth │ useProgram      │ │
│  │  useAwardXP │ useXpBalance │ useCourseCompletion │ useLeaderboard       │ │
│  └──────────────────────────┬───────────────────────────────────────────────┘ │
│                             │                                                  │
│  ┌──────────────────────────▼───────────────────────────────────────────────┐ │
│  │                   Services Layer (lib/services)                           │ │
│  │  CourseService │ ProgressService │ XpService │ AchievementService        │ │
│  │  CredentialService │ CodeExecutionService │ RustExecutionService         │ │
│  │  HeliusService │ OnChainService │ TransactionService                     │ │
│  └──────────────────────────┬───────────────────────────────────────────────┘ │
│                             │                                                  │
│  ┌──────────────────────────▼───────────────────────────────────────────────┐ │
│  │                   Anchor Client SDK (lib/anchor)                          │ │
│  │  IDL │ PDA derivation │ Program client │ Type definitions                │ │
│  └──────────────────────────┬───────────────────────────────────────────────┘ │
│                             │                                                  │
└─────────────────────────────┼──────────────────────────────────────────────────┘
                              │ HTTP/REST + RPC
             ┌────────────────┼────────────────┐
             │                │                │
      ┌──────▼──────┐  ┌─────▼──────┐  ┌──────▼──────────┐
      │  Next.js    │  │  Supabase  │  │  Solana RPC     │
      │  API Routes │  │  (Postgres)│  │  (Helius)       │
      │  (14 routes)│  │            │  │                 │
      └──────┬──────┘  │ • users    │  │ • Token-2022    │
             │         │ • enroll.  │  │ • Metaplex Core │
             ├─────────▶ • lessons  │  │ • Anchor PDAs   │
             │         │ • xp_txns  │  │ • DAS API       │
             │         │ • creds    │  └─────────────────┘
             │         │ • streaks  │
             │         └────────────┘
             │
      ┌──────▼──────────────────┐
      │   Solana Blockchain     │
      │   Devnet / Mainnet      │
      │                         │
      │ • Academy Program (24   │
      │   instructions)         │
      │ • XP Token Mint         │
      │   (Token-2022)          │
      │ • Credentials (cNFTs    │
      │   via Metaplex Core)    │
      │ • Enrollment PDAs       │
      └─────────────────────────┘
```

---

## Technology Stack

| Layer             | Stack                                                                     |
| ----------------- | ------------------------------------------------------------------------- |
| Frontend          | Next.js 14.2.5, React 18.3.1, TypeScript, Tailwind CSS 3.4.4             |
| Auth              | NextAuth 4.24.13 (Google + GitHub OAuth, JWT sessions)                    |
| Wallet            | @solana/wallet-adapter-react 0.15.35                                      |
| State (client)    | Zustand 4.5.4 (theme store with persist)                                  |
| State (server)    | TanStack React Query 5.48.0                                              |
| Database          | Supabase (PostgreSQL) via @supabase/supabase-js 2.38.0                    |
| CMS               | Sanity 5.9.0 + next-sanity 12.1.0 (courses, lessons, modules, challenges)|
| i18n              | Custom I18nProvider (3 locales: en, pt-br, es)                            |
| Editor            | Monaco Editor (@monaco-editor/react 4.7.0)                               |
| On-Chain          | Anchor 0.32.1, Token-2022 (XP), Metaplex Core (credentials)              |
| RPC               | Helius (DAS API, token balances, RPC)                                     |
| Analytics         | PostHog 1.356.1, Google Analytics (gtag.js), Sentry 10.40.0              |
| Animations        | Framer Motion 11.2.12                                                     |
| Charts            | Recharts 3.7.0                                                           |
| Markdown          | react-markdown 10.1.0                                                     |
| Testing           | Vitest 2.1.9, @testing-library/react 16.3.2                              |

---

## Component Architecture

### Provider Nesting (app/layout.tsx)

```
<html>
  <body>
    <QueryProvider>               ← TanStack React Query
      <AnalyticsProvider>         ← PostHog + GA4
        <AuthProvider>            ← NextAuth SessionProvider
          <WalletProvider>        ← Solana wallet-adapter
            <ThemeProvider>       ← light / dark / system
              <I18nProvider>      ← Custom i18n (en, pt-br, es)
                <Header />
                <main>{children}</main>
                <Footer />
              </I18nProvider>
            </ThemeProvider>
          </WalletProvider>
        </AuthProvider>
      </AnalyticsProvider>
    </QueryProvider>
  </body>
</html>
```

**Fonts:** Inter (sans), JetBrains Mono (mono), Space Grotesk (display)

### Component Hierarchy

```
<RootLayout>
  ├── <Header>
  │   ├── Logo + Navigation Links
  │   ├── <AuthButtons>         ← Sign In / Profile dropdown / Sign Out
  │   ├── <WalletConnect>       ← Solana wallet button
  │   ├── <ThemeSwitcher>       ← Light/Dark/System toggle
  │   └── LanguageSwitcher
  │
  ├── <main> (page content)
  │   ├── / → <HomePage>
  │   │   ├── HeroSection (animated stats: learners, courses, XP)
  │   │   ├── FeaturesSection (6 feature cards)
  │   │   ├── PopularCourses (CourseCard grid)
  │   │   ├── TestimonialsSection (3 testimonials)
  │   │   └── CTASection
  │   │
  │   ├── /courses → <CourseCatalog>
  │   │   ├── SearchBar
  │   │   ├── FilterPanel (difficulty, track)
  │   │   └── CourseGrid
  │   │       └── <CourseCard> (progress %, XP, duration, lessons)
  │   │
  │   ├── /courses/[slug] → <CourseDetail>
  │   │   ├── CourseHeader (title, difficulty, track)
  │   │   ├── ProgressBar (% complete)
  │   │   ├── LessonList (sidebar navigation)
  │   │   ├── CourseEnrollmentCard
  │   │   └── FinalizeAndClaim (certificate issuance)
  │   │
  │   ├── /courses/[slug]/lessons/[id] → <LessonPage>
  │   │   ├── Sidebar (module list + progress)
  │   │   ├── LessonContent (markdown rendering)
  │   │   ├── <CodeEditor> / <RustEditor> (Monaco)
  │   │   ├── <ChallengeRunner> + <TestResults>
  │   │   ├── <OutputPanel> (console output)
  │   │   └── Mark Complete + XP Award UI
  │   │
  │   ├── /dashboard → <Dashboard>
  │   │   ├── WelcomeBanner (greeting + streak info)
  │   │   ├── StatsGrid (Total XP, Level, Streak, Achievements)
  │   │   ├── LevelProgress bar
  │   │   ├── InProgressCourses (enrollment cards)
  │   │   ├── <GamificationUI>
  │   │   ├── <OnChainDashboard>
  │   │   └── StreakInfo panel
  │   │
  │   ├── /profile → <Profile>
  │   │   ├── ProfileHeader (avatar, name, bio, editable)
  │   │   ├── StatsSection (Level, XP, Streak, Longest)
  │   │   ├── <SkillRadar> chart
  │   │   ├── Credentials list (on-chain cNFTs)
  │   │   └── Member since / Join date
  │   │
  │   ├── /leaderboard → <Leaderboard>
  │   │   ├── YourRank card
  │   │   └── LeaderboardTable (on-chain + DB fallback)
  │   │
  │   ├── /settings → <Settings>
  │   │   ├── Account (email, linked providers)
  │   │   ├── Privacy (public profile, leaderboard visibility)
  │   │   ├── Language selector (3 locales)
  │   │   ├── Theme selector (light/dark/auto)
  │   │   ├── Wallet connection/disconnection
  │   │   └── Sign out
  │   │
  │   ├── /certificates → Certificate listing
  │   │   └── /certificates/[id] → Certificate detail
  │   │
  │   ├── /auth/signin → <SignIn>
  │   │   └── Google + GitHub OAuth buttons
  │   │
  │   └── /auth/complete-profile → <CompleteProfile>
  │       └── Display name + Age form
  │
  ├── <AchievementNotification> (toast popup)
  │
  └── <Footer>
      ├── Tagline + Links (Courses, Paths, Certifications)
      ├── Community (Discord, Twitter, GitHub)
      ├── Legal (Terms, Privacy, Contact)
      └── Copyright
```

### Component Directory Structure

```
components/
├── achievements/
│   ├── AchievementBadge.tsx      ← Single badge display
│   ├── AchievementGrid.tsx       ← Grid of all achievements
│   ├── AchievementNotification.tsx ← Toast notification
│   └── AchievementsSection.tsx   ← Dashboard section
│
├── auth/
│   ├── AuthButtons.tsx           ← Sign In / profile dropdown
│   └── WalletConnect.tsx         ← Solana wallet button
│
├── courses/
│   ├── CourseCard.tsx            ← Course preview card
│   ├── CourseCatalog.tsx         ← Search + filter + grid
│   └── CourseEnrollmentCard.tsx  ← Enrollment sidebar
│
├── dashboard/
│   ├── GamificationUI.tsx       ← XP, streaks, levels display
│   └── OnChainDashboard.tsx     ← On-chain data panel
│
├── editor/
│   ├── CodeEditor.tsx           ← Monaco editor (JS/TS)
│   ├── RustEditor.tsx           ← Monaco editor (Rust/Anchor)
│   ├── ChallengeRunner.tsx      ← Execute + validate code
│   ├── LessonPanels.tsx         ← Resizable lesson layout
│   ├── OutputPanel.tsx          ← Console output display
│   ├── SolanaCodeLesson.tsx     ← Solana-specific lesson UI
│   ├── TestResults.tsx          ← Test pass/fail display
│   ├── code-templates.ts        ← Starter code templates
│   └── test-runner.ts           ← Client-side test execution
│
├── layout/
│   ├── Header.tsx               ← Navigation + auth + wallet
│   └── Footer.tsx               ← Links + copyright
│
├── profile/
│   └── SkillRadar.tsx           ← Recharts radar chart
│
├── providers/
│   ├── AnalyticsProvider.tsx    ← PostHog + GA4
│   ├── AuthProvider.tsx         ← NextAuth session
│   ├── QueryProvider.tsx        ← TanStack React Query
│   ├── ThemeProvider.tsx        ← Dark/light/system
│   └── WalletProvider.tsx       ← Solana wallet-adapter
│
└── ui/
    ├── Button.tsx
    ├── Card.tsx
    ├── Input.tsx
    ├── Loading.tsx
    ├── ResizablePanel.tsx
    └── ThemeSwitcher.tsx
```

---

## Authentication Architecture

```
User clicks "Sign In"
    │
    ▼
/auth/signin page
  ├── "Continue with Google"  → NextAuth Google provider
  └── "Continue with GitHub"  → NextAuth GitHub provider
    │
    ▼
NextAuth JWT callback (lib/auth.ts):
  1. Lookup user by email in Supabase `users` table
  2. If not found → set token.needsProfile = true
  3. If found → set token.id = user.email
    │
    ├── needsProfile = true → redirect to /auth/complete-profile
    │   └── User fills display name + age
    │       └── POST /api/users/oauth (upserts user + auth_providers)
    │           └── Redirect to /dashboard
    │
    └── needsProfile = false → redirect to /dashboard
```

**Session Strategy:** JWT (no database sessions)  
**User Identifier:** Email address (stored as `users.id` in Supabase)

---

## Data Flow Architecture

### 1. Course Browsing Flow

```
User visits /courses
    │
    ▼
<CourseCatalog> renders
    │
    ├─→ useI18n() → localized strings
    │
    └─→ getCourseService().getAllCourses(filters)
        │
        ├─→ Sanity CMS query (GROQ)
        │   └─→ Returns Course[] with modules + lessons
        │
        └─→ Render CourseCard grid with:
            • Title, description, difficulty badge
            • Duration (minutes), lesson count
            • XP reward, progress % (if enrolled)
```

### 2. Course Enrollment Flow

```
User clicks "Enroll" on CourseDetail
    │
    ▼
POST /api/enrollments
  { user_id, course_id }
    │
    ▼
Supabase:
  1. INSERT into enrollments (user_id, course_id, enrolled_at)
  2. UNIQUE constraint ensures no duplicate enrollment
    │
    ▼
Frontend updates enrollment state
    │
    ├─→ If wallet connected:
    │   POST /api/enrollments/sync
    │   └─→ Reads Anchor program PDA
    │       └─→ Syncs on-chain enrollment to DB
    │
    └─→ Dashboard shows "In Progress" card
```

### 3. Lesson Completion & XP Award Flow

```
User completes lesson content / challenge
    │
    ▼
Click "Mark Complete & Earn XP"
    │
    ▼
POST /api/xp/award
  { userId, courseId, lessonId, amount, reason }
    │
    ▼
Backend (atomic):
  1. INSERT lesson_progress (user_id, course_id, lesson_id, xp_earned)
  2. UPDATE enrollments SET lessons_completed + 1, total_xp_earned + amount
  3. UPDATE users SET total_xp = total_xp + amount
  4. INSERT xp_transactions (user_id, amount, reason, course_id, lesson_id)
    │
    ▼
Frontend:
  • Success toast: "Lesson Complete! +{xp} XP"
  • Update progress bar
  • Check if all lessons complete → show "Finalize" button
```

### 4. Course Completion & Certificate Issuance Flow

```
All lessons completed → "Finalize & Claim Certificate"
    │
    ▼
Step 1: POST /api/courses/finalize
  { userId, courseId }
  └─→ UPDATE enrollments SET completed_at = NOW()
    │
    ▼
Step 2: POST /api/credentials/issue
  { userId, courseId, walletAddress }
  └─→ Mint cNFT via Metaplex Core
      └─→ On-chain credential with course metadata
    │
    ▼
INSERT credentials (user_id, course_id, asset_id)
    │
    ▼
Frontend: Show "View Certificate" link
  └─→ /certificates/[id] shows on-chain credential details
```

### 5. Leaderboard Flow (Hybrid On-Chain + DB)

```
User visits /leaderboard
    │
    ▼
GET /api/leaderboard
    │
    ├─→ Try: Helius DAS API (getTokenAccounts for XP mint)
    │   └─→ Returns wallet → balance mapping
    │       └─→ Map wallets to user profiles
    │
    └─→ Fallback: Supabase query
        └─→ SELECT * FROM users ORDER BY total_xp DESC
    │
    ▼
Response: ranked list with user info + XP amounts
    │
    ▼
Frontend:
  • <YourRank> card (current user's position)
  • <LeaderboardTable> with all ranked users
```

### 6. Gamification Stats Flow

```
GET /api/gamification/[userId]
    │
    ▼
Merge from multiple sources:
  1. Supabase `users` → total_xp, level, streak data
  2. Supabase `user_achievements` → unlocked achievements
  3. Supabase `lesson_progress` → lessons completed count
  4. On-chain XP balance (if wallet connected)
  5. Combine: max(db_xp, onchain_xp) for display
    │
    ▼
Response:
  { xp, level, streak, achievements[], lessonsCompleted }
```

---

## API Routes (14 Endpoints)

### Next.js API Routes (app/api/)

| Route                                   | Methods    | Purpose                                           |
| --------------------------------------- | ---------- | ------------------------------------------------- |
| `/api/auth/[...nextauth]`               | GET, POST  | NextAuth handler (Google + GitHub OAuth)           |
| `/api/users/oauth`                      | POST       | Upsert user from OAuth provider + profile data    |
| `/api/users/[userId]/profile`           | GET, PATCH | Fetch or update user profile                      |
| `/api/users/[userId]/enrollments`       | GET        | List all enrollments for a user                   |
| `/api/users/[userId]/completed-lessons` | GET        | List completed lesson IDs (filtered by courseId)   |
| `/api/enrollments`                      | POST       | Create new enrollment                             |
| `/api/enrollments/sync`                 | POST       | Sync on-chain enrollment PDA → Supabase           |
| `/api/enrollments/[userId]/completion`  | GET        | Course completion status + credential minted?      |
| `/api/xp/award`                         | POST       | Award XP for lesson completion (multi-table write) |
| `/api/courses/finalize`                 | POST       | Mark course as completed (set completed_at)        |
| `/api/credentials/issue`                | POST       | Issue on-chain credential (cNFT via Metaplex Core) |
| `/api/leaderboard`                      | GET        | Ranked users (Helius on-chain → DB fallback)       |
| `/api/gamification/[userId]`            | GET        | Gamification stats (XP, level, streak, etc.)       |
| `/api/code-execution/rust`              | POST       | Execute Rust code via Rust Playground API          |

---

## Service Layer Architecture

### Frontend Services (lib/services/)

```
lib/services/
├── course.service.ts              ← LocalCourseService (Sanity CMS queries)
├── learning-progress.service.ts   ← LocalLearningProgressService
├── xp.service.ts                  ← XpService (Token-2022 ATA balances)
├── achievement.service.ts         ← AchievementService (10+ achievement defs)
├── credential.service.ts          ← CredentialService (Helius DAS getAssetsByOwner)
├── code-execution.service.ts      ← CodeExecutionService (JS/TS sandbox)
├── rust-execution.service.ts      ← RustExecutionService (Rust Playground API)
├── test-runner.service.ts         ← TestRunnerService (client-side test exec)
├── helius.service.ts              ← HeliusService (DAS API, token queries)
├── onchain.service.ts             ← OnChainService (program interactions)
├── onchain-course.service.ts      ← OnChainCourseService (course PDA reads)
├── photon.service.ts              ← PhotonService (compressed account queries)
├── transaction.service.ts         ← TransactionService (TX building + sending)
└── index.ts                       ← Exports singletons + interfaces
```

**Key Service Interfaces:**

```typescript
// CourseService
getAllCourses(filters?: FilterOptions): Promise<Course[]>
getCourse(slug: string): Promise<CourseWithLessons>
getLesson(courseSlug: string, lessonId: string): Promise<Lesson>

// XpService
getXpBalance(walletAddress: string): Promise<number>
getXpLevel(totalXp: number): { level: number; progress: number }

// AchievementService (10+ achievement definitions)
checkAchievements(userId: string, stats: UserStats): Achievement[]
// Definitions: first-lesson, course-complete, three-courses,
// xp-100, xp-500, streak-3, streak-7, streak-30, etc.

// CredentialService
getCredentials(walletAddress: string): Promise<Credential[]>
getCredentialByTrack(wallet: string, track: string): Promise<Credential | null>

// CodeExecutionService
execute(code: string, language: string): Promise<ExecutionResult>

// RustExecutionService
executeRust(code: string, opts?: RustOptions): Promise<ExecutionResult>
```

### Backend Services (backend/src/services/)

```
backend/src/services/
├── auth.service.ts           ← OAuth provider management
├── blockchain.service.ts     ← Solana RPC interactions
├── enrollment.service.ts     ← Enrollment CRUD
├── gamification.service.ts   ← XP, streaks, levels, achievements
├── transaction.service.ts    ← Transaction building & signing
├── user.service.ts           ← User CRUD, profile updates
└── index.ts                  ← Exports GamificationService, UserService, TransactionService
```

---

## Hooks Architecture

### Custom Hooks (lib/hooks/)

| Hook                      | Purpose                                             |
| ------------------------- | --------------------------------------------------- |
| `useAuth`, `AuthProvider` | NextAuth session wrapper + user state               |
| `useI18n`, `I18nProvider` | Internationalization (3 locales)                    |
| `useTheme`                | Theme state (light/dark/system) via Zustand         |
| `useCourses`              | Course list fetching + caching                      |
| `useEnrollment`           | Enrollment creation + status checking               |
| `useEnrollmentSync`       | Sync on-chain enrollment → DB                       |
| `useLearningProgress`     | Track/update learner progress                       |
| `useLessonSubmission`     | Lesson code submission + validation                 |
| `useCompleteLesson`       | On-chain lesson completion                          |
| `useProgress`             | User progress data (courses, lessons)               |
| `useUserProgress`         | On-chain user progress (PDA reads)                  |
| `useAwardXP`              | Trigger XP award via API                            |
| `useXpBalance`            | On-chain XP token balance (Token-2022 ATA)          |
| `useXp`                   | Combined XP data (on-chain + DB)                    |
| `useGamification`         | Gamification stats (XP, level, streak, achievements)|
| `useAchievements`         | Achievement list + unlock status                    |
| `useLeaderboard`          | Leaderboard data fetching                           |
| `useCourseCompletion`     | Course completion status + finalization              |
| `useWallet`               | Solana wallet connection state                      |
| `useProgram`              | Anchor program client instance                      |
| `useOnchain`              | Generic on-chain data fetching                      |
| `useConfig`               | App configuration                                   |

---

## State Management

### Zustand Store

```typescript
// lib/stores/theme.store.ts
interface ThemeStore {
  theme: 'light' | 'dark' | 'system';
  systemDark: boolean;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void;
  getEffectiveTheme: () => 'light' | 'dark';
}
// Persisted to localStorage key: 'theme-storage'
```

### TanStack React Query (Server State)

All API data fetching uses TanStack Query for caching, refetching, and stale-while-revalidate:

```typescript
// Course data
useQuery(['courses'], () => courseService.getAllCourses())
useQuery(['course', slug], () => courseService.getCourse(slug))

// User data
useQuery(['user', userId], () => fetchUserProfile(userId))
useQuery(['enrollments', userId], () => fetchEnrollments(userId))
useQuery(['completed-lessons', userId, courseId], ...)

// Gamification
useQuery(['gamification', userId], () => fetchGamificationStats(userId))
useQuery(['leaderboard'], () => fetchLeaderboard())
useQuery(['xp-balance', wallet], () => xpService.getXpBalance(wallet))

// Mutations
useMutation(() => enrollCourse(userId, courseId))
useMutation(() => awardXP({ userId, courseId, lessonId, amount }))
useMutation(() => finalizeCourse(userId, courseId))
useMutation(() => issueCredential(userId, courseId, wallet))
```

---

## On-Chain Architecture (Anchor Program)

### Program Overview

**Program ID:** `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf`  
**Framework:** Anchor 0.32.1  
**Network:** Devnet (production: Mainnet-Beta)

### Instructions (24)

| Category         | Instructions                                                  |
| ---------------- | ------------------------------------------------------------- |
| Admin            | `initialize`, `update_config`, `create_season`, `close_season`|
| Courses          | `create_course`, `update_course`                              |
| Minters          | `register_minter`, `revoke_minter`                            |
| Achievements     | `create_achievement_type`, `deactivate_achievement_type`      |
| Enrollment       | `enroll`, `close_enrollment`, `unenroll`                      |
| Progress         | `complete_lesson`, `finalize_course`                          |
| Credentials      | `issue_credential`, `upgrade_credential`                      |
| XP & Rewards     | `reward_xp`, `award_achievement`, `award_streak_freeze`, `claim_achievement` |
| Social           | `register_referral`                                           |
| Learner          | `init_learner`                                                |

### On-Chain State Accounts (PDAs)

```
Config PDA → [authority, backendSigner, xpMint, ...]
Course PDA → [courseId, creator, contentTxId, lessonCount, difficulty, xpPerLesson, trackId, ...]
Enrollment PDA → [user, courseId, enrolledAt, lessonsCompleted, ...]
AchievementType PDA → [name, criteria, xpReward, rarity, ...]
Learner PDA → [wallet, totalXp, level, ...]
```

### Client SDK (lib/anchor/)

```
lib/anchor/
├── academy.json        ← Full IDL (auto-generated from program)
├── client.ts           ← Program client wrapper
├── constants.ts        ← PROGRAM_ID, TOKEN_2022_PROGRAM_ID, MPL_CORE_PROGRAM_ID
├── idl-compat.ts       ← IDL version compatibility layer
├── pda.ts              ← PDA derivation helpers (getConfigPda, getCoursePda, etc.)
├── types.ts            ← TypeScript mirrors of on-chain account types
└── index.ts            ← Re-exports
```

---

## Database Schema (Supabase / PostgreSQL)

```sql
-- Core user table
CREATE TABLE users (
  id TEXT PRIMARY KEY,               -- email address
  username TEXT,
  email TEXT,
  password_hash TEXT,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  wallet_address TEXT,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  achievements_bitmap INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Course enrollments
CREATE TABLE enrollments (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  course_id TEXT,
  progress_bitmap INTEGER DEFAULT 0,
  lessons_completed INTEGER DEFAULT 0,
  total_xp_earned INTEGER DEFAULT 0,
  enrolled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, course_id)
);

-- Per-lesson progress tracking
CREATE TABLE lesson_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  course_id TEXT,
  lesson_id TEXT,
  completed BOOLEAN DEFAULT false,
  xp_earned INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, course_id, lesson_id)
);

-- XP transaction history
CREATE TABLE xp_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  amount INTEGER,
  reason TEXT,
  course_id TEXT,
  lesson_id TEXT,
  created_at TIMESTAMPTZ
);

-- Achievement definitions
CREATE TABLE achievements (
  id INTEGER PRIMARY KEY,
  name TEXT,
  description TEXT,
  icon TEXT,
  rarity TEXT,                        -- common/uncommon/rare/epic/legendary
  xp_reward INTEGER,
  condition_type TEXT,                -- xp/challenges/streak/course/social
  condition_value INTEGER
);

-- User ↔ Achievement unlock tracking
CREATE TABLE user_achievements (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  achievement_id INTEGER REFERENCES achievements(id),
  unlocked_at TIMESTAMPTZ,
  UNIQUE(user_id, achievement_id)
);

-- Streak tracking
CREATE TABLE streaks (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE REFERENCES users(id),
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  freeze_used BOOLEAN DEFAULT false
);

-- Daily activity history
CREATE TABLE streak_history (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  activity_date DATE,
  xp_earned INTEGER DEFAULT 0,
  UNIQUE(user_id, activity_date)
);

-- OAuth provider linkage
CREATE TABLE auth_providers (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  provider TEXT,                       -- 'google' | 'github'
  provider_user_id TEXT,
  UNIQUE(provider, provider_user_id)
);

-- On-chain credentials
CREATE TABLE credentials (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  course_id TEXT,
  asset_id TEXT                        -- Metaplex Core asset address
);

-- User profile extensions
CREATE TABLE user_profiles (
  user_id TEXT REFERENCES users(id),
  age INTEGER
);
```

---

## Content Management (Sanity CMS)

### Schema Types

```
sanity/schemaTypes/
├── blockContent.ts    ← Rich text (portable text)
├── challenge.ts       ← Code challenges (starter code, tests, language)
├── course.ts          ← Course documents (title, slug, difficulty, track, modules)
├── lesson.ts          ← Lesson documents (title, content, order, xpReward)
└── module.ts          ← Course modules (grouping of lessons)
```

**Project:** `superteam_academy` / Dataset: `production`

Courses are authored in Sanity Studio and queried via GROQ in `CourseService`.

---

## Internationalization (i18n)

### Architecture

```
lib/i18n/
└── translations.ts    ← ~1050 lines, all 3 locale translations

lib/hooks/
└── useI18n.tsx         ← Custom I18nProvider + useI18n hook
```

**Locales:** `en` (English), `pt-br` (Brazilian Portuguese), `es` (Spanish)

**Usage Pattern:**
```typescript
const { t, language, setLanguage } = useI18n();
<h1>{t('dashboard.welcomeUser').replace('{name}', userName)}</h1>
```

**Translation Sections:** `nav`, `home`, `courses`, `courseDetail`, `lesson`, `challenge`, `dashboard`, `leaderboard`, `profile`, `settings`, `auth`, `achievements`, `certificates`, `footer`, `common`

Language preference stored in `localStorage` and selectable from Settings page.

---

## Routing Architecture

### Next.js App Directory

```
app/
├── layout.tsx                           ← Root layout (providers + header/footer)
├── page.tsx                             ← / (Home)
├── global-error.tsx                     ← Global error boundary
├── globals.css                          ← Tailwind base styles
│
├── courses/
│   └── [slug]/
│       ├── page.tsx                     ← /courses/[slug] (Course detail)
│       └── lessons/
│           └── [id]/
│               └── page.tsx             ← /courses/[slug]/lessons/[id]
│
├── dashboard/
│   └── page.tsx                         ← /dashboard
│
├── profile/
│   └── page.tsx                         ← /profile
│
├── leaderboard/
│   └── page.tsx                         ← /leaderboard
│
├── settings/
│   └── page.tsx                         ← /settings
│
├── certificates/
│   ├── page.tsx                         ← /certificates (listing)
│   └── [id]/
│       └── page.tsx                     ← /certificates/[id] (detail)
│
├── auth/
│   ├── signin/
│   │   └── page.tsx                     ← /auth/signin
│   └── complete-profile/
│       └── page.tsx                     ← /auth/complete-profile
│
├── demo/                                ← Demo/playground page
│
└── api/
    ├── auth/[...nextauth]/route.ts
    ├── users/oauth/route.ts
    ├── users/[userId]/profile/route.ts
    ├── users/[userId]/enrollments/route.ts
    ├── users/[userId]/completed-lessons/route.ts
    ├── enrollments/route.ts
    ├── enrollments/sync/route.ts
    ├── enrollments/[userId]/completion/route.ts
    ├── xp/award/route.ts
    ├── courses/finalize/route.ts
    ├── credentials/issue/route.ts
    ├── leaderboard/route.ts
    ├── gamification/[userId]/route.ts
    └── code-execution/rust/route.ts
```

---

## Code Editor Architecture

### Monaco Editor Integration

```
<LessonPage>
  │
  ├─→ JavaScript/TypeScript lessons:
  │   └── <CodeEditor> (Monaco)
  │       • Language: auto-detect from lesson
  │       • Theme: synced with app theme
  │       • Starter code from Sanity CMS
  │       • Client-side execution via Web Worker
  │
  └─→ Rust/Anchor lessons:
      └── <RustEditor> (Monaco)
          • Language: rust
          • Anchor-aware syntax highlighting
          • Execution via POST /api/code-execution/rust
          • Uses Rust Playground API backend

<ChallengeRunner>
  ├─→ Collects user code from editor
  ├─→ Runs against test cases
  ├─→ <TestResults> shows pass/fail per test
  └─→ <OutputPanel> shows console output
```

**Code Templates:** Predefined starter templates in `components/editor/code-templates.ts`

---

## Performance & Caching Strategy

### Code Splitting
```typescript
// Heavy components loaded dynamically
const CodeEditor = dynamic(() => import('@/components/editor/CodeEditor'), {
  loading: () => <EditorSkeleton />,
  ssr: false   // Monaco doesn't support SSR
});
```

### Caching Layers
```
TanStack Query (client):
  • Course list: 5min staleTime
  • User profile: 2min staleTime
  • Leaderboard: 1min staleTime
  • XP balance: 30s staleTime

Next.js (server):
  • Static pages: ISR where applicable
  • API routes: no-cache (dynamic data)

Supabase:
  • Connection pooling via Supabase client
  • Row-level security (RLS) policies
```

---

## Analytics & Monitoring

```
lib/analytics/
├── ga4.ts              ← Google Analytics 4 integration
├── posthog.ts          ← PostHog product analytics
└── index.ts            ← Unified analytics interface

components/providers/
└── AnalyticsProvider.tsx  ← Initializes both GA4 + PostHog
```

**Error Monitoring:** Sentry (`@sentry/nextjs`) with `instrumentation.ts` + `instrumentation-client.ts`

**Key Tracked Events:**
- Page views, course enrollments, lesson completions
- XP awards, achievement unlocks
- Code submissions (pass/fail), editor interactions
- Wallet connections, credential claims

---

## Security Considerations

### Authentication
- NextAuth JWT sessions (no sensitive data in tokens)
- OAuth only (no password-based auth in production flow)
- Profile completion gated by `needsProfile` flag

### Code Execution Sandbox
- JavaScript: Client-side Web Worker execution (isolated from DOM)
- Rust: Server-side via Rust Playground API (no local execution)

### On-Chain Security
- Backend signer for privileged operations (XP minting, credential issuance)
- PDA-based access control in Anchor program
- Token-2022 mint authority restricted to backend signer

### Input Validation
- API routes validate required fields before DB writes
- Unique constraints prevent duplicate enrollments, lesson completions, achievements

---

## Directory Structure Summary

```
solana-academy-platform/
├── .claude/                  ← AI assistant config (agents, commands, rules, skills)
├── .github/workflows/        ← CI/CD pipelines
├── app/                      ← Next.js pages + API routes (14 endpoints)
├── backend/                  ← Express backend services + DB setup
│   └── src/
│       ├── services/         ← Auth, Blockchain, Enrollment, Gamification, etc.
│       └── routes/           ← API, Auth, OnChain, Transaction routes
├── components/               ← React components (9 directories)
├── docs/                     ← Architecture, specification, feature docs
│   └── internal/             ← Dev logs, deployment notes, audit reports
├── lib/
│   ├── analytics/            ← GA4 + PostHog integration
│   ├── anchor/               ← Anchor IDL, client, PDAs, types
│   ├── api/                  ← API client utilities
│   ├── data/                 ← Static course/lesson data
│   ├── hooks/                ← 23 custom React hooks
│   ├── i18n/                 ← Translations (en, pt-br, es)
│   ├── services/             ← 14 frontend service files
│   ├── stores/               ← Zustand theme store
│   ├── types/                ← TypeScript types, DB row types
│   └── utils/                ← Utility functions (cn.ts)
├── programs/academy/         ← Anchor/Rust on-chain program (24 instructions)
├── sanity/schemaTypes/       ← CMS schemas (course, lesson, module, challenge)
├── scripts/                  ← Deployment + utility scripts
├── wallets/                  ← Keypairs (program, signer, XP mint)
├── CLAUDE.md                 ← AI context file
├── README.md                 ← Project readme
├── Anchor.toml               ← Anchor config
├── package.json              ← Dependencies
├── tsconfig.json             ← TypeScript config
├── tailwind.config.ts        ← Tailwind config
├── next.config.js            ← Next.js config
├── sanity.config.ts          ← Sanity CMS config
├── vitest.config.mts         ← Test config
└── vitest.setup.mts          ← Test setup
```

---

**Document Version**: 2.0.0  
**Last Updated**: March 2026  
**Maintained By**: Superteam Academy Team
