# Architecture

System architecture reference for the Superteam Academy frontend.

## High-Level Architecture

```
+------------------------------------------------------------------+
|                         Browser / Client                          |
|                                                                   |
|  +-------------------+  +------------------+  +----------------+  |
|  | React Components  |  | Wallet Adapter   |  | Analytics SDK  |  |
|  | (Server + Client) |  | (Phantom/Solflare)|  | (GA4/PostHog)  |  |
|  +--------+----------+  +--------+---------+  +-------+--------+  |
|           |                      |                     |          |
+-----------+----------------------+---------------------+----------+
            |                      |                     |
            v                      v                     v
+------------------------------------------------------------------+
|                     Next.js App Router (Edge/Node)                |
|                                                                   |
|  +----------------+  +-------------------+  +------------------+  |
|  | API Routes     |  | Server Components |  | Middleware        |  |
|  | /api/auth/*    |  | SSR + Static Gen  |  | (i18n, headers)  |  |
|  | /api/academy/* |  |                   |  |                  |  |
|  | /api/activity/*|  |                   |  |                  |  |
|  +-------+--------+  +--------+----------+  +------------------+  |
|          |                     |                                  |
+----------+---------------------+----------------------------------+
           |                     |
           v                     v
+-------------------------+  +---------------------------+
| Server Services         |  | External Services         |
|                         |  |                           |
| - wallet-auth.ts (JWT)  |  | - Solana RPC (Helius)     |
| - academy-program.ts    |  | - Sanity CMS (optional)   |
| - leaderboard-cache.ts  |  | - Google/GitHub OAuth     |
| - activity-store.ts     |  | - PostHog / GA4 / Sentry  |
| - account-linking.ts    |  |                           |
| - certificate-service.ts|  |                           |
+------------+------------+  +-------------+-------------+
             |                             |
             v                             v
+------------------------------------------------------------------+
|                    Solana Blockchain (Devnet)                      |
|                                                                   |
|  Program: DFB44LZedVS461TK6kv4o9U28ALuhJF26N5V9yRyCvtZ          |
|                                                                   |
|  PDAs:                                                            |
|  - Config    ["config"]                                           |
|  - Learner   ["learner", user_pubkey]                            |
|  - Course    ["course", course_id]                               |
|  - Enrollment["enrollment", course_pda, user_pubkey]             |
+------------------------------------------------------------------+
```

## Component Hierarchy

```
RootLayout (app/layout.tsx)
├── IntlProvider (next-intl server messages)
│   └── AppProviders (client boundary)
│       ├── ThemeProvider (next-themes, dark/light/system)
│       │   └── Web3Provider
│       │       ├── ConnectionProvider (Solana RPC)
│       │       └── WalletProvider (Phantom, Solflare)
│       │           └── WalletModalProvider
│       │               └── WalletAuthProvider (JWT session + auto-init)
│       │                   └── AnalyticsProvider (GA4 + PostHog)
│       │                       └── {children}
│       │                           ├── Navbar
│       │                           ├── Page Content
│       │                           └── Footer
│       └── Toaster (sonner)
```

### Provider Responsibilities

| Provider | File | Purpose |
|----------|------|---------|
| `IntlProvider` | `components/providers/intl-provider.tsx` | Passes server-resolved locale and messages to client |
| `ThemeProvider` | `components/theme-provider.tsx` | Dark/light mode via CSS class on `<html>` |
| `Web3Provider` | `components/providers/web3-provider.tsx` | Solana connection + wallet adapters |
| `WalletAuthProvider` | `components/providers/wallet-auth-provider.tsx` | JWT session management, auto-sign-in, auto-init learner |
| `AnalyticsProvider` | `components/analytics/analytics-provider.tsx` | Page view tracking, GA4 script injection |

## Data Flow

### Lesson Completion Flow

```
User clicks "Run Code"
        |
        v
CodeEditor validates tests (client-side pattern matching)
        |
        v
All tests pass? ──No──> Show failures
        |
       Yes
        v
onComplete callback fires
        |
        v
POST /api/academy/progress/complete
  { courseSlug, lessonId }
        |
        v
Server: academy-program.ts
  1. Verify JWT session (wallet-auth.ts)
  2. Derive PDAs: Course, Learner, Enrollment
  3. Build complete_lesson instruction
  4. Sign with backend keypair
  5. Send transaction to Solana
        |
        v
On-chain: complete_lesson instruction
  - Increment enrollment.lessons_completed
  - Award XP to learner profile
  - Update streak timestamp
        |
        v
Server: activity-store.ts
  - Record in-memory activity for heatmap
  - Update recent activity list
        |
        v
Response: { success: true, signature }
        |
        v
Client: Show confetti + XP badge
```

