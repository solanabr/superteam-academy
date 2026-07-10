# Shared TypeScript Interfaces

Located in `packages/types/src/`. Key types:

- `Course`, `Module`, `Lesson`, `Instructor`, `LearningPath` — CMS content
- `TestCase` — challenge test cases (input, expectedOutput, hidden flag)
- `UserProfile`, `Achievement`, `Certificate` — user data
- `Progress`, `StreakData`, `LeaderboardEntry`, `XpTransaction` — gamification
- `LearningProgressService` — abstract interface for future on-chain swap

Consumers import from `@superteam-academy/types`; `src/index.ts` re-exports everything.
