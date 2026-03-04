# Superteam Academy — Application Architecture

Reference for frontend and backend developers. The on-chain program architecture is in [ARCHITECTURE.md](./ARCHITECTURE.md). The full program specification is in [SPEC.md](./SPEC.md).

Last Updated: 2026-03-04

---

## System Overview

```
Learner Browser  <-->  Next.js App (Vercel)  <-->  Solana Devnet
                           |                           ^
                           v                           |
                     Supabase (DB)               Hono Backend (Railway)
                     Sanity (CMS)                   (signs transactions)
```

Three application tiers sit above the on-chain program:

| Tier | Technology | Host | Role |
|------|-----------|------|------|
| Frontend | Next.js 16, App Router | Vercel | UI, auth, data orchestration |
| Backend | Hono (Node.js) | Railway | Transaction signing, keypair custody |
| Data | Supabase + Sanity | Supabase Cloud / Sanity Cloud | Off-chain state, course content |

---

## Zero Mocks — Full Devnet Integration

**There is no mock data anywhere in this application.** Every data source is connected to a real service:

### On-Chain (Solana Devnet)

All core learning operations go through the deployed Anchor program. Nothing is simulated.

| Feature | Implementation | Details |
|---------|---------------|---------|
| Course enrollment | On-chain transaction | Learner signs `enroll` instruction directly from wallet |
| Lesson completion | On-chain transaction | Backend signs `complete_lesson`, marks bitmap, mints XP |
| Course finalization | On-chain transaction | Auto-triggered after last lesson, awards bonus XP + creator reward |
| XP tokens | Token-2022 on devnet | Soulbound (NonTransferable + PermanentDelegate), real token balance |
| Credential NFTs | Metaplex Core on devnet | Soulbound NFTs with on-chain attributes (track, level, XP, courses) |
| Achievement NFTs | Metaplex Core on devnet | Each achievement award mints a real soulbound NFT |
| Leaderboard | Synced from chain | Daily cron parses on-chain XP transactions via Helius DAS API |
| Credential display | Helius DAS API | `getAssetsByOwner` reads real NFTs from devnet |

### Off-Chain (Supabase) — Per Bounty Specification

The bounty specification explicitly states certain features should be implemented off-chain. These are stored in Supabase with Row Level Security:

| Feature | Why Off-Chain | Storage |
|---------|--------------|---------|
| Streaks | Bounty spec: "Streaks are a frontend-only feature" | `user_stats` table — current/longest streak, freezes, last activity |
| Community posts | Social features — no on-chain equivalent | `community_posts` table — posts, replies, tags, likes |
| Testimonials | User-generated content with admin curation | `testimonials` table — users submit, admin approves for landing page |
| Daily challenges | Quiz pool managed by admin | `daily_challenges` + `daily_challenge_completions` tables |
| Newsletter | Email subscriptions | `newsletter_subscribers` table |
| User profiles | Extended user data beyond on-chain identity | `profiles` table — username, bio, avatar, social links, preferences |
| XP transaction log | Off-chain mirror for fast leaderboard queries | `xp_transactions` table — synced from on-chain via Helius |

### Content (Sanity CMS)

Course content is managed in Sanity CMS — not hardcoded, not static JSON files. All content is editable by course creators without code changes.

### Testimonials — User-Submitted, Admin-Curated

Even testimonials are real user-generated content, not hardcoded:

```
User visits site → "Share your experience" → Submits testimonial (quote + role)
    │
    └── Stored in Supabase `testimonials` table (featured = false)
            │
            └── Admin reviews at /admin → Testimonials tab
                    ├── Approve → Sets featured = true, assigns featured_order
                    └── Reject → Remains hidden

Landing page queries: WHERE featured = true ORDER BY featured_order
```

No seed data, no placeholder content. The landing page testimonials section shows real user submissions that have been admin-approved.

---

## Frontend Architecture

### Framework

Next.js 16 with App Router.

- Server Components for data fetching — courses, profiles, leaderboard
- Client Components for interactivity — wallet connection, code editor, forms
- Route groups under `[locale]/` for i18n (en, pt-BR, es)
- 30+ API Route Handlers in `app/api/`

