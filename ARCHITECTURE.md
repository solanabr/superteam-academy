# Superteam Academy -- Frontend Architecture

A Solana-native learning management system (LMS) dApp. This document describes
the frontend application architecture, data flows, on-chain integrations, and
design decisions.

---

## 1. System Overview

```
+---------------------+        +-------------------+        +------------------+
|                     |  RPC   |                   |  DAS   |                  |
|   Next.js 16 App    +------->+  Solana Devnet    +------->+  Helius RPC      |
|   (Vercel Edge)     |        |  Validators       |        |  (DAS API)       |
|                     +<-------+                   +<-------+                  |
+----------+----------+        +-------------------+        +------------------+
           |
           |  HTTPS
           v
+----------+----------+        +-------------------+
|                     |        |                   |
|   Browser Client    +------->+  Wallet Adapter   |
|   (React 19 SPA)    |        |  (Phantom, etc.)  |
|                     +<-------+                   |
+---------------------+        +-------------------+
```

**Primary data sources:**

| Data             | Source                      | Read Method                          |
|------------------|-----------------------------|--------------------------------------|
| Course catalog   | Static `courses.ts`         | Direct import (zero latency)         |
| XP balance       | Token-2022 soulbound mint   | `getAccount` via `@solana/spl-token` |
| Credentials      | Bubblegum cNFTs             | Helius DAS `getAssetsByOwner`        |
| Leaderboard      | XP mint token accounts      | `getTokenLargestAccounts` + cache    |
| Learning progress| Browser localStorage        | `LocalStorageProgressService`        |
| User session     | NextAuth.js (next-auth v5)  | `SessionProvider`                    |
| Analytics        | PostHog + GA4               | Lazy-loaded client-side SDKs         |

**Network configuration:** Controlled by `NEXT_PUBLIC_SOLANA_NETWORK` env var.
Defaults to `devnet`. All on-chain reads use a shared `Connection` singleton
(`lib/solana/connection.ts`) pointed at `HELIUS_RPC_URL`.

---

## 2. Frontend Architecture

### 2.1 Framework

Next.js 16 with the App Router. React 19. TypeScript strict mode. Deployed on
Vercel with Edge runtime for middleware.

### 2.2 App Router Structure

```
src/app/
  layout.tsx                         -- Root layout (Server): fonts, metadata, GA script, JSON-LD
  globals.css                        -- Design system CSS variables, Tailwind v4 import
  not-found.tsx                      -- 404 page
  page.tsx                           -- Root redirect (handled by i18n middleware)
  opengraph-image.tsx                -- Dynamic OG image generation
  icon.svg                           -- Favicon
  studio/                            -- Sanity Studio (embedded)
  api/
    auth/                            -- NextAuth.js API routes
    leaderboard/route.ts             -- Leaderboard data API (server-side, 60s cache)
  [locale]/
    layout.tsx                       -- Locale layout (Server): NextIntlClientProvider, AppProviders, Navbar, Footer
    page.tsx                         -- Landing page
    landing-content.tsx              -- Landing page client content
    loading.tsx                      -- Route-level Suspense fallback
    courses/
      page.tsx                       -- Course catalog (Server)
      course-catalog.tsx             -- Catalog client component
      loading.tsx                    -- Catalog skeleton
      [slug]/
        page.tsx                     -- Course detail (Server)
        lessons/
          [id]/                      -- Lesson viewer (Client): editor, quiz, reading
    dashboard/
      layout.tsx                     -- Dashboard layout
      page.tsx                       -- User dashboard (Client): XP, streak, progress
      loading.tsx                    -- Dashboard skeleton
    leaderboard/
      layout.tsx                     -- Leaderboard layout
      page.tsx                       -- XP leaderboard (Client)
      loading.tsx                    -- Leaderboard skeleton
    profile/
      page.tsx                       -- User profile (Client)
      [username]/                    -- Public profile view
    certificates/
      layout.tsx                     -- Certificates layout
      page.tsx                       -- Credentials gallery (Client)
      [id]/
        page.tsx                     -- Certificate detail + share
        share-actions.tsx            -- Share/export actions
    settings/
      layout.tsx                     -- Settings layout
      page.tsx                       -- User settings (Client)
```

