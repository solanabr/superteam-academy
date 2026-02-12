# Superteam Academy — Architecture

Covers both the **on-chain program** and the **frontend** application. On-chain details are in [SPEC.md](./SPEC.md).

---

## System overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 14, App Router)                │
│                                                                     │
│  Wallet Adapter ──► LearningProgressService ──► Stub / On-chain    │
│       │                        │                     │              │
│       │                        ├── getXP             ├── Helius DAS │
│       │                        ├── getProgress        ├── Photon     │
│       │                        ├── getCredentials     └── Anchor SDK │
│       │                        ├── getLeaderboard                    │
│       │                        └── getStreak                         │
└─────────────────────────────────────────────────────────────────────┘
```

- **Wallet**: Solana Wallet Adapter (multi-wallet); wallet required for XP display, credentials, and leaderboard identity.
- **LearningProgressService**: Single abstraction for progress, XP, streak, leaderboard, credentials. Implementations:
  - **Stub** (default): localStorage + in-memory; used until backend/on-chain is connected.
  - **On-chain**: Token accounts for XP, indexer for leaderboard/credentials, Anchor for enrollments/completions.

---

## Frontend structure

### Routes (App Router)

| Path | Purpose |
|------|---------|
| `/` | Landing: hero, CTAs, learning path preview, features, footer |
| `/courses` | Course catalog: filterable grid, search |
| `/courses/[slug]` | Course detail: modules/lessons, progress, enrollment CTA |
| `/courses/[slug]/lessons/[id]` | Lesson view: content + code challenge (split layout) |
| `/dashboard` | User dashboard: current courses, XP, level, streak, achievements |
| `/profile`, `/profile/[username]` | Profile: credentials, completed courses, skills |
| `/leaderboard` | Rankings by XP; weekly/monthly/all-time |
| `/settings` | Profile, account, preferences, privacy |
| `/certificates/[id]` | Certificate view + verification link (Explorer) |

All routes are under `[locale]` for i18n (en, pt-BR, es).

### Component layout

- **`src/components/layout`**: Header, LanguageSwitcher, ThemeSwitcher
- **`src/components/providers`**: WalletProvider, ThemeProvider
- **`src/components/ui`**: Button, Select, etc. (Radix-based)
- **`src/lib`**: types, `LearningProgressService` interface, stub implementation, `levelFromXP` util

### Data flow

1. **Auth**: Wallet connection via Wallet Adapter; `publicKey` used as `userId` for stub and for on-chain identity.
2. **Progress/XP/Streak**: `LearningProgressService` (stub) reads/writes localStorage; swap for API + on-chain later.
3. **Leaderboard**: Stub aggregates from localStorage XP keys; production uses Helius DAS (token holders) or custom indexer.
4. **Credentials**: Stub returns empty or stored list; production uses Photon/DAS for compressed NFTs.

---

## Service interface: LearningProgressService

Used so the app can switch from stub to on-chain without changing UI code:

```ts
interface LearningProgressService {
  getProgress(userId: string, courseId: string): Promise<Progress>;
  completeLesson(userId: string, courseId: string, lessonIndex: number): Promise<void>;
  getXP(userId: string): Promise<number>;
  getStreak(userId: string): Promise<StreakData>;
  getLeaderboard(timeframe: 'weekly' | 'monthly' | 'alltime'): Promise<LeaderboardEntry[]>;
  getCredentials(wallet: PublicKey): Promise<Credential[]>;
}
```

- **Stub**: `createStubLearningProgressService()` in `src/lib/stub-learning-progress.ts`.
- **On-chain**: Implement using Config/XP mint, enrollment PDAs, Photon/Helius; inject via provider or module.

---

## On-chain integration points (when connected)

| Feature | Source |
|--------|--------|
| XP balance | Token-2022 (soulbound) ATA for current season mint |
| Level | `floor(sqrt(xp / 100))` |
| Leaderboard | Helius DAS `getTokenHolders(currentMint)` sorted by balance |
| Credentials | Photon / ZK Compression indexer or Metaplex Bubblegum |
| Enrollment / complete_lesson | Anchor instructions (backend-signed); stubbed in UI |

Full on-chain details (PDAs, instructions, events, CU budgets): [SPEC.md](./SPEC.md).

---

## Performance

- Lighthouse targets: Performance 90+, Accessibility 95+, Best Practices 95+, SEO 90+.
- Core Web Vitals: LCP &lt; 2.5s, FID &lt; 100ms, CLS &lt; 0.1.
- Use: code splitting, lazy loading, static generation where possible, image optimization, bundle size care.