### Authentication Flow

```
1. WALLET AUTH (Primary)
   ========================

   Wallet connects (auto-detect)
           |
           v
   GET /api/auth/me  ──── Has valid JWT cookie? ──Yes──> Authenticated
           |
          No
           v
   POST /api/auth/wallet/nonce
     - Server generates random nonce
     - Builds sign-in message with address + nonce + timestamp
     - Sets nonce challenge cookie (signed, 5min TTL)
     - Returns { message }
           |
           v
   Client: wallet.signMessage(message)
     - User approves in wallet popup
     - Returns ed25519 signature
           |
           v
   POST /api/auth/wallet/verify
     - Verify nonce cookie (timing-safe compare)
     - Verify ed25519 signature against public key
     - Extract address from message, compare to claimed address
     - Create/find linked account
     - Issue JWT (HS256, 7-day TTL) as HttpOnly cookie
     - Return { ok: true, user }
           |
           v
   Auto-init learner profile
     - GET /api/identity/me (check chain for LearnerProfile PDA)
     - If no profile: client sends init_learner transaction
       (user signs, pays rent)


2. OAUTH (Optional, Secondary)
   ========================

   User clicks Google/GitHub button
           |
           v
   NextAuth v5 flow (/api/auth/[...nextauth])
     - Redirect to provider
     - Callback: findOrCreateByOAuth
     - JWT callback: attach userId, walletAddress
     - Session callback: expose to client
           |
           v
   Account linking:
     - If OAuth user later connects wallet, accounts merge
     - Wallet address stored on linked account
```

### Leaderboard Data Flow

```
GET /api/leaderboard
        |
        v
leaderboard-cache.ts
  - In-memory cache (5-minute TTL)
  - Cache miss? Call getAllLearnerProfilesOnChain()
        |
        v
academy-chain-read.ts
  - Single RPC: getProgramAccounts with LearnerProfile filter
  - Decode each account: authority, xpTotal, level, streakCurrent
        |
        v
Sort by XP descending, assign ranks
        |
        v
Return LeaderboardEntry[]
```

## Service Layer Architecture

All server-side services live in `lib/server/` and use the `"server-only"` import guard.

### Core Services

| Service | File | Responsibility |
|---------|------|----------------|
| **Academy Program** | `academy-program.ts` | PDA derivation, instruction building, transaction signing, chain reads |
| **Wallet Auth** | `wallet-auth.ts` | JWT creation/verification, nonce generation, message building |
| **Auth Config** | `auth-config.ts` | NextAuth v5 provider configuration, JWT/session callbacks |
| **Account Linking** | `account-linking.ts` | In-memory store linking wallet addresses with OAuth identities |
| **Leaderboard Cache** | `leaderboard-cache.ts` | 5-minute in-memory cache of global leaderboard from chain data |
| **Activity Store** | `activity-store.ts` | Activity heatmap + recent activity (chain data + in-memory overlay) |
| **Certificate Service** | `certificate-service.ts` | On-chain credential verification and metadata |
| **Course Service** | `cms/course-service.ts` | Strategy pattern: Sanity CMS or local fallback |
| **Identity Service** | `services/identity-read-service.ts` | Composite identity snapshot (profile + chain state) |
| **Progress Adapter** | `server/academy-progress-adapter.ts` | Adapts chain enrollment data to UI progress model |
| **Course Catalog** | `server/academy-course-catalog.ts` | Server-side course data with progress enrichment |

### CMS Service (Strategy Pattern)

```
CourseService (interface)
├── SanityCourseService    # Used when NEXT_PUBLIC_SANITY_PROJECT_ID is set
│     Uses GROQ queries to fetch from Sanity API
│     Transforms SanityCourse -> Course via sanityCourseToLocal()
│
└── LocalCourseService     # Fallback when Sanity is not configured
      Returns hardcoded data from lib/course-catalog.ts
      Zero external dependencies

Factory: getCourseService() checks isCmsConfigured()
```

