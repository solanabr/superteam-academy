# Architecture

This document describes the technical architecture of the Superteam Academy frontend (`app/`). For the on-chain program specification, see `../docs/SPEC.md` in the monorepo root.

---

## Overview

Superteam Academy is a decentralized learning management system (LMS) built on **Next.js 16 App Router** with an **Anchor on-chain program** deployed to Solana Devnet. The architecture separates concerns across three layers:

- **Content Layer** — Sanity CMS stores all course content (courses, lessons, challenges, instructors) queried via GROQ.
- **Application Layer** — Next.js handles SSR/ISR rendering, API routes, internationalization, authentication, and client-side state.
- **Blockchain Layer** — An Anchor program manages enrollments, lesson progress (bitmap), soulbound XP tokens (Token-2022), and Metaplex Core credential NFTs.

---

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                             Browser                                  │
│                                                                      │
│  Solana Wallet Adapter  ←→  React Components  ←→  Zustand Stores    │
│  (Phantom, Solflare)         (Server + Client)      (progress,       │
│  signs: enroll tx,                                   activity,       │
│         lesson/finalize msgs                         bookmarks)      │
└──────────────┬──────────────────────┬──────────────────────────────┘
               │                      │
               │ HTTP/fetch           │ wallet.sendTransaction
               ▼                      │  (enroll only)
