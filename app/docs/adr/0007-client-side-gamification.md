# ADR 0007: Client-Side Gamification State

**Date:** 2026-02-12
**Status:** Accepted

## Context

The bounty requires a comprehensive gamification system:

- **XP & Leveling**: XP earned per lesson/challenge/course with level derived from `floor(sqrt(xp / 100))`
- **Streaks**: Consecutive days of activity with calendar visualization and milestone rewards
- **Achievements**: 20 badges across 5 categories (progress, streaks, skills, community, special) — up to 256 supported by on-chain bitmap
- **Daily Goals**: Configurable XP target per day with progress tracking
- **Daily Quests**: 3 rotating quests generated deterministically from the date
- **Combo Multiplier**: XP multiplier (1x → 1.25x → 1.5x → 2x) based on consecutive completions within 30 minutes

The on-chain program stores XP as a Token-2022 soulbound token and achievements as a 256-bit bitmap on the LearnerProfile PDA. However, writing to these accounts requires a backend signer — the frontend cannot mint XP or update achievements directly.

## Decision

Implement all gamification state in **localStorage** via the `GamificationProvider` React context, with the intention of syncing to on-chain state when the backend signer flow is available.

### State Storage

All gamification state is persisted in localStorage, keyed by user ID:

| Key Pattern | Data | Sync Plan |
|-------------|------|-----------|
| `sta_xp_{userId}` | Total XP (number) | → Token-2022 balance |
| `sta_streak_{userId}` | Current/longest streak, last activity date | → LearnerProfile PDA streak fields |
| `sta_achievements_{userId}` | Achievement[] with claimed/unclaimed status | → LearnerProfile PDA bitmap |
| `sta_daily_goal_{userId}` | Target XP, current XP, date | Client-only (UX feature) |
| `sta_combo_{userId}` | Multiplier, last completion timestamp | Client-only (UX feature) |

### Quest Generation

Daily quests are deterministically generated from the date string to ensure consistency across page reloads:

```typescript
function generateDailyQuests(date: string): DailyQuest[] {
  const seed = hashDateString(date);
  const templates = QUEST_TEMPLATES; // 8 predefined quest types
  // Select 3 non-repeating quests using seeded shuffle
}
```

### Notification System

The `XPNotificationProvider` provides toast-style notifications:

- `showXPGain(amount)` — floating "+X XP" toast on lesson completion
- `showAchievement(name)` — achievement unlocked toast with icon
- `showLevelUp(level)` — level up celebration toast

Toasts auto-dismiss after 3 seconds with slide-in CSS animation.

## Consequences

### Positive

- **Instant feedback**: XP gains, streak updates, and achievement unlocks appear immediately without waiting for blockchain confirmation. This is critical for the "game feel" of the gamification system.
- **Offline-capable**: All gamification features work without network access. Users on unreliable connections (common in LATAM) still get the full experience.
- **No RPC costs**: Frequent gamification reads (every page load checks streak, daily goal, quests) don't hit the Solana RPC. localStorage reads are sub-millisecond.
- **Deterministic quests**: Seeded generation from date means quests are consistent for all users on the same day, enabling social comparison without a server.
- **Clean sync boundary**: The `LearningProgressService` interface abstracts storage. When backend signing is available, the `HybridProgressService` can write XP mints and achievement claims to chain while keeping localStorage as a read-ahead cache.

### Negative

- **Not tamper-proof**: Users can modify localStorage to inflate XP or claim achievements. Acceptable for the development phase — on-chain state is the canonical record once the backend signer is connected.
- **No cross-device sync**: Gamification state exists only on the device where it was earned. When wallet connects, on-chain XP is read and `max(chain, local)` is used, but streaks and achievements don't sync.
- **State fragmentation**: Gamification state is spread across multiple localStorage keys per user. A single `userState` object would be more atomic but harder to evolve incrementally.

### Alternatives Considered

- **Supabase Realtime**: Would provide cross-device sync and server authority for gamification state. Adds infrastructure and a real-time subscription cost. Noted in bounty FAQ as acceptable but not required.
- **On-chain only**: Would make all state tamper-proof and cross-device. But every XP gain requires a transaction (~0.5s confirmation), breaking the instant feedback loop. Also impossible without the backend signer.
- **Server-side API with database**: Traditional approach. Would centralize state and enable leaderboard integrity. Adds a backend service to deploy and maintain — the bounty focuses on frontend delivery.
- **IndexedDB**: Larger storage capacity and structured queries. Overkill for the current data volume (< 10KB per user). localStorage's synchronous API is simpler for the React context pattern.
