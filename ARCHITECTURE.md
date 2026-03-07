# ARCHITECTURE

## System Overview

Superteam Academy is a Next.js 14 App Router application with a service-layer design:

- UI and API are served from the same Next.js app (`app/src/app`)
- Domain logic is centralized in `src/lib/services`
- Backend-facing contracts are maintained in `backend/src/contracts`
- Progress, gamification, and auth state persist in PostgreSQL via Prisma
- Solana integration is read-focused (Devnet reads through RPC and Helius DAS)
- Course content is abstracted behind `CourseContentService` so storage can switch from local TypeScript files to a CMS
- The local course registry in `src/lib/data/courses/index.ts` currently enforces a 51-course catalog
- An optional standalone `runner/` service executes isolated Anchor, Cargo, and Solana CLI jobs

## Grant Submission Positioning

This codebase now lives inside the target `superteam-academy` repo structure for the Superteam Brazil grant submission.

- The current app already covers most LMS product surfaces and the required Devnet read layer.
- The frontend now sits directly in the target monorepo structure (`app` plus related backend folders as required by this repository).
- The main remaining architectural work is aligning write-path interactions to the target on-chain program while keeping the existing frontend stable.

## Grant-Specific Integration Status

### Implemented Now

- Wallet authentication and wallet linking
- Wallet-signed Devnet enrollment from explicit course and lesson CTAs
- Devnet XP balance reads via Token-2022 account lookups
- Credential discovery and verification via Helius DAS
- Leaderboard enrichment with on-chain XP balances
- Course-filtered leaderboard views, profile social links, and downloadable certificate exports

### Local/Stubbed Today

- Enrollment transactions are wallet-signed and validated against the target program; enrollment persistence remains app/DB-backed
- Lesson completion, XP awarding, finalization, and achievement writes are currently backed by local database logic
- Course content can run from local TypeScript data or Sanity (`CONTENT_SOURCE=sanity`)

### Planned Alignment

- Move lesson completion/finalization/achievement writes behind explicit on-chain-ready service interfaces
- Promote CMS from tooling/import support to an active runtime content source

## High-Level Diagram

```text
Browser
  |
  v
Next.js App (App Router)
  |
  v
API Routes
  |
  v
Prisma
  |
  v
PostgreSQL

Browser
  |
  v
Wallet Adapter
  |
  v
Solana Devnet

API Routes
  |
  v
Helius DAS API
  |
  v
Solana Devnet

Browser
  |
  v
Next.js Runner APIs
  |
  v
Remote Runner (`runner/`)
  |
  v
Anchor / Cargo / Solana CLI
```

## Directory Structure (`app/src`)

