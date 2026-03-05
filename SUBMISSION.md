# Superteam Academy -- Bounty Submission

A production-grade decentralized learning platform on Solana where learners enroll in courses, earn soulbound XP tokens (Token-2022), receive Metaplex Core credential NFTs, collect 41 achievement badges, and compete on a global leaderboard -- all with progress recorded on-chain. Built for the Superteam Brazil bounty with full Portuguese (pt-BR), English, and Spanish localization.

---

## Live Demo

> **App:** [https://superteam-academy.vercel.app](https://superteam-academy.vercel.app)
>
> **On-chain Program (Devnet):** [`ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf`](https://explorer.solana.com/address/ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf?cluster=devnet)

---

## Architecture

```
                           +-------------------+
                           |  Sanity CMS (v5)  |
                           |  (course content) |
                           +--------+----------+
                                    |  GROQ
                                    v
+----------+    Next.js 16 App Router (React 19)    +----------+
|          |  +------------------------------------+|          |
| Browser  |  |  [locale]/page.tsx  (ISR)          ||  Helius  |
| -------  |  |  [locale]/courses/[slug]/...       ||  DAS API |
| Phantom  |  |  [locale]/dashboard/               |+--->------+
| Solflare |  |  [locale]/leaderboard/             |     |
| Coinbase |  |  [locale]/profile/                 |     | getAssetsByOwner
| Ledger   |  |  [locale]/certificates/            |     | getTokenAccounts
| Trust    |  |  [locale]/challenges/              |     v
| Backpack |  +----+-----------+-------------------+  +---------+
|          |       |           |                      | Solana  |
+----+-----+       |    API Routes                    | Devnet  |
     |             |    (/api/progress/*)              |         |
     |  signMessage|    (/api/chat)                    | Program |
     |             |    (/api/helius/*)                 | Account |
     |             v                                   | PDAs    |
     |      +------+--------+                          +---------+
     |      | NextAuth v5   |                               ^
     |      | Google OAuth  |                               |
     |      | GitHub OAuth  |                               |
     |      | Solana Wallet +--- nacl.sign.detached.verify  |
     |      | (Credentials) |                               |
     |      +------+--------+                               |
     |             |                                        |
     +-------------+--- BackendSignerService ---------------+
                        (completeLesson, finalizeCourse,
                         issueCredential, awardAchievement)

Analytics: GA4 | PostHog | Sentry | Microsoft Clarity
State:     Zustand stores (progress, activity, bookmarks, notifications)
AI:        Anthropic Claude API (Solana learning chatbot)
```

---

## Required Pages Checklist

All 10 required pages are implemented as locale-prefixed routes under `src/app/[locale]/`:

| # | Page | Route | Status |
|---|------|-------|--------|
| 1 | Landing / Home | `/[locale]/` | Implemented (LandingOption_E.tsx, ISR) |
| 2 | Course Catalog | `/[locale]/courses` | Implemented (filterable grid, track/difficulty) |
| 3 | Course Detail | `/[locale]/courses/[slug]` | Implemented (syllabus, enroll button, progress) |
| 4 | Lesson View | `/[locale]/courses/[slug]/lessons/[lessonSlug]` | Implemented (tab-based: Lesson + Code Challenge) |
| 5 | Dashboard | `/[locale]/dashboard` | Implemented (XP, progress, activity heatmap, streaks) |
| 6 | Leaderboard | `/[locale]/leaderboard` | Implemented (Helius DAS, ISR cached) |
| 7 | Profile | `/[locale]/profile` | Implemented (wallet, credentials, achievements) |
| 8 | Certificates | `/[locale]/certificates` | Implemented (Metaplex Core NFT viewer, OG image) |
| 9 | Code Challenges | `/[locale]/challenges` | Implemented (self-hosted Monaco editor) |
| 10 | Settings | `/[locale]/settings` | Implemented (locale, theme, notifications) |

**Bonus pages:** Auth sign-in (`/auth/signin`), Onboarding quiz (`/onboarding`), Community (`/community`), Admin (`/admin`), Offline (`/offline`), Sanity Studio (`/studio`), Certificate detail (`/certificates/[id]`), Public profile (`/profile/[username]`)

---

## Bonus Features

| Feature | Implementation | Files |
|---------|---------------|-------|
| AI Chatbot | Anthropic Claude API for Solana Q&A with built-in knowledge base fallback, rate-limited (20/min) | `src/app/api/chat/route.ts` |
| Command Palette | Cmd+K global search, keyboard shortcut framework | `src/hooks/useKeyboardShortcuts.ts`, `src/components/ui/KeyboardShortcutsDialog.tsx` |
| Notification Center | Real-time dropdown with achievement, streak, XP, level-up notifications | `src/components/notifications/NotificationCenter.tsx`, `src/stores/notification-store.ts` |
| Self-Hosted Monaco | CDN-independent code editor (80+ language bundles at `/public/monaco/vs/`) | `public/monaco/vs/` |
| Activity Heatmap | GitHub-style contribution heatmap on dashboard | `src/stores/activity-store.ts` |
| Certificate OG Image | Dynamic `og:image` generation for credential sharing | `src/app/api/og/certificate/route.tsx` |
| PWA / Offline | Service worker registration, offline page | `src/components/pwa/ServiceWorkerRegistration.tsx`, `src/app/[locale]/offline/page.tsx` |
| Sitemap + Robots | Auto-generated SEO files | `src/app/sitemap.ts`, `src/app/robots.ts` |

---

## Security Advantages

This is the critical differentiator. Many competing submissions skip wallet signature verification entirely.

### Wallet Authentication (3-Layer Verification)

```
src/lib/auth/config.ts -- Credentials provider "solana"
```

1. **Cryptographic signature verification** -- `nacl.sign.detached.verify()` confirms the wallet actually signed the message. Not just "check if signature exists" -- actual Ed25519 verification against the public key bytes.

2. **Wallet address cross-validation** -- The signed message embeds `Wallet: <base58>` and the server verifies this matches the claimed `publicKey` parameter. Prevents an attacker from submitting a valid signature from wallet A while claiming to be wallet B.

3. **Timestamp expiry window** -- Messages include `Timestamp: <epoch_ms>`. Server rejects signatures older than 5 minutes. Prevents replay attacks.

### Session Security

| Protection | Implementation |
|-----------|----------------|
| PKCE code verifier | `__Secure-authjs.pkce.code_verifier` (httpOnly, sameSite: lax) |
| CSRF token | `__Secure-authjs.csrf-token` (httpOnly, sameSite: lax) |
| Secure cookies | Auto-enabled in production (prefix `__Secure-`) |
| JWT sessions | Stateless, no server-side session store required |
| Rate limiting | In-memory token bucket (`src/lib/rate-limit.ts`) on all API routes |

---

## On-Chain Integration

Full typed Solana integration -- not just "connect wallet and display balance." The frontend mirrors the actual Anchor program data structures.

### Solana Module (`src/lib/solana/`)

| File | Purpose | Lines |
|------|---------|-------|
| `pdas.ts` | PDA derivation for all 6 account types (Config, Course, Enrollment, MinterRole, AchievementType, AchievementReceipt) | 45 |
| `instructions.ts` | Transaction builders: `buildEnrollTx`, `buildCloseEnrollmentTx` | 57 |
| `bitmap.ts` | Lesson progress bitmap decoding (u64[] -> per-lesson boolean), matches on-chain `lesson_flags` | 34 |
| `queries.ts` | Account fetchers with typed deserialization via BorshCoder | 133 |
| `typed-program.ts` | Type-safe Anchor program wrapper (zero `as any` in consuming code) | 91 |
| `events.ts` | Real-time on-chain event listener (LessonCompleted, CourseFinalized, CredentialIssued, etc.) | 217 |
| `helius.ts` | Helius DAS API integration for credential queries + XP leaderboard | -- |
| `constants.ts` | Program ID, XP mint, RPC URL, Token-2022 program ID | -- |

### Bitmap-Based Lesson Progress

The on-chain program stores lesson completion as a `u64[]` bitmap. Our frontend decodes this directly:

```typescript
// src/lib/solana/bitmap.ts
export function isLessonComplete(lessonFlags: BNLike[], lessonIndex: number): boolean {
  const wordIndex = Math.floor(lessonIndex / 64);
  const bitIndex = lessonIndex % 64;
  const word = toBigInt(lessonFlags[wordIndex]);
  return (word >> BigInt(bitIndex)) & 1n ? true : false;
}
```

This is tested with 5 dedicated test files (`bitmap.test.ts`, `bitmap-extended.test.ts`, `pdas.test.ts`, `pdas-extended.test.ts`, `queries-extended.test.ts`).

### Transaction Signing Model

| Action | Signer | Flow |
|--------|--------|------|
| Enroll in course | Learner wallet | Direct transaction via `buildEnrollTx()` |
| Complete lesson | Backend signer | API route, learner proves ownership via `signMessage` |
| Finalize course | Backend signer | API route after all lessons complete |
| Issue credential | Backend signer | Metaplex Core NFT mint (soulbound) |
| Award achievement | Backend signer | API route, triggers notification |

---

## Multi-Wallet Support

```typescript
// src/components/wallet/WalletProvider.tsx
const wallets = useMemo(() => [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
  // Backpack auto-detected via Wallet Standard
  new CoinbaseWalletAdapter(),
  new LedgerWalletAdapter(),
  new TrustWalletAdapter(),
], []);
```

6 wallets supported: **Phantom, Solflare, Backpack (auto-detected), Coinbase, Ledger, Trust Wallet**. Uses `CustomWalletModalProvider` for branded wallet selection UI. Lazy-loaded with `next/dynamic` to avoid SSR issues.

Most competing submissions only support Phantom.

---

## Gamification

### 41 Achievement Badges

Defined in `src/lib/gamification/achievements.ts` with bitmap-indexed tracking (matches on-chain 256-bit bitmap):

| Category | Count | Examples |
|----------|-------|---------|
| Progress | 12 | First Steps, Momentum, Dedicated Learner, Marathon Day |
| Streaks | 6 | On a Roll (3d), Week Warrior (7d), Iron Will (60d), Consistency King (100d) |
| Skills | 7 | Rust Rookie, Anchor Expert, Credentialed, Proof of Work |
| XP | 5 | First Gains (100), Rising Star (500), Legendary (10,000) |
| Community | 6 | First Comment, Helper, Mentor, Spread the Word |
| Special | 5 | Early Adopter, Bug Hunter, Category Explorer, Polyglot Learner |

Supply-capped achievements: Speed Runner (2,500), Consistency King (500), Anchor Expert (1,000), Early Adopter (1,000), Bug Hunter (500).

### Additional Gamification

- **Streak system** with freeze tokens and milestone rewards (3/7/14/30/60/100 days)
- **Level-up modal** on XP thresholds
- **XP toasts** with canvas-confetti particles
- **Activity heatmap** (GitHub-style) on dashboard
- **Notification center** for real-time achievement/streak/XP/level events

---

## Tech Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Framework | Next.js (App Router) | 16.1.6 | ISR, RSC, streaming |
| Runtime | React | 19.2.3 | Server Components default |
| Language | TypeScript | 5.x | Strict mode |
| Styling | Tailwind CSS | v4 | @tailwindcss/postcss |
| Components | shadcn/ui (Radix UI) | latest | 15+ Radix primitives |
| Animation | Framer Motion | 12.x | Page transitions, landing animations |
| On-chain | Anchor | 0.32.1 | Full typed program client |
| XP tokens | Token-2022 | -- | NonTransferable + PermanentDelegate |
| Credential NFTs | Metaplex Core | -- | Soulbound via PermanentFreezeDelegate |
| CMS | Sanity | v5 | GROQ queries, Studio at /studio |
| Auth | NextAuth | v5 beta | Google + GitHub + Solana wallet |
| i18n | next-intl | v4.8 | 3 locales, message files |
| State | Zustand | v5 | 4 stores with persistence + selectors |
| AI | Anthropic SDK | 0.78 | Claude-powered Solana chatbot |
| Charts | Recharts | v3 | Dashboard visualizations |
| Code editor | Monaco (self-hosted) | v4.7 | CDN-free, 80+ languages |
| Error monitoring | Sentry | v10 | @sentry/nextjs |
| Analytics | GA4 + PostHog + Clarity | -- | 3 complementary analytics tools |
| Certificate export | html2canvas-pro | v2 | PNG export of credentials |
| Sig verification | tweetnacl | v1 | nacl.sign.detached.verify |

---

## Testing

### Unit Tests (20 files, Vitest)

| Area | Test Files | Coverage |
|------|-----------|----------|
| Solana bitmap | `bitmap.test.ts`, `bitmap-extended.test.ts` | Lesson flags decoding, edge cases |
| PDA derivation | `pdas.test.ts`, `pdas-extended.test.ts` | All 6 PDA types |
| On-chain queries | `queries-extended.test.ts` | Account fetching, error handling |
| Achievements | `achievements.test.ts` | Bitmap unlock, definitions |
| Rate limiting | `rate-limit.test.ts` | Window expiry, burst protection |
| API errors | `api-errors.test.ts` | Error response formatting |
| i18n completeness | `i18n-completeness.test.ts` | All 3 locales have matching keys |
| Level calculation | `level-calculation.test.ts` | XP thresholds |
| Format utilities | `format-utils.test.ts` | Number/date formatting |
| General utilities | `utils.test.ts` | cn(), misc helpers |
| Progress store | `progress-store.test.ts`, `progress-store-extended.test.ts` | Zustand store logic |
| Activity store | `activity-store.test.ts` | Heatmap data, streak tracking |
| Streak milestones | `streak-milestones.test.ts` | Milestone triggers |
| Sanity queries | `queries.test.ts` | GROQ query construction |
| Validate progress | `validate-progress-request.test.ts` | API input validation |
| LearningProgress | `LearningProgressService.test.ts` | Service layer |
| Empty states | `empty-states.test.tsx` | Component rendering |

### E2E Tests (9 files, Playwright)

| Test File | Coverage |
|-----------|----------|
| `smoke.spec.ts` | App loads, no console errors |
| `landing.spec.ts` | Landing page renders, CTAs work |
| `navigation.spec.ts` | Route transitions, back/forward |
| `courses.spec.ts` | Course catalog, detail pages |
| `auth.spec.ts` | Auth flows, protected routes |
| `i18n.spec.ts` | Locale switching, URL prefixes |
| `theme.spec.ts` | Dark/light toggle |
| `leaderboard.spec.ts` | Leaderboard renders |
| `accessibility.spec.ts` | ARIA roles, skip-to-content, focus management |

Run: `npm test` (unit) | `npm run test:e2e` (E2E)

---

## Internationalization

3 locales with message files at `src/i18n/messages/`:
- `pt-BR.json` (default)
- `en.json`
- `es.json`

All user-facing strings are externalized via `next-intl` `useTranslations()`. An automated test (`i18n-completeness.test.ts`) verifies all 3 locale files have matching key sets.

Locale-prefixed routing: `/pt-BR/courses`, `/en/courses`, `/es/courses`. Locale switcher in header. Default redirects to `/pt-BR`.

---

## Screenshots

| View | Path |
|------|------|
| Landing Page | `app/docs/screenshots/landing.png` |
| Dashboard | `app/docs/screenshots/dashboard.png` |
| Course Detail | `app/docs/screenshots/course-detail.png` |
| Code Challenge | `app/docs/screenshots/code-challenge.png` |
| Leaderboard | `app/docs/screenshots/leaderboard.png` |
| Profile | `app/docs/screenshots/profile.png` |

---

## How to Run Locally

### Prerequisites

- Node.js 20+
- Solana wallet (Phantom, Solflare, or any supported) set to Devnet
- Sanity project credentials
- Helius API key

### Setup

```bash
git clone https://github.com/praneethreddy1729/superteam-academy.git
cd superteam-academy/app
npm install
cp .env.example .env.local
# Fill in .env.local (see Environment Variables in README.md)
npm run dev
```

App runs at `http://localhost:3000`. Default locale is pt-BR.

### Optional

```bash
node scripts/seed-sanity.mjs   # Seed demo courses (idempotent)
npm test                        # Run unit tests
npm run test:e2e                # Run Playwright E2E tests
npm run build                   # Production build
```

---

## Project Stats

| Metric | Value |
|--------|-------|
| Source files (src/) | ~222 TypeScript/TSX files |
| Unit test files | 20 |
| E2E test files | 9 |
| Solana module files | 8 (pdas, instructions, bitmap, queries, typed-program, events, helius, constants) |
| Achievement definitions | 41 (across 6 categories) |
| Zustand stores | 4 (progress, activity, bookmarks, notifications) + selectors |
| API routes | 8 (4 progress, 1 chat, 1 auth link, 3 Helius proxy) |
| React hooks | 9 custom hooks (useEnrollment, useXpBalance, useCredentials, useAchievements, etc.) |
| i18n locales | 3 (pt-BR, en, es) |
| Supported wallets | 6 (Phantom, Solflare, Backpack, Coinbase, Ledger, Trust) |
| Analytics tools | 4 (GA4, PostHog, Sentry, Clarity) |
| Auth providers | 3 (Google, GitHub, Solana wallet) |

---

## What Sets This Apart

1. **Security is not optional.** Wallet auth uses `nacl.sign.detached.verify` with timestamp expiry and address cross-validation. Competing submissions skip signature verification entirely -- accepting any wallet connection as authentication.

2. **On-chain integration is real.** The frontend includes typed PDA derivation, bitmap-based lesson progress decoding, real-time event listeners, and transaction builders that match the actual Anchor program. Not a wrapper around `getBalance()`.

3. **6 wallets, not 1.** Phantom, Solflare, Backpack, Coinbase, Ledger, Trust. Auto-detection via Wallet Standard.

4. **41 achievement badges** with bitmap-indexed tracking, supply caps, and timestamp recording. Not a static badge grid.

5. **Self-hosted Monaco editor** at `/public/monaco/vs/` -- no CDN dependency. Code challenges run in-browser with TypeScript and Rust support.

6. **AI-powered learning.** Anthropic Claude API for contextual Solana Q&A with fallback knowledge base. Rate-limited and input-sanitized.

7. **29 test files** (20 unit + 9 E2E) covering Solana bitmap math, PDA derivation, store logic, API validation, i18n completeness, and accessibility.

8. **Production observability.** GA4 for traffic, PostHog for product analytics, Sentry for errors, Clarity for session replay. Four complementary tools, not just one.

---

## License

MIT
