# Superteam Academy — Architecture

## 1. Overview

Superteam Academy is a gamified learning management system (LMS) for Solana developer education. It combines traditional course content delivery with on-chain mechanics — learners earn soulbound XP tokens, unlock credential NFTs, and collect achievement receipts as they progress through structured learning tracks.

The platform is built with Next.js 16 (App Router, Turbopack), styled with Tailwind CSS v4, and backed by Sanity CMS for content management. On-chain integration uses Token-2022 for soulbound XP tokens, Metaplex Core for credential NFTs, and a custom Anchor program for enrollment, progress tracking, and achievement receipts.

Three locales are supported out of the box: English, Portuguese, and Spanish — targeting the Superteam ecosystem across the Americas.

## 2. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 16 (App Router, Turbopack) | SSR, routing, code splitting |
| Styling | Tailwind CSS v4, shadcn/ui (New York) | Design system, oklch colors |
| State | Zustand v5 | Client-side stores (user, course) |
| CMS | Sanity v3 | Course content, i18n (en/pt/es) |
| Blockchain | @solana/web3.js, Token-2022, Metaplex Core | XP tokens, credentials, achievements |
| i18n | next-intl v4 | Locale routing, message bundles |
| Testing | Vitest, Playwright | Unit (308 tests), E2E (36 specs) |
| Monitoring | Sentry | Error tracking (client/server/edge) |
| Community | Supabase | Forum data layer, user preferences |
| Analytics | Vercel Analytics | Usage tracking |

### Notable Dependencies

- `@coral-xyz/anchor` — Anchor IDL types and program interaction
- `@metaplex-foundation/mpl-core` + `umi` — Metaplex Core NFT operations
- `@monaco-editor/react` — In-browser code editor for challenges
- `chart.js` + `recharts` — Dashboard analytics and progress visualization
- `framer-motion` — Animations (level-up, confetti, page transitions)
- `cmdk` — Command palette for navigation
- `date-fns` — Date formatting across locales

## 3. Directory Structure

