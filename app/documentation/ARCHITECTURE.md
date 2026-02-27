# Superteam Academy App — Architecture

This document describes the architecture of the `app` package only.
It is intentionally separate from the root-level `docs/ARCHITECTURE.md` (which focuses on the on-chain program and protocol-level design).

## 1) System Architecture

The app is a Next.js App Router application with:

- UI rendering (marketing + dashboard)
- API routes (server-side orchestration)
- MongoDB persistence
- Solana read/write integration points
- CMS integration (Sanity)
- analytics + monitoring + PWA capabilities

### High-level Runtime Topology

```text
Browser (React/Next client)
  ├─ Auth + Wallet Providers
  ├─ Dashboard / Courses / Profile / Certificates / Leaderboard UI
  └─ Calls Next.js API routes

Next.js Server (App Router + Route Handlers)
  ├─ NextAuth session + account linking
  ├─ MongoDB models/services
  ├─ Solana integration helpers (program client, PDA derivation)
  ├─ Indexer abstraction (custom / helius / alchemy)
  ├─ Credential verification service (Metaplex Core-aware)
  └─ Sanity API client usage where needed

External Dependencies
  ├─ Solana RPC (custom, Helius RPC, or Alchemy RPC)
  ├─ Helius DAS API (asset / credential queries)
  ├─ Sanity Content Lake + Studio
  ├─ OAuth providers (Google/GitHub)
  └─ Observability (Sentry, GA4, PostHog)
```

## 2) Package Structure and Responsibilities

### `src/app`

- App Router routes and layouts.
- Contains marketing pages, dashboard pages, and all API route handlers (`src/app/api/**`).
- Dashboard pages consume API endpoints and provider hooks.

### `src/components`

- UI and feature components grouped by domain:
  - `dashboard`, `editor`, `gamification`, `settings`, `onboarding`, etc.
- Global providers for auth, wallet, analytics, and service worker.

### `src/lib`

- Core runtime integrations and helpers:
  - `auth.ts` (NextAuth config)
  - `mongodb.ts` (database connection)
  - `solana/**` (program config, PDAs, program client, indexer abstraction)
  - `services/**` (credential verification, XP indexing, Solana XP)
  - `sanity/**` (CMS client and configuration)

### `src/services`

- Application-facing service interfaces and implementations.
- Includes `learning-progress.ts` with swappable provider implementations:
  - local storage mode
  - on-chain/API-backed mode

### `src/models`

- Mongoose models for users, enrollments, progress, certificates, achievements, indexer settings, etc.

### `src/hooks`

- Client hooks for auth, gamification, translations, wallets, and on-chain program data.

## 3) Component Structure (UI Layer)

### Global Providers

The root layout composes providers for:

- session/auth state
- wallet state and connect flows
- analytics events
- theme and i18n
- service worker registration behavior

### Dashboard Composition

Dashboard pages follow feature-sliced composition:

- route-level page requests API data
- domain components render stateful widgets
- user actions call route handlers
- updates are reflected through re-fetch / hook refresh

### Certificates/Credentials UI

- Certificate detail page shows course + recipient + NFT metadata fields.
- On-chain verification and ownership check use API route handlers.
- Explorer links and metadata links are surfaced in the UI.

## 4) Data Flow

## 4.1 Auth and Session

1. User signs in via wallet, Google, or GitHub.
2. NextAuth callback/session normalization enriches session context.
3. Protected routes validate session and onboarding state.
4. Dashboard APIs use session identity to load user-scoped data.

## 4.2 Dashboard/Profile Data

1. Client requests `/api/dashboard` or `/api/profile`.
2. API handler loads user + enrollments + achievements from MongoDB.
3. XP indexing services reconcile off-chain and on-chain XP when available.
4. Response is normalized for UI widgets.

## 4.3 Course Progress and Lesson Completion

- Service contract: `ILearningProgressService`.
- `local` provider stores and reads from local storage.
- `onchain` provider maps calls to API routes and Solana helpers.

Typical completion path (`onchain` mode):

