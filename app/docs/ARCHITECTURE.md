# Architecture Overview

This document describes how the Superteam Academy frontend is organized today and where to extend it for on-chain or CMS-backed data.

## 1) App Router Structure

The app uses Next.js App Router in `src/app` with route groups and dynamic segments:

- `src/app/layout.tsx`: global shell (Header, Sidebar, Footer, provider composition).
- `src/app/page.tsx`: landing page.
- `src/app/courses/page.tsx`: course catalog.
- `src/app/courses/[slug]/page.tsx`: course details.
- `src/app/courses/[slug]/lessons/[id]/page.tsx`: lesson experience + challenge completion.
- `src/app/dashboard/page.tsx`: learner metrics and activity.
- `src/app/leaderboard/page.tsx`: ranking and timeframe switching.
- `src/app/profile/[username]/page.tsx`: profile and credentials.
- `src/app/certificates/[id]/page.tsx`: credential details + verification links.
- `src/app/settings/page.tsx`: language/theme/preferences/wallet view.
- `src/app/(auth)/sign-in/page.tsx`, `src/app/(auth)/sign-up/page.tsx`: auth UI shells.
- `src/app/loading.tsx`, `src/app/error.tsx`, `src/app/not-found.tsx`: app-level UX states.

## 2) Server vs Client Components

### Server components (current)

- `src/app/layout.tsx` (root layout shell).
- `src/app/profile/[username]/page.tsx` (async server route).
- `src/app/certificates/[id]/page.tsx` (async server route).
- `src/app/loading.tsx`, `src/app/not-found.tsx`.

### Client components (current)

Most interactive routes are marked with `"use client"`, including:

- `src/app/page.tsx`, `src/app/courses/page.tsx`, `src/app/dashboard/page.tsx`, `src/app/leaderboard/page.tsx`, `src/app/settings/page.tsx`, `src/app/courses/[slug]/page.tsx`, `src/app/courses/[slug]/lessons/[id]/page.tsx`.
- Provider stack in `src/components/providers/*`.
- Hooks and Zustand store.

Reasoning: wallet adapter hooks, persisted local state, animations, and client-side filtering/progression currently run in-browser.

## 3) Provider Composition

Provider entrypoint is `src/components/providers/app-providers.tsx`:

1. `ThemeProvider` (`next-themes`) from `src/components/providers/theme-provider.tsx`.
2. `IntlProvider` (`next-intl`) from `src/components/providers/intl-provider.tsx`.
3. `AcademyWalletProvider` (Solana wallet adapter) from `src/components/providers/wallet-provider.tsx`.

This order ensures theme/i18n/wallet context is available app-wide.

## 4) Service Interface Pattern

The app uses explicit service interfaces plus local implementations, enabling backend swaps with minimal UI change.

### Key contracts

- `src/lib/services/course-service.ts`
  - Interface: `CourseService`
  - Current class: `LocalCourseService`
  - Responsibilities: catalog listing/search, slug lookup, enrollment transaction.

- `src/lib/services/learning-progress.ts`
  - Interface: `LearningProgressService`
  - Current class: `LocalLearningProgressService`
  - Responsibilities: lesson completion, progress, XP, streaks, leaderboard projection, credentials list.

- `src/lib/services/achievement-service.ts`
  - Interface: `AchievementService`
  - Current class: `LocalAchievementService`

- `src/lib/services/leaderboard-service.ts`
  - Interface: `LeaderboardService`
  - Current class: `LocalLeaderboardService`

- `src/lib/services/credential-service.ts`
  - Interface: `CredentialService`
  - Current class: `LocalCredentialService`

### Why this matters

UI and hooks depend on interfaces/exports (`courseService`, `learningProgressService`, etc.), not raw data files. Replacing local implementations with on-chain/CMS/API versions can happen behind these contracts.

## 5) Solana Integration

Solana constants live in `src/lib/solana/constants.ts`:

- Network: `devnet`
- Program ID: `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf`
- XP mint: `xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3`
- Authority: `ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn`
- XP per lesson: `100`

Connection setup:

- `src/lib/solana/program.ts` exports shared `connection` with `confirmed` commitment.

PDA helpers:

- `src/lib/solana/pda.ts` includes `deriveEnrollmentPda` and `deriveProgressPda`.

Wallet integration:

- `src/components/providers/wallet-provider.tsx` configures `ConnectionProvider`, `WalletProvider`, and `WalletModalProvider`.
- Wallet adapters: Phantom + Solflare.

Current enrollment behavior:

- `courseService.enrollInCourse` builds a minimal transfer transaction (0 lamports) to authority as a placeholder transport path.

## 6) State Management (Zustand)

The user store is `src/lib/store/user-store.ts`.

Stored domains:

- `profile`
- `locale`
- `theme`
- `walletAddress`
- `enrollments`
- `completedLessons`

Actions:

- `setLocale`, `setTheme`, `setWalletAddress`
- `enroll`, `completeLesson`, `addXp`

Persistence:

- Zustand `persist` middleware with key `academy-user-state-v1`.
- Partialized persisted shape to keep local UX state stable across reloads.

## 7) i18n Setup

Dictionaries:

- `src/messages/en.json`
- `src/messages/es.json`
- `src/messages/pt-BR.json`

Runtime locale source:

- Zustand store (`locale` in `user-store.ts`).

Provider wiring:

- `src/components/providers/intl-provider.tsx` maps store locale -> dictionary and wraps app in `NextIntlClientProvider`.

Usage:

- Components consume `useTranslations(namespace)`.
- Header/settings route allows locale switching, updating store state immediately.

## 8) Data Flow Snapshot

- Catalog data is generated in `src/lib/data/mock-courses.ts` from `REFERENCE_COURSE_CATALOG.ts` and transformed to app-level `Course` model.
- Hooks (`src/hooks`) call service layer and expose loading/interaction state.
- UI routes and components render from hooks/store + service responses.
- Lesson completion updates both local progress service storage and Zustand state, then recalculates XP/level surfaces.
