# Shared TypeScript Interfaces

Located in `packages/types/src/`. Key types:

- `Course`, `Module`, `Lesson`, `LearningPath` — CMS content (`Course.creator` is a wallet, issue #478 — no separate `Instructor` type)
- `TestCase` — challenge test cases (input, expectedOutput, hidden flag)
- `UserProfile`, `Achievement`, `Certificate` — user data
- `Progress`, `StreakData`, `LeaderboardEntry`, `XpTransaction` — gamification
- `LearningProgressService` — abstract interface for future on-chain swap

Consumers import from `@superteam-academy/types`; `src/index.ts` re-exports everything.