```
app/
├── e2e/                     # Playwright E2E tests
│   ├── fixtures/            # Test data & wallet mocks
│   ├── pages/               # Page Object Model classes
│   └── tests/               # Test suites (9 files, 36 specs)
├── public/                  # Static assets, PWA manifest
├── sanity/                  # Sanity CMS configuration
│   ├── schemas/             # Document types (track, course, module, lesson, achievement, dailyChallenge)
│   │   └── helpers/         # Schema helper utilities
│   ├── seed/                # NDJSON import data
│   ├── sanity.cli.ts        # Sanity CLI config
│   └── sanity.config.ts     # Studio configuration
└── src/
    ├── app/
    │   ├── [locale]/        # i18n routing segment
    │   │   ├── (marketing)/ # Landing page (public)
    │   │   ├── (platform)/  # Authenticated platform routes
    │   │   ├── (admin)/     # Admin dashboard
    │   │   ├── onboarding/  # Onboarding quiz
    │   │   ├── layout.tsx   # Root locale layout (providers, fonts)
    │   │   ├── sitemap.ts   # Dynamic sitemap generation
    │   │   └── opengraph-image.tsx # Dynamic OG image
    │   ├── api/             # 6 API routes (server-only)
    │   │   ├── achievements/award/    # Award achievement receipt
    │   │   ├── courses/finalize/      # Finalize course completion
    │   │   ├── credentials/issue/     # Issue credential NFT
    │   │   ├── credentials/upgrade/   # Upgrade credential tier
    │   │   ├── leaderboard/           # Leaderboard data
    │   │   └── lessons/complete/      # Mark lesson complete + mint XP
    │   ├── studio/          # Sanity Studio (/studio route)
    │   ├── globals.css      # Tailwind v4 base styles
    │   └── robots.ts        # Robots.txt generation
    ├── components/
    │   ├── admin/           # Admin dashboard components
    │   ├── challenges/      # Code challenge UI
    │   ├── community/       # Forum components
    │   ├── courses/         # Course catalog & detail views
    │   ├── credentials/     # Credential viewer & sharing
    │   ├── creator/         # Creator dashboard
    │   ├── dashboard/       # Learner dashboard widgets
    │   ├── devnet/          # Devnet explorer
    │   ├── editor/          # Code editor wrapper (Monaco)
    │   ├── gamification/    # XP bar, streaks, confetti, level-up
    │   ├── landing/         # Landing page sections
    │   ├── layout/          # Header, sidebar, footer, mobile nav
    │   ├── leaderboard/     # Leaderboard table & podium
    │   ├── lessons/         # Lesson viewer
    │   ├── onboarding/      # Quiz step components
    │   ├── profile/         # Profile page components
    │   ├── providers/       # React context providers (wallet, theme, i18n)
    │   ├── settings/        # Settings page sections
    │   └── ui/              # shadcn/ui primitives (28 components)
    ├── i18n/                # next-intl config
    │   ├── routing.ts       # Locale routing definition
    │   └── request.ts       # Server-side locale resolution
    ├── lib/
    │   ├── hooks/           # 8 custom hooks + barrel export
    │   │   ├── use-xp.ts
    │   │   ├── use-enrollment.ts
    │   │   ├── use-credentials.ts
    │   │   ├── use-leaderboard.ts
    │   │   ├── use-achievements.ts
    │   │   ├── use-streak.ts
    │   │   ├── use-course.ts
    │   │   ├── use-program-events.ts
    │   │   ├── index.ts     # Barrel export
    │   │   └── __tests__/   # 35 hook tests
    │   ├── sanity/          # Sanity data layer
    │   │   ├── client.ts    # Sanity client (auto-fallback to mock)
    │   │   ├── queries.ts   # GROQ queries
    │   │   ├── mock-client.ts # Mock client for dev without Sanity
    │   │   ├── seed-data.ts # Comprehensive seed data (83KB)
    │   │   └── __tests__/   # 17 seed data validation tests
    │   ├── solana/          # On-chain service layer (10 modules)
    │   │   ├── constants.ts # Program ID, XP mint, authority, cluster
    │   │   ├── pda.ts       # PDA derivation (6 account types)
    │   │   ├── accounts.ts  # Account fetching & deserialization
    │   │   ├── enrollment.ts # Enrollment transaction builders
    │   │   ├── xp.ts        # XP/level calculations
    │   │   ├── bitmap.ts    # Lesson completion bitmap ops
    │   │   ├── achievements.ts # Achievement service
    │   │   ├── credentials.ts # Credential NFT operations (Metaplex)
    │   │   ├── program.ts   # Anchor program factory
    │   │   ├── events.ts    # On-chain event parsing
    │   │   ├── idl/         # Program IDL types
    │   │   ├── server/      # Server-only modules
    │   │   │   ├── signer.ts    # Backend keypair signer
    │   │   │   ├── rate-limit.ts # IP-based sliding window limiter
    │   │   │   └── validate.ts   # Input validation schemas
    │   │   └── __tests__/   # 163 unit tests (7 test files)
    │   ├── stores/          # Zustand state management
    │   │   ├── user-store.ts   # Wallet, XP, enrollments, achievements
    │   │   ├── course-store.ts # Catalog, filters, selection
    │   │   └── __tests__/      # 75 store tests (2 test files)
    │   ├── supabase/        # Community forum data layer
    │   │   ├── client.ts    # Supabase client
    │   │   └── forum.ts     # Forum queries & mutations
    │   └── utils/           # Utility modules
    │       ├── recommendation.ts # Course recommendation engine
    │       └── __tests__/   # 18 recommendation tests
    └── messages/            # i18n message bundles
        ├── en.json          # English (primary, 11KB)
        ├── pt.json          # Portuguese
        └── es.json          # Spanish
```

## 4. Data Flow Architecture

```
Component → Hook → Store → Service (lib/solana/*) → On-chain Program
                     ↕
              Sanity CMS (content)
              Supabase (community)
```

### Layer Responsibilities

**Components** (`src/components/`) — Pure UI layer. Receive data via hooks and props. No direct service calls. Responsible for rendering, user interactions, loading/error states, and accessibility. Heavy components (Monaco editor, chart SVGs) are dynamically imported.

**Hooks** (`src/lib/hooks/`) — Bridge layer between components and stores. Each hook encapsulates a specific domain concern:

- `useXp` — Current XP balance, level, progress percentage, level title
- `useEnrollment` — Enrollment status, lesson progress bitmap, completion handlers
- `useCredentials` — Credential NFTs, issuance, tier upgrades via Metaplex DAS API
- `useLeaderboard` — Ranked learner data with pagination
- `useAchievements` — Achievement types, receipts, unlock checks
- `useStreak` — Daily activity streak tracking
- `useCourse` — Course catalog, filtering, individual course data from Sanity
- `useProgramEvents` — Real-time on-chain event subscriptions

