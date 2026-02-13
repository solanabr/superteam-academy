# Superteam Academy Brasil LMS

Open-source LMS frontend for Solana developer education, aligned to the Superteam Brasil bounty scope.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript (strict mode)
- Tailwind CSS with custom design tokens
- Solana Wallet Adapter (multi-wallet)
- Monaco Editor for coding challenges
- Sanity CMS schema scaffolding
- Analytics hooks: GA4, Hotjar, Clarity, PostHog
- Error monitoring: Sentry

## Bounty Alignment

### Core routes

Implemented:

- `/`
- `/courses`
- `/courses/[slug]`
- `/courses/[slug]/lessons/[id]`
- `/dashboard`
- `/profile`
- `/profile/[username]`
- `/leaderboard`
- `/settings`
- `/certificates/[id]`

### On-chain scope status

Implemented for Devnet reads:

- Wallet authentication UI (multi-wallet adapter)
- XP balance read path (on-chain adapter + RPC)
- Credential read path (cNFT read adapter + fallback)
- Leaderboard read path (indexed balances + fallback)

Stubbed behind clean interfaces (swap-ready):

- Course enrollment transaction relay (`/api/learning/enroll`)
- Lesson completion relay with backend receipt (`/api/learning/complete-lesson`)
- Server-side progress/enrollment store (`/api/learning/progress`, `/api/learning/enrollment`)
- Server-side streak and XP mutation flow (`/api/learning/streak`, `/api/learning/xp`)

Service contract boundary:

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

### Product requirements status

Implemented:

- i18n (`pt-BR`, `es`, `en`) with externalized UI strings
- Light/dark themes
- Responsive layouts
- Challenge editor integration (Monaco)
- Dashboard gamification surface (XP, level, streak, rank)
- Account registration UX and account-gated pages
- Analytics script bootstrap and event helper
- CMS-backed course loading with local fallback behavior

## Local Development

Use project-local dependencies in `node_modules` (no global npm packages required).

Recommended Node version: `20.x` via `nvm`.

1. Install dependencies:

```bash
npm install
```

2. Create local env:

```bash
cp .env.example .env.local
```

3. Start dev server:

```bash
npm run dev
```

If Next cache gets inconsistent (chunk 404), run:

```bash
npm run dev:clean
```

4. Validate quality gates:

```bash
npm run lint
npm run typecheck
```

5. Run E2E suite (Playwright):

```bash
npx playwright install chromium
npm run test:e2e
```

## Environment Variables

See `.env.example`.

Key groups:

- Solana RPC:
  - `NEXT_PUBLIC_SOLANA_RPC_URL`
- On-chain reads:
  - `NEXT_PUBLIC_XP_MINT_ADDRESS`
  - `NEXT_PUBLIC_DAS_RPC_URL`
  - `NEXT_PUBLIC_LEADERBOARD_WALLETS`
  - `NEXT_PUBLIC_LEADERBOARD_ALIASES`
- Analytics:
  - `NEXT_PUBLIC_GA_MEASUREMENT_ID`
  - `NEXT_PUBLIC_HOTJAR_ID`
  - `NEXT_PUBLIC_CLARITY_PROJECT_ID`
  - `NEXT_PUBLIC_POSTHOG_KEY`
  - `NEXT_PUBLIC_POSTHOG_HOST`
- Monitoring:
  - `NEXT_PUBLIC_SENTRY_DSN`
- App URL:
  - `NEXT_PUBLIC_APP_URL`
- Auth:
  - `AUTH_SECRET`
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY`
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GITHUB_CLIENT_ID`
  - `GITHUB_CLIENT_SECRET`
  - OAuth redirect URIs:
    - Google: `${NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
    - GitHub: `${NEXT_PUBLIC_APP_URL}/api/auth/github/callback`
- Learning backend:
  - `LEARNING_STORE_PATH`
- CMS:
  - `SANITY_PROJECT_ID`
  - `SANITY_DATASET`
  - `SANITY_API_VERSION`
  - `SANITY_READ_TOKEN`

## Deployment

Deploy to Vercel or Netlify.

Recommended pipeline:

- Preview deployments on PRs
- Production deployment from `main`
- Configure all env vars in hosting settings

## Integration Notes

Current adapters:

- `lib/services/local-learning-progress-service.ts`
- `lib/services/onchain-learning-progress-service.ts`
- `lib/learning/server-transaction-relay.ts`
- `lib/learning/server-progress-store.ts`

Integration swap point:

- `lib/services/index.ts`

Expected real program integration target:

- `github.com/solanabr/superteam-academy`

## Submission Checklist

- PR link to target repo
- Live demo URL
- 3-5 min demo video
- Twitter/X post tagging `@SuperteamBR`

Supporting files:

- `SUBMISSION.md`
- `DEMO_VIDEO_SCRIPT.md`
- `TWITTER_POST_TEMPLATE.md`
- `TEST_PLAN_TOMORROW.md`