| Folder | Purpose |
|---|---|
| `src/app` | App Router entry points, layouts, localized pages, API routes. |
| `src/app/[locale]` | Locale-scoped pages (`en`, `pt-BR`, `es`). |
| `src/app/[locale]/auth` | Sign-in screen and auth UX. |
| `src/app/[locale]/certificates` | Certificate detail page and credential verification views. |
| `src/app/[locale]/components` | Component Hub page. |
| `src/app/[locale]/courses` | Course list, course details, lesson pages. |
| `src/app/[locale]/dashboard` | Learner dashboard with XP/streak/on-chain widgets. |
| `src/app/[locale]/leaderboard` | Leaderboard page. |
| `src/app/[locale]/playground` | Solana playground with templates. |
| `src/app/[locale]/profile` | Public and private profile pages. |
| `src/app/[locale]/settings` | Profile settings and wallet linking. |
| `src/app/api` | Route handlers for app backend APIs. |
| `src/app/api/achievements` | Achievement read endpoint. |
| `src/app/api/auth` | Wallet nonce + wallet linking endpoints. |
| `src/app/api/courses` | Course catalog, course detail, lesson detail endpoints. |
| `src/app/api/health` | Database health endpoint. |
| `src/app/api/leaderboard` | Primary leaderboard endpoint. |
| `src/app/api/onchain` | On-chain read and verification endpoints. |
| `src/app/api/runner` | Remote/local runner orchestration, preflight checks, jobs, imports, and stream proxies. |
| `src/app/api/profile` | Current-user profile and public profile endpoints. |
| `src/app/api/progress` | Enrollment, completion, XP, streak, activity, progress endpoints. |
| `src/app/api/users` | Public user stat endpoints (streak). |
| `src/components` | Feature and shared React components. |
| `src/components/achievements` | Achievement badges/grid/toasts. |
| `src/components/analytics` | Google Analytics and PostHog providers. |
| `src/components/auth` | Auth guard and wallet button components. |
| `src/components/credentials` | Credential cards and credential grid. |
| `src/components/dashboard` | Streak and dashboard-specific UI blocks. |
| `src/components/editor` | Monaco editor, test runner UI, Rust challenge UI. |
| `src/components/gamification` | XP displays and streak calendar variants. |
| `src/components/layout` | Header/footer/session/theme/wallet providers. |
| `src/components/lessons` | Lesson navigation/sidebar/challenge wrappers. |
| `src/components/ui` | shadcn/ui primitives. |
| `src/lib` | Core app libraries (services, auth, db, i18n, runtime utilities). |
| `src/lib/analytics` | Analytics provider abstractions. |
| `src/lib/api` | API middleware, validation, error envelope helpers. |
| `src/lib/auth` | NextAuth config/session helpers/wallet signature verification. |
| `src/lib/challenge-runner` | Browser worker runner for challenge execution. |
| `src/lib/data` | Static data for courses, achievements, templates. |
| `src/lib/data/courses` | 51-course registry and legacy/local course definition files. |
| `src/lib/db` | Prisma client singleton. |
| `src/lib/hooks` | React data-fetching hooks for dashboard/profile/progress/XP. |
| `src/lib/i18n` | next-intl locale and navigation configuration. |
| `src/lib/logging` | Structured logging and request context helpers. |
| `src/lib/runner` | Runner policy, local execution, remote transport, redaction, and job token safeguards. |
| `src/lib/rate-limit` | In-memory/Upstash rate-limiter implementation. |
| `src/lib/services` | Service interfaces, implementations, factories, registry. |
| `src/lib/services/implementations` | Specialized implementations (on-chain read variants). |
| `src/lib/services/interfaces` | Shared service interface contracts. |
| `src/messages` | Locale JSON dictionaries. |
| `src/styles` | Global CSS and design tokens. |
| `src/types` | Shared domain type definitions. |

## Data Flows

### 1. Authentication

1. OAuth sign-in uses NextAuth (`/api/auth/*` internal + provider callbacks).
2. Wallet auth/linking flow calls `/api/auth/nonce` to issue a short-lived nonce.
3. Client signs nonce with wallet; `/api/auth/link-wallet` verifies signature.
4. Verified wallet is stored in `User.walletAddress` and/or `UserWallet` records.

### 2. Content Delivery

1. Client requests `/api/courses` or `/api/courses/[slug]`.
2. Route resolves `CourseContentService` via `getContentService()` factory.
3. `ContentLocalService` reads TypeScript course data from `src/lib/data/courses/*.ts`.
4. API returns normalized `Course`, `Module`, `Lesson`, `Challenge` payloads.

### 3. Lesson Completion + XP

1. Client posts to `/api/progress/complete-lesson` with `courseSlug` + `lessonId`.
2. `PrismaLearningProgressService.completeLesson()` enforces idempotency.
3. Lesson XP + first-of-day bonus are computed.
4. `LessonCompletion`, `UserXP`, `UserStreak` are updated in transaction scope.
5. `AchievementEngine` checks definitions and stores new unlocks in `UserAchievementNew`.

### 4. Challenge Execution

1. TypeScript challenge code runs in sandboxed Web Worker (`runChallengeTests`).
2. Dangerous patterns are blocked by static checks (`eval`, dynamic import, DOM/network access).
3. Test cases execute in isolated worker context with timeout limits.
4. Rust challenges use structural checks (`structural-checker.ts`) instead of native Rust execution.

### 4b. Remote Runner Execution

1. Client posts a constrained job request to `/api/runner/job`.
2. The app validates the allowlisted job type, scopes the request to the caller, and rate limits the action.
3. When `RUNNER_URL` is configured, the app signs the request with `RUNNER_SHARED_SECRET`.
4. The standalone `runner/` service verifies the signature, unpacks the workspace, enforces archive limits, and executes the allowed CLI command.
5. The app polls or streams the result back through short-lived job access tokens.

### 5. On-Chain Reads

1. `/api/onchain/xp` reads token account balance for configured XP mint.
2. `/api/onchain/credentials` calls Helius DAS (`getAssetsByOwner`) and maps cNFT metadata.
3. `/api/onchain/leaderboard` merges local leaderboard with on-chain balances when available.
4. `/api/onchain/verify` checks current asset owner via Helius `getAsset`.