## On-Chain Integration

### PDA Derivation

| Account | Seeds | Derivation Function |
|---------|-------|---------------------|
| Config | `["config"]` | `deriveConfigPda()` |
| Learner | `["learner", user.toBuffer()]` | `deriveLearnerPda(user)` |
| Course | `["course", Buffer.from(courseId)]` | `deriveCoursePda(courseId)` |
| Enrollment | `["enrollment", course.toBuffer(), user.toBuffer()]` | `deriveEnrollmentPda(course, user)` |

All PDAs are derived against `ACADEMY_PROGRAM_ID` (`DFB44LZedVS461TK6kv4o9U28ALuhJF26N5V9yRyCvtZ`).

### Instructions Used by Frontend

| Instruction | Signer | Triggered By |
|-------------|--------|--------------|
| `init_learner` | User wallet | Auto on first auth (client-side tx) |
| `enroll` | User wallet | "Enroll" button on course page (client-side tx) |
| `create_course` | Backend keypair | POST /api/academy/courses/ensure |
| `complete_lesson` | Backend keypair | POST /api/academy/progress/complete |
| `finalize_course` | Backend keypair | Auto when all lessons completed |

Client-side transactions (`init_learner`, `enroll`) are built in `lib/solana/` and signed by the user's wallet via `sendTransaction`.

Server-side transactions (`create_course`, `complete_lesson`, `finalize_course`) are built and signed by the backend keypair in `lib/server/academy-program.ts`.

### Chain Data Reading

```
fetchLearnerProfile(user)         # Check if learner PDA exists
fetchEnrollment(user, courseId)   # Get enrollment + lessons_completed count
fetchChainActivity(user, days)    # Get signatures for heatmap + recent activity
countCompletedCoursesOnChain(w)   # Batch getMultipleAccountsInfo for all courses
getAllLearnerProfilesOnChain()    # getProgramAccounts for leaderboard
```

## Authentication Architecture

### Dual Auth System

The app supports two independent auth mechanisms:

1. **Wallet Auth (Primary)** -- Custom JWT-based authentication via message signing. No database required. Tokens stored as `st_access_token` HttpOnly cookie with 7-day TTL.

2. **OAuth Auth (Secondary)** -- NextAuth v5 with Google and GitHub providers. Session stored as NextAuth JWT cookie. Optional; only active when OAuth credentials are configured.

### Account Linking

Accounts from both systems can be linked via `account-linking.ts`:
- In-memory store (Map) with secondary indexes for wallet address and OAuth provider+ID lookups
- When a wallet user connects OAuth, or an OAuth user connects a wallet, the accounts merge
- The `LinkedAccount` type holds optional fields for email, googleId, githubId, and walletAddress

### JWT Implementation

Custom JWT in `wallet-auth.ts`:
- Algorithm: HS256
- Claims: `iss` (superteam-academy), `aud` (superteam-frontend), `sub` (userId), `walletAddress`, `iat`, `exp`
- Nonce challenge tokens use a separate signed payload with 5-minute TTL
- All signature comparisons use `crypto.timingSafeEqual` to prevent timing attacks

## State Management

### Server Components (Default)

Pages are Server Components by default. Data is fetched at request time:
- Dashboard: fetches identity snapshot, courses with progress, activity data, leaderboard
- Courses: fetches course catalog via CourseService
- Leaderboard: fetches from leaderboard cache (5-minute TTL)

### Client State

| Layer | Mechanism | Scope |
|-------|-----------|-------|
| Auth state | `WalletAuthProvider` context | Global (status, user, isAuthenticated) |
| Wallet state | `@solana/wallet-adapter-react` context | Global (publicKey, connected, signMessage) |
| Theme | `next-themes` context | Global (resolvedTheme) |
| Locale | `next-intl` + cookie | Global (locale, messages) |
| Component state | `useState` / `useRef` | Local (code editor, form inputs) |

### Data Freshness Strategy

| Data Type | Strategy | TTL |
|-----------|----------|-----|
| Course catalog | Server fetch per request | No cache (or Sanity CDN) |
| Leaderboard | In-memory cache | 5 minutes |
| Activity heatmap | Chain fetch + in-memory overlay | Per request |
| Auth session | JWT cookie | 7 days |
| User identity | API call on dashboard load | Per request |

## Internationalization Architecture

### How It Works

