# Superteam Academy - Architecture

## System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         Browser / PWA                             │
│                                                                   │
│  Next.js 14 App Router (React Server Components + Client)        │
│                                                                   │
│  [locale]/(public)          [locale]/(auth)         /api         │
│  ├── Landing page           ├── Dashboard           ├── auth/    │
│  ├── Course list            ├── Profile             │   [...next │
│  ├── Course detail          ├── Profile/[username]  │   auth]    │
│  ├── Lesson view            └── Settings            └── lessons/ │
│  ├── Leaderboard                                        complete  │
│  ├── Certificates/[id]                                           │
│  ├── Community                                                    │
│  └── Onboarding                                                   │
└──────────────┬────────────────────────────────────────────────────┘
               │
    ┌──────────┼──────────┬───────────────┐
    ▼          ▼          ▼               ▼
┌────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐
│ Solana │ │ Supabase │ │ Sanity │ │  Helius  │
│ Devnet │ │   DB     │ │  CMS   │ │  DAS API │
└───┬────┘ └──────────┘ └────────┘ └──────────┘
    │
┌───┴──────────────────────────────────┐
│         Anchor Program               │
│  ID: ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf │
│                                      │
│  16 instructions / 6 PDA types       │
│  26 error variants / 15 events       │
│                                      │
│  Token-2022 XP Mint (NonTransferable │
│  + PermanentDelegate)                │
│                                      │
│  Metaplex Core Credential NFTs       │
│  (soulbound via PermanentFreezeDelegate) │
└──────────────────────────────────────┘
```

## Component Tree

```
<RootLayout>                           src/app/layout.tsx
  (fonts, PWA meta, SW registration)
  │
  └── <LocaleLayout>                   src/app/[locale]/layout.tsx
        (next-intl provider, SessionProvider, WalletProvider)
        │
        ├── <Header />                 src/components/layout/Header.tsx
        │     ├── <NavLinks />
        │     ├── <LocaleSwitcher />
        │     ├── <ThemeToggle />
        │     └── <WalletButton />     src/components/solana/WalletButton.tsx
        │
        ├── {children}                 (public) or (auth) route group
        │
        └── <Footer />                 src/components/layout/Footer.tsx

(public) routes:
  <LandingPage />
    ├── <HeroSection />
    ├── <TrackGrid />
    │     └── <TrackCard /> x5
    └── <StatsSection />

  <CoursesPage />
    └── <CourseGrid />
          └── <CourseCard /> x N

  <CourseDetailPage />
    ├── <CourseHero />
    ├── <ModuleList />
    │     └── <LessonRow /> x N
    ├── <EnrollButton />              (client, uses useEnrollment hook)
    └── <InstructorCard />

  <LessonPage />
    ├── <LessonSidebar />             (module + lesson list)
    ├── <LessonContent />             (Portable Text renderer)
    │   OR
    └── <CodeChallenge />             (Monaco Editor + test runner)
          ├── <MonacoEditor />        src/components/editor/MonacoEditor.tsx
          └── <TestResults />

  <LeaderboardPage />
    └── <LeaderboardTable />          (client component, fetches on mount)
          └── <LeaderboardRow /> x N

  <CertificatePage />
    ├── <CertificateCard />           (static render, server component)
    ├── <DownloadButton />            (client, html2canvas)
    ├── <CopyShareButton />           (client, clipboard API)
    └── <TwitterShareButton />        (anchor tag, intent URL)

(auth) routes:
  <DashboardPage />
    ├── <XPBar />                     src/components/gamification/XPBar.tsx
    ├── <StreakWidget />              src/components/gamification/StreakWidget.tsx
    ├── <LevelBadge />               src/components/gamification/LevelBadge.tsx
    ├── <EnrolledCourseList />
    └── <CredentialGrid />
          └── <CredentialCard /> x N  src/components/solana/CredentialCard.tsx
```

## Data Flow Diagrams

### Lesson Completion Flow

```
User submits code in Monaco Editor
  │
  ▼
<CodeChallenge /> runs local test cases (browser)
  │ pass
  ▼
completeLesson(courseId, lessonIndex)      [src/services/learning-progress.ts]
  │
  ▼
POST /api/lessons/complete                 [src/app/api/lessons/complete/route.ts]
  body: { courseId, lessonIndex, walletAddress }
  │
  ▼ (server validates NextAuth session + course ownership)
Backend keypair signs complete_lesson tx   [BACKEND_SIGNER_PRIVATE_KEY]
  │
  ▼ [ON-CHAIN]
