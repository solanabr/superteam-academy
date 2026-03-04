# Architecture

## 1. System Architecture

This app is a Next.js App Router frontend that combines four integration planes:

1. Browser wallet + on-chain reads/writes (Anchor/Web3)
2. BFF proxy routes (`/api/*`) to backend academy/admin services
3. Direct Postgres access for community (Prisma)
4. Content and challenge metadata from Sanity

High-level topology:

```text
Browser UI
  -> Next.js App Router (pages + components + hooks)
    -> Direct chain access (wallet-signed) via Anchor program client
    -> /api/academy/* and /api/admin/* proxy to backend service
    -> /api/challenges/* proxy to backend challenge endpoints
    -> /api/community/* direct Prisma/Postgres queries
    -> /api/credentials* and /api/leaderboard use Helius DAS/RPC
    -> Sanity read client for course/challenge content
```

## 2. Application Structure

Core folders:

- `app/app/`:
  - Route groups and pages (`(app)` for wallet-guarded app shell)
  - API routes under `app/app/api/*`
- `app/components/`:
  - `app/*`: authenticated app UI blocks
  - `landing/*`: public landing sections + assessment UI
  - `wallet/*`: wallet connect modal/button
  - `ui/*`: shared UI primitives
- `app/hooks/`:
  - TanStack Query hooks for chain reads, backend mutations, and API fetches
- `app/lib/`:
  - On-chain helpers (`program.ts`, PDA derivation)
  - Service layers (`services/*`) for backend, content, credentials, indexing
  - Community DB access (`community-db.ts`, `prisma.ts`)
- `app/sanity/schema/`:
  - Sanity document/object schemas

Main route groups:

- Public pages: `/`, `/challenges`, `/discussions`, `/profile/[wallet]`
- App shell pages (`app/app/(app)/*`): dashboard, courses, certificates, settings, profile, admin
- Studio route: `/studio` (wallet + admin gated)

## 3. Provider and Runtime Composition

`app/app/layout.tsx` composes providers in this order:

1. Theme provider (`next-themes`)
2. Solana provider (RPC + wallet adapters + custom wallet modal)
3. React Query provider
4. `next-intl` provider
5. Analytics and service worker bootstrap

Notes:

- Wallet auto-connect is enabled in `providers/SolanaProvider.tsx`
- PWA service worker registration happens only in production
- Localized messages are loaded via `i18n/request.ts`

## 4. Data Flow

### 4.1 Wallet and Session Model

- Authentication is wallet-based (no social auth)
- `WalletGuard` gates protected app-shell routes
- Wallet identity (`publicKey`) is the principal id for progress, credentials, and community attribution

### 4.2 Course Enrollment and Learning Progress

- Course content:
  - `content-service.ts` chooses Sanity or mock provider
  - Course and lesson pages consume this content layer
- Enrollment write path:
  - `useEnroll` signs and sends `enroll` instruction directly using wallet
  - On success, it calls `indexEnrollment` via BFF (`/api/academy/index-enrollment`)
- Progress read path:
  - `useEnrollment` fetches enrollment PDA
  - Lesson completion bitmap is decoded in `lib/lesson-bitmap.ts`
- Lesson completion write path:
  - `useCompleteLesson` calls BFF to backend (`/api/academy/complete-lesson`)
  - Backend performs instruction with backend signer context where required

### 4.3 Credentials and Certificates

- Credential issuance/upgrades are backend-driven via `lib/services/backend-api.ts`
- Certificate UI reads wallet assets through API routes (`/api/credentials*`)
- Helius DAS integration in `lib/services/credentials-das.ts`

### 4.4 Challenges

- Challenge metadata and completion status fetched through `/api/challenges`
- Daily challenge pages use challenge slug routes and completion endpoints
- Code challenge evaluation path goes through `/api/challenges/[id]/run-code`
- Completion path uses `/api/challenges/[id]/complete`

### 4.5 Community Discussions

- API routes: `/api/community/threads*`, `/api/community/stats/[wallet]`
- Data storage: Postgres tables (`community_threads`, `community_replies`)
- Access layer: `lib/community-db.ts`
- Prisma client lifecycle: `lib/prisma.ts` caches per `DATABASE_URL` to avoid stale DB bindings

### 4.6 Leaderboard, XP, Achievements

- XP reads combine chain token balances and backend/indexing responses
- Leaderboard route `/api/leaderboard` aggregates and falls back to mock in failure cases
- Achievements admin flows use backend actions (`create-achievement-type`, `award-achievement`, etc.)
- Profile achievements page composes XP, credentials, streak, and community stats into badge progress

## 5. Service Interfaces

## 5.1 Frontend Service Layer (`lib/services/*`)

- `backend-api.ts`:
  - Typed wrappers for `/api/academy/*` actions
  - Handles admin bearer token forwarding and normalized error shape
- `content-service.ts`:
  - Runtime switch between Sanity and mock content
- `sanity-content.ts`:
  - GROQ queries and transformations into `MockCourse` format
- `credentials-das.ts`:
  - Helius DAS reads for credential NFT assets
- `indexing-db.ts`:
  - Indexed stats queries (leaderboard/courses completed)

## 5.2 API Route Layer (`app/app/api/*`)

Grouped responsibilities:

- Backend proxy routes:
  - `/api/academy/[action]`
  - `/api/admin/[action]`
  - `/api/challenges*`
- Community direct DB routes:
  - `/api/community/threads`
  - `/api/community/threads/[id]`
  - `/api/community/threads/[id]/replies`
  - `/api/community/stats/[wallet]`
- Credentials/leaderboard/routes:
  - `/api/credentials`
  - `/api/credentials/asset`
  - `/api/leaderboard`
  - `/api/credential-collections`
- Sanity helper routes:
  - `/api/sanity/create-*-stub` (admin JWT protected)

## 6. On-chain Integration Points

Defined in `lib/program.ts`:

- Program ID from IDL (`onchain_academy.json`)
- PDA helpers:
  - `getConfigPda`
  - `getCoursePda`
  - `getEnrollmentPda`
  - `getMinterRolePda`
  - `getAchievementTypePda`
  - `getAchievementReceiptPda`

Primary hook mapping:

- Reads:
  - `useProgram`, `useCourse`, `useEnrollment`, `useConfig`
- Wallet-signed writes:
  - `useEnroll`, `useCloseEnrollment` (where available)
- Backend-mediated writes:
  - `useCompleteLesson`, `useFinalizeCourse`, `useIssueCredential*`, `useCreateAchievementType`, `useAwardAchievement`, `useRegisterMinter`, etc.

## 7. State Management and Caching

- TanStack Query is the primary async state/cache layer
- Query keys are domain-scoped (`enrollment`, `xpBalance`, `leaderboard`, `challenges`, etc.)
- Mutation success handlers invalidate dependent queries to keep UI consistent

## 8. Security and Authorization

- Wallet gating for protected learning surfaces
- Admin-only backend actions enforced in BFF route with JWT verification
- Sanity stub write routes require admin JWT and server-side Sanity token
- Community writes require wallet in UI flow; API also validates payload constraints

## 9. Operational Notes

- Service worker is active only in production (`ServiceWorkerRegister`)
- In development, service workers and caches are aggressively unregistered/cleared
- Prisma client cache is URL-aware to prevent stale connections if `DATABASE_URL` changes during dev runtime
