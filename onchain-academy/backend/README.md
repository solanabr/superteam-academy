# Superteam Academy Backend

Production-oriented backend contract for the Superteam Academy frontend.

This backend is designed as a thin API and persistence layer for:

- auth/session identity normalization
- enrollment durability
- lesson progress durability
- streak and activity feeds
- leaderboard window aggregation

## Required Environment

Use these variables in `onchain-academy/app/.env.local`:

```bash
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Privy (optional but recommended)
NEXT_PUBLIC_PRIVY_APP_ID=
NEXT_PUBLIC_PRIVY_CLIENT_ID=

# Solana/Indexers
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_HELIUS_RPC_URL=
NEXT_PUBLIC_XP_MINT=
```

## API Contracts

Implemented route handlers in frontend app (Next.js Route Handlers):

- `GET /api/enrollments?learnerId=&courseId=`  
  Returns enrollment state for a learner/course.
- `POST /api/enrollments`  
  Upserts enrollment payload: `{ learnerId, courseId, signature, source }`.

- `GET /api/progress?learnerId=&courseId=`  
  Returns lesson progress for learner/course.
- `POST /api/progress`  
  Upserts lesson completion payload:
  `{ learnerId, courseId, lessonId, totalLessons }`.

- `GET /api/streak?learnerId=`  
  Returns streak summary from stored active days.

- `GET /api/activity?learnerId=`  
  Returns recent completion/enrollment events.

- `GET /api/leaderboard?window=weekly|monthly|all-time`  
  Returns ranked leaderboard rows.

## Supabase Schema

Canonical schema is provided in:

- `onchain-academy/backend/supabase/schema.sql`

Main tables:

- `academy_users`
- `academy_linked_accounts`
- `academy_enrollments`
- `academy_lesson_completions`
- `academy_streak_days`
- `academy_activity_feed`
- `academy_leaderboard_snapshots`

## Backend-Signed Program Flows (still stubbed by design)

These remain intentionally backend-signed in later phases:

- `complete_lesson` (anti-cheat verification)
- `finalize_course`
- `issue_credential`
- `upgrade_credential`
- `award_achievement`

The current implementation keeps clean interfaces so these flows can be attached without breaking frontend routes.
