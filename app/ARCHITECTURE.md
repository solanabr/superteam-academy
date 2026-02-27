# Superteam Academy — Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js Frontend                      │
│                                                             │
│  [locale]/(public)     [locale]/(auth)     /api             │
│  Landing               Dashboard           auth/[...nextauth]│
│  Courses               Profile             lessons/complete  │
│  Course Detail         Settings                             │
│  Lesson View           Leaderboard                          │
│  Certificates                                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
    ┌─────────┐  ┌──────────┐  ┌──────────┐
    │ Solana  │  │ Supabase │  │  Sanity  │
    │ Devnet  │  │   DB     │  │   CMS    │
    └────┬────┘  └──────────┘  └──────────┘
         │
    ┌────┴────────────────────┐
    │  Anchor Program         │
    │  ACADBRCB3...           │
    │                         │
    │  Token-2022 XP Mint     │
    │  Metaplex Core NFTs     │
    └─────────────────────────┘
```

## Data Flow

### Lesson Completion Flow

```
User submits code
    │
    ▼
POST /api/lessons/complete
    │
    ▼ (backend validates session + content)
Backend keypair signs complete_lesson tx
    │
    ▼
On-chain: bitmap updated, XP minted to learner ATA
    │
    ▼
Frontend: polls XP balance, updates progress UI
```

### Course Enrollment Flow

```
User clicks "Enroll"
    │
    ▼
useEnrollment.enroll()
    │
    ▼
Wallet signs enroll tx (learner pays rent)
    │
    ▼
On-chain: Enrollment PDA created
    │
    ▼
UI updates: progress bar, lesson list unlocked
```

### Credential Display Flow

```
Profile page loads
    │
    ▼
getCredentials(walletAddress)
    │
    ▼
Helius DAS API: getAssetsByOwner
    │
    ▼
Filter by TRACK_COLLECTIONS addresses
    │
    ▼
Display CredentialCard components
```

## Component Architecture

### Providers (root level)

```
<SessionProvider>           ← NextAuth session
  <WalletProvider>          ← Solana wallet adapter
    <TooltipProvider>       ← shadcn/ui
      <LocaleLayout>        ← next-intl messages
        <Header />
        {children}
        <Footer />
```

### Service Layer Interfaces

```typescript
// LearningProgressService — src/services/learning-progress.ts
getProgress(wallet, courseId)     → CourseProgress    // on-chain Enrollment PDA
completeLesson(courseId, index)   → TxResult          // POST /api/lessons/complete
getXpBalance(wallet)              → number            // Token-2022 ATA balance
getStreakData(userId)             → StreakData         // localStorage
getLeaderboard(timeframe)         → LeaderboardEntry[] // XP token index
getCredentials(wallet)            → Credential[]       // Helius DAS API
```

### Key Hooks

| Hook | Data Source | Polling |
|---|---|---|
| `useXpBalance` | Token-2022 ATA | 30s |
| `useEnrollment` | Enrollment PDA | on-demand |
| `useCredentials` | Helius DAS | on-demand |
| `useStreak` | localStorage | never |

## PDA Layout

All derived from Program ID `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf`:

| PDA | Seeds |
|---|---|
| Config | `["config"]` |
| Course | `["course", courseId]` |
| Enrollment | `["enrollment", courseId, learnerPubkey]` |
| MinterRole | `["minter", minterPubkey]` |
| AchievementType | `["achievement", achievementId]` |
| AchievementReceipt | `["achievement_receipt", achievementId, recipientPubkey]` |

## Lesson Bitmap

Enrollment tracks completed lessons as `[u64; 4]` (256 bits total):

```
Word 0: lessons 0-63
Word 1: lessons 64-127
Word 2: lessons 128-191
Word 3: lessons 192-255
```

Helper functions in `src/lib/bitmap.ts`.

## i18n Structure

- Locales: `en` (default), `pt-BR`, `es`
- Routing: `[locale]` URL segment via next-intl
- Messages: `src/i18n/messages/{locale}.json`
- Server: `getTranslations({ locale, namespace })`
- Client: `useTranslations(namespace)`

## CMS (Sanity)

Schema types:
- `course` — references modules
- `module` — references lessons
- `lesson` — portable text content OR code challenge
- `instructor` — linked to courses

Course content stays in original language; UI strings are translated.

## Stubbed Features

These features are architecturally wired but use stubs pending backend implementation:

| Feature | Status | Implementation Path |
|---|---|---|
| `completeLesson` | Stub (POST /api/lessons/complete) | Backend keypair signs `complete_lesson` tx |
| `finalizeCourse` | Not implemented | Backend calls `finalize_course` after full bitmap |
| `issueCredential` | Not implemented | Backend calls `issue_credential` post-finalization |
| Achievement claiming | Not implemented | Registered minter calls `award_achievement` |
