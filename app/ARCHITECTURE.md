# Architecture

> Technical architecture documentation for **Superteam Academy** -- a gamified Solana learning platform built with Next.js 16 and TypeScript.

---

## Table of Contents

- [High-Level Overview](#high-level-overview)
- [Directory Structure](#directory-structure)
- [Routing & Layouts](#routing--layouts)
- [Authentication System](#authentication-system)
- [Service Layer](#service-layer)
- [State Management](#state-management)
- [Internationalization (i18n)](#internationalization-i18n)
- [Gamification Engine](#gamification-engine)
- [Blockchain Integration](#blockchain-integration)
- [Observability](#observability)
- [Key Design Decisions](#key-design-decisions)
- [Data Flow Diagrams](#data-flow-diagrams)

---

## High-Level Overview

```
+------------------+     +------------------+     +------------------+
|                  |     |                  |     |                  |
|    Browser       |---->|   Next.js App    |---->|  External APIs   |
|    (React 19)    |     |   (App Router)   |     |                  |
|                  |     |                  |     |  - Helius DAS    |
|  - Monaco Editor |     |  - API Routes    |     |  - Google OAuth  |
|  - Wallet Adapter|     |  - SSR / CSR     |     |  - GitHub OAuth  |
|  - Theme/i18n    |     |  - Middleware     |     |  - Solana RPC    |
|                  |     |                  |     |                  |
+------------------+     +------------------+     +------------------+
                                  |
                                  v
                         +------------------+
                         |  Observability   |
                         |  - Sentry        |
                         |  - GA4           |
                         +------------------+
```

The app follows a **client-heavy** architecture where most pages are client-rendered (`"use client"`) due to heavy reliance on React contexts (Auth, Theme, Language). The server is used for API routes (NextAuth, Helius proxy) and initial page delivery.

---

## Directory Structure

```
Superteam Academy-academy-next/
├── public/                         # Static assets
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (main)/                 # Route group: pages with Navbar + Footer
│   │   │   ├── layout.tsx          # Shared layout (Navbar + <main> + Footer)
│   │   │   ├── page.tsx            # Landing page (/)
│   │   │   ├── courses/
│   │   │   │   ├── page.tsx        # Course catalog (/courses)
│   │   │   │   └── [slug]/page.tsx # Course detail (/courses/:slug)
│   │   │   ├── dashboard/page.tsx  # User dashboard (/dashboard)
│   │   │   ├── leaderboard/page.tsx# Leaderboard (/leaderboard)
│   │   │   └── profile/page.tsx    # Profile (/profile)
│   │   ├── lesson/
│   │   │   └── [courseId]/page.tsx  # Lesson IDE (outside main layout)
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/ # NextAuth.js endpoints
│   │   │   └── nfts/[wallet]/      # Helius DAS API proxy
│   │   ├── layout.tsx              # Root layout (HTML, Providers, GA4)
│   │   ├── global-error.tsx        # Sentry error boundary
│   │   ├── providers.tsx           # Context provider composition
│   │   └── globals.css             # Tailwind base styles
│   ├── components/
│   │   ├── layout/                 # Navbar, Footer
│   │   ├── shared/                 # AuthModal, CodeEditor, Hero
│   │   └── ui/                     # shadcn/ui primitives
│   ├── contexts/
│   │   ├── AuthContext.tsx          # Auth + game state
│   │   ├── LanguageContext.tsx      # i18n
│   │   ├── ThemeContext.tsx         # Dark/light mode
│   │   ├── ServiceContext.tsx       # Service layer DI
│   │   └── WalletProvider.tsx      # Solana wallet adapter
│   ├── data/
│   │   └── courses.ts              # Course content & achievements
│   ├── hooks/
│   │   └── useNFTs.ts              # On-chain NFT fetching hook
│   ├── i18n/
│   │   └── translations.ts         # Translation strings (EN/PT-BR/ES)
│   ├── services/
│   │   └── interfaces.ts           # Service interfaces + stubs
│   ├── lib/
│   │   ├── auth.ts                 # NextAuth config
│   │   └── utils.ts                # cn() helper
│   └── types/
│       └── next-auth.d.ts          # Type augmentations
├── sentry.client.config.ts         # Sentry client init
├── sentry.server.config.ts         # Sentry server init
├── sentry.edge.config.ts           # Sentry edge init
├── instrumentation.ts              # Next.js instrumentation hook
├── next.config.ts                  # Next.js + Sentry config
├── tailwind.config.mjs             # Tailwind CSS 4 config
└── tsconfig.json                   # TypeScript config
```

---

## Routing & Layouts

### Route Groups

Next.js App Router uses **route groups** to share layouts without affecting the URL:

```
(main)/              --> Wraps pages with Navbar + Footer
  ├── page.tsx       --> /
  ├── courses/       --> /courses, /courses/:slug
  ├── dashboard/     --> /dashboard
  ├── leaderboard/   --> /leaderboard
  └── profile/       --> /profile

lesson/[courseId]/   --> /lesson/:courseId (NO Navbar/Footer, full-screen IDE)
```

### Layout Hierarchy

```
RootLayout (app/layout.tsx)
  ├── <html>, <body>, font loading
  ├── <Providers> wrapper (all contexts)
  ├── <GoogleAnalytics> (conditional)
  │
  ├── MainLayout (app/(main)/layout.tsx)
  │     ├── Skip-to-main-content link (a11y)
  │     ├── <Navbar />
  │     ├── <main id="main-content"> {children} </main>
  │     └── <Footer />
  │
  └── LessonPage (app/lesson/[courseId]/page.tsx)
        └── Custom split-screen layout (no shared layout)
```

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/*` | GET/POST | NextAuth.js authentication endpoints |
| `/api/nfts/[wallet]` | GET | Proxy to Helius DAS API for cNFT reading |

---

## Authentication System

Superteam Academy uses a **unified authentication model** supporting both Web3 wallets and traditional OAuth:

```
                    AuthContext
                   /          \
        Wallet Auth          Social Auth
       /          \         /           \
   Phantom    Solflare   Google      GitHub
   (adapter)  (adapter)  (NextAuth)  (NextAuth)
```

### Flow

1. **Wallet Auth**: User clicks Phantom/Solflare in AuthModal. Solana Wallet Adapter handles connection. On success, `AuthContext.loginWithWallet()` creates a profile from the wallet public key.

2. **Social Auth**: User clicks Google/GitHub. NextAuth.js handles OAuth flow via `/api/auth/*`. On callback, `AuthContext.loginWithSocial()` creates a profile from the OAuth session.

3. **Unified Profile**: Both paths produce the same `UserProfile` shape stored in `AuthContext`:

```typescript
interface UserProfile {
  id: string;
  displayName: string;
  avatar: string;
  email?: string;
  image?: string;
  walletAddress?: string;
  authProvider: 'phantom' | 'solflare' | 'google' | 'github';
  // Game state
  xp: number;
  level: number;
  streak: number;
  streakDates: string[];
  enrolledCourses: string[];
  completedLessons: string[];
  completedCourses: string[];
  achievements: string[];
  nftCertificates: { courseId: string; mintAddress: string; mintedAt: string }[];
}
```

---

## Service Layer

The service layer uses **interface-based dependency injection** to decouple business logic from implementation details:

```
ServiceContext (React Context)
  ├── IEnrollmentService
  │     ├── enroll(request)
  │     ├── unenroll(userId, courseId)
  │     ├── getEnrollments(userId)
  │     └── isEnrolled(userId, courseId)
  │
  ├── ILessonCompletionService
  │     ├── completeLesson(request)
  │     ├── getLessonProgress(userId, courseId)
  │     └── isCourseCompleted(userId, courseId)
  │
  ├── ICertificateService (interface only)
  │     ├── mintCertificate(request)
  │     ├── getCertificates(walletAddress)
  │     └── verifyCertificate(mintAddress)
  │
  └── IXPTokenService (interface only)
        ├── getBalance(walletAddress)
        ├── awardXP(walletAddress, amount)
        └── getLeaderboard(limit)
```

### Current Implementation

All services currently use **in-memory stub implementations** (`StubEnrollmentService`, `StubLessonCompletionService`). These are designed to be swapped with real Solana Smart Contract implementations in Phase 7 without changing any UI code.

### Swap Strategy

```typescript
// Current (Phase 1-6): Stub
const enrollmentService = new StubEnrollmentService();

// Future (Phase 7): Smart Contract
const enrollmentService = new SolanaEnrollmentService(connection, program);
```

---

## State Management

All state is managed through **React Context providers**, composed in `providers.tsx`:

```
<Providers>
  <ThemeProvider>           <!-- Dark/light mode, localStorage -->
    <LanguageProvider>      <!-- i18n, localStorage -->
      <WalletProvider>      <!-- Solana wallet adapter -->
        <AuthProvider>      <!-- User auth + game state -->
          <ServiceProvider> <!-- Service layer -->
            {children}
          </ServiceProvider>
        </AuthProvider>
      </WalletProvider>
    </LanguageProvider>
  </ThemeProvider>
</Providers>
```

### Context Responsibilities

| Context | State | Persistence |
|---------|-------|-------------|
| **ThemeContext** | `isDark`, `toggleTheme` | localStorage |
| **LanguageContext** | `lang`, `t()` function | localStorage |
| **WalletProvider** | Wallet connection state | Wallet adapter |
| **AuthContext** | User profile, XP, streak, achievements | In-memory (session) |
| **ServiceContext** | Service instances | Singleton |

---

## Internationalization (i18n)

Custom lightweight i18n implementation without external libraries:

```
LanguageContext
  ├── lang: 'en' | 'pt-br' | 'es'
  ├── setLang(lang)
  └── t(key, params?)  -->  translations[lang][key]
```

### Translation Structure

```typescript
// src/i18n/translations.ts
const translations = {
  en: {
    'nav.home': 'Home',
    'hero.tagline': 'Learn. Build. Earn.',
    'dash.toNextLevel': '{xp} XP to level {level}',
    // 100+ keys...
  },
  'pt-br': { /* ... */ },
  'es': { /* ... */ },
};
```

### Parameter Interpolation

```typescript
t('dash.toNextLevel', { xp: 150, level: 3 })
// Output: "150 XP to level 3"
```

---

## Gamification Engine

### XP & Level System

```
Level = floor(sqrt(xp / 100))

XP     Level
0      0
100    1
400    2
900    3
1600   4
2500   5
```

Helper functions exported from `AuthContext`:
- `xpForLevel(level)` -- minimum XP needed for a given level
- `xpProgressPercent(xp)` -- progress bar percentage to next level
- `xpToNextLevel(xp)` -- remaining XP to reach next level

### Streak System

- Daily login/activity tracked via `streakDates[]` (ISO date strings)
- `recordStreak()` called on lesson completion
- Consecutive day counting with streak break detection
- 28-day calendar visualization on dashboard

### Achievement System

10 achievement badges triggered by game events:

| Trigger | Achievement |
|---------|-------------|
| First login | Welcome Builder |
| Complete 1 lesson | First Steps |
| Complete 5 lessons | Getting Serious |
| Complete 1 course | Course Graduate |
| 3-day streak | On Fire |
| 7-day streak | Week Warrior |
| Earn 1000 XP | XP Hunter |
| All beginner courses | Foundation Builder |
| Mint first cNFT | NFT Collector |
| All Rust lessons | Rustacean |

### Leaderboard

- Mock leaderboard with 50 generated entries
- Current user dynamically injected at correct XP position
- Re-ranked in real-time as user earns XP
- Podium display for top 3

---

## Blockchain Integration

### Solana Wallet Adapter

```typescript
// WalletProvider.tsx
const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];
const endpoint = clusterApiUrl('devnet');
```

Wraps the app with `ConnectionProvider`, `WalletProvider`, and `WalletModalProvider`.

### Helius DAS API (cNFT Reading)

```
Browser --> /api/nfts/[wallet] --> Helius DAS API (devnet)
                                   getAssetsByOwner()
                                   Filter by Superteam Academy collection
```

The API route (`src/app/api/nfts/[wallet]/route.ts`):
1. Validates wallet address format (base58)
2. Calls Helius `getAssetsByOwner` method
3. Filters for Superteam Academy NFTs
4. Returns typed `BlockchainCertificate[]`

Client-side hook:
```typescript
const { certificates, isLoading, error, refetch } = useNFTs(walletAddress);
```

### Future: Smart Contract Integration

Service interfaces are pre-defined for:
- **ICertificateService** -- Metaplex Bubblegum cNFT minting
- **IXPTokenService** -- SPL token-based XP tracking

---

## Observability

### Sentry Error Monitoring

Three separate configs for full-stack coverage:

| Config | Runtime | Features |
|--------|---------|----------|
| `sentry.client.config.ts` | Browser | Error tracking + Session Replay |
| `sentry.server.config.ts` | Node.js | Server-side error tracking |
| `sentry.edge.config.ts` | Edge | Edge function error tracking |

Initialized via `instrumentation.ts` (Next.js instrumentation hook). Conditional activation -- only enabled when `NEXT_PUBLIC_SENTRY_DSN` is set.

### Google Analytics 4

```typescript
// app/layout.tsx
{GA_ID && <GoogleAnalytics gaId={GA_ID} />}
```

Uses `@next/third-parties/google` for optimal Next.js integration. Conditional -- only loads when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set.

---

## Key Design Decisions

### 1. Client-Side Rendering for Most Pages

**Decision:** All page components use `"use client"` directive.

**Rationale:** Heavy reliance on React contexts (Auth, Theme, Language) makes server-side rendering impractical for most pages. Trade-off is acceptable since the app is an interactive SPA-like experience.

### 2. Route Groups for Layout Sharing

**Decision:** `(main)` route group wraps pages that need Navbar + Footer. Lesson pages live outside this group.

**Rationale:** Lesson pages need a full-screen IDE experience without navigation chrome. Route groups allow this without URL pollution.

### 3. Interface-Based Service Layer

**Decision:** Business logic abstracted behind TypeScript interfaces with stub implementations.

**Rationale:** Enables incremental migration from mock data to real Solana Smart Contracts. UI code never depends on implementation details.

### 4. Custom i18n (No External Library)

**Decision:** Built custom i18n with React Context instead of using next-intl or react-i18next.

**Rationale:** Simpler implementation for 3 languages, no build-time complexity, supports parameter interpolation. All translations in a single file for easy management.

### 5. Conditional Observability

**Decision:** Both Sentry and GA4 are completely optional, gated by environment variables.

**Rationale:** Development experience stays clean (no console errors about missing keys). Production gets full observability. Open-source contributors can run locally without any service accounts.

### 6. Monaco Editor with Dynamic Import

**Decision:** Monaco Editor loaded via `next/dynamic` with `ssr: false`.

**Rationale:** Monaco is a large library (~2MB) that requires browser APIs. Dynamic import prevents SSR failures and enables code splitting for better initial load performance.

---

## Data Flow Diagrams

### Lesson Completion Flow

```
User writes code in Monaco Editor
         |
         v
Click "Run" button
         |
         v
CodeEditor checks for testKeyword in code
         |
    +----+----+
    |         |
  PASS      FAIL
    |         |
    v         v
Show pass   Show fail
message     message
    |
    v
AuthContext.completeLesson()
    |
    +---> Add XP (addXP)
    +---> Record streak (recordStreak)
    +---> Check achievements
    +---> Update completedLessons[]
    |
    v
ServiceContext.lessonService.completeLesson()
    |
    v
Update UI (dashboard, progress bars, leaderboard)
```

### Authentication Flow (Wallet)

```
User clicks "Phantom" in AuthModal
         |
         v
Solana Wallet Adapter opens wallet popup
         |
         v
User approves connection
         |
         v
publicKey available in useWallet()
         |
         v
AuthContext.loginWithWallet(publicKey, 'phantom')
         |
         v
Create UserProfile with wallet address
         |
         v
User redirected to /courses
```

### Authentication Flow (OAuth)

```
User clicks "Google" in AuthModal
         |
         v
NextAuth signIn('google') called
         |
         v
Redirect to Google OAuth consent screen
         |
         v
Google redirects to /api/auth/callback/google
         |
         v
NextAuth creates session (JWT strategy)
         |
         v
AuthContext.loginWithSocial(session)
         |
         v
Create UserProfile from OAuth data
         |
         v
User redirected to /courses
```

---

<p align="center">
  <sub>Last updated: February 2026</sub>
</p>