Anchor: Enrollment.lesson_flags bitmap updated
Anchor: Token-2022 XP minted to learner ATA
Anchor: LessonCompleted event emitted
  │
  ▼
API returns { signature: "..." }
  │
  ▼
Frontend: useXpBalance polls Token-2022 ATA (30s interval)
Frontend: CourseProgress re-fetched → progress bar updates
Frontend: Streak updated in localStorage + Supabase
```

**Current Status**: `POST /api/lessons/complete` returns a stub mock signature. The full backend-signing flow is architecturally complete and ready to wire up (see `CUSTOMIZATION.md > Swapping Stubs`).

### Course Enrollment Flow

```
User clicks "Enroll Now" on course detail page
  │
  ▼
<EnrollButton /> → useEnrollment().enroll()    [src/hooks/useEnrollment.ts]
  │
  ▼
Wallet adapter prompts user to sign
  tx: enroll(courseId)                          [Anchor instruction]
  │ user approves
  ▼ [ON-CHAIN]
Anchor: Enrollment PDA created
  seeds: ["enrollment", courseId, learnerPubkey]
  data: { lesson_flags: [0u64; 4], enrolled_at: now() }
  │
  ▼
UI: enrolled state → progress bar visible, lessons unlocked
Supabase: enrollment recorded for streak tracking
```

### Credential Display Flow

```
<ProfilePage /> or <DashboardPage /> mounts
  │
  ▼
getCredentials(walletAddress)                  [src/services/credentials.ts]
  │
  ▼
Helius DAS API: getAssetsByOwner(walletAddress)
  filter: updateAuthority in TRACK_COLLECTIONS
  │
  ▼
Map assets → Credential[] (id, name, imageUrl, attributes)
  attributes: { trackId, level, coursesCompleted, totalXp }
  │
  ▼
<CredentialCard /> rendered per credential
  links to /certificates/[assetAddress]
```

### Leaderboard Flow

```
<LeaderboardPage /> mounts
  │
  ▼
getLeaderboard(timeframe)                      [src/services/leaderboard.ts]
  │
  ▼
Helius DAS: getTokenAccounts for XP mint
  filter: nonZero balances
  sort: descending by amount
  paginate: top 100
  │
  ▼
Enrich with Supabase profiles (username, avatar)
  │
  ▼
Map → LeaderboardEntry[] { rank, walletAddress, xpBalance, level }
  level = floor(sqrt(xpBalance / 100))
  │
  ▼
<LeaderboardTable /> renders with timeframe tabs
```

## Service Layer

All business logic lives in `src/services/`. Services are plain async functions (not classes), grouped by domain.

### LearningProgressService Interface

```typescript
// src/services/learning-progress.ts

interface LearningProgressService {
  // On-chain: reads Enrollment PDA, decodes lesson_flags bitmap
  getProgress(walletAddress: string, courseId: string): Promise<CourseProgress>;

  // Backend-signed: POST /api/lessons/complete
  completeLesson(courseId: string, lessonIndex: number): Promise<TxResult>;

  // Token-2022 ATA balance for XP mint
  getXpBalance(walletAddress: string): Promise<number>;

  // localStorage + Supabase streaks table
  getStreakData(userId: string): Promise<StreakData>;

  // Helius DAS: XP token holders sorted by balance
  getLeaderboard(timeframe: "weekly" | "monthly" | "all-time"): Promise<LeaderboardEntry[]>;

