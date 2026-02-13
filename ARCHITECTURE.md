# Architecture

## System Overview

The project is a Next.js 14 App Router frontend organized with service boundaries to support progressive on-chain integration.

## Layered Design

1. Presentation layer
- `app/**`: route pages
- `components/**`: feature UI blocks and reusable components

2. Domain layer
- `lib/types.ts`: shared domain models
- `lib/services/learning-progress-service.ts`: core service contract

3. Adapter layer
- `lib/services/local-learning-progress-service.ts`: local stub behavior
- `lib/services/onchain-learning-progress-service.ts`: on-chain reads + backend API mutations
- `lib/learning/server-transaction-relay.ts`: backend transaction relay abstraction
- `lib/learning/server-progress-store.ts`: persistent server progress store (`.learning/store.json`)

4. Content layer
- `lib/cms/sanity-client.ts`: CMS client entry
- `lib/data/courses.ts`: normalized CMS loaders for published courses

5. Cross-cutting layer
- `lib/i18n/messages.ts`: externalized UI dictionaries
- `lib/analytics.ts`: event helper
- `components/providers/analytics-scripts.tsx`: analytics bootstrapping
- Sentry: `instrumentation.ts`, `app/global-error.tsx`, `sentry.client.config.ts`

## Service Boundary

```ts
interface LearningProgressService {
  getProgress(userId: string, courseId: string): Promise<Progress>;
  enrollCourse(userId: string, courseId: string): Promise<void>;
  getEnrollment(userId: string, courseId: string): Promise<boolean>;
  completeLesson(userId: string, courseId: string, lessonIndex: number): Promise<void>;
  getXP(userId: string): Promise<number>;
  getStreak(userId: string): Promise<StreakData>;
  getLeaderboard(timeframe: 'weekly' | 'monthly' | 'alltime'): Promise<LeaderboardEntry[]>;
  getCredentials(wallet: PublicKey): Promise<Credential[]>;
}
```

## Data Flow

1. Route loads content from CMS through `lib/data/courses.ts`.
2. Client feature resolves current account context (registration + wallet).
3. Feature calls `learningProgressService`.
4. Mutation calls go through `app/api/learning/*` and are resolved server-side using authenticated session.
5. UI computes derived values (for example, `level = floor(sqrt(xp / 100))`).
6. Events are tracked through `lib/analytics.ts`.

## Scope Mapping (Implemented vs Stub)

Implemented read paths:

- wallet connection UI
- XP read path
- credential read path
- leaderboard read path

Stubbed mutation paths:

- enrollment relay
- lesson completion relay
- achievement bitmap path (planned)
- streak mutation side effects

## Route Coverage

- `/`: landing and marketing surface
- `/courses`: catalog, filters, search
- `/courses/[slug]`: course detail, modules, outcomes
- `/courses/[slug]/lessons/[id]`: lesson workspace + challenge panel
- `/dashboard`: XP/streak/rank surface
- `/profile` and `/profile/[username]`: account profile + public profile
- `/leaderboard`: timeframe ranking
- `/settings`: profile/account preferences
- `/certificates/[id]`: certificate display

## On-chain Integration Points

Primary swap target:

- `lib/services/index.ts`

Planned real integrations:

- enrollment PDA operations
- `complete_lesson` transaction flow
- Token-2022 non-transferable XP reads
- cNFT verification via DAS/Bubblegum
- leaderboard indexing integration
- relay swap from stub receipt to real backend signer

## Folder Guide

- `app/`: pages/routes
- `components/`: UI and feature modules
- `lib/data/`: CMS data loading
- `lib/services/`: contracts and adapters
- `lib/learning/`: backend learning state and transaction relay
- `lib/i18n/`: locale dictionaries and hooks
- `lib/cms/`: CMS client configuration
- `sanity/`: schema files and sample content
