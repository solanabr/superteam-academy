# ADR 0004: Hybrid Service Layer (localStorage + On-Chain)

**Date:** 2026-02-12
**Status:** Accepted

## Context

The bounty requires clean service interfaces so local storage can be swapped for on-chain calls:

```typescript
interface LearningProgressService {
  getProgress(userId, courseId): Promise<Progress>;
  completeLesson(userId, courseId, lessonIndex): Promise<void>;
  getXP(userId): Promise<number>;
  getStreak(userId): Promise<StreakData>;
  getLeaderboard(timeframe): Promise<LeaderboardEntry[]>;
  getCredentials(wallet): Promise<Credential[]>;
}
```

The on-chain Anchor program exists but requires a backend signer for write operations (complete_lesson, finalize_course, claim_achievement). The frontend cannot sign these transactions. However, read operations (XP balance, enrollment state, credentials) can be performed client-side.

## Decision

Implement a **three-tier service architecture** with a hybrid service as the default:

### Service Hierarchy

| Service | Purpose | Data Source |
|---------|---------|-------------|
| `LocalStorageProgressService` | Full-featured offline implementation | Browser localStorage |
| `OnChainProgressService` | Read-only on-chain state | Solana RPC + Helius DAS API |
| `HybridProgressService` | Combines both, prefers chain data | Chain reads → localStorage fallback |

The `HybridProgressService` is exported as a singleton (`progressService`) and injected into the React context via `LearningProgressProvider`.

### Per-Operation Strategy

| Operation | Hybrid Behavior |
|-----------|----------------|
| `getXP()` | Read Token-2022 balance on-chain; return `max(chain, local)` for seamless transition |
| `getProgress()` | Read Enrollment PDA bitmap; fall back to localStorage if PDA doesn't exist |
| `enrollInCourse()` | Build and send `enroll` transaction if wallet connected; localStorage fallback |
| `completeLesson()` | localStorage only (requires backend signer for on-chain) |
| `getStreak()` | localStorage only (on-chain streaks updated by backend) |
| `getLeaderboard()` | Helius DAS `getTokenAccounts` for XP mint holders; mock data fallback |
| `getCredentials()` | Helius DAS `getAssetsByOwner` filtered by `track_id`; empty array fallback |
| `getAchievements()` | localStorage only (on-chain achievements updated by backend) |

### Wallet Lifecycle

```
1. App loads → HybridProgressService uses localStorage only
2. Wallet connects → setWallet(publicKey) activates on-chain reads
3. Wallet disconnects → setWallet(null) reverts to localStorage only
```

## Consequences

### Positive

- **Always works**: The app is fully functional without a wallet, without RPC access, and without the on-chain program deployed. Every feature works with localStorage alone.
- **Instant UI feedback**: Write operations update localStorage immediately. No waiting for transaction confirmation for the UI to reflect changes.
- **Progressive enhancement**: When wallet connects, on-chain data (real XP balance, real enrollment state, real credentials) seamlessly replaces localStorage approximations.
- **Clean swap path**: Each service implements the same interface. Connecting the backend signer means replacing `localStorage.completeLesson()` with an API call — no UI changes required.
- **Testable**: The `LocalStorageProgressService` is fully unit-tested (43 tests) without any RPC mocking.

### Negative

- **Data divergence**: localStorage and on-chain state can diverge if the user completes lessons offline and then connects a wallet. The `max(chain, local)` strategy for XP prevents regression but doesn't merge lesson-level progress.
- **No server-side writes**: Lesson completion, achievement claiming, and credential issuance cannot happen on-chain from the frontend. These require the backend signer flow described in the bounty spec.
- **RPC dependency**: On-chain reads fail silently if the RPC endpoint is down or rate-limited. The user sees localStorage data without knowing chain reads failed.

### Alternatives Considered

- **On-chain only**: Would require the backend signer service to be built and deployed. The bounty explicitly says to stub write operations and implement reads.
- **localStorage only**: Simpler, but misses the requirement to display real on-chain XP, credentials, and leaderboard data from devnet.
- **API-first with Supabase**: Would centralize state in a database, solving cross-device sync. But adds infrastructure and doesn't demonstrate the clean service interface pattern the bounty requests.
- **Single service with feature flags**: Could use one class with `if (wallet)` branches. The three-class pattern is more maintainable and makes the on-chain/local boundary explicit.
