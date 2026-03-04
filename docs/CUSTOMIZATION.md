# Customization Guide

This guide covers practical extension points for theming, localization, and gamification.

## 1. Theme Customization

Theme behavior is managed by `next-themes` and CSS variables.

Relevant files:

- `providers/ThemeProvider.tsx`
- `components/app/ThemeToggle.tsx`
- `app/globals.css`

### 1.1 Change default theme

In `providers/ThemeProvider.tsx`:

- `defaultTheme` controls initial theme
- `storageKey` controls persisted localStorage key

### 1.2 Adjust palette and UI tone

In `app/globals.css`:

- `:root` contains light theme tokens
- `.dark` contains dark theme tokens
- Tokens include `--background`, `--foreground`, `--card`, `--primary`, `--border`, etc.

Use these tokens first before adding hard-coded colors.

### 1.3 Keep app shell visual consistency

Also in `app/globals.css`:

- `.floating-sidebar`
- `.floating-content-panel`

These classes produce the elevated 3D panel treatment. If you adjust radius/border/shadow here, sidebar and content remain visually aligned.

## 2. Add a New Language

Current i18n is powered by `next-intl`.

Relevant files:

- `i18n/request.ts`
- `messages/*.json`
- `components/app/LanguageSwitcher.tsx`
- `app/actions/locale.ts`

### 2.1 Steps

1. Add locale code to `locales` in `i18n/request.ts`.
2. Add new message file: `messages/<locale>.json`.
3. Copy all top-level namespaces from existing files (`common`, `dashboard`, `course`, etc.).
4. Add display label to `LOCALES` in `LanguageSwitcher.tsx`.
5. Test language switch in navbar/app header.

### 2.2 Best practices

- Keep key structure identical across all locale JSON files.
- Avoid deleting keys that are used by older pages.
- Use locale-appropriate date/time copy where applicable.

## 3. Extend Gamification

Gamification in this app combines chain state, backend actions, and UI-only progress visuals.

Core areas:

- XP balance hooks: `hooks/useXpBalance.ts`, `hooks/useXpBalanceFor.ts`
- Leaderboard UI/API: `components/app/LeaderboardContent.tsx`, `app/api/leaderboard/route.ts`
- Challenges: `hooks/useChallenges.ts`, `app/api/challenges/*`
- Achievements UI: `components/app/ProfileAchievementsContent.tsx`
- Achievement admin actions: hooks like `useCreateAchievementType`, `useAwardAchievement`

### 3.1 Add a new achievement in UI

For display-only progress cards, edit `ProfileAchievementsContent.tsx`:

- Add a new item to the `achievements` array
- Choose category, icon, target, and metric source

### 3.2 Add new on-chain achievement types

Use admin flow (backend-mediated):

1. Create AchievementType (`create-achievement-type` action)
2. Award to recipient (`award-achievement` action)
3. NFT receipt is minted as soulbound credential

Frontend hooks already exist for these actions.

### 3.3 Add XP reward surfaces

Typical extension points:

- New challenge types in backend + `app/api/challenges/*`
- New dashboard modules or completion triggers
- Additional query invalidation in mutation success handlers

When adding rewards, always invalidate:

- `xpBalance`
- relevant feature query (`enrollment`, `challenges`, `leaderboard`, etc.)

## 4. Community and Progress Tuning

### 4.1 Discussion behavior

Files:

- `components/app/DiscussionsListContent.tsx`
- `app/api/community/threads/*`
- `lib/community-db.ts`

You can tune:

- Filters (`all/question/discussion`)
- Search behavior
- Per-page limits
- Validation rules for title/body size

### 4.2 Course progression UX

Files:

- `app/(app)/courses/[slug]/page.tsx`
- `app/(app)/courses/[slug]/lessons/[id]/page.tsx`
- `lib/lesson-bitmap.ts`

Use these to adjust:

- Unlock rules
- Continue-learning behavior
- Completion state messaging

## 5. Safe Customization Checklist

Before shipping a customization:

1. Run `pnpm exec tsc --noEmit`.
2. Validate both light and dark themes.
3. Validate mobile + desktop layouts.
4. Validate wallet connected/disconnected flows.
5. Validate translations in each supported locale.
6. If touching gamification, verify cache invalidation and refreshed values.