### 2.3 Server vs Client Component Split

**Server Components** (default, no `"use client"` directive):
- Root layout (`app/layout.tsx`) -- font loading, metadata, structured data
- Locale layout (`app/[locale]/layout.tsx`) -- message loading via `getMessages()`
- Course catalog page -- static course data, no wallet dependency
- Course detail page -- static course data, `generateStaticParams` eligible

**Client Components** (`"use client"` directive):
- Dashboard -- reads wallet XP, streak, progress from localStorage
- Profile -- reads wallet credentials, XP, computed skills
- Leaderboard -- fetches `/api/leaderboard`, interactive timeframe tabs
- Settings -- user preferences, theme toggle
- Certificates -- reads cNFTs via Helius DAS, wallet-gated
- Lesson viewer -- Monaco editor, quiz interactions, progress mutations
- Landing content -- animations, wallet connect CTA

**Rationale:** Anything that touches `useWallet()`, `localStorage`, or
interactive state must be a Client Component. Course content is static and
benefits from Server Component rendering for SEO and initial load performance.

### 2.4 Provider Stack

All providers are Client Components, composed in `providers/app-providers.tsx`:

```
<SessionProvider>              -- NextAuth.js session (next-auth v5 beta)
  <ThemeProvider>              -- next-themes: attribute="data-theme", default="dark"
    <WalletProvider>           -- Solana Wallet Adapter: ConnectionProvider + WalletProvider + WalletModalProvider
      <ToastProvider>          -- Custom toast notification context
        <Suspense>
          <AnalyticsProvider>  -- PostHog (lazy, requestIdleCallback) + GA4 pageview tracking
            {children}
          </AnalyticsProvider>
        </Suspense>
      </ToastProvider>
    </WalletProvider>
  </ThemeProvider>
</SessionProvider>
```

The `NextIntlClientProvider` wraps `AppProviders` in the locale layout, sitting
outside the client provider tree because it receives server-loaded messages.

**Wallet Provider details:**
- `ConnectionProvider` endpoint = `HELIUS_RPC_URL` (devnet or mainnet)
- `wallets = []` -- Wallet Standard v0.9+ auto-detects installed wallets
- `autoConnect = true` -- reconnects on page reload

### 2.5 Internationalization

**Library:** next-intl v4.8+

**Locales:** `en` (default), `pt-br`, `es`

**Configuration:**
```
src/i18n/
  config.ts     -- locales array, defaultLocale, localeLabels
  routing.ts    -- defineRouting() with locale list
src/messages/
  en.json       -- English translations
  pt-br.json    -- Brazilian Portuguese translations
  es.json       -- Spanish translations
src/middleware.ts -- next-intl middleware, matcher excludes /api, /_next, static files
```

**Routing:** Every user-facing route is prefixed with `[locale]`. The middleware
detects the browser's preferred language and redirects accordingly. The root
`/` redirects to `/en` (or detected locale).

---

## 3. Data Flow

### 3.1 Course Content

```
courses.ts (static)                     Sanity CMS (optional)
       |                                       |
       v                                       v
  Direct import                        fetchCourses() GROQ query
       |                                       |
       +------------------+--------------------+
                          |
                          v
                   Course[] array
                          |
                   +------+------+
                   |             |
                   v             v
           Catalog Page    Course Detail
           (Server)        (Server)
```

The static `courses.ts` file contains the full course catalog with modules,
lessons, code challenges, quiz data, and XP reward values. This is the primary
data source. Sanity CMS integration exists as a fallback path via `next-sanity`
but the static catalog is authoritative for the competition submission.

### 3.2 User XP