## Service Architecture

### CourseContentService

- Interface: `src/lib/services/content.ts`
- Key methods:
  - `getCourses()`
  - `getCourse(slug)`
  - `getLesson(courseSlug, lessonId)`
  - `getModules(courseSlug)`
  - `searchCourses(query, filters)`
- Local implementation: `ContentLocalService` in `src/lib/services/content-local.ts`
- Factory: `getContentService()` in `src/lib/services/content-factory.ts` (switches by `CONTENT_SOURCE`)

### LearningProgressService

- Interface: `src/lib/services/progress.ts`
- Prisma implementation: `PrismaLearningProgressService` in `src/lib/services/progress-local.ts`
- Responsibilities:
  - enrollment
  - lesson completion and idempotency
  - XP/level calculations
  - streak management
  - leaderboard snapshots
  - achievement unlock coordination

### AchievementEngine

- Implementation: `src/lib/services/achievements.ts`
- Definitions source: `src/lib/data/achievements.ts`
- Checker behavior:
  - loads already unlocked achievements
  - evaluates condition unions (`xp_reached`, `streak_reached`, etc.)
  - persists unlocks in `UserAchievementNew`

### OnChainService

- Implementation: `src/lib/services/onchain.ts`
- Reads:
  - XP balance (`getOnChainXP`)
  - credentials/cNFTs (`getCredentials`)
  - on-chain leaderboard token holders (`getOnChainLeaderboard`)
  - ownership verification (`verifyCredentialOwnership`)
- Integrations:
  - `@solana/web3.js`
  - `@solana/spl-token`
  - Helius DAS API

## Database Schema (Prisma)

Source: `app/prisma/schema.prisma`

### `User`

- Fields: `id`, `username`, `displayName`, `email`, `emailVerified`, `bio`, `avatarUrl`, `isPublic`, `createdAt`, `updatedAt`, social handles, `preferredLocale`, `theme`, `walletAddress`
- Relations:
  - one-to-many: `accounts`, `sessions`, `wallets`, `courseProgress`, `xpEvents`, `achievements`, `nonces`, `enrollments`, `lessonCompletions`, `userAchievements`
  - one-to-one: `streakData`, `userXP`, `userStreak`

### `Account` (NextAuth)

- Fields: `id`, `userId`, `type`, `provider`, `providerAccountId`, token metadata fields
- Relations: many-to-one `user`

### `Session` (NextAuth)

- Fields: `id`, `sessionToken`, `userId`, `expires`
- Relations: many-to-one `user`

### `VerificationToken` (NextAuth)

- Fields: `identifier`, `token`, `expires`
- Relations: none

### `UserWallet`

- Fields: `id`, `userId`, `address`, `isPrimary`, `linkedAt`
- Relations: many-to-one `user`

### `WalletNonce`

- Fields: `id`, `userId`, `address`, `nonce`, `expiresAt`, `used`
- Relations: optional many-to-one `user`

### `CourseProgress` (legacy progress model)

- Fields: `id`, `userId`, `courseId`, `completedLessons`, `totalLessons`, `currentModuleIndex`, `currentLessonIndex`, `startedAt`, `lastAccessedAt`, `completedAt`
- Relations: many-to-one `user`

### `XPEvent` (legacy XP events)

- Fields: `id`, `userId`, `amount`, `reason`, `courseId`, `lessonId`, `createdAt`
- Relations: many-to-one `user`

### `StreakRecord` (legacy streak model)

- Fields: `id`, `userId`, `currentStreak`, `longestStreak`, `lastActivityDate`
- Relations: one-to-one `user`

### `UserAchievement` (legacy achievements)

- Fields: `id`, `userId`, `achievementId`, `unlockedAt`
- Relations: many-to-one `user`

### `LeaderboardCache`

- Fields: `id`, `timeframe`, `data` (JSON), `cachedAt`, `expiresAt`
- Relations: none

### `Enrollment`

- Fields: `id`, `userId`, `courseSlug`, `enrolledAt`, `completedAt`
- Relations: many-to-one `user`

### `LessonCompletion`

- Fields: `id`, `userId`, `courseSlug`, `lessonId`, `xpAwarded`, `completedAt`
- Relations: many-to-one `user`

