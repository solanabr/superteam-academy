# CUSTOMIZATION Guide

This guide covers the required customization areas for this project:

1. Theme customization
2. Adding languages
3. Extending gamification

## 1) Theme Customization

## Where theme is controlled

- Theme state hook: [app/src/hooks/use-theme.ts](../app/src/hooks/use-theme.ts)
- Global design tokens + dark/light CSS variables: [app/src/app/globals.css](../app/src/app/globals.css)
- Provider wiring: [app/src/components/providers/theme-provider.tsx](../app/src/components/providers/theme-provider.tsx)

## What to change

### A) Design tokens (recommended first)

In `globals.css`:

- edit `:root` variables for light mode
- edit `.dark` variables for dark mode
- update shared primitives (`--radius`, chart/sidebar tokens) as needed

This keeps component styles consistent without hard-coding colors in many files.

### B) Default theme behavior

In `use-theme.ts`:

- default is currently `dark`
- change `const [theme, setThemeState] = useState<Theme>('dark')` if needed
- update localStorage key logic only if migration is handled

### C) Theme toggle behavior

- `toggleTheme()` currently flips resolved light/dark
- system theme support is built in through `Theme = 'light' | 'dark' | 'system'`

## Theme regression checks

- dashboard, courses, profile, settings in both light and dark
- text contrast for muted/secondary states
- cards, borders, ring/focus styles

---

## 2) Adding Languages

## Current i18n implementation

- Translation hook: [app/src/hooks/use-translation.ts](../app/src/hooks/use-translation.ts)
- Locale registry/types: [app/src/locales/index.ts](../app/src/locales/index.ts)
- Current locales:
  - [app/src/locales/en.ts](../app/src/locales/en.ts)
  - [app/src/locales/es.ts](../app/src/locales/es.ts)
  - [app/src/locales/pt-br.ts](../app/src/locales/pt-br.ts)

## Add a new language (example: French `fr`)

1. Create `app/src/locales/fr.ts` by copying `en.ts`.
2. Translate all keys (keep key structure identical).
3. Update [app/src/locales/index.ts](../app/src/locales/index.ts):
   - export `fr`
   - extend `Locale` type to include `'fr'`
   - add `'fr'` to `locales`
   - add locale label in `localeNames`
4. Update any language selection UI to expose the new locale option.
5. Validate fallback behavior:
   - missing keys fallback to English
   - if missing in English, fallback formatter shows readable text

## i18n behavior notes

- Selected locale is stored in localStorage key `locale`.
- Document language (`document.documentElement.lang`) is updated automatically.
- Cross-tab updates are handled via storage event + custom locale change event.

---

## 3) Extending Gamification

## Core extension points

### Types/config constants

- [app/src/types/gamification.ts](../app/src/types/gamification.ts)
  - XP reward ranges (`XP_REWARDS`)
  - streak milestones (`STREAK_MILESTONES`)
  - achievement catalog (`ACHIEVEMENTS`)
  - criteria types and transaction types

### Business logic service

- [app/src/lib/services/gamification-service.ts](../app/src/lib/services/gamification-service.ts)
  - XP award logic
  - streak progression and bonuses
  - achievement unlock checks
  - leaderboard aggregation

### Client integration hook

- [app/src/hooks/useGamification.ts](../app/src/hooks/useGamification.ts)
  - fetch profile/leaderboard
  - complete lesson/course/challenge actions
  - sync XP and activity recording

### Swappable learning progress contract

- [app/src/services/learning-progress.ts](../app/src/services/learning-progress.ts)
  - `ILearningProgressService`
  - `LocalLearningProgressService`
  - `OnChainLearningProgressService`
  - provider switch via `NEXT_PUBLIC_PROGRESS_SERVICE_MODE=local|onchain`

## Common customization tasks

### A) Change XP economics

1. Update constants in `types/gamification.ts`.
2. Update server rules in `gamification-service.ts` (if logic depends on old values).
3. Verify UI calculations and labels still match.

### B) Add/modify achievements

1. Edit `ACHIEVEMENTS` catalog.
2. Ensure `criteria.type` is supported in service switch logic.
3. If adding a new criteria type:
   - extend `AchievementCriteriaType`
   - implement progress computation in service
   - update any display filters/grouping in UI

### C) Adjust streak milestones

1. Edit `STREAK_MILESTONES`.
2. Verify milestone reward logic in `recordActivity()`.
3. Validate streak UI displays new threshold names and rewards.

### D) Extend leaderboard behavior

- For DB-backed logic: update `GamificationService.getLeaderboard()`
- For on-chain default flow: check [app/src/app/api/leaderboard/onchain/route.ts](../app/src/app/api/leaderboard/onchain/route.ts)
- Indexer providers:
  - custom
  - helius
  - alchemy

## On-chain alignment notes

If `onchain` mode is enabled, keep gamification values consistent across:

- UI display
- API response values
- Solana/integration assumptions (XP token and credential flows)

References:

- [docs/INTEGRATION.md](INTEGRATION.md)
- [docs/SPEC.md](SPEC.md)

---

## Suggested Validation Checklist

After customization changes:

- auth/session and dashboard load
- theme works in light/dark/system
- all translated surfaces render without broken keys
- gamification APIs return expected fields
- leaderboard (default + filtered) still works
- profile/certificate values remain consistent
- no new lint/type/runtime errors