```
Wallet connects
       |
       v
useUser() hook
       |
       v
getXPBalance(walletAddress)               -- lib/services/xp.ts
       |
       +-- Derive ATA address (Token-2022 program, XP mint, wallet owner)
       |
       +-- getAccount(connection, ata, "confirmed", TOKEN_2022_PROGRAM_ID)
       |
       +-- Return Number(account.amount)  -- or 0 if ATA doesn't exist
       |
       v
calculateLevel(xp)                        -- lib/constants.ts
       |
       +-- level = floor(sqrt(xp / 100))
       |
       v
{ xp, level } -> UserProfile state
```

**XP token design:** Token-2022 with `NonTransferable` and `PermanentDelegate`
extensions. This makes the token soulbound -- users cannot transfer or
self-burn XP. The mint authority is the platform backend signer.

### 3.3 Credentials (cNFTs)

```
Wallet connects
       |
       v
getCredentialsByOwner(walletAddress)       -- lib/services/credentials.ts
       |
       v
Helius DAS API (POST to RPC URL)
  method: "getAssetsByOwner"
  params: { ownerAddress, page: 1, limit: 100, showCollectionMetadata }
       |
       v
Filter by collection grouping
  group_key === "collection"
  group_value === CREDENTIAL_COLLECTION (env var)
       |
       v
Map to Credential[]
  - Parse track from metadata attributes
  - Parse level, courses_completed, xp_earned from metadata
  - Build explorer URL (network-aware)
       |
       v
Credential[] -> UserProfile.credentials
```

**Why Bubblegum cNFTs:** Compressed NFTs cost ~0.00005 SOL to mint vs ~0.015
SOL for regular NFTs. For a platform issuing thousands of credentials, this is
a 300x cost reduction. The Helius DAS API provides the same query interface
(`getAssetsByOwner`) regardless of whether NFTs are compressed or regular.

### 3.4 Leaderboard

```
Client                          Server API Route
  |                                  |
  v                                  v
getLeaderboard(timeframe)     GET /api/leaderboard
  |                                  |
  v                                  v
fetch("/api/leaderboard")     Check in-memory cache (60s TTL)
                                     |
                              cache miss?
                                     |
                                     v
                              getTokenLargestAccounts(xpMint)
                                     |
                                     v
                              For each account:
                                getParsedAccountInfo -> resolve owner
                                     |
                                     v
                              Sort by XP desc, assign ranks
                                     |
                                     v
                              Cache result, return LeaderboardEntry[]
```

**Why server-side:** `getTokenLargestAccounts` is an expensive RPC call. The
API route caches results for 60 seconds in process memory, preventing clients
from hammering the RPC endpoint. The route returns an empty array on any error
to avoid breaking the UI.

### 3.5 Learning Progress

```
+---------------------------+
|  LearningProgressService  |  <-- Interface (lib/services/types.ts)
+---------------------------+
| getProgress()             |
| getAllProgress()           |
| completeLesson()          |
| enrollInCourse()          |
| unenrollFromCourse()      |
| getXP()            -------+----> On-chain (Token-2022)
| getStreak()               |
| getLeaderboard()   -------+----> On-chain (API route)
| getCredentials()   -------+----> On-chain (Helius DAS)
+---------------------------+
             ^
             |  implements
             |
+---------------------------+
|  LocalStorageProgressService  |  <-- Current implementation
+---------------------------+
| localStorage for:         |
|   - Progress tracking     |
|   - Enrollment state      |
|   - Streak data           |
| Delegates to on-chain for:|
|   - XP balance            |
|   - Leaderboard           |
|   - Credentials           |
+---------------------------+
```

This is the key abstraction. The `LearningProgressService` interface defines
the contract. The current `LocalStorageProgressService` stubs progress/streak/
enrollment in the browser while delegating XP, leaderboard, and credentials to
real on-chain reads. When the Anchor program is deployed, a new
`OnChainProgressService` can implement the same interface without touching any
UI code.