  // Helius DAS: getAssetsByOwner filtered by TRACK_COLLECTIONS
  getCredentials(walletAddress: string): Promise<Credential[]>;
}
```

### Key Hooks

| Hook | File | Data Source | Revalidation |
|---|---|---|---|
| `useXpBalance` | hooks/useXpBalance.ts | Token-2022 ATA via getTokenAccountBalance | 30s polling |
| `useEnrollment` | hooks/useEnrollment.ts | Enrollment PDA via getAccountInfo | on-demand |
| `useCredentials` | hooks/useCredentials.ts | Helius DAS getAssetsByOwner | on-demand |
| `useStreak` | hooks/useStreak.ts | localStorage + Supabase streaks | on mount |
| `useLessonProgress` | hooks/useLessonProgress.ts | Enrollment PDA bitmap | post-completion |

## On-Chain Integration Points

### Live (Implemented)

| Feature | Status | Code Location |
|---|---|---|
| PDA derivation (all 6 types) | Live | `src/lib/pda.ts` |
| Lesson bitmap decode | Live | `src/lib/bitmap.ts` |
| XP Token-2022 ATA balance | Live | `src/lib/solana.ts:fetchXpBalance` |
| Enrollment PDA read + decode | Live | `src/services/learning-progress.ts:getProgress` |
| Helius DAS credential query | Live | `src/services/credentials.ts` |
| Helius DAS leaderboard query | Live | `src/services/leaderboard.ts` |
| Wallet connect (Phantom, Backpack, Solflare) | Live | `src/components/providers/WalletProvider.tsx` |

### Stubbed (Ready to Wire)

| Feature | Status | Stub Location | Production Path |
|---|---|---|---|
| `complete_lesson` tx signing | Stub | `src/app/api/lessons/complete/route.ts` | Load `BACKEND_SIGNER_PRIVATE_KEY`, build + submit tx |
| `finalize_course` call | Not impl | — | Backend calls after bitmap fully set |
| `issue_credential` call | Not impl | — | Backend calls after finalization |
| Achievement awarding | Not impl | — | Registered minter calls `award_achievement` |

## PDA Structure Table

Program ID: `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf`

| Account | Seeds | Authority | Purpose |
|---|---|---|---|
| Config | `["config"]` | Platform admin | Program-wide settings, backend signer pubkey |
| Course | `["course", courseId]` | Course creator | Course metadata, lesson count, XP reward |
| Enrollment | `["enrollment", courseId, learnerPubkey]` | Learner | Per-learner progress bitmap |
| MinterRole | `["minter", minterPubkey]` | Admin | Whitelist for achievement minters |
| AchievementType | `["achievement", achievementId]` | Admin | Achievement definition |
| AchievementReceipt | `["achievement_receipt", achievementId, recipientPubkey]` | Minter | Proof of achievement award |

### Enrollment Bitmap Layout

`lesson_flags: [u64; 4]` — 256 bits total, 1 bit per lesson:

```
Word 0 (u64): lessons 0-63
Word 1 (u64): lessons 64-127
Word 2 (u64): lessons 128-191
Word 3 (u64): lessons 192-255

Bit check: word[i / 64] & (1 << (i % 64)) != 0
```

Helpers in `src/lib/bitmap.ts`: `isLessonCompleted(flags, index)`, `getCompletedLessonIndices(flags, total)`.

## Database Schema (Supabase)

```
profiles
  id                UUID PK
  wallet_address    TEXT UNIQUE
  google_id         TEXT UNIQUE
  github_id         TEXT UNIQUE
  username          TEXT UNIQUE
  display_name      TEXT
  bio               TEXT
  avatar_url        TEXT
  is_public         BOOLEAN DEFAULT true
  created_at        TIMESTAMPTZ
  updated_at        TIMESTAMPTZ

linked_accounts
  id                UUID PK
  user_id           UUID FK → profiles.id
  provider          TEXT ('wallet' | 'google' | 'github')
  provider_id       TEXT
  UNIQUE(provider, provider_id)

streaks
  user_id           UUID PK FK → profiles.id
  current_streak    INT
  longest_streak    INT
  last_activity_date DATE
  streak_history    JSONB (array of ISO date strings)
```

Note: Learning progress (completed lessons, XP) lives on-chain. Supabase stores only identity and social data.

## API Routes

| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | — | NextAuth session management (Google, GitHub) |
| `/api/lessons/complete` | POST | NextAuth session | Validates lesson completion, returns mock signature (stub) |

## i18n Architecture

- Supported locales: `en` (default), `pt-BR`, `es`
- URL structure: `/{locale}/path` (e.g. `/pt-BR/courses`)
- Routing config: `src/i18n/routing.ts` (next-intl `defineRouting`)
- Server translation: `getTranslations({ locale, namespace })` in Server Components
- Client translation: `useTranslations(namespace)` in Client Components
- Message files: `src/i18n/messages/{locale}.json`
- Course content stays in original language; all UI strings are translated

### Translation Namespaces

| Namespace | Used In |
|---|---|
| `nav` | Header navigation |
| `hero` | Landing page hero section |
| `course` | Course detail + lesson views |
| `certificate` | Certificate page |
| `dashboard` | Learner dashboard |
| `leaderboard` | Leaderboard page |
| `common` | Shared UI elements |

## Security Notes

- Backend signer private key (`BACKEND_SIGNER_PRIVATE_KEY`) never reaches the client bundle.
- Service role Supabase key (`SUPABASE_SERVICE_ROLE_KEY`) is server-side only.
- NextAuth validates all OAuth tokens before issuing session cookies.
- Lesson completion requires a valid NextAuth session (wallet address or OAuth).
- All Solana account data is validated by the Anchor program before state mutation.
