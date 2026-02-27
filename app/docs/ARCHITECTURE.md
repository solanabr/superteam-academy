# Architecture — Superteam Brazil LMS

High-level system architecture, component structure, data flow, and service interfaces for the LMS dApp.

## Overview

The app is a **Next.js 14 (App Router)** frontend that talks to a **learning progress service** abstraction. Stub implementations use localStorage and API routes; production will swap in on-chain (Anchor program) and/or backend calls. See `docs/INTEGRATION.md` for on-chain mapping.

## Tech stack

- **Framework**: Next.js 14+ (App Router), React, TypeScript (strict)
- **Styling**: Tailwind CSS with design tokens (CSS variables) for theming (light/dark)
- **Wallet**: Solana Wallet Adapter (multi-wallet)
- **i18n**: Custom context (`lib/i18n`) with EN, PT-BR, ES
- **Theme**: Client-side theme provider (`lib/theme`) with localStorage persistence

## System architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (Wallet Adapter, Theme, i18n)                           │
├─────────────────────────────────────────────────────────────────┤
│  App Router (app/)                                               │
│  · /, /courses, /courses/[slug], /courses/.../lessons/[id]       │
│  · /dashboard, /profile, /profile/[username], /leaderboard,      │
│    /settings, /certificates/[id]                                 │
├─────────────────────────────────────────────────────────────────┤
│  Service layer (lib/services/)                                   │
│  · learning-progress.ts  → getProgress, completeLesson,          │
│    getXPBalance, getLeaderboard(timeframe?, courseId?),           │
│    getCredentials, getAchievements, enroll, isEnrolled, getStreakData │
│  · streak.ts            → getStreakData, recordActivity (local)  │
├─────────────────────────────────────────────────────────────────┤
│  Data / API                                                      │
│  · lib/data/courses.ts  → static course catalog (CMS-ready)      │
│  · app/api/             → progress, xp, leaderboard, enroll,    │
│    credentials, streak, analytics, auth/[...nextauth] (stub)     │
└─────────────────────────────────────────────────────────────────┘
```

## Component structure

- **Layout**: `app/layout.tsx` — SessionProvider (NextAuth), WalletProvider, I18nProvider, ThemeProvider, SkipToContent, Footer.
- **Shell**: `components/Header.tsx` (nav, XP badge, wallet, theme toggle, language), `components/Footer.tsx`, `components/SkipToContent.tsx`.
- **Home**: `components/HomeContent.tsx`, `HeroSection`, `StatsCharts`, course links.
- **Dashboard**: `app/dashboard/DashboardContent.tsx` — XP, level, streak (with streak calendar), credentials, achievements stub, per-course cards with “Resume”.
- **Courses**: `app/courses/page.tsx` (catalog + filters), `app/courses/[slug]/` — course detail, `EnrollmentCTA`, `CourseContent` (lessons + progress), lesson page with code editor stub.
- **Leaderboard**: `app/leaderboard/page.tsx` — timeframe + course filter, current user highlighted.
- **Profile / Settings**: Profile with connect CTA; when connected: profile header, skill radar (Recharts), achievements, credentials, completed courses, visibility toggle. Settings: Profile/Account/Preferences (theme toggle, language switcher), Privacy.
- **Certificate**: `app/certificates/[id]/CertificateView.tsx` — visual cert, share (X, copy link), verify link, download stub, NFT details section.

## Data flow

1. **Progress**: Wallet → `GET /api/progress?wallet=` → service `getProgress` / stub reads API → UI shows completed lessons and %.
2. **Lesson complete**: User clicks “Mark complete” → `POST /api/progress` + `learningProgressService.completeLesson` + `recordActivity` (streak) → UI updates XP and progress.
3. **Enrollment**: User clicks “Enroll” → `learningProgressService.enroll` (stub: localStorage) → “Start course” and lesson list.
4. **Leaderboard**: `getLeaderboard(timeframe, courseId?)` → stub returns mock list; production will filter by course when indexer supports it.
5. **Streaks**: Frontend-only; `getStreakData(wallet)` reads from localStorage; `recordActivity` updates history; dashboard shows streak calendar (StreakCalendar component).

## Service interfaces (on-chain integration points)

Defined in `lib/services/learning-progress.ts` and `lib/services/types.ts`:

- **getProgress(wallet)** → `LearningProgress` (completedLessons, courseProgress).
- **completeLesson(wallet, courseId, lessonId)** → void (stub: API + local XP; production: backend-signed instruction).
- **getXPBalance(wallet)** → `XPBalance` (xp, level); production: Token-2022 balance, level = floor(sqrt(xp/100)).
- **getStreakData(wallet)** → `StreakData` (frontend-only).
- **getLeaderboard(timeframe, courseId?)** → `LeaderboardEntry[]`; production: indexer, optional course filter.
- **getCredentials(wallet)** → `Credential[]`; production: Metaplex Core NFTs (soulbound).
- **enroll(wallet, courseId)** → `EnrollmentResult`; production: learner-signed enroll tx.
- **isEnrolled(wallet, courseId)** → boolean; production: Enrollment PDA exists.

See `docs/INTEGRATION.md` for account structures, instruction mapping, and event signatures.

## Routing and metadata

- Course detail: `generateMetadata` in `app/courses/[slug]/page.tsx` for SEO.
- Courses list: `app/courses/layout.tsx` sets catalog title/description.
- Certificate: dynamic `[id]` (course slug or credential mint).

## Performance and a11y

- Skip-to-content, main landmark (`id="main-content"`), ARIA where needed (progressbar, live regions, nav labels).
- Reduced motion respected in `globals.css`.
- Focus-visible styles; theme and language switchers in header/settings.