**Storage keys:**
- Progress: `stacad:progress:{walletAddress}:{courseId}`
- Streak: `stacad:streak:{walletAddress}`

### 3.6 User Data Aggregation

The `useUser()` hook (`lib/hooks/use-user.ts`) is the single entry point for
user data in the frontend:

```
useWallet() -> publicKey
       |
       +-- !publicKey? -> return DEFAULT_PROFILE
       |
       +-- Promise.all([
       |     getCredentialsByOwner(walletAddress),
       |     getXPBalance(walletAddress),
       |   ])
       |
       +-- Compute skills from credentials:
       |     skills[track] = min(100, level * 25 + coursesCompleted * 15)
       |
       +-- calculateLevel(xp)
       |
       v
UserProfile {
  wallet, displayName, xp, level,
  streak, achievements, credentials,
  skills, joinedAt, isPublic
}
```

---

## 4. Service Layer

```
lib/
  constants.ts                  -- Network config, mint addresses, program ID,
  |                                level math (calculateLevel, xpForLevel,
  |                                xpToNextLevel, levelProgress), track/difficulty
  |                                labels and colors
  |
  solana/
    connection.ts               -- Shared Connection singleton (confirmed commitment)
  |
  services/
    types.ts                    -- All TypeScript interfaces:
    |                              Course, Module, Lesson, CodeChallenge, TestCase,
    |                              Progress, StreakData, LeaderboardEntry,
    |                              Credential, Achievement, UserProfile,
    |                              LearningProgressService (interface)
    |
    courses.ts                  -- Static course catalog (6 tracks, 12+ courses)
    |                              Achievement definitions
    |                              Module/lesson structure with code challenges
    |
    xp.ts                       -- getXPBalance(walletAddress): number
    |                              Derives Token-2022 ATA, reads balance
    |                              Re-exports calculateLevel, xpForLevel
    |                              progressToNextLevel() helper
    |
    credentials.ts              -- getCredentialsByOwner(walletAddress): Credential[]
    |                              Helius DAS API call
    |                              Filters by CREDENTIAL_COLLECTION
    |                              Parses track/level/XP from metadata attributes
    |
    leaderboard.ts              -- getLeaderboard(timeframe): LeaderboardEntry[]
    |                              Client-side fetch to /api/leaderboard
    |
    learning-progress.ts        -- LocalStorageProgressService class
                                   Singleton export: learningService
                                   Implements LearningProgressService interface

  hooks/
    use-user.ts                 -- useUser(): { user, loading, connected, walletAddress, refresh }
    use-toast.tsx               -- Toast notification system with ToastProvider
    useIntersectionObserver.ts  -- Intersection Observer hook for lazy loading

  auth/                         -- NextAuth.js configuration
  sanity/                       -- Sanity CMS client and queries
  supabase/                     -- Supabase client (if used for user profiles)
  utils.ts                      -- cn() classname merge utility (clsx + tailwind-merge)
```

---

## 5. On-Chain Integration

### 5.1 XP Token (Token-2022)

| Property          | Value                                          |
|-------------------|------------------------------------------------|
| Program           | Token-2022 (`TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb`) |
| Extensions        | NonTransferable, PermanentDelegate             |
| Mint address      | `NEXT_PUBLIC_XP_MINT_ADDRESS` env var          |
| Decimals          | 0 (whole XP units)                             |
| Mint authority    | Platform backend signer                        |
| Transfer behavior | Soulbound -- transfers always fail             |

**ATA derivation:**
```
getAssociatedTokenAddressSync(
  mint,           -- XP mint public key
  owner,          -- User wallet public key
  false,          -- allowOwnerOffCurve
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
)
```

### 5.2 Credentials (Bubblegum cNFTs)