### Component Structure

```
components/
├── auth/          # SignInModal, UserMenu
├── creator/       # Course wizard steps, lesson editor
├── dashboard/     # AchievementGrid, DailyChallenge, CredentialClaimBanner
├── layout/        # Header, Footer, LocaleSwitcher, WalletLinkBanner, ThemeToggle
├── providers/     # SessionProvider, ThemeProvider, AnalyticsProvider,
│                  # OnboardingGuard, SolanaWalletProvider
└── ui/            # Shadcn/ui primitives (button, card, dialog, etc.)
```

### Provider Hierarchy

```
RootLayout (GA4 scripts)
  └── [locale]/layout.tsx
      └── SessionProvider (NextAuth)
          └── SolanaWalletProvider (@solana/wallet-adapter)
              └── ThemeProvider (3 themes: light, dark, brasil)
                  └── AnalyticsProvider (PostHog init, page views, sign-in tracking)
                      └── OnboardingGuard (redirects new users to /onboarding)
                          └── Page Content
```

---

## Data Flows

### Authentication Flow

```
User clicks Sign In
    ├── Google OAuth  → NextAuth callback → Supabase profile upsert
    ├── GitHub OAuth  → NextAuth callback → Supabase profile upsert
    └── Wallet (SIWS) → Sign message → NextAuth credentials → Link to existing account

Session contains: userId, walletAddress, isAdmin, onboarded flags
JWT shared between NextAuth and Hono backend (same AUTH_SECRET)
```

Account linking: users can sign up with any method and link additional providers later. Wallet linking is required for on-chain operations. Multi-provider logic lives in `lib/auth/account-linking.ts`.

### Course Content Flow

```
Sanity CMS (content source of truth)
    │
    ├── Content entry via:
    │   ├── Sanity Studio (superteam-academy.sanity.studio)
    │   └── Creator Dashboard (/creator) → writes to Sanity via API
    │
    ├── GROQ queries via sanityClient
    │   ├── getCourseCards()       → course catalog
    │   ├── getCourseBySlug()      → course detail with modules/lessons
    │   └── getLessonByIdAsync()   → lesson content + challenge data
    │
    └── Sanity Webhook → /api/webhooks/sanity → revalidate cache
```

### Lesson Completion Flow

```
Learner completes lesson → Frontend calls /api/progress
    │
    ├── Content lesson: mark complete in local state
    │
    └── Challenge lesson:
        1. User writes code in Monaco Editor
        2. Frontend calls /api/challenges/run-rust (or /run for TS)
        3. Code transpiled + tests executed server-side
        4. Results returned (pass/fail per test case)
        5. On pass → call /api/progress (which calls Hono backend)
               └── Backend: validate JWT
                         → build Anchor transaction
                         → backendSigner signs
                         → submit to Solana
                         ├── complete_lesson instruction (marks bitmap, mints XP)
                         └── If all lessons done → auto-triggers finalize_course
```

### Credential Issuance Flow

```
Course finalized → "Collect Credential" banner appears
    │
    └── User clicks → /api/credentials/collect
            └── Frontend service → Hono backend
                    ├── Check: course finalized? wallet linked?
                    ├── If first credential for track:
                    │       issue_credential → mint Metaplex Core NFT
                    └── If existing credential:
                            upgrade_credential → update attributes in place
                    NFT: soulbound, frozen, track/level/XP attributes on-chain
```

### Leaderboard Sync Flow

```
Vercel Cron (daily) → /api/leaderboard/sync
    │
    └── HeliusSyncService.syncLeaderboardWithOnchainData()
            ├── Helius DAS API → get XP token transactions
            ├── Parse instruction type → determine XP source
            │       (lesson, course, achievement, etc.)
            ├── Upsert xp_transactions in Supabase (deduped by tx_signature)
            └── Leaderboard queries aggregate xp_transactions by timeframe
```

---

## Service Layer

17 service files implement clean interfaces defined in `services/interfaces.ts`. All services are dependency-injected, allowing future swap from Supabase-backed to fully on-chain implementations.

