# Superteam Academy — Design Document (PRD)

**Date:** 2026-02-24
**Author:** RECTOR
**Status:** Approved
**Bounty:** [Superteam Academy LMS](https://superteam.fun/earn/listing/superteam-academy)

---

## 1. Overview

Production-ready Learning Management System (LMS) dApp for Solana developer education. Built on an existing Anchor on-chain program (16 instructions, 6 PDA types) deployed to devnet. Features interactive courses, gamification with soulbound XP tokens, on-chain credential NFTs, and a code editor for challenges.

**Program ID (devnet):** `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf`
**XP Mint:** `xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3`
**Authority:** `ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn`

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS + shadcn/ui (Radix primitives) |
| State | Zustand |
| CMS | Sanity (embedded studio) |
| Wallet | Unified Wallet Kit (Jupiter) — all wallets supported |
| i18n | next-intl (en, pt, es) |
| Code Editor | Monaco Editor (lazy-loaded) |
| Charts | Chart.js (radar), Recharts (admin analytics) |
| Analytics | GA4 + Vercel Analytics + Sentry + PostHog/Clarity heatmaps |
| Testing | Vitest (unit) + Playwright (E2E) |
| Deploy | Vercel |
| On-chain | @coral-xyz/anchor, @solana/web3.js, @solana/spl-token (Token-2022) |
| Credentials | Metaplex Core NFTs via Helius DAS API |
| User Data | Supabase (MVP, designed for future on-chain migration) |

---

## 3. Architecture

```
superteam-academy/
├── app/                              # Next.js 14+ frontend
│   ├── src/
│   │   ├── app/                      # App Router pages
│   │   │   ├── [locale]/             # i18n root layout
│   │   │   │   ├── (marketing)/      # Landing page (public)
│   │   │   │   ├── (platform)/       # Authenticated platform
│   │   │   │   │   ├── courses/      # Catalog + detail + lesson view
│   │   │   │   │   ├── dashboard/    # User dashboard
│   │   │   │   │   ├── profile/      # User profile + credentials
│   │   │   │   │   ├── leaderboard/  # XP leaderboard
│   │   │   │   │   ├── settings/     # Account settings
│   │   │   │   │   ├── challenges/   # Daily challenges (bonus)
│   │   │   │   │   └── community/    # Forum (bonus)
│   │   │   │   ├── (admin)/          # Admin dashboard (bonus)
│   │   │   │   └── onboarding/       # Onboarding quiz (bonus)
│   │   │   └── api/                  # Route handlers (backend signer)
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui primitives
│   │   │   ├── layout/               # Header, Footer, Sidebar, Navigation
│   │   │   ├── courses/              # Course cards, filters, catalog
│   │   │   ├── editor/               # Monaco editor wrapper
│   │   │   ├── gamification/         # XP bar, level badge, streak, achievements
│   │   │   ├── wallet/               # Wallet connect
│   │   │   ├── credentials/          # NFT viewer, certificate display
│   │   │   └── admin/                # Admin-only components
│   │   ├── lib/
│   │   │   ├── solana/               # On-chain service layer
│   │   │   │   ├── program.ts        # Anchor program instance
│   │   │   │   ├── pda.ts            # All PDA derivations
│   │   │   │   ├── xp.ts             # XP balance, level calc
│   │   │   │   ├── credentials.ts    # Metaplex Core + Helius DAS
│   │   │   │   ├── enrollment.ts     # Enroll, complete, finalize
│   │   │   │   ├── achievements.ts   # Achievement types + receipts
│   │   │   │   ├── bitmap.ts         # Lesson bitmap helpers
│   │   │   │   └── constants.ts      # Program ID, XP mint, cluster
│   │   │   ├── sanity/               # CMS client + queries
│   │   │   ├── hooks/                # Custom React hooks
│   │   │   ├── stores/               # Zustand stores
│   │   │   ├── utils/                # General utilities
│   │   │   └── i18n/                 # next-intl config
│   │   ├── messages/                 # Translation JSON (en, pt, es)
│   │   ├── styles/                   # Global CSS, Tailwind config
│   │   └── types/                    # TypeScript types/interfaces
│   ├── sanity/                       # Sanity Studio (embedded)
│   ├── e2e/                          # Playwright E2E tests
│   ├── public/                       # Static assets
│   └── next.config.ts
├── onchain-academy/                  # Existing Anchor program (untouched)
└── docs/                             # Documentation
```

### Service Abstraction Pattern

```
Component → Hook → Store → Service (lib/solana/*) → Anchor Program
                              ↓ (stubbed)
                         Mock/LocalStorage fallback
```

All on-chain interactions flow through `lib/solana/` service layer. Frontend components never call Anchor directly. Clean boundaries for stubbed vs. implemented features.

---

## 4. Core Pages (10)

### 4.1 Landing Page (`/`)

Public marketing page. Sections: Hero + animated stats, Featured Courses (from Sanity ISR), How It Works (3-step), Tracks Overview (visual map), Gamification Preview, Social Proof (recent completions), CTA Banner, Footer.

Data: Sanity CMS (ISR 60s) + on-chain aggregation (Helius DAS cached server-side).

### 4.2 Course Catalog (`/courses`)

Browse, filter, search all courses. Left sidebar filters (track, difficulty, status, sort). Responsive grid of course cards. Each card: thumbnail, track badge, difficulty dots, title, lesson count, XP, enrollment count, progress bar (if enrolled), prerequisite lock.

Data: Sanity (ISR) + Course PDA reads + Enrollment PDA existence checks. Client-side filtering (courses < 100).

### 4.3 Course Detail (`/courses/[courseId]`)

Tabbed layout: Overview | Curriculum | Reviews. Full description, What You'll Learn, prerequisites (linked), skills, credential preview. Curriculum shows module → lesson tree with ✓/○/🔒 states from bitmap. Enroll button triggers learner-signed `enroll` instruction (handles prerequisite remaining_accounts).

### 4.4 Lesson View (`/courses/[courseId]/lessons/[lessonIndex]`)

Split layout: collapsible sidebar (module/lesson nav) + main content (rich text from Sanity + code editor). Monaco Editor: Rust/TypeScript/JSON, lazy-loaded, auto-save to localStorage. Lesson completion: API route → backend_signer co-signs `complete_lesson` → XP minted → confetti + XP toast → auto-advance.

Responsive: desktop = fixed sidebar + split content/editor. Tablet = collapsible sidebar. Mobile = stacked vertical layout.

### 4.5 Code Challenge (`/courses/[courseId]/challenge`)

Split: instructions (problem, requirements, hints, examples) + Monaco Editor (file tabs) + Test Results Panel. Test cases from Sanity (input, expected output, points). Client-side execution via Web Worker (TypeScript). All tests pass → submit → `complete_lesson` for challenge index.

### 4.6 User Dashboard (`/dashboard`)

Welcome banner (name, level, XP progress, streak). Quick stats. Activity heatmap (GitHub-style, 12 months). Continue Learning (in-progress courses with progress bars). Recent Achievements. Credentials gallery (Metaplex Core NFTs via Helius DAS). Recommended courses (track-based).

Data: Token-2022 ATA (XP), Enrollment PDAs (progress), AchievementReceipt PDAs, Helius DAS (credentials), localStorage (streak).

### 4.7 User Profile (`/profile/[wallet]`)

Public profile. Avatar (Jazzicon) + wallet + level + member since. Skill radar chart (Chart.js — axes = tracks, values = XP per track). Stats summary. Full credential gallery. Achievement badge grid (earned = colored, locked = gray). Completed courses list.

### 4.8 Leaderboard (`/leaderboard`)

Time filters: Weekly | Monthly | All-Time. Top 3 podium (visual cards). Ranked table: wallet, level, XP, courses. "Your Rank" sticky row. All-time: Helius DAS `getTokenAccounts` for XP mint sorted by balance. Weekly/monthly: Supabase event aggregation (or stubbed with "Coming soon").

### 4.9 Settings (`/settings`)

Sidebar nav: Profile, Appearance, Language, Notifications, Wallet, Privacy. Profile form (display name, bio, avatar). Theme toggle (light/dark/system). Language selector (en/pt/es). Notification preferences. Wallet management (connected, disconnect, switch). Privacy (public profile, leaderboard visibility). Storage: Supabase + localStorage.

### 4.10 Credential Viewer (`/credentials/[assetId]`)

Certificate-style visual display. On-chain verification: asset ID, collection, owner, frozen status. Attributes from Metaplex plugin (track_id, level, courses_completed, total_xp). Share: Twitter (OG image), Download PNG (html2canvas), Copy link. OG image generation via Next.js Image Response API.

---

## 5. On-Chain Integration

### PDA Derivations

```
configPda()                                     → ["config"]
coursePda(courseId)                              → ["course", courseId]
enrollmentPda(courseId, learner)                 → ["enrollment", courseId, learner]
minterRolePda(minter)                           → ["minter", minter]
achievementTypePda(achievementId)               → ["achievement", achievementId]
achievementReceiptPda(achievementId, recipient)  → ["achievement_receipt", achievementId, recipient]
```

### Instruction Responsibility Matrix

| Instruction | Signer | Implementation |
|-------------|--------|---------------|
| `enroll` | learner wallet | Fully implemented (client-side) |
| `close_enrollment` | learner wallet | Fully implemented (client-side) |
| `complete_lesson` | backend_signer | API route (server-side) |
| `finalize_course` | backend_signer | API route (server-side) |
| `issue_credential` | backend_signer + new keypair | API route (server-side) |
| `upgrade_credential` | backend_signer | API route (server-side) |
| `create_course` | authority | Admin dashboard |
| `update_course` | authority | Admin dashboard |
| `register_minter` / `revoke_minter` | authority | Admin dashboard |
| `create_achievement_type` / `deactivate_achievement_type` | authority | Admin dashboard |
| `reward_xp` | minter | API route (achievement/daily challenge) |
| `award_achievement` | minter + new keypair | API route |

### API Routes (Backend Signer)

```
POST /api/lessons/complete      # complete_lesson
POST /api/courses/finalize      # finalize_course
POST /api/credentials/issue     # issue_credential
POST /api/credentials/upgrade   # upgrade_credential
POST /api/achievements/award    # award_achievement
GET  /api/leaderboard           # XP rankings (cached)
```

Security: wallet signature verification, enrollment existence check, anti-replay, rate limiting (10 req/min/wallet).

### Token-2022 Critical Notes

- Always use `TOKEN_2022_PROGRAM_ID` (`TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb`)
- ATA derivation: `getAssociatedTokenAddressSync(XP_MINT, wallet, false, TOKEN_2022_PROGRAM)`
- `XpRewarded.recipient` = ATA address, not wallet pubkey
- XP tokens are NonTransferable (soulbound)

---

## 6. Gamification System

### XP Economy

| Action | XP | Source |
|--------|-----|--------|
| Complete lesson | 10–50 | `course.xp_per_lesson` |
| Complete challenge | 25–100 | Same (challenge = final lesson) |
| Course completion bonus | 50% of total | `floor((xp_per_lesson * lesson_count) / 2)` |
| Achievement | 0–500 | `achievement_type.xp_reward` |
| Daily challenge | 25–75 | Via minter |
| Accepted forum answer | 25 | Via minter |

### Level Calculation

```
Level = floor(sqrt(xp / 100))

L0=0, L1=100, L2=400, L3=900, L4=1600, L5=2500, L6=3600, L7=4900, L8=6400, L9=8100, L10=10000
```

### Streak (Frontend-Only)

Zustand store persisted to localStorage. Increments on daily lesson completion. Resets on missed day. Milestones at 3, 7, 14, 30, 100 days trigger achievement checks.

### Achievements (256 Possible)

Categories: learning, streak, challenge, social, special. On-chain: AchievementType PDA + AchievementReceipt PDA. Frontend evaluates conditions after each action → awards via minter.

---

## 7. Sanity CMS Content Models

### Schemas

- **course** — courseId, title (localized), description, thumbnail, track (ref), difficulty, modules, prerequisites, skills, credentialImage
- **module** — title, description, lessons (ref array)
- **lesson** — title, lessonIndex (matches bitmap), content (localized rich text), xpReward, hasCodeEditor, starterCode, solution (hidden), isChallenge, testCases
- **testCase** — description, input, expectedOutput, points, hidden
- **track** — trackId (matches on-chain), name, description, icon, color
- **achievement** — achievementId, name, description, icon, category, xpReward, condition
- **dailyChallenge** — date, title, description, difficulty, xpReward, starterCode, testCases

Localized types: `localizedString = { en, pt, es }`, `localizedBlockContent = { en, pt, es }`.

Sanity Studio embedded at `/studio` route.

---

## 8. Monaco Editor

Lazy-loaded via `next/dynamic` (SSR disabled). Languages: Rust, TypeScript, JSON with syntax highlighting + basic autocomplete. Theme synced with app (light/dark). Auto-save to localStorage per lesson.

TypeScript/JSON execution: Web Worker with sandboxed eval, 5s timeout. Rust: display-only editor + "Open in Solana Playground" link.

Challenge mode: test cases evaluate output strings. Visual results: pass (✓), fail (✗ with diff), skipped (○).

---

## 9. i18n & Theming

### i18n (next-intl)

Routing: `[locale]` segment → `/en/courses`, `/pt/courses`, `/es/courses`. Middleware detects browser locale. Server Components: `getTranslations()`. Client Components: `useTranslations()`.

### Theming

CSS variables + Tailwind `dark:` variant + `next-themes`. **Light-first** (clean modern SaaS aesthetic). Colors: Solana purple (#7C3AED) primary, Solana green (#16A34A) accent. Typography: Inter (body), JetBrains Mono (code). Spacing: 8px grid, generous whitespace.

---

## 10. Bonus Features (All 8)

### 10.1 Admin Dashboard (`/admin`)

Access: wallet = `config.authority` or registered minter. Tabs: Overview (stats cards + enrollment chart + activity feed), Courses (CRUD table), Users (search + detail), Achievements (grid + create/deactivate), Analytics (Recharts — enrollment trends, completion rates, drop-off, XP distribution), Config (PDA values, minter roles).

### 10.2 E2E Tests (Playwright)

Page Object Model. Tests: navigation, catalog, enrollment, lesson view, challenges, dashboard, leaderboard, credentials, i18n, theme, responsive, accessibility (axe-core), performance (Lighthouse CI). Wallet mocking via custom adapter. CI: GitHub Actions on PR.

### 10.3 Community/Forum (`/community`)

Categories: General, Help, Show & Tell, Course Q&A. Threaded replies (2 levels). Upvote/downvote (wallet-signed). Accepted answers (+25 XP). Context-aware Q&A linked to courses/lessons. Storage: Supabase (threads, replies, votes) with real-time subscriptions.

### 10.4 Onboarding Quiz (`/onboarding`)

4-step wizard: Experience Level → Programming Background → Interests → Goals. Recommendation algorithm maps answers to track + starting course. Results: personalized learning path with rationale. Storage: localStorage + Supabase (analytics).

### 10.5 PWA Support

`next-pwa` plugin. Service worker: cache static assets + viewed lesson content. Network-first for on-chain data. Offline indicator. Queue offline completions → sync on reconnect. Installable (manifest.json, icons).

### 10.6 Daily Challenges (`/challenges`)

Today's challenge (from Sanity, scheduled by date). Same code challenge interface. One attempt/day/wallet. XP via minter. Speed leaderboard. Past challenges history. Resets at midnight UTC.

### 10.7 Course Creator Dashboard (`/creator`)

Access: wallets listed as `creator` in Course PDAs. Views: My Courses (enrollment/completion stats), Analytics (per-lesson drop-off), Rewards (creator XP threshold status), Drafts (Sanity Studio link).

### 10.8 Devnet Program Integration (Deep)

Real-time event subscriptions via WebSocket (`connection.onLogs`). Transaction history timeline. Account explorer (raw PDA data). Helius webhook integration for analytics aggregation.

---

## 11. Performance Targets

| Metric | Target |
|--------|--------|
| Lighthouse Performance | 90+ |
| Lighthouse Accessibility | 95+ |
| Lighthouse Best Practices | 95+ |
| Lighthouse SEO | 90+ |
| LCP | < 2.5s |
| FID | < 100ms |
| CLS | < 0.1 |

Strategies: ISR, lazy-load Monaco, image optimization, route prefetch, code-split, font-display: swap, fixed dimensions.

---

## 12. Documentation Deliverables

| Document | Purpose |
|----------|---------|
| `README.md` | Setup, install, dev/build, deploy, bounty context |
| `ARCHITECTURE.md` | System design, data flows, service layer, on-chain patterns |
| `CMS_GUIDE.md` | Sanity setup, content models, authoring workflow, translations |
| `CUSTOMIZATION.md` | Theme, languages, achievements, tracks, component library |

Demo video: 3–5 min covering all pages, wallet flow, on-chain interactions, bonus features.

---

## 13. Evaluation Alignment

| Criteria | Weight | Our Strategy |
|----------|--------|-------------|
| Code Quality & Architecture | 25% | Clean service abstraction, TypeScript strict, Vitest + Playwright, linting |
| Feature Completeness | 25% | All 10 pages + all 8 bonus features |
| UI/UX Design | 20% | Clean SaaS aesthetic, shadcn/ui, responsive, a11y, animations |
| Performance | 15% | ISR, lazy-loading, code-splitting, all Lighthouse targets exceeded |
| Documentation | 10% | 4 comprehensive docs + demo video |
| Bonus Features | 5% | All 8 implemented |