```
1. Server: getRequestConfig() in i18n/request.ts
   - Read "locale" cookie (set by LanguageSwitcher)
   - Fallback: parse Accept-Language header
   - Fallback: "en" default
   - Import messages/{locale}.json

2. Server Component: RootLayout
   - Call getLocale() + getMessages()
   - Set <html lang={locale}>
   - Pass to IntlProvider

3. Client Components:
   - useTranslations("namespace") for translated strings
   - useLocale() for current locale
   - useSetLocale() to change (sets cookie, triggers re-render)
```

### Supported Locales

| Code | Language | File |
|------|----------|------|
| `en` | English | `messages/en.json` |
| `pt-br` | Portuguese (Brazil) | `messages/pt-br.json` |
| `es` | Spanish | `messages/es.json` |

No i18n routing (no `/en/`, `/es/` URL prefixes). Locale is stored in a `locale` cookie and resolved on each request.

### Translation Namespaces

The message JSON is organized by namespace: `nav`, `footer`, `theme`, `language`, `hero`, `stats`, `paths`, `features`, `testimonials`, `cta`, `courses`, `dashboard`, `leaderboard`, `profile`, `settings`, `common`.

## Analytics Pipeline

```
+--------------------+
| AnalyticsProvider   |
| (client component)  |
+--------+-----------+
         |
         v
+--------------------+     +--------------------+
| analytics.ts       |---->| gtag.ts            |
| Unified API:       |     | - gtag pageview()  |
| - trackPageView()  |     | - gtag event()     |
| - trackEvent()     |     +--------------------+
| - identify()       |
| - reset()          |---->| posthog.ts         |
+--------------------+     | - capture()        |
                           | - identify()       |
                           | - reset()          |
                           +--------------------+

Sentry: Loaded separately via @sentry/nextjs
- Automatic error boundary capture
- Performance tracing
```

All analytics are opt-in: if the environment variables are not set, the functions are no-ops.

## Performance Strategy

### Server-Side Rendering

- All pages use the App Router and are Server Components by default
- Heavy client components (Monaco Editor, React Flow) are loaded via `next/dynamic` with `ssr: false`
- Loading states use dedicated skeleton components (`components/skeletons/`)

### Code Splitting

| Component | Strategy |
|-----------|----------|
| Monaco Editor | `dynamic(() => import("@monaco-editor/react"), { ssr: false })` |
| React Flow | Loaded only on roadmap pages |
| Wallet Modal | Loaded only when wallet UI is needed |
| Analytics Scripts | `strategy="afterInteractive"` via `next/script` |

### Fonts

Three Google Fonts loaded with `next/font/google` for zero layout shift:
- **Inter** -- Body text (`--font-inter`)
- **Archivo** -- Headings (`--font-archivo`)
- **JetBrains Mono** -- Code editor (`--font-jetbrains`)

### Turbopack

Development server uses Turbopack (`next dev --turbo`) for faster HMR and builds.

## Security Considerations

### Authentication Security

- **Nonce-based challenge-response** prevents replay attacks for wallet auth
- **Timing-safe comparison** (`crypto.timingSafeEqual`) for all signature and token verification
- **HttpOnly cookies** for JWT storage (not accessible to JavaScript)
- **Short nonce TTL** (5 minutes) limits window for nonce reuse
- **User rejection detection** cleanly disconnects wallet on sign refusal

### On-Chain Security

- **Backend keypair** signs privileged transactions (lesson completion, course finalization)
- **PDA derivation** is deterministic and verified on-chain
- **Separate client vs server transactions** -- users can only sign `init_learner` and `enroll`; XP-granting operations require the backend signer

### Web Security

- **CSRF protection** via SameSite cookie attributes
- **XSS prevention** via React's default escaping and no `dangerouslySetInnerHTML` in user content
- **Content Security Policy** headers recommended for production deployment
- **No secrets in client bundles** -- all `NEXT_PUBLIC_*` variables are safe for exposure; server secrets stay in server-only modules guarded by `"server-only"` import

### Data Integrity

- **In-memory stores** (account linking, leaderboard cache, activity store) are ephemeral and rebuilt from chain data on restart
- **Chain data is authoritative** -- in-memory overlays only supplement chain reads for freshness
- **Network error handling** -- all chain reads gracefully fall back to cached data or empty results on RPC failures
