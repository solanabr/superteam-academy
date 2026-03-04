# Architecture

## Monorepo Layout
- `app/` Next.js frontend (primary submission surface)
- `backend/` optional backend workspace (not required for core on-chain enrollment flow)
- `docs/` architecture/checklists/build logs
- `onchain-academy/` Anchor program source in upstream repo context

## Frontend Architecture (`app/`)

### Rendering Model
- App Router with locale segment: `app/src/app/[locale]/...`
- Public routes: landing, courses, leaderboard, public profile
- Guarded routes: dashboard, settings, private profile
- Root i18n middleware/proxy in `app/src/proxy.ts`

### Data & Service Layers
1. On-chain read hooks
- `useCourses`, `useEnrollment`, `useXpBalance`, `useCredentials`
- Anchor/web3 read paths, Token-2022 XP reads, DAS credential reads

2. Content layer
- `ContentService` uses Sanity if configured
- Fallback to local content JSON in `src/content`
- Lesson pipeline supports optional `videoUrl`

3. Auth/identity layer
- NextAuth (Google/GitHub) in `api/auth/[...nextauth]`
- Wallet auth via Solana Wallet Adapter
- `IdentityProfileService` for onboarding/profile completion
- `PublicProfileService` for `/profile/[username]` snapshots

4. Progress/gamification layer
- On-chain XP/enrollment where available
- Demo/stub storage abstractions for non-finalized program flows
- Achievements/streak UI backed by local/demo data contracts

### Security Controls
- Wallet action proof validation for protected write APIs
- Same-origin checks on sensitive POST endpoints
- Production diagnostics token gating
- Security headers + CSP report-only mode in `next.config.ts`
- Rate limit utility with Upstash support + bounded local fallback

### API Surface (Next.js route handlers)
- `POST /api/complete-lesson`
- `POST /api/finalize-course`
- `POST /api/issue-credential`
- `GET /api/leaderboard`
- `GET /api/signing-mode`
- `GET /api/cms-status`
- `GET /api/integration-status`
- `POST /api/sentry-test`

## Key User Flows
1. Course enrollment
- Learner clicks enroll on course detail
- Client builds/sends wallet-signed Anchor enroll tx directly
- Enrollment state revalidated via query invalidation

2. Lesson completion
- Challenge executed in sandboxed worker
- On submit, client sends wallet-signed action proof to backend
- Backend validates proof + enrollment + lesson bitmap, then submits tx (or stub path)

3. Finalize and credential
- Finalize/claim use wallet-signed action proofs
- Credentials rendered from DAS and/or stub fallback

4. Public profile
- Private profile editable at `/[locale]/profile`
- If public enabled, snapshot published to `/[locale]/profile/[username]`

## Internationalization
- `messages/en.json`, `messages/pt-BR.json`, `messages/es.json`
- `next-intl` routing and navigation wrappers
- Root html `lang` follows active locale cookie

## Observability
- GA4 + Clarity scripts in root layout (validated IDs)
- Sentry client/server/edge setup
- Readiness endpoint + env audit script for deployment checks

## Performance Strategy
- Lazy/deferred heavy UI (Monaco/editor surfaces)
- Route-level split architecture
- Mobile overflow checks + Lighthouse audit scripts

## Known Deferred Items
- Deployed provider verification (OAuth/analytics/Sentry/CMS)
- Final Lighthouse/CWV evidence refresh on unrestricted environment