| Property          | Value                                          |
|-------------------|------------------------------------------------|
| Standard          | Metaplex Bubblegum (compressed NFTs)           |
| Collection        | `NEXT_PUBLIC_CREDENTIAL_COLLECTION` env var    |
| Query method      | Helius DAS API `getAssetsByOwner`              |
| Metadata          | On-chain attributes: Track, Level, XP earned   |
| Cost per mint     | ~0.00005 SOL (vs ~0.015 SOL regular NFT)       |

**Credential metadata attributes:**
```json
{
  "attributes": [
    { "trait_type": "Track", "value": "rust" },
    { "trait_type": "Level", "value": 2 },
    { "trait_type": "Courses Completed", "value": 3 },
    { "trait_type": "XP Earned", "value": 1500 }
  ]
}
```

### 5.3 Leaderboard Derivation

The leaderboard is derived entirely from on-chain data. No separate leaderboard
account or database exists.

```
XP Mint -> getTokenLargestAccounts()
  Returns top 20 token accounts by balance (Solana RPC limit)
  For each: getParsedAccountInfo() -> resolve owner wallet
  Sort by balance descending
  Assign rank 1..N
```

### 5.4 Network Configuration

| Env Variable                      | Purpose                              | Default              |
|-----------------------------------|--------------------------------------|----------------------|
| `NEXT_PUBLIC_SOLANA_NETWORK`      | Network selection                    | `devnet`             |
| `NEXT_PUBLIC_XP_MINT_ADDRESS`     | XP token mint                        | (empty)              |
| `NEXT_PUBLIC_PROGRAM_ID`          | Anchor program ID                    | (empty)              |
| `NEXT_PUBLIC_CREDENTIAL_COLLECTION`| cNFT collection address             | (empty)              |

When `NEXT_PUBLIC_SOLANA_NETWORK=devnet`:
- RPC URL: `https://api.devnet.solana.com`
- Explorer links include `?cluster=devnet`

When `NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta`:
- RPC URL: `https://api.mainnet-beta.solana.com`
- Explorer links use default (mainnet)

---

## 6. Routing Map

```
Path                                        Component Type   Auth    Description
------------------------------------------------------------------------------------------------------------
/                                           Redirect         No      -> /[defaultLocale]
/[locale]                                   Server + Client  No      Landing page
/[locale]/courses                           Server           No      Course catalog with filters
/[locale]/courses/[slug]                    Server           No      Course detail, modules, lessons list
/[locale]/courses/[slug]/lessons/[id]       Client           Yes*    Lesson viewer (editor/quiz/reading)
/[locale]/dashboard                         Client           Yes*    XP, streak, enrolled courses, progress
/[locale]/leaderboard                       Client           No      XP leaderboard with timeframe tabs
/[locale]/profile                           Client           Yes*    User profile, skills radar, credentials
/[locale]/profile/[username]                Client           No      Public profile view
/[locale]/certificates                      Client           Yes*    Credentials gallery (cNFT grid)
/[locale]/certificates/[id]                 Client           Yes*    Certificate detail, share/export
/[locale]/settings                          Client           Yes*    Theme, locale, notification preferences
/api/auth/*                                 API Route        --      NextAuth.js endpoints
/api/leaderboard                            API Route        No      GET: LeaderboardEntry[] (60s cache)
/studio                                     Embedded         Yes     Sanity Studio (CMS admin)

* "Auth" = wallet connection required. The app degrades gracefully when no
  wallet is connected (shows connect prompt, empty states) rather than
  hard-blocking with a redirect.
```

---

## 7. Performance Strategy

### 7.1 Code Splitting and Dynamic Imports

| Module              | Strategy                | Reason                               |
|---------------------|-------------------------|--------------------------------------|
| Monaco Editor       | `dynamic(() => import(...), { ssr: false })` | 2MB+ bundle, not needed on non-lesson pages |
| canvas-confetti     | `import()` on trigger   | Only fires on achievement/completion  |
| LazyParticles       | Client component, lazy  | Background animation, non-critical    |
| PostHog SDK         | `requestIdleCallback`   | Analytics should never block UI       |
| posthog-js          | Dynamic `import()`      | Only loaded if `POSTHOG_KEY` is set   |