**Stores** (`src/lib/stores/`) — Zustand v5 client-side state. Two stores:

- `user-store` — Wallet connection state, XP balance, enrolled courses, earned achievements, user preferences
- `course-store` — Course catalog cache, active filters (track, difficulty, language), selected course state

**Services** (`src/lib/solana/`) — On-chain interaction layer. Pure functions with no React dependencies:

- `pda.ts` — Deterministic PDA derivation for all 6 account types
- `accounts.ts` — Account fetching with discriminator-based filtering
- `enrollment.ts` — Transaction builders for enroll, complete-lesson, finalize-course
- `xp.ts` — Level formula, XP thresholds, progress calculations
- `bitmap.ts` — Lesson completion bitmap operations ([u64; 4] = 256 bits)
- `achievements.ts` — Achievement type registration and receipt awarding
- `credentials.ts` — Metaplex Core NFT minting and DAS API reads
- `events.ts` — On-chain event log parsing and subscription
- `program.ts` — Anchor program instance factory
- `constants.ts` — Program IDs, mint addresses, cluster config

**API Routes** (`src/app/api/`) — Server-only endpoints implementing the backend signer pattern. The server co-signs transactions to prevent client-side cheating (e.g., self-awarding XP). Each route validates input, rate-limits by IP, and uses the backend keypair to authorize on-chain mutations:

| Route | Method | Purpose |
|---|---|---|
| `/api/lessons/complete` | POST | Mark lesson done, mint XP |
| `/api/courses/finalize` | POST | Finalize course completion |
| `/api/achievements/award` | POST | Award achievement receipt |
| `/api/credentials/issue` | POST | Issue credential NFT |
| `/api/credentials/upgrade` | POST | Upgrade credential tier |
| `/api/leaderboard` | GET | Aggregated leaderboard data |

## 5. On-Chain Architecture

### Program

- **Program ID**: `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf`
- **XP Mint**: `xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3`
- **Authority**: `ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn`
- **Cluster**: devnet (configurable via `NEXT_PUBLIC_CLUSTER`)
- **Framework**: Anchor (Borsh serialization, 8-byte discriminators)

### PDA Account Types

| Account | Seeds | Purpose |
|---|---|---|
| Config | `["config"]` | Singleton program configuration |
| Course | `["course", course_id]` | Course metadata (on-chain) |
| Enrollment | `["enrollment", course_id, learner]` | Per-learner course enrollment |
| MinterRole | `["minter", minter]` | Authorized XP minter addresses |
| AchievementType | `["achievement", achievement_id]` | Achievement definitions |
| AchievementReceipt | `["achievement_receipt", achievement_id, recipient]` | Per-learner achievement proof |

### Lesson Completion Bitmap

Enrollment accounts store lesson progress as a `[u64; 4]` array — 256 bits total, where each bit represents a lesson's completion status. This compact representation allows a single account to track up to 256 lessons per course with O(1) read/write for any lesson index.

```
Word 0 (bits 0-63)   → Lessons 0-63
Word 1 (bits 64-127)  → Lessons 64-127
Word 2 (bits 128-191) → Lessons 128-191
Word 3 (bits 192-255) → Lessons 192-255
```

### XP Token (Token-2022)

XP is implemented as a soulbound SPL token using Token-2022 extensions:

- **NonTransferable** — XP cannot be traded or transferred between wallets
- **PermanentDelegate** — Program authority can burn/adjust XP if needed

Level progression follows a quadratic curve:

```
Level = floor(sqrt(xp / 100))
XP for level N = N^2 * 100
```

Level titles: Newcomer (0) → Explorer (1) → Builder (2) → Developer (3) → Engineer (4) → Architect (5) → Specialist (6) → Expert (7) → Master (8) → Grandmaster (9) → Legend (10+)

### Credential NFTs (Metaplex Core)

Course completion credentials are minted as Metaplex Core NFTs:

- **Program**: `CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d`
- **Read path**: DAS (Digital Asset Standard) API for efficient indexed queries
- **Write path**: Direct Metaplex Core instructions via UMI adapter
- **Tiers**: Credentials can be upgraded (e.g., completion → distinction) via `/api/credentials/upgrade`

