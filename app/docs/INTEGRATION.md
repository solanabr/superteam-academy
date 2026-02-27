# Integration guide — Superteam Academy LMS

This doc describes how the frontend integrates with the on-chain program and backend. The full spec and Anchor program live at [github.com/solanabr/superteam-academy](https://github.com/solanabr/superteam-academy).

## Service layer

The app uses a **learning progress service** abstraction so you can swap stub (localStorage) for on-chain/API without changing UI.

- **Interface**: `lib/services/learning-progress.ts` → learning progress service (getProgress, getXPBalance, getLeaderboard, etc.)
- **Stub**: current implementation uses localStorage and API routes; mock leaderboard/credentials.

### Methods to implement for production

| Method | Stub behavior | Production |
|--------|----------------|------------|
| `getProgress(wallet)` | Read from localStorage | Aggregate from chain + indexer |
| `getProgressForCourse(wallet, courseId)` | From localStorage | Enrollment PDA + 256-bit lesson bitmap |
| `completeLesson(wallet, courseId, lessonId)` | Append to localStorage, add XP, update streak | Backend-signed tx (stub until program connected) |
| `getXp(wallet)` | From localStorage | Token-2022 soulbound balance (NonTransferable) |
| `getStreak(wallet)` | From localStorage (frontend-only) | Keep frontend-only or sync to DB/CMS |
| `getLeaderboard(timeframe, courseId?)` | Mock list | Index XP token balances; optional course filter (Helius DAS or custom indexer) |
| `getCredentials(wallet)` | Empty array | Metaplex Core NFTs (PermanentFreezeDelegate), one per track |
| `getAchievements(wallet)` | Empty array | AchievementReceipt soulbound Core NFTs |
| `enroll(wallet, courseId)` | Add to localStorage | Learner signs enroll tx → Enrollment PDA |
| `isEnrolled(wallet, courseId)` | From localStorage | Check Enrollment PDA exists |

### Level formula

- **Level** = `floor(sqrt(xp / 100))`
- Exported as `levelFromXp(xp)` in `lib/services`.

### XP and credentials on-chain

- **XP**: Soulbound fungible Token-2022 (NonTransferable). Balance = XP. Mint/accounts per program spec.
- **Credentials**: Metaplex Core NFTs, soulbound via PermanentFreezeDelegate. One NFT per learning track; upgrades in place (no wallet clutter). Attributes: track, level, courses completed, total XP.
- **Enrollments**: PDAs per learner per course. Lesson progress = 256-bit bitmap (up to 256 lessons). Closeable after completion to reclaim rent; proof preserved via credential NFT and tx history.
- **Achievements**: AchievementType (badge def) + AchievementReceipt per award, soulbound Core NFTs.

### Leaderboard

- Off-chain. Derive by indexing XP token balances (e.g. Helius DAS API or custom indexer). Timeframes: weekly, monthly, all-time (filter by last activity or balance snapshot).

### Streaks

- Frontend-only in spec. Current stub: store in localStorage; optional sync to backend/DB later.

## Account structures and instructions

See the repo’s `docs/` and `onchain-academy/` for:

- Account layouts (Course PDA, Enrollment PDA, XP mint, Credential NFT, etc.)
- Instruction parameters and event signatures.
- How to wire `completeLesson`, course finalization, and credential issuance (stub until backend-signed txs are connected).

## Monorepo layout (reference)

When contributing to [solanabr/superteam-academy](https://github.com/solanabr/superteam-academy):

```
/root
  docs/             # INTEGRATION.md, ARCHITECTURE.md, etc.
  onchain-academy/  # Anchor program (if present)
  app/              # frontend client (this app)
  backend/          # backend (if present)
```

Delivery is a PR to the repo; frontend lives in the `app` folder per the monorepo structure.