### 7.2 Font Loading

```
Root layout:
  Geist (sans)      -- next/font/google, latin subset, CSS variable --font-geist-sans
  Geist_Mono        -- next/font/google, latin subset, CSS variable --font-geist-mono

globals.css @font-face:
  Diatype           -- Solana brand font (headings), woff2, font-display: swap
  DSemi             -- Semi-mono (stats/numbers), woff2, font-display: swap
```

Self-hosted brand fonts use `font-display: swap` to prevent invisible text
during load. Google Fonts are handled by `next/font` with automatic
optimization.

### 7.3 Static Generation

- `generateStaticParams` for `/courses/[slug]` -- all course slugs known at build
- `generateStaticParams` for `/courses/[slug]/lessons/[id]` -- all lesson IDs known at build
- Course catalog page renders server-side with no client data dependencies

### 7.4 Resource Hints

In the root layout `<head>`:
```html
<link rel="dns-prefetch" href="https://api.devnet.solana.com" />
<link rel="preconnect" href="https://api.devnet.solana.com" crossorigin="anonymous" />
<link rel="dns-prefetch" href="https://us.i.posthog.com" />
<link rel="dns-prefetch" href="https://www.googletagmanager.com" />
```

### 7.5 Caching

| Data              | Cache Strategy                    | TTL      |
|-------------------|-----------------------------------|----------|
| Leaderboard       | In-memory (API route process)     | 60s      |
| Course catalog    | Static import (no fetch)          | Infinite |
| XP balance        | Per-render (no cache)             | --       |
| Credentials       | Per-render (no cache)             | --       |
| i18n messages     | Server-loaded, passed to client   | Per-build|

### 7.6 Suspense Boundaries

Every route group has a `loading.tsx` that renders a skeleton UI:
- `/[locale]/loading.tsx` -- full-page skeleton
- `/[locale]/courses/loading.tsx` -- catalog grid skeleton
- `/[locale]/dashboard/loading.tsx` -- dashboard card skeletons
- `/[locale]/leaderboard/loading.tsx` -- table skeleton

The `AnalyticsProvider` is wrapped in `<Suspense fallback={null}>` because
`useSearchParams()` triggers client-side suspension in Next.js App Router.

---

## 8. Design System

### 8.1 Color Palette

**Dark theme (default):**

```
Background:   #000000  (--nd-bg)
Card:         #0A090F  (--card)
Text high:    #FFFFFF  (--nd-high-em-text)
Text mid:     #ABABBA  (--nd-mid-em-text)
Border:       #ECE4FD1F (--nd-border-light, 12% opacity)
Border hover: #ECE4FD52 (--nd-border-hovered, 32% opacity)
```

**Light theme:**

```
Background:   #FAFAFA
Card:         #FFFFFF
Text high:    #0F0F0F
Text mid:     #6B7280
Border:       #E5E7EB
```

**Solana brand colors (used sparingly):**

```
Green:   #00FFA3  (--solana-green)  -- Primary CTA, XP moments
Blue:    #03E1FF  (--solana-blue)   -- Accent, links
Purple:  #DC1FFF  (--solana-purple) -- Credentials only
```

**Solana Foundation nd-* highlight tokens:**

```
Green:     #55E9AB  (--nd-highlight-green)     -- XP, beginner, DeFi track
Lavender:  #CA9FF5  (--nd-highlight-lavendar)  -- Achievements, Anchor track
Blue:      #6693F7  (--nd-highlight-blue)      -- Frontend track
Gold:      #FFC526  (--nd-highlight-gold)      -- Streaks, intermediate
Orange:    #F48252  (--nd-highlight-orange)     -- Rust track
```

### 8.2 Typography