| Service | Implementation | Data Source |
|---------|---------------|-------------|
| ProfileService | SupabaseProfileService | Supabase profiles table |
| GamificationService | SupabaseGamificationService | Supabase user_stats + on-chain achievements |
| LeaderboardService | SupabaseLeaderboardService | Supabase xp_transactions (synced from chain) |
| CredentialService | HeliusCredentialService | Helius DAS API (on-chain NFTs) |
| OnChainProgressService | BackendSignerOnChainProgressService | Hono backend → Solana |
| CommunityService | SupabaseCommunityService | Supabase community_posts |
| AchievementCheckerService | SupabaseAchievementCheckerService | On-chain enrollment PDAs + rules |
| OnboardingService | SupabaseOnboardingService | Supabase profiles |
| TrackService | Sanity + on-chain | Sanity CMS + enrollment PDAs |
| AvatarService | SupabaseAvatarService | Supabase Storage |
| NewsletterService | SupabaseNewsletterService | Supabase newsletter_subscribers |
| TestimonialService | SupabaseTestimonialService | Supabase testimonials |

---

## State Management

No global state library. React patterns only:

- **Server Components** for initial data fetch (static or ISR)
- **React hooks** for client-side state (11 custom hooks listed below)
- **useEffect + local state** for API-driven data (SWR-like, without the library)
- **Context** only for cross-cutting concerns: theme, auth, analytics, wallet

### Custom Hooks

| Hook | Purpose |
|------|---------|
| useProgress | Lesson completion state per course |
| useStreak | Streak data + freeze consumption |
| useProfile | User profile + stats |
| useOnchainProgress | Lesson/course completion via backend |
| useEnrollment | Enrollment PDA data |
| useBulkEnrollments | Batch enrollment fetching |
| useCoursesCompleted | Completed courses + credentials |
| usePlayerStats | On-chain XP, level, rank |
| useLeaderboard | Leaderboard data by timeframe |
| useWalletLink | SIWS wallet connection |
| useProgramEvents | Real-time on-chain event listening |

---

## Backend Architecture

### Why a Separate Backend?

The on-chain program requires a `backend_signer` keypair to authenticate lesson completion, XP minting, and credential issuance. That keypair must:

1. Never be exposed to the frontend
2. Remain loaded in memory — no cold-start delay between requests
3. Maintain a persistent Solana RPC connection
4. Hold a consistent Anchor program instance for transaction building

**Why Railway and not Vercel?** Vercel serverless functions have cold starts, 10–60 second timeouts, and no persistent memory. Railway provides always-on containers that satisfy all four requirements above.

### Request Flow

```
Frontend (Next.js API route)
    │
    ├── Attach JWT from NextAuth session (Authorization: Bearer <token>)
    │
    └── POST to Hono backend
            │
            ├── auth.ts middleware: jose.jwtVerify() against AUTH_SECRET
            │
            ├── Route handler: validate request body, fetch on-chain state
            │
            ├── Build Anchor transaction with program.methods.<instruction>()
            │
            ├── backendSigner (or authoritySigner) signs transaction
            │
            ├── Submit via connection.sendRawTransaction()
            │
            └── Return { success, signature, ... }
```

### API Endpoints

**Learner operations** — signed by backendSigner:

| Method | Path | Description |
|--------|------|-------------|
| POST | /complete-lesson | Mark lesson complete, mint XP, auto-finalize course when all lessons done |
| POST | /finalize-course | Award bonus XP to learner + creator reward |
| POST | /issue-credential | Create soulbound Metaplex Core NFT |
| POST | /upgrade-credential | Update existing credential attributes in place |
| POST | /reward-xp | Mint arbitrary XP (requires MinterRole) |
| POST | /award-achievement | Award achievement NFT + XP |

**Admin operations** — signed by authoritySigner:

| Method | Path | Description |
|--------|------|-------------|
| POST | /create-course | Create Course PDA |
| POST | /update-course | Update Course account fields |
| POST | /admin/create-track-collection | Create Metaplex Core collection for a track |
| POST | /admin/create-achievement-type | Create AchievementType PDA + collection |
| POST | /admin/deactivate-achievement-type | Deactivate achievement type |

