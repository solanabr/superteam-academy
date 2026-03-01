# Gap-Closing Design: Challenges + Hindi + i18n Expansion

**Goal:** Close remaining competitive gaps — 100 coding challenges, Hindi locale, i18n expansion to 500+ keys.

**Context:** After the win strategy (10 tasks), the only meaningful gaps remaining are:
- Practice challenges: 1 vs competitors' 75
- Languages: 3 vs 4 (missing Hindi)
- i18n key count: 358 vs 615

## 1. Challenge Content Architecture

**Approach:** Separate challenge files under `app/src/lib/challenges/`

```
app/src/lib/challenges/
├── index.ts              — Re-exports + getAllChallenges()
├── types.ts              — CodingChallenge type
├── solana-fundamentals.ts — 20 challenges
├── defi.ts               — 20 challenges
├── nft-metaplex.ts       — 20 challenges
├── security.ts           — 20 challenges
└── token-extensions.ts   — 20 challenges
```

**100 challenges total:**
- 30 beginner, 38 intermediate, 32 advanced
- Each has: id, title, description, difficulty, category, language (rust/typescript)
- Each has: starterCode, solution, testCases[], hints[] (3 per), xpReward, estimatedMinutes

**Integration:** `getAllChallenges()` wired into mock-client for challenge page queries.

## 2. Hindi Locale

- Create `app/src/messages/hi.json` with all keys translated
- Add `hi` to routing.ts, request.ts, middleware
- Add Hindi option to language switcher

## 3. i18n Expansion to 500+ Keys

Add ~150 new keys across all 4 locales:
- admin (30), creator (20), challenges (25), achievements (20)
- errors (25), a11y labels (20), notifications (15), onboarding (15)

## 4. Integration + README

- Wire challenges into mock-client
- Update README badges (4 languages, 100 challenges, 500+ i18n keys)
- Update PR #39
- Verify CI green