### `UserXP`

- Fields: `id`, `userId`, `totalXP`, `weeklyXP`, `monthlyXP`, `lastWeeklyReset`, `lastMonthlyReset`
- Relations: one-to-one `user`

### `UserStreak`

- Fields: `id`, `userId`, `currentStreak`, `longestStreak`, `lastActivityDate`, `streakHistory` (JSON)
- Relations: one-to-one `user`

### `UserAchievementNew`

- Fields: `id`, `userId`, `achievementId`, `unlockedAt`
- Relations: many-to-one `user`

## API Routes (16 Core Product Routes)

| Method | Path | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/achievements` | Yes | Returns achievement definitions with unlock status for current user. |
| `POST` | `/api/auth/nonce` | No | Generates wallet-signature nonce for wallet ownership verification. |
| `POST`, `DELETE` | `/api/auth/link-wallet` | Yes | Links/unlinks wallet addresses to authenticated user account. |
| `GET` | `/api/courses` | No | Lists all courses from the content service. |
| `GET` | `/api/courses/[slug]` | No | Returns one course by slug. |
| `GET` | `/api/courses/[slug]/lessons/[id]` | No | Returns one lesson/challenge payload. |
| `GET` | `/api/leaderboard` | No | Returns leaderboard entries with timeframe/limit and optional `course` filters. |
| `POST` | `/api/newsletter` | No | Stores landing-page newsletter signups. |
| `GET` | `/api/onchain/xp` | No | Reads on-chain XP SPL balance for a wallet. |
| `GET` | `/api/onchain/credentials` | No | Fetches cNFT credentials for a wallet via Helius DAS. |
| `GET` | `/api/onchain/verify` | No | Verifies credential ownership against current asset owner. |
| `GET`, `PATCH` | `/api/profile` | Yes | Reads/updates authenticated user profile settings, social links, locale, and theme. |
| `GET` | `/api/progress` | Yes | Returns all progress records for current user. |
| `GET` | `/api/progress/[courseSlug]` | Yes | Returns progress snapshot for one course. |
| `POST` | `/api/progress/enroll` | Yes | Enrolls user in a course. |
| `POST` | `/api/progress/complete-lesson` | Yes | Completes lesson and awards XP/streak/achievement updates. |
| `GET` | `/api/progress/streak` | Yes | Returns current and longest streak values. |
## Security

- CSP and hardened headers in `app/next.config.mjs`:
  - `Content-Security-Policy`
  - `X-Content-Type-Options`
  - `X-Frame-Options`
  - `Referrer-Policy`
  - `Permissions-Policy`
- Auth middleware (`src/middleware.ts`) protects dashboard/settings/private profile routes.
- Wallet signature verification in `src/lib/auth/wallet-verify.ts` and wallet-link API flow.
- Challenge execution sandbox:
  - code isolation in Web Worker
  - static deny-list for dangerous runtime APIs
  - execution timeout controls
- Rate limiting (`src/lib/rate-limit/index.ts`):
  - optional via env flag
  - route-specific limits
  - in-memory fallback or Upstash-backed store

## On-Chain Integration Status

### Currently read from Devnet

- XP token balance for wallet (`/api/onchain/xp`)
- Credential/cNFT lookup (`/api/onchain/credentials`)
- Ownership verification (`/api/onchain/verify`)
- Optional on-chain enrichment for leaderboard (`/api/onchain/leaderboard`)

### Currently stubbed / off-chain

- Lesson completion transaction writes
- On-chain enrollment registration
- On-chain achievement claiming/minting

### Path to full write integration

1. Deploy XP/credential programs and set mint/collection env vars.
2. Add signed transaction builders in API or client wallet flows.
3. Persist tx signatures in DB alongside completion/achievement records.
4. Add retry/indexing jobs to reconcile chain state with local tables.

## Performance

- SSG/ISR strategy:
  - static page rendering for stable page shells
  - `revalidate` on selected API routes (`onchain/xp`, `onchain/credentials`, `onchain/leaderboard`)
- Dynamic imports and split bundles:
  - Monaco/editor-heavy experiences are isolated from baseline pages
- Caching:
  - API cache-control headers on leaderboard and on-chain reads
  - optional DB cache model via `LeaderboardCache`
- Build/runtime optimizations:
  - Next.js experimental package import optimization
  - strict TypeScript and lint gate to avoid runtime regressions