1. UI invokes `completeLesson(userId, courseId, lessonId)`.
2. On-chain provider resolves wallet and calls `/api/lessons/complete`.
3. API route validates enrollment and signs backend tx as configured signer.
4. Solana instruction is submitted; UI refreshes progress.

## 4.4 Leaderboard Flow

Default path:

1. UI calls `/api/leaderboard/onchain` for default all-time/all-courses view.
2. Active indexer provider fetches rankings:
   - `custom`: direct RPC scanning
   - `helius`: Helius-backed indexed calls
   - `alchemy`: Alchemy-backed RPC/indexed path
3. If unavailable or non-default filters are used, UI/API falls back to DB-backed leaderboard endpoints.

## 4.5 Credential Display and Verification

1. UI requests certificate data from `/api/certificates/:id`.
2. Verification endpoint `/api/certificates/:id/verify` performs on-chain checks.
3. Credential verification service resolves active provider configuration and validates asset existence/ownership with Metaplex Core-aware logic.

## 5) Service Interfaces and Swappability

## 5.1 Learning Progress Interface

`ILearningProgressService` exposes these methods:

- `getProgressForUserCourse`
- `getAllUserProgress`
- `completeLesson`
- `getXPBalance`
- `awardXP`
- `getStreakData`
- `recordDailyActivity`
- `getLeaderboardEntries`
- `getCredentials`
- `getCredentialById`
- `getAchievements`
- `getUnlockedAchievements`

Provider selection:

- `NEXT_PUBLIC_PROGRESS_SERVICE_MODE=local|onchain`
- singleton exported through `createLearningProgressService()`

This enables replacing local-storage stubs with on-chain/API implementation without changing consumer components.

## 5.2 Indexer Abstraction

Leaderboard/indexed queries are behind provider interface(s):

- `CustomRpcIndexer`
- `HeliusIndexer`
- `AlchemyIndexer`

Active provider is selected from persisted indexer settings and/or env fallbacks.

## 5.3 Solana Integration Facade

`src/lib/solana` provides:

- program constants (Program ID, XP mint, Token-2022, MPL Core)
- PDA derivation helpers
- account read/parse helpers
- transaction builders for learner-signed actions
- Helius client for credential/asset query flows

## 6) On-Chain Integration Points

This app maps to the on-chain workflow documented in root docs (`SPEC.md` and `INTEGRATION.md`) through these integration points:

- enroll flow: learner-signed transaction construction
- lesson completion: backend-signed instruction route
- finalize course / issue credential / upgrade credential: backend-signed route handlers
- XP balance reads: Token-2022 account lookup services
- credential verification: Metaplex Core asset-aware verification path

## 7) API Layer Design

API routes are grouped by domain:

- auth/account linking
- courses and enrollments
- lessons/challenges
- dashboard/profile
- leaderboard/gamification
- certificates/credentials
- admin-premium controls

Patterns used:

- request validation + session checks
- service/model orchestration in handlers
- normalized response payloads for UI
- graceful fallbacks when external providers fail

## 8) Configuration and Environment Strategy

Key principles:

- env-first configuration for Program ID / XP mint / RPC endpoints
- provider-aware indexer configuration (custom/helius/alchemy)
- separate server-only secrets for backend signer and sensitive integrations
- optional feature flags for service mode and observability

## 9) Non-Functional Concerns

### Caching/PWA

- Service worker is registered in production.
- dev mode unregisters SW and clears related caches to avoid stale behavior.

### Observability

- Sentry for error monitoring.
- GA4/PostHog for analytics.

### Security

- backend signer required for privileged on-chain writes.
- session checks enforced in protected API routes.
- wallet ownership checks for credential verification routes.

## 10) Current Boundaries and Evolution

Current architecture intentionally supports incremental migration:

- local-storage compatible service interfaces remain available for MVP/dev workflows.
- on-chain/API implementations are now pluggable through the same interfaces.
- indexer provider abstraction allows switching infrastructure without changing UI contracts.

Planned evolution should continue preserving these stable contracts while improving internal implementations.