**Read-only**:

| Method | Path | Description |
|--------|------|-------------|
| GET | /credential-metadata | Metaplex JSON metadata endpoint |
| GET | /track-stats | Track-level learner stats |
| GET | /health | Health check |

### Security Model

- JWT validated on every request using the same `AUTH_SECRET` as NextAuth
- CORS restricted to `APP_ORIGIN`
- Keypairs are never returned in responses — backend only uses them to sign specific program instructions
- Token-2022 ATAs are auto-created when needed; backend pays rent

---

## Database Schema

Supabase — 11 tables with Row Level Security enabled on all tables.

```
profiles ──────────── accounts (1:N, multi-provider auth)
    │
    ├── user_stats (1:1, streaks + cached XP)
    │
    ├── community_posts (1:N)
    │   └── post_likes (N:M)
    │
    ├── xp_transactions (1:N, synced from on-chain)
    │
    ├── daily_challenge_completions (1:N)
    │
    ├── testimonials (1:N)
    │
    └── newsletter_subscribers

daily_challenges (admin-managed pool)
system_config (key-value store for sync state)
```

Key indexes:
- GIN index on tags columns
- B-tree index on `xp_transactions(transaction_at)` for time-range leaderboard queries
- Composite unique constraint on `(tx_signature, user_id)` for deduplication

---

## CMS Architecture