| Usage       | Font Family | Weight    | Variable         |
|-------------|-------------|-----------|------------------|
| Body text   | Geist       | 400       | --font-geist-sans|
| Code blocks | Geist Mono  | 400       | --font-geist-mono|
| Headings    | Diatype     | 400/500/700| @font-face      |
| Stats/nums  | DSemi       | 400/500   | @font-face       |

### 8.3 Semantic Color Tokens

```
--xp:          #55E9AB    XP-related UI (bars, badges, counters)
--streak:      #FFC526    Streak fire icon, streak counters
--achievement: #CA9FF5    Achievement badges, unlock animations
```

**Track colors:**
```
--track-rust:      #F48252
--track-anchor:    #CA9FF5
--track-frontend:  #6693F7
--track-security:  #EF4444
--track-defi:      #55E9AB
--track-mobile:    #EC4899
```

**Difficulty colors:**
```
--difficulty-beginner:     #55E9AB  (green)
--difficulty-intermediate: #FFC526  (amber)
--difficulty-advanced:     #EF4444  (red)
```

### 8.4 Component Library

Built on top of:
- **Tailwind CSS v4** -- `@import "tailwindcss"` (CSS-first config)
- **class-variance-authority** -- Variant-based component styling
- **clsx + tailwind-merge** -- `cn()` utility for conditional classes
- **Lucide React** -- Icon library
- **Framer Motion** -- Animations
- **Recharts** -- Charts (skills radar, XP history)
- **React Resizable Panels** -- Lesson viewer split panes

### 8.5 Theme Switching

```
next-themes configuration:
  attribute: "data-theme"    (not "class")
  defaultTheme: "dark"
  enableSystem: true
```

CSS variables switch between `:root` (dark) and `[data-theme="light"]` selectors.
The `data-theme` attribute approach avoids conflicts with Tailwind's `dark:`
class-based utilities.

### 8.6 Special CSS Classes

- `credential-border` -- Premium gradient border for credential cards
  (green -> purple -> blue Solana gradient)
- `gradient-solana` -- Full Solana gradient, used ONLY on small logo icons
  (navbar, footer)