┌──────────────────────────────────── ┼ ───────────────────────────────┐
│           Next.js App Router (Server + Edge)                         │
│                                                                      │
│  Server Components  │  API Routes           │  Middleware            │
│  (ISR/streaming)    │  /api/progress/*      │  (next-intl locale     │
│                     │  /api/helius/*        │   detection + rewrite) │
│                     │  /api/auth/*          │                        │
└────────┬────────────┴──────┬────────────────┴────────────────────────┘
         │                   │
         │ GROQ (CDN)        │ @coral-xyz/anchor (server-side signing)
         ▼                   ▼
┌────────────────┐  ┌──────────────────────────────────────────────────┐
│   Sanity CMS   │  │                  Solana Devnet                   │
│                │  │                                                  │
│  Courses       │  │  Program: ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7b... │
│  Modules       │  │  XP Mint:  Token-2022 (NonTransferable)         │
│  Lessons       │  │  Credentials: Metaplex Core (soulbound NFTs)    │
│  Challenges    │  │                                                  │
│  Instructors   │  └─────────────────────┬────────────────────────────┘
└────────────────┘                        │
                                          │ DAS API
                                          │ (getAssetsByOwner,
                                          │  getTokenAccounts)
                                          ▼
                                   ┌──────────────┐
                                   │  Helius RPC  │
                                   └──────────────┘
```

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js App Router | 16.1.6 |
| Language | TypeScript | 5 (strict) |
| Styling | Tailwind CSS | v4 |
| Component library | shadcn/ui (Radix UI) | latest |
| On-chain program | Anchor + Rust | 0.32 |
| XP tokens | Token-2022 | NonTransferable + PermanentDelegate |
| Credential NFTs | Metaplex Core | soulbound via PermanentFreezeDelegate |
| CMS | Sanity | v5 |
| Authentication | NextAuth | v5 (beta) |
| i18n | next-intl | v4 |
| State management | Zustand | v5 |
| RPC / DAS | Helius | latest |
| Error monitoring | Sentry | @sentry/nextjs v10 |
| Analytics | GA4, PostHog, Microsoft Clarity | — |
| Code editor | @monaco-editor/react | v4 |
| Rich text | @portabletext/react | v6 |

---

## Data Flow: CMS → Server Components → Client → On-Chain

### 1. Content Delivery (CMS → Server Components)

```
Sanity Studio (/studio)
  └── Author publishes Course document
        └── Next.js Server Component (ISR)
              └── getAllCourses(locale)          # src/lib/sanity/queries.ts
                    └── publicClient.fetch(GROQ) # CDN-backed, no token
                          └── SanityCourse[]     # rendered as static HTML
```

### 2. Course Enrollment (Client → On-Chain, wallet-signed)

The learner signs the enrollment transaction directly in their browser wallet. No backend key is involved.

```
Browser
  └── EnrollButton.tsx
        └── buildEnrollTx(wallet, courseId)        # src/lib/solana/instructions.ts
              ├── getCoursePda(courseId)             # PDA: ["course", courseId]
              ├── getEnrollmentPda(courseId, wallet) # PDA: ["enrollment", courseId, learner]
              └── program.methods.enroll(courseId)
                    └── wallet.sendTransaction(tx)   # Wallet Adapter
                          └── Solana: Enrollment PDA created on-chain
```

If the course has a prerequisite, the prerequisite course and enrollment PDAs are passed as `remainingAccounts` and validated by the program before enrollment.

### 3. Lesson Completion (Client → API Route → On-Chain, backend-signed)

Lesson completion is co-signed by a backend authority. The browser signs a message for wallet verification, then calls an API route which signs and submits the on-chain transaction server-side.

```
Browser
  └── LessonView.tsx
        └── useLessonComplete hook
              └── completeLessonWithProgress(params)      # LearningProgressService.ts
                    │
                    ├── [1] Wallet signs message:
                    │         "superteam-academy:{courseId}:{lessonIndex}:{timestamp}"
                    │
                    ├── [2] Optimistic Zustand update:
                    │         markLessonComplete(courseId, lessonIndex, xpEarned)
                    │         addActivity({ type: "lesson_completed", ... })
                    │
                    └── [3] POST /api/progress/complete-lesson
                              └── API Route (server)
                                    ├── validateProgressRequest()
                                    │     ├── auth()                   # NextAuth session
                                    │     ├── nacl.sign.detached.verify # wallet sig
                                    │     └── timestamp check (5-min window)
                                    ├── checkRateLimit("complete:{wallet}", 10, 60s)
                                    └── BackendSignerService.completeLesson()
                                          ├── ensureAtaExists()        # Token-2022 ATA
                                          └── program.methods.completeLesson(lessonIndex)
                                                └── Solana:
                                                      ├── Enrollment bitmap bit set
                                                      └── XP minted to learner ATA

On failure → rollback optimistic updates:
  revertLessonComplete(courseId, lessonIndex, xpEarned)
  removeActivityById(activityId)
```

### 4. Course Finalization (Client → API Route → On-Chain)

When all lessons are complete, `finalize-course` awards completion XP to the learner and creator reward XP, then freezes the enrollment account.

```
Browser
  └── finalizeCourseWithProgress(params)
        ├── Wallet signs: "superteam-academy:finalize:{courseId}:{timestamp}"
        └── POST /api/progress/finalize-course
              └── BackendSignerService.finalizeCourse()
                    ├── ensureAtaExists() for learner AND creator (parallelized)
                    └── program.methods.finalizeCourse()
                          └── Solana:
                                ├── Completion XP bonus minted to learner
                                ├── Creator reward XP minted to creator
                                └── Enrollment account frozen
```

### 5. Credential Issuance (Client → API Route → On-Chain)

After finalization, a Metaplex Core credential NFT can be issued on-chain.

```
Browser
  └── issueCredential(params)
        └── POST /api/progress/issue-credential
              └── BackendSignerService.issueCredential()
                    ├── Generates new assetKeypair
                    └── program.methods.issueCredential(name, uri, coursesCompleted, totalXp)
                          └── Solana: Metaplex Core NFT minted to learner wallet
```

### 6. Leaderboard & Credentials (Helius DAS)

```
Leaderboard:
  GET /api/helius/leaderboard
    └── getXpLeaderboard(xpMint)
          └── Helius: getTokenAccounts (all holders, sorted by amount desc)

Credentials:
  POST /api/helius/credentials { owner }
    └── getCredentialsByOwner(owner)
          └── Helius: getAssetsByOwner (all Metaplex Core NFTs)
```

---

## Service Layer

### BackendSignerService (`src/lib/services/BackendSignerService.ts`)

A **server-only** module (guarded by `import "server-only"`) that holds the backend authority keypair. Only imported in API routes — never in client components.

| Function | On-chain Instruction | Description |
|---|---|---|
| `completeLesson(learner, courseId, lessonIndex, xpMint)` | `complete_lesson` | Sets bitmap bit, mints XP to learner |
| `finalizeCourse(learner, courseId, creator, xpMint)` | `finalize_course` | Awards completion XP, credits creator, freezes enrollment |
| `awardAchievement(achievementId, recipient, xpMint)` | `award_achievement` | Mints Metaplex Core achievement NFT |
| `issueCredential(learner, courseId, ...)` | `issue_credential` | Mints Metaplex Core credential NFT |

Internal helpers:
- `getBackendKeypair()` — reads `BACKEND_SIGNER_KEYPAIR` (JSON array of 64 numbers), cached in module scope.
- `getBackendConnection()` — singleton `Connection` to `SOLANA_RPC_URL` with `"confirmed"` commitment.
- `getBackendProgram()` — singleton Anchor `Program` instance.
- `ensureAtaExists(connection, payer, owner, mint)` — creates the Token-2022 ATA if it does not exist, with TOCTOU race condition handling (concurrent creation is safe).

### LearningProgressService (`src/lib/services/LearningProgressService.ts`)

A **client-side** module that wraps the progress API routes. Responsibilities:

1. Wallet message signing with timestamp for replay protection
2. Optimistic Zustand store updates before the async RPC call
3. Rollback on failure
4. Activity feed recording
5. Analytics event tracking (GA4 + PostHog)
6. Achievement trigger dispatch (fire-and-forget, never blocks UI)

| Function | Description |
|---|---|
| `completeLessonWithProgress(params)` | Signs message, optimistic update, POST to API, rollback on failure |
| `finalizeCourseWithProgress(params)` | Signs message, POST to API, records `course_completed` activity |
| `claimAchievement(params)` | Signs message, POST to claim API |
| `issueCredential(params)` | Signs message, POST to issue-credential API |
| `fetchLeaderboard(timeframe)` | GET `/api/helius/leaderboard` |
| `fetchCredentials(walletAddress)` | POST `/api/helius/credentials` |

**Signed message format:**
- Lesson: `superteam-academy:{courseId}:{lessonIndex}:{timestamp}`
- Finalize: `superteam-academy:finalize:{courseId}:{timestamp}`
- Achievement: `superteam-academy:achievement:{achievementId}:{timestamp}`
- Credential: `superteam-academy:issue-credential:{courseId}:{timestamp}`

**XP values (per bounty spec):**
- Lesson XP range: 10–50 XP
- Challenge XP range: 25–100 XP
- Course completion bonus: 500–2000 XP
- Daily streak bonus: +10 XP
- First activity of the day bonus: +25 XP

### AchievementTriggerService (`src/lib/services/AchievementTriggerService.ts`)

A **client-side** module that checks achievement unlock conditions after user actions and calls the claim API when conditions are met. All functions catch errors internally so achievement checking never blocks the main user flow.

**Events dispatched via `checkAndTriggerAchievements(event, context)`:**

| Event | Trigger | Achievements Checked |
|---|---|---|
| `lesson_complete` | After a lesson is marked complete | `first_steps` (first lesson ever), `top_contributor` (10+ total lessons) |
| `course_complete` | After `finalize_course` succeeds | `course_completer`, `speed_runner` (all lessons within 24h of enrollment), `rust_rookie`, `anchor_expert`, `full_stack_solana` (3+ tracks), `early_adopter` |
| `streak_update` | After `recordActivity()` updates streak | `week_warrior` (7 days), `monthly_master` (30 days), `consistency_king` (100 days) |
| `challenge_complete` | After code challenge is passed | `perfect_score` (passed on first attempt) |
| `review_submit` | After a course review is submitted | `first_comment` (first review ever) |

Additional helpers: `recordCourseShare()`, `triggerHelperIfEligible()` (3+ course shares), `checkAndMarkFirstReview()`.

---

## PDA Map

All PDAs are derived in `src/lib/solana/pdas.ts` using `PublicKey.findProgramAddressSync`.

**Program ID:** `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf`

| PDA | Seeds | Description |
|---|---|---|
| **Config** | `["config"]` | Platform-wide config: authority, XP mint address, backend signer pubkey |
| **Course** | `["course", courseId]` | On-chain course: lesson count, XP rates, prerequisites, enrollment stats |
| **Enrollment** | `["enrollment", courseId, learner]` | Per-learner progress: bitmap of completed lessons, timestamps, credential ref |
| **MinterRole** | `["minter", minter]` | Authorized XP minter: label, max XP per call, total minted |
| **AchievementType** | `["achievement", achievementId]` | Achievement definition: name, metadata URI, Metaplex Core collection, supply cap |
| **AchievementReceipt** | `["achievement_receipt", achievementId, recipient]` | Per-user achievement grant: asset pubkey, awarded timestamp |

### Derivation Example

```typescript
// src/lib/solana/pdas.ts
export function getEnrollmentPda(courseId: string, learner: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("enrollment"), Buffer.from(courseId), learner.toBuffer()],
    PROGRAM_ID,
  );
}
```

### Lesson Completion Bitmap

Progress is stored as a bitmap in the `Enrollment` account's `lessonFlags` field, supporting up to 256 lessons per course.

```
Word 0 (bits 0–63):    [lesson0, lesson1, ..., lesson63]
Word 1 (bits 64–127):  [lesson64, lesson65, ..., lesson127]
Word 2 (bits 128–191): [lesson128, ..., lesson191]
Word 3 (bits 192–255): [lesson192, ..., lesson255]
```

The `lessonIndex` in the Sanity CMS (0-based) maps directly to the bitmap bit position. This is the critical contract between CMS content and on-chain state.

---

## State Management

State is split between Zustand stores (client-side, optimistic) and on-chain accounts (authoritative).

### `progress-store` (`src/stores/progress-store.ts`)

Persisted to localStorage (key: `"superteam-progress"`). Custom JSON serializer converts `Set<number>` to/from arrays.

| State | Type | Description |
|---|---|---|
| `completedLessons` | `Record<string, Set<number>>` | `courseId` → set of completed lesson indices |
| `xp` | `number` | Local XP total (seeded from on-chain balance on wallet connect) |
| `streakDays` | `number` | Current consecutive-day streak |
| `lastActivityDate` | `string \| null` | ISO date (YYYY-MM-DD) of last activity |
| `activityDates` | `string[]` | All days any activity occurred |
| `streakMilestonesReached` | `number[]` | Milestones achieved (7, 30, 100 days) |
| `streakFreezeCount` | `number` | Available streak freeze tokens |
| `streakFreezeActive` | `boolean` | Whether a freeze was used today |

**Optimistic update pattern:**
1. `markLessonComplete(courseId, lessonIndex, xpEarned)` fires immediately
2. API call proceeds asynchronously
3. On failure, `revertLessonComplete(courseId, lessonIndex, xpEarned)` rolls back

**Streak logic:**
- Activity today after activity yesterday → streak + 1
- Activity today after activity today → no change
- Activity today after a gap → streak resets to 1
- Streak freeze: if exactly 1 day was missed and a freeze is available, it is auto-consumed to preserve the streak

**Streak milestone rewards:**
- 7-day milestone → +1 streak freeze
- 30-day milestone → +2 streak freezes
- 100-day milestone → +3 streak freezes

### `activity-store` (`src/stores/activity-store.ts`)

Ring buffer (max 50 entries) of recent user actions. Persisted to localStorage (key: `"superteam-activity"`).

| Activity Type | Description |
|---|---|
| `lesson_completed` | A lesson was completed |
| `course_enrolled` | Enrolled in a course |
| `course_completed` | A course was finalized |
| `achievement_earned` | An achievement was unlocked |

### `bookmark-store` (`src/stores/bookmark-store.ts`)

Persisted to localStorage (key: `"superteam-bookmarks"`). Stores an array of bookmarked course slugs.

### `notification-store` (`src/stores/notification-store.ts`)

In-memory store for toast notifications (streak milestones, XP earned, achievements). Not persisted.

---

## Caching Strategy

| Resource | Strategy | TTL | Location |
|---|---|---|---|
| Landing page | ISR | 3600 s (1 h) | `src/app/[locale]/page.tsx` |
| Course list | ISR | 60 s | `src/app/[locale]/courses/page.tsx` |
| Course detail | ISR | 60 s | `src/app/[locale]/courses/[slug]/page.tsx` |
| Lesson content | ISR | 3600 s (1 h) | `src/app/[locale]/courses/[slug]/lessons/[slug]/page.tsx` |
| Dashboard | ISR | 60 s | `src/app/[locale]/dashboard/page.tsx` |
| Leaderboard page | ISR | 300 s (5 min) | `src/app/[locale]/leaderboard/page.tsx` |
| Leaderboard API | HTTP cache | `s-maxage=60, stale-while-revalidate=30` | `src/app/api/helius/leaderboard/route.ts` |
| Credentials API | HTTP cache | `private, max-age=30` | `src/app/api/helius/credentials/route.ts` |
| Asset API | HTTP cache | `private, max-age=3600` | `src/app/api/helius/asset/route.ts` |
| XP balance | Client polling | ~30 s interval (tab-visible only) | `src/hooks/useXpBalance.ts` |
| Sanity CDN | CDN (production) | Automatic | `useCdn: true` in `src/lib/sanity/config.ts` |

ISR is configured via `export const revalidate = N` in page files. The Sanity public client uses the CDN in production for public reads; the `SANITY_API_TOKEN`-authenticated server client (`src/lib/sanity/server-client.ts`) bypasses the CDN for draft access.

---

## i18n Architecture

Internationalization uses `next-intl` v4 with locale-prefixed routing.

**Supported locales:** `pt-BR` (default), `en`, `es`

```
Request to /courses
  └── next-intl middleware (src/middleware.ts)
        └── Detects locale from Accept-Language / cookie
              └── Redirects to /pt-BR/courses (default locale)

Request to /en/courses
  └── [locale] segment matches routing.locales
        └── LocaleLayout (src/app/[locale]/layout.tsx)
              ├── setRequestLocale(locale)           # enables static rendering
              ├── import(`@/i18n/messages/${locale}.json`)
              └── <NextIntlClientProvider locale messages>
                    └── Page Component
                          └── getTranslations({ locale, namespace })
```

**Middleware matcher** excludes API routes, static files, Vercel internals, and `/studio`:

```typescript
export const config = {
  matcher: ["/((?!api|_next|_vercel|studio|.*\\..*).*)"],
};
```

**Message files:** `src/i18n/messages/{pt-BR,en,es}.json` — namespaced flat JSON.

**Content locale fallback:** If no courses exist for the requested locale, the app falls back to `pt-BR`:

```typescript
courses = await getAllCourses(locale);
if (courses.length === 0 && locale !== routing.defaultLocale) {
  courses = await getAllCourses(routing.defaultLocale);
}
```

**Server components** use `getTranslations({ locale, namespace })` from `next-intl/server`.
**Client components** use `useTranslations(namespace)` from `next-intl`.

---

## Authentication Architecture

The platform uses three independent authentication mechanisms:

| Tier | Mechanism | Used For |
|---|---|---|
| 1 | OAuth (NextAuth v5) — Google/GitHub | Session identity, API route authorization |
| 2 | Solana Wallet Adapter | On-chain transactions (enroll, connect wallet) |
| 3 | Wallet signature verification (tweetnacl) | Proves wallet ownership on API calls |

Progress API routes require both Tier 1 (active NextAuth session) and Tier 3 (valid wallet signature).

---

## Security Model

### Request Validation (`src/lib/api/validate-progress-request.ts`)

Every progress API call requires:
1. **Active NextAuth session** — `auth()` returns a user
2. **Valid wallet signature** — `nacl.sign.detached.verify(message, signature, publicKeyBytes)`
3. **Timestamp freshness** — within 5 minutes (`TIMESTAMP_MAX_AGE_MS = 300,000 ms`)

### Replay Protection

1. **Timestamp window** — Signatures older than 5 minutes are rejected.
2. **Fingerprint deduplication** — In-memory `Map<string, number>` tracks `{learner}:{courseId}:{lessonIndex}:{timestamp}`. Duplicates receive HTTP 409. Map is pruned every 100 requests and capped at 10,000 entries.

### Rate Limiting (`src/lib/rate-limit.ts`)

In-memory sliding-window rate limiter:

| Endpoint | Key Pattern | Limit | Window |
|---|---|---|---|
| complete-lesson | `complete:{walletBase58}` | 10 req | 60 s |
| finalize-course | `finalize:{walletBase58}` | 5 req | 60 s |
| leaderboard | `helius-lb:{ip}` | 60 req | 60 s |
| credentials | `helius-creds:{ip}` | 30 req | 60 s |
| asset | `asset:{ip}` | 30 req | 60 s |

### Server-Only Guards

- `BackendSignerService.ts` — `import "server-only"` prevents client-side import at build time.
- `server-client.ts` (Sanity write client) — same guard; `SANITY_API_TOKEN` is never exposed to the browser.

---

## Provider Hierarchy

The locale layout (`src/app/[locale]/layout.tsx`) establishes the full provider tree:

```
<html lang={locale} suppressHydrationWarning>
  <body>
    GoogleAnalytics (lazy script, strategy="lazyOnload")
    ClarityAnalytics (lazy script, strategy="lazyOnload")
    ThemeProvider (next-themes, attribute="class", defaultTheme="dark")
      └── SessionProvider (NextAuth v5)
            └── LazyWalletProvider (Solana Wallet Adapter, dynamic import, ssr: false)
                  ├── PostHogProvider (lazy dynamic import)
                  │     └── NextIntlClientProvider (locale + messages)
                  │           ├── OnboardingModal
                  │           ├── GlobalKeyboardShortcuts
                  │           ├── GlobalCommandPalette
                  │           ├── Sidebar (desktop)
                  │           ├── Header
                  │           ├── <main id="main-content">{children}</main>
                  │           ├── Footer
                  │           └── BottomNav (mobile)
                  └── Toaster (sonner, richColors, position="bottom-right")
  </body>
</html>
```

---

## Performance Optimizations

| Technique | Implementation |
|---|---|
| Lazy wallet bundle (~200KB) | `LazyWalletProvider` via `next/dynamic` with `ssr: false` |
| Tree-shaking heavy deps | `experimental.optimizePackageImports` in `next.config.ts` |
| Zero FOIT fonts | `next/font/google` with `display: "swap"` |
| Resource hints | `<link rel="preconnect">` for Sanity CDN and Helius RPC in `<head>` |
| No Node.js polyfills | `webpack.resolve.fallback` disables `crypto`, `stream`, `buffer` |
| Lazy analytics | `strategy="lazyOnload"` for GA4 and Clarity; dynamic `import()` for PostHog |
| Lazy Sanity Studio | `NextStudio` dynamically imported with `ssr: false` |
| `prefers-reduced-motion` | All CSS animations disabled globally via media query |

---

## API Routes Summary

| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | — | NextAuth v5 handlers |
| `/api/progress/complete-lesson` | POST | Session + Wallet sig | Complete a lesson on-chain |
| `/api/progress/finalize-course` | POST | Session + Wallet sig | Finalize a course on-chain |
| `/api/progress/claim-achievement` | POST | Session + Wallet sig | Issue achievement on-chain |
| `/api/progress/issue-credential` | POST | Session + Wallet sig | Issue credential NFT on-chain |
| `/api/helius/leaderboard` | GET | Rate limit by IP | XP leaderboard via Helius DAS |
| `/api/helius/credentials` | POST | Rate limit by IP | Credential NFTs for a wallet |
| `/api/helius/asset` | POST | Rate limit by IP | Single asset metadata |

---

## File Structure Reference

```
src/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx              # Provider hierarchy, metadata, fonts
│   │   ├── page.tsx                # Landing page (revalidate=3600)
│   │   ├── courses/
│   │   │   ├── page.tsx            # Course grid (revalidate=60)
│   │   │   └── [slug]/
│   │   │       ├── page.tsx        # Course detail (revalidate=60)
│   │   │       └── lessons/[slug]/
│   │   │           └── page.tsx    # Lesson view (revalidate=3600)
│   │   ├── dashboard/page.tsx      # Learner dashboard (revalidate=60)
│   │   ├── leaderboard/page.tsx    # XP leaderboard (revalidate=300)
│   │   ├── profile/page.tsx        # Wallet profile + credentials
│   │   ├── certificates/[id]/page.tsx
│   │   ├── challenges/[id]/page.tsx
│   │   └── settings/page.tsx
│   ├── studio/[[...tool]]/page.tsx # Sanity Studio (dynamic, ssr: false)
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── progress/
│       │   ├── complete-lesson/route.ts
│       │   ├── finalize-course/route.ts
│       │   ├── claim-achievement/route.ts
│       │   └── issue-credential/route.ts
│       └── helius/
│           ├── leaderboard/route.ts
│           ├── credentials/route.ts
│           └── asset/route.ts
├── lib/
│   ├── solana/
│   │   ├── constants.ts             # PROGRAM_ID, TOKEN_2022, XP_MINT, RPC URL
│   │   ├── pdas.ts                  # PDA derivation functions (6 PDAs)
│   │   ├── program.ts               # Anchor Program + Connection singletons (client)
│   │   ├── queries.ts               # On-chain account fetchers
│   │   ├── instructions.ts          # Client-side transaction builders (enroll)
│   │   ├── bitmap.ts                # Bitmap utilities for lesson flags
│   │   └── helius.ts                # Helius DAS API wrappers
│   ├── services/
│   │   ├── BackendSignerService.ts  # Server-only: keypair, on-chain signing
│   │   ├── LearningProgressService.ts # Client: optimistic updates + API calls
│   │   └── AchievementTriggerService.ts # Client: achievement condition evaluation
│   ├── sanity/
│   │   ├── config.ts                # Sanity project config
│   │   ├── client.ts                # Public Sanity client (CDN)
│   │   ├── server-client.ts         # Token-authenticated client (server-only)
│   │   ├── queries.ts               # GROQ queries + TypeScript types
│   │   ├── portable-text.tsx        # Rich content renderer
│   │   └── schemas/                 # Sanity document schemas
│   ├── auth/config.ts               # NextAuth v5 config (Google, GitHub)
│   ├── api/validate-progress-request.ts  # Wallet sig verification + replay protection
│   ├── rate-limit.ts                # In-memory sliding-window rate limiter
│   ├── gamification/achievements.ts # Achievement definitions + bitmap helpers
│   └── analytics/
│       ├── ga4.tsx                  # Google Analytics 4
│       ├── posthog.tsx              # PostHog provider
│       ├── clarity.tsx              # Microsoft Clarity
│       └── events.ts                # Unified event tracking
├── stores/
│   ├── progress-store.ts            # Zustand: lesson progress + XP + streaks
│   ├── activity-store.ts            # Zustand: activity feed ring buffer
│   ├── bookmark-store.ts            # Zustand: bookmarked courses
│   └── notification-store.ts        # Zustand: in-memory notifications
├── hooks/
│   ├── useXpBalance.ts              # Polls on-chain XP balance every 30s
│   ├── useCredentials.ts            # Fetches credential NFTs
│   ├── useLessonComplete.ts         # Lesson completion with optimistic UI
│   ├── useEnrollment.ts             # On-chain enrollment PDA state
│   ├── useAchievements.ts           # Fetches on-chain achievement receipts
│   └── useAchievementTrigger.tsx    # AchievementTriggerService + toast UI
└── i18n/
    ├── routing.ts                   # Locale list + default locale
    ├── request.ts                   # Server-side locale config
    └── messages/
        ├── pt-BR.json
        ├── en.json
        └── es.json
```