## 6. Authentication & Security

### Wallet-Based Authentication

Authentication is wallet-native — no email/password. Users connect via Solana wallet-adapter, which supports Phantom, Solflare, Backpack, and other standard wallets. The connected wallet public key serves as the user identifier across all on-chain operations.

### Backend Signer Pattern

Critical mutations (XP minting, lesson completion, achievement awards) require server co-signing to prevent client-side cheating:

1. Client builds a partial transaction with the user's wallet as a signer
2. Client sends the transaction payload to the corresponding API route
3. Server validates the request (input schema, rate limit, business rules)
4. Server adds the backend signer keypair as a co-signer
5. Server returns the fully signed transaction for client submission

The backend keypair (`BACKEND_SIGNER_KEYPAIR`) is a server-only environment variable — never exposed to the client bundle.

### Rate Limiting

API routes implement IP-based sliding window rate limiting (`lib/solana/server/rate-limit.ts`) to prevent abuse. Each endpoint has configurable window size and request limits.

### Input Validation

All API endpoints validate request bodies against strict schemas (`lib/solana/server/validate.ts`) before processing. Invalid payloads are rejected with descriptive error responses.

### Client-Side Security

- No secrets in the client bundle (all sensitive config is server-only)
- Wallet signatures verified on every authenticated request
- CORS and CSP headers configured via Next.js middleware

## 7. Internationalization

### Configuration

- **Framework**: next-intl v4
- **Locales**: `en` (English), `pt` (Portuguese), `es` (Spanish)
- **Default**: `en`
- **Routing**: `[locale]` segment in App Router (`src/app/[locale]/`)

### Architecture

```
src/i18n/
├── routing.ts   # Locale definitions, pathnames, default locale
└── request.ts   # Server-side locale resolution per request

src/messages/
├── en.json      # English message bundle (primary, 11KB)
├── pt.json      # Portuguese translations
└── es.json      # Spanish translations
```

### Content Strategy

- **UI strings**: Stored in `src/messages/*.json`, loaded by next-intl
- **CMS content**: Sanity documents use localized fields (`title.en`, `title.pt`, `title.es`)
- **Language switcher**: Available in the header, persists locale preference

## 8. CMS Integration

### Sanity v3 Configuration

- **Studio**: Accessible at `/studio` route (deployed alongside the app)
- **CLI config**: `sanity/sanity.cli.ts`
- **Studio config**: `sanity/sanity.config.ts`

### Document Types (6 schemas)

| Schema | File | Purpose |
|---|---|---|
| Track | `schemas/track.ts` | Learning track grouping (e.g., "Solana Fundamentals") |
| Course | `schemas/course.ts` | Individual course with modules |
| Module | `schemas/module.ts` | Course module grouping lessons |
| Lesson | `schemas/lesson.ts` | Individual lesson content |
| Achievement | `schemas/achievement.ts` | Achievement definitions |
| Daily Challenge | `schemas/daily-challenge.ts` | Daily coding challenges |

### Data Layer (`src/lib/sanity/`)

- **`client.ts`** — Sanity client with automatic fallback to mock client when credentials are not configured
- **`queries.ts`** — GROQ queries for all document types
- **`mock-client.ts`** — Full mock implementation for development without Sanity
- **`seed-data.ts`** — Comprehensive seed dataset (83KB) with 1 course, 5 lessons, 5 achievements, and supporting data

### Seed Data

Development seed data (`sanity/seed/`) provides NDJSON files for bulk import. The TypeScript seed data in `lib/sanity/seed-data.ts` mirrors this and is validated by 17 unit tests ensuring referential integrity, required fields, and locale completeness.

## 9. Testing Strategy

### Unit Tests (Vitest)

**308 tests across 13 files** — all passing.

| Test File | Tests | Coverage Area |
|---|---|---|
| `solana/__tests__/xp.test.ts` | 31 | Level formula, XP calculations |
| `solana/__tests__/bitmap.test.ts` | 24 | Lesson completion bitmap ops |
| `solana/__tests__/pda.test.ts` | 22 | PDA derivation for all 6 types |
| `solana/__tests__/enrollment.test.ts` | 24 | Enrollment transaction builders |
| `solana/__tests__/accounts.test.ts` | 20 | Account fetching & filtering |
| `solana/__tests__/achievements.test.ts` | 24 | Achievement service layer |
| `solana/__tests__/credentials.test.ts` | 16 | Credential NFT operations |
| `stores/__tests__/user-store.test.ts` | 32 | User store actions & selectors |
| `stores/__tests__/course-store.test.ts` | 43 | Course store filters & catalog |
| `hooks/__tests__/hooks.test.ts` | 35 | All 8 custom hooks |
| `sanity/__tests__/seed-data.test.ts` | 17 | Seed data integrity validation |
| `utils/__tests__/recommendation.test.ts` | 18 | Recommendation engine logic |
| `__tests__/smoke.test.ts` | 2 | Basic smoke tests |

