# Win Strategy: Superteam Academy Bounty

## Goal

Close all competitive gaps and add killer differentiators to guarantee a winning submission against 20 competitors before the March 5, 2026 deadline.

## Context

After analyzing all 20 PRs on `solanabr/superteam-academy`, the top competitors are:
- **#29 TheAuroraAI** — 19 pages, 459 tests, 611 i18n keys, 23 API routes, CSP headers, server quiz validation, RBAC, JSON-LD
- **#40 krishvsoni** — AI chatbot (Lyzr), 75 practice challenges, SOL bounties on forum, MongoDB, Arweave/Irys

Our submission (#39) is top 2-3 but has gaps in: CSP, server quiz validation, JSON-LD, CI breadth, AI features, API route count.

## Strategy: Close Gaps + Killer Differentiators

### Phase 1: Critical Gap Closers (Day 1)

**1A. CSP + Security Headers**
- Add `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` via `next.config.ts`
- Allow: Helius RPC, Solana wallets, analytics, Sanity, Arweave
- Impact: Code Quality (25%)

**1B. Server-Side Quiz Validation**
- `POST /api/quiz/validate` — answer keys in `lib/quiz-keys.ts` with `import 'server-only'`
- Client sends `{ courseId, lessonIndex, answers }`, server validates
- Rate-limited per wallet
- Impact: Code Quality (25%) + Feature Completeness (25%)

**1C. JSON-LD Structured Data**
- `EducationalOrganization` on landing page
- `Course` schema on course detail pages
- `BreadcrumbList` on catalog
- Impact: Performance/SEO (15%)

**1D. CI/CD Pipeline Expansion**
- Split into 4 parallel jobs: TypeScript, ESLint, Build, Vitest
- Add Playwright E2E workflow
- Impact: Code Quality (25%)

### Phase 2: Killer Differentiators (Day 2-3)

**2A. AI-Powered Code Hints**
- "Get AI Hint" button in Monaco editor (lessons + challenges)
- `POST /api/ai/hint` — sends code + challenge context to Claude API
- Returns contextual hint (not solution), rate-limited (3/challenge/wallet)
- Streaming response for UX
- Env var: `ANTHROPIC_API_KEY` (optional — graceful fallback)
- Impact: Feature Completeness (25%) + UI/UX (20%)

**2B. API Routes Expansion (8 → 15+)**
- `GET /api/search?q=` — full-text search
- `GET/POST /api/courses/[slug]/reviews` — star ratings
- `GET /api/notifications` — user feed
- `GET /api/stats` — platform statistics
- `GET /api/profile/[wallet]` — public profile data
- `POST /api/challenges/submit` — challenge submissions
- `GET /api/courses` — paginated listing
- Impact: Feature Completeness (25%) + Code Quality (25%)

**2C. On-Chain Achievement Claiming UI**
- Wire `claim_achievement` Anchor instruction in dashboard
- User clicks "Claim" → wallet signs → soulbound NFT minted
- Show tx signature + Solana Explorer link
- Impact: Feature Completeness (25%) + Bonus (5%)

**2D. Arweave Content Storage**
- Upload course content via Irys SDK
- Store tx IDs in seed data
- Show "Stored on Arweave" badge on course detail
- Link to `arweave.net/{txId}`
- Impact: Feature Completeness (25%) + Bonus (5%)

### Phase 3: Polish & Ship (Day 4)

- Update all 3 i18n locales with new feature keys
- Write tests for new features
- Update README badges and PR body
- Re-run full E2E verification
- Update screenshots if needed
- Final production deployment

## Evaluation Criteria Coverage

| Criteria (Weight) | Before | After |
|---|---|---|
| Code Quality (25%) | Strong (zero any, rate limiting) | +CSP, +server quiz validation, +CI/CD |
| Feature Completeness (25%) | 10 pages + 8 bonus | +AI hints, +API routes, +achievement claiming, +Arweave |
| UI/UX (20%) | Strong (SVG thumbnails, responsive) | +AI hint UX in editor |
| Performance (15%) | Lighthouse 100 desktop | +JSON-LD SEO |
| Documentation (10%) | 8 docs | Updated with new features |
| Bonus (5%) | 8 bonus features | +AI integration, +real Arweave |

## Execution Order

Day 1: 1A → 1B → 1C → 1D (all parallelizable)
Day 2: 2B → 2A (API routes first, then AI hints which uses new API pattern)
Day 3: 2C → 2D (on-chain work)
Day 4: Phase 3 polish
