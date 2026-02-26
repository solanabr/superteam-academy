## Superteam Academy — Full-Stack Submission

**Live Demo**: https://superteam-academy-six.vercel.app/
**Video **: https://www.youtube.com/watch?v=Hznv2ZR1IwM
**Tweet**: https://x.com/blchead/status/2027092542961877468
---

### On-Chain Program — Deployed & Working on Devnet

| | Address | Explorer |
|---|---|---|
| **Program** | `FEjumbmTCGxTwqikEcyC13czHfTwsnk7B9erNEEuHeBB` | [↗](https://explorer.solana.com/address/FEjumbmTCGxTwqikEcyC13czHfTwsnk7B9erNEEuHeBB?cluster=devnet) |
| **XP Mint (Token-2022)** | `5S5pSBFe968KdjAaG5yUXX1detFrE9vR4RGvT7JqRGjd` | [↗](https://explorer.solana.com/address/5S5pSBFe968KdjAaG5yUXX1detFrE9vR4RGvT7JqRGjd?cluster=devnet) |
| **Credential Collection** | `3kVGs49bDKKjwhP1B83QuQDdNnCcDPkMoyRGKBm6Nosb` | [↗](https://explorer.solana.com/address/3kVGs49bDKKjwhP1B83QuQDdNnCcDPkMoyRGKBm6Nosb?cluster=devnet) |
| **Config PDA** | `5EzcihtLatMMqRanQZqcmZaufctgH3rWf6Mq8sQgbdHV` | [↗](https://explorer.solana.com/address/5EzcihtLatMMqRanQZqcmZaufctgH3rWf6Mq8sQgbdHV?cluster=devnet) |

- 18 instructions · 7 PDA types · 27 error variants · 15 events
- **141 on-chain tests**: 77 Rust unit + 62 TS integration + 2 Trident fuzz targets
- XP = soulbound Token-2022 (NonTransferable + PermanentDelegate)
- Credentials = soulbound Metaplex Core NFTs (PermanentFreezeDelegate), upgrade-in-place

---

### Frontend — 15 Pages, 28k+ LOC TypeScript

| Page | Route |
|---|---|
| Landing | `/` |
| Course Catalog | `/courses` |
| Course Detail | `/courses/[slug]` |
| Lesson (split-pane + Monaco) | `/courses/[slug]/lessons/[id]` |
| Dashboard | `/dashboard` |
| Profile (public + private) | `/profile`, `/profile/[username]` |
| Leaderboard | `/leaderboard` |
| Settings | `/settings` |
| Certificate/Credential | `/certificates/[id]` |
| My Courses | `/my-courses` |
| **Bonus:** Admin Dashboard | `/admin` |
| **Bonus:** Course Creator/Editor | `/create-course`, `/edit-course` |
| **Bonus:** Community/Forum | `/community` |
| **Bonus:** Onboarding Quiz | via onboarding flow |
| **Bonus:** Offline/PWA | `/offline` + Save for Offline on enrolled courses |
| **Bonus:** User Docs | `/docs`, `/docs/course-reviews`, `/docs/courses`, ... |

---

### Requirement Checklist

| Requirement | How |
|---|---|
| Wallet Auth | Solana Wallet Standard (Phantom, Solflare, Backpack, all auto-detected) |
| OAuth | Supabase Auth — Google + GitHub, account linking |
| XP Display | Live Token-2022 ATA balance via `useOnChainXP()` |
| Credential NFTs | Metaplex Core NFTs fetched via Helius DAS API |
| On-Chain Enrollment | Learner signs `enroll` tx → PDA created on devnet |
| Leaderboard | XP ranking — weekly/monthly/all-time filters |
| Code Editor | Monaco — Rust/TS/JSON syntax, run + test + pass/fail |
| CMS | Sanity v3 (GROQ) + zero-config fallback (18 built-in courses) |
| i18n | EN, PT-BR, ES — 324 keys each, full coverage (next-intl) |
| Dark/Light | Class-based toggle, oklch color system |
| Analytics | GA4 + PostHog + Sentry (env-gated, graceful degradation) |
| Responsive | Mobile-first + resizable panels desktop |
| Docs | README, ARCHITECTURE, CMS_GUIDE, CUSTOMIZATION |

---

### Backend Signer — 30 API Routes

| Endpoint | Description |
|---|---|
| `POST /api/lessons/complete` | Quiz validation → `complete_lesson` tx (server signs) |
| `POST /api/courses/finalize` | All lessons verified → `finalize_course` + XP mint |
| `POST /api/mint/achievement` | Condition check → `award_achievement` + soulbound NFT |
| `POST /api/mint/early-adopter` | One-time claim → Metaplex Core NFT |
| `POST /api/achievements/award` | Achievement verification + on-chain CPI |
| `GET/POST/DELETE /api/reviews` | Course reviews — submit, edit, delete (completion-gated) |
| + 25 more | Auth, profile, progress, leaderboard, comments, admin, forum, onboarding |

Quiz security: client gets questions without answers → server validates → signs tx only on correct answers.

---

### Gamification

| Feature | Details |
|---|---|
| XP & Levels | `Level = floor(√(xp / 100))` — SVG ring + progress bar |
| Streaks | GitHub-style calendar, freezes, milestones at 7/30/100 days |
| Achievements | 8 badges: First Steps, Course Completer, Speed Runner, Week Warrior, Monthly Master, Consistency King, Early Adopter, Perfect Score |
| Skill Radar | Recharts radar (Rust, Anchor, Frontend, Security, DeFi, NFTs) |
| Daily Challenges | First-of-day bonus + streak XP |

---

### All Bonus Features

| Bonus | Status |
|---|---|
| Admin dashboard (course mgmt + user analytics) | ✅ |
| E2E tests (Playwright — 9 smoke tests, 7 flows) | ✅ |
| Community/Forum section | ✅ |
| Onboarding flow with skill quiz | ✅ |
| PWA offline course reading (SW + IndexedDB + auto-sync) | ✅ |
| Advanced gamification (daily challenges, streak freezes) | ✅ |
| CMS Course creator dashboard | ✅ |
| **Actual devnet integration (not stubbed)** | ✅ |
| 18 pre-built courses with full content + challenges | ✅ |
| Account linking (wallet + Google + GitHub) | ✅ |
| Course reviews (completion-gated, 1-5 stars, edit/delete) | ✅ |
| User documentation portal (`/docs`) | ✅ |

---

### PWA / Offline Course Reading

Enrolled learners can **save entire courses for offline reading** — study on a plane, no WiFi needed.

| Component | What it does |
|---|---|
| Service Worker (`sw.js`) | Caches all lesson pages into a dedicated `academy-courses` cache via message-passing. Network-first for nav, stale-while-revalidate for assets. |
| IndexedDB (`offline-store.ts`) | Stores course metadata + queues lesson completions made while offline |
| React hooks (`use-offline.ts`) | `useOnlineStatus`, `useOfflineCourse`, `useOfflineCourses`, `useOfflineCompletion` |
| Auto-sync | When connectivity returns, pending completions POST to `/api/progress/offline-sync` automatically |
| UI | "Save for Offline" button on course detail (enrolled only), amber offline banner on lessons, `/offline` page listing saved courses |

100% client-side storage — zero database impact.

---

### Lighthouse (Desktop)

| | Performance | Accessibility | Best Practices | SEO |
|---|:---:|:---:|:---:|:---:|
| **Homepage** | **98** | **100** | **100** | **100** |
| **Courses** | **95** | **98** | **100** | **100** |

---

### Tech Stack

| Layer | Stack |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS v4, shadcn/ui, Radix UI |
| Wallet | Solana Wallet Standard (auto-detect) |
| Solana | @coral-xyz/anchor, @solana/web3.js, Token-2022, Metaplex Core |
| Backend | 30 Next.js API Routes (backend signer pattern) |
| CMS | Sanity v3 (GROQ) + mock fallback |
| Code Editor | Monaco (@monaco-editor/react) |
| Auth | Supabase (Google + GitHub) + Wallet |
| Database | Supabase (PostgreSQL + RLS) |
| i18n | next-intl (3 locales) |
| Analytics | GA4, PostHog, Sentry |
| State | Zustand |
| Animations | Framer Motion |
| Charts | Recharts |

---

### Build & Verify

```bash
pnpm build        # ✅ Clean production build
pnpm lint         # ✅ Zero warnings
npx tsc --noEmit  # ✅ Clean type check
```

11 service interfaces with clean abstractions (Sanity/Supabase/Mock) — ready for full on-chain swap.  
See `app/src/services/` and `docs/INTEGRATION.md`.