### E2E Tests (Playwright)

**36 specs across 9 suites** — testing real user flows with wallet mocks.

| Suite | Specs | Coverage Area |
|---|---|---|
| `navigation.spec.ts` | 7 | Route transitions, breadcrumbs, back navigation |
| `course-catalog.spec.ts` | 5 | Filtering, search, course cards |
| `dashboard.spec.ts` | 4 | Widgets, XP display, recent activity |
| `i18n.spec.ts` | 4 | Locale switching, translated content |
| `responsive.spec.ts` | 4 | Mobile layout, sidebar collapse |
| `accessibility.spec.ts` | 3 | ARIA labels, keyboard nav, focus management |
| `theme.spec.ts` | 3 | Dark/light mode, system preference |
| `leaderboard.spec.ts` | 3 | Ranking display, podium, pagination |
| `settings.spec.ts` | 3 | Preference persistence, form validation |

### Test Infrastructure

- **Fixtures**: `e2e/fixtures/` — Wallet mocks, test data factories
- **Page Objects**: `e2e/pages/` — POM classes for each page
- **Coverage target**: 80%+ on all new code

## 10. Performance Optimizations

### Code Splitting

- **Dynamic imports** via `next/dynamic` for heavy components: Monaco editor, SVG chart components, confetti animations
- **Route groups** — `(marketing)`, `(platform)`, `(admin)` prevent cross-loading of unrelated route bundles
- **Tree shaking** — Barrel exports in hooks and components enable dead code elimination

### Image Optimization

- **Format**: AVIF/WebP with automatic fallback via Next.js Image component
- **CDN**: Sanity image pipeline for CMS-hosted assets (crop, hotspot, responsive srcset)
- **Lazy loading**: Below-the-fold images use native lazy loading

### Font & Rendering

- **Font optimization**: `display: 'swap'` prevents FOIT (flash of invisible text)
- **Skeleton states**: All data-dependent views render skeleton placeholders during loading
- **Streaming SSR**: App Router leverages React Suspense boundaries for progressive rendering

### Animation Performance

- **`prefers-reduced-motion`**: All animations (confetti, level-up, page transitions) respect the user's motion preferences
- **GPU-accelerated**: Framer Motion animations use `transform` and `opacity` for compositor-only rendering
- **Conditional loading**: Animation libraries loaded only when needed

### Data Fetching

- **Sanity CDN**: Read queries use Sanity's global CDN with stale-while-revalidate caching
- **On-chain reads**: Batched RPC calls where possible, DAS API for indexed Metaplex queries
- **Client cache**: Zustand stores prevent redundant fetches within a session

## 11. Deployment

### Recommended Platform

Vercel is the recommended deployment target — zero-config for Next.js 16, automatic edge functions, and built-in analytics integration.

### Environment Variables

Required environment variables (from `.env.example`):

```bash
# Solana Program (required)
NEXT_PUBLIC_PROGRAM_ID=ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf
NEXT_PUBLIC_XP_MINT=xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3
NEXT_PUBLIC_AUTHORITY=ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn
NEXT_PUBLIC_CLUSTER=devnet
NEXT_PUBLIC_HELIUS_RPC_URL=              # Helius RPC endpoint

# Sanity CMS (optional — falls back to mock client)
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production

# Backend Signer (server-only, required for API routes)
BACKEND_SIGNER_KEYPAIR=                  # Base58-encoded keypair

# Analytics (optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=
SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# Supabase (optional — for community forum)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### Sanity Studio

The Sanity Studio is deployed at the `/studio` route as part of the Next.js application. No separate deployment is needed. Content editors access it directly at `https://<domain>/studio`.

### PWA Support

A PWA manifest is included in `public/` for installability on mobile devices. Service worker registration enables offline access to previously viewed content.