- `::selection` -- Green highlight (#14F195) with black text

---

## 9. Component Organization

```
src/components/
  layout/
    navbar.tsx              -- Top navigation, wallet connect button, locale switcher
    footer.tsx              -- Site footer, social links
  course/
    course-card.tsx         -- Course grid card (track badge, difficulty, XP)
    course-sidebar.tsx      -- Module/lesson navigation tree
    lesson-viewer.tsx       -- Main lesson container (routes to type-specific renderers)
  editor/
    code-editor.tsx         -- Monaco editor wrapper (dynamic import, SSR disabled)
    output-panel.tsx        -- Code execution output display
  gamification/
    xp-bar.tsx              -- Level progress bar
    streak-display.tsx      -- Fire icon + streak counter
    achievement-badge.tsx   -- Achievement unlock display
    leaderboard-table.tsx   -- Ranked XP table
  ui/
    button.tsx              -- CVA-based button variants
    card.tsx                -- Card container
    tabs.tsx                -- Tab component (supports onValueChange)
    dialog.tsx              -- Modal dialog
    skeleton.tsx            -- Loading skeleton
    lazy-particles.tsx      -- Background particle animation (lazy-loaded)
    ...                     -- Additional primitives
```

---

## 10. Analytics Architecture

```
+-------------------+          +-------------------+
|   GA4             |          |   PostHog         |
|   (afterInteractive)        |   (requestIdleCallback)
+-------------------+          +-------------------+
         ^                              ^
         |                              |
         +----------+-------------------+
                    |
          AnalyticsProvider
                    |
        +-----------+-----------+
        |                       |
    gtagPageview()         posthog.capture()
        |                       |
        v                       v
    Page views              Page views +
                            Custom events
```

**Pre-defined events** (via `analytics` export):
- `course_viewed`, `lesson_started`, `lesson_completed`
- `challenge_run`, `course_enrolled`
- `wallet_connected`, `achievement_unlocked`, `credential_viewed`
- `search_performed`, `filter_applied`

**PostHog loading strategy:**
1. On first mount, register `requestIdleCallback`
2. When idle, dynamically `import("posthog-js")`
3. Initialize with `person_profiles: "identified_only"`
4. Subsequent calls use cached module reference

This ensures PostHog never blocks initial page render or interaction.

---

## 11. Error Handling

| Layer               | Strategy                                              |
|---------------------|-------------------------------------------------------|
| On-chain reads      | `try/catch`, return empty/zero on failure             |
| API routes          | `try/catch`, return `[]` with console.error           |
| useUser hook        | `Promise.all` with catch, degrades to DEFAULT_PROFILE |
| Leaderboard client  | Returns `[]` on fetch failure                         |
| Credential fetch    | Returns `[]` on DAS API failure                       |
| Sentry              | Configured for client, server, and edge runtimes      |

**Design principle:** Every on-chain read has a safe fallback. The app never
crashes due to RPC unavailability. Users see empty states rather than error
screens. Sentry captures errors for observability without surfacing them to
users.

---

## 12. Security Considerations

| Concern                    | Mitigation                                           |
|----------------------------|------------------------------------------------------|
| Wallet signing             | No blind signing -- all transactions are transparent |
| RPC exposure               | Public devnet RPC, no API keys in client bundle      |
| XP manipulation            | Soulbound token, only backend signer can mint        |
| localStorage tampering     | Progress is client-side only; XP/credentials are on-chain and authoritative |
| Session management         | NextAuth.js with secure session tokens               |
| Analytics PII              | PostHog `identified_only`, no PII in GA4 events      |
| Middleware bypass           | i18n middleware excludes only /api, /_next, static   |

---

## 13. Environment Variables

```
# Solana
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_XP_MINT_ADDRESS=<Token-2022 mint pubkey>
NEXT_PUBLIC_PROGRAM_ID=<Anchor program pubkey>
NEXT_PUBLIC_CREDENTIAL_COLLECTION=<Bubblegum collection pubkey>

# Auth
NEXTAUTH_SECRET=<random secret>
NEXTAUTH_URL=https://superteam-academy.vercel.app

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=<GA4 ID>
NEXT_PUBLIC_POSTHOG_KEY=<PostHog project key>
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# CMS
NEXT_PUBLIC_SANITY_PROJECT_ID=<Sanity project ID>
NEXT_PUBLIC_SANITY_DATASET=production

# Error Tracking
SENTRY_DSN=<Sentry DSN>
```

---

## 14. Dependency Graph (Key Packages)

```
next@16.1.6
react@19.2.3
typescript@5.x

Solana:
  @solana/web3.js@1.98.4
  @solana/spl-token@0.4.14
  @solana/wallet-adapter-react@0.15.39
  @solana/wallet-adapter-react-ui@0.9.39
  @solana/wallet-adapter-base@0.9.27
  bs58@6.0.0

UI:
  tailwindcss@4.x (CSS-first, @import "tailwindcss")
  framer-motion@12.34.0
  lucide-react@0.563.0
  class-variance-authority@0.7.1
  clsx@2.1.1 + tailwind-merge@3.4.0
  recharts@3.7.0
  react-resizable-panels@4.6.2
  react-markdown@10.1.0 + rehype-highlight + remark-gfm

Auth & Data:
  next-auth@5.0.0-beta.30
  next-intl@4.8.2
  @sanity/client@7.14.1 + next-sanity@12.1.0
  @supabase/supabase-js@2.95.3

Analytics & Monitoring:
  posthog-js@1.347.1
  @sentry/nextjs@10.38.0

Editor:
  @monaco-editor/react@4.7.0

Effects:
  canvas-confetti@1.9.4
  next-themes@0.4.6
```