Sanity CMS — 5 document types, hosted Studio at [superteam-academy.sanity.studio](https://superteam-academy.sanity.studio/).

| Document | Key Fields |
|----------|-----------|
| course | courseId (max 32 chars, used as PDA seed), title, description, difficulty, track ref, instructor ref, modules[], tags, XP config, submissionStatus |
| module | title, description, order, lessons[] |
| lesson | title, type (content or challenge), duration, portable-text content, challenge data (prompt, starterCode, testCases, hints) |
| instructor | name, bio, avatar, social links |
| track | name, slug, description, color, collectionAddress (Metaplex Core collection pubkey) |

Content can be managed through two interfaces:
- **Sanity Studio** (hosted) — direct CMS editing at [superteam-academy.sanity.studio](https://superteam-academy.sanity.studio/)
- **Creator Dashboard** (`/creator`) — in-app course creation wizard tightly integrated with Sanity (bonus feature)

Both interfaces write to the same Sanity dataset and follow the same publishing workflow with admin approval. Track management (creating tracks + credential NFT collections) is admin-only, available at `/admin` -> Tracks tab.

See [CMS_GUIDE.md](./CMS_GUIDE.md) for the full content management guide.

---

## On-Chain Integration Points

### PDA Derivation

Shared between frontend, backend, and SDK:

```
Config:               ["config"]
Course:               ["course", courseId]
Enrollment:           ["enrollment", courseId, learner]
MinterRole:           ["minter", minter]
AchievementType:      ["achievement", achievementId]
AchievementReceipt:   ["achievement_receipt", achievementId, recipient]
```

Full PDA derivation examples are in [INTEGRATION.md](./INTEGRATION.md).

### Token-2022 Integration

- XP is a soulbound fungible token: NonTransferable + PermanentDelegate extensions
- Level formula: `floor(sqrt(totalXP / 100))`
- XP balance read via `getTokenAccountBalance` on the learner's ATA
- XP supply (for leaderboard ranking) read via `getMintInfo`

### Metaplex Core Integration

- Credentials are soulbound NFTs locked with PermanentFreezeDelegate
- One NFT per track; upgraded in place when new courses in that track are completed
- On-chain attributes: `track_id`, `level`, `courses_completed`, `total_xp`
- Queried via Helius DAS API (`getAssetsByOwner`) — not from chain directly

### Helius DAS API Usage

| Operation | API Call | Used By |
|-----------|---------|---------|
| Fetch credential NFTs | getAssetsByOwner | Profile, credential views |
| Filter by collection | collection filter on getAssetsByOwner | Track credential matching |
| Sync XP events | Transaction history parsing | Leaderboard sync cron |

---

## Analytics

Triple-layer: GA4, PostHog, and Sentry. Full event inventory is in [ANALYTICS.md](./ANALYTICS.md).

```
trackEvent(name, properties)
    ├── PostHog.capture()     # Product analytics, heatmaps, funnels
    ├── gtag("event", ...)    # GA4 conversions
    └── console.log()         # Development only

Sentry.captureException()     # Error boundaries + catch blocks
```

22 custom events across: navigation, course lifecycle, lesson and challenge interaction, progression and gamification.

---

## Themes

3 themes via CSS custom properties:

| Theme | Background | Primary Accent |
|-------|-----------|----------------|
| Light | White | Green (#2f6b3f) |
| Dark | Zinc dark (#09090B) | Gold (#ffd23f) |
| Brasil | Deep green (#1b231d) | Gold (#ffd23f) |

Both `dark` and `brasil` themes share dark-mode component variants via a custom Tailwind variant:

```css
@custom-variant dark (&:is(.dark *, .brasil *));
```

---

## i18n Architecture

| Property | Value |
|----------|-------|
| Library | next-intl with App Router integration |
| Locales | en, pt-BR, es |
| String count | 795 per locale |
| Route format | /en/courses, /pt-BR/courses, /es/courses |
| Storage | Locale preference stored in Supabase profiles |

All UI strings are externalized in `src/messages/{locale}.json`. The language switcher is in the header. Locale-aware navigation utilities are shared with Playwright tests.

---

## Performance

| Technique | Applied To |
|-----------|-----------|
| Server Components | Course pages, landing page, leaderboard |
| Dynamic imports | Monaco Editor, Recharts charts |
| Sanity CDN + next/image | All course and instructor images |
| Code splitting | Per-route automatic via App Router |
| Optimized package imports | lucide-react, recharts |
| Static generation | Landing page, public course catalog |

Lighthouse reports are in `docs/`:
- `LighthouseReportLandingPage.html`
- `LighthouseReportCoursesPage.html`
- `LighthouseReportLeaderboardPage.html`

---

## Testing

**234 test cases** across 13 Playwright test files, covering all critical user flows:

| Test File | Area | Coverage |
|-----------|------|---------|
| `auth.spec.ts` | Auth | Google OAuth, GitHub OAuth, wallet SIWS, account linking |
| `courses.spec.ts` | Courses | Catalog browsing, filtering, enrollment |
| `lessons.spec.ts` | Lessons | Content lessons, challenge editor, code execution, completion |
| `dashboard.spec.ts` | Dashboard | Stats display, course progress, activity feed |
| `leaderboard.spec.ts` | Leaderboard | All timeframes, rank display, course filtering |
| `profile.spec.ts` | Profile | Profile viewing, editing, wallet link |
| `settings.spec.ts` | Settings | Preference changes, account management |
| `community.spec.ts` | Community | Post creation, filtering, liking, replies |
| `gamification.spec.ts` | Gamification | XP display, level, achievement unlock, streaks |
| `i18n.spec.ts` | i18n | Locale switching between en, pt-BR, es |
| `admin.spec.ts` | Admin | Admin page access, tab navigation, course management |
| `error-handling.spec.ts` | Errors | 404/500 error pages, unauthorized access |
| `landing.spec.ts` | Landing | Hero, CTAs, testimonials, navigation |

Tests run across multiple browser viewports (desktop Chrome, mobile Chrome) for responsive coverage. Test helpers in `e2e/helpers.ts` provide locale-aware navigation utilities shared across all test files.

---

## Related Documentation

| Document | Contents |
|----------|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | On-chain program account map, CU budgets, PDA scheme |
| [SPEC.md](./SPEC.md) | Full program specification, all 16 instructions, 26 error variants |
| [INTEGRATION.md](./INTEGRATION.md) | Frontend integration guide, PDA derivation, instruction examples |
| [ANALYTICS.md](./ANALYTICS.md) | Full event inventory, PostHog and GA4 setup |
| [SETUP_ENV.md](./SETUP_ENV.md) | Environment variable reference for frontend and backend |
