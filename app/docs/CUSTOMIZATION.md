# Customization — Superteam Brazil LMS

How to customize theme, add languages, and extend gamification without changing core architecture.

## Theme customization

The app uses **CSS custom properties** (design tokens) and a **data-theme** attribute on `<html>`.

### Design tokens (`app/globals.css`)

- **Dark theme** (default): `:root` and `[data-theme="dark"]` define:
  - `--bg`, `--bg-page`, `--surface`, `--surface-elevated`, `--border`, `--text`, `--text-muted`, `--text-subtle`
  - `--accent`, `--accent-hover`, `--success`, `--chart-1` / `--chart-2` / `--chart-3`
- **Light theme**: `[data-theme="light"]` overrides the same variables with light backgrounds and dark text.

To add a new theme (e.g. “high contrast”):

1. Add a new block in `globals.css`, e.g. `[data-theme="high-contrast"] { ... }`.
2. In `lib/theme/context.tsx`, extend the `Theme` type and storage/UI to allow the new value.
3. Optionally add a theme toggle option in `components/ThemeToggle.tsx` or Settings.

To change accent color only: edit `--accent` and `--accent-hover` in both `:root` and `[data-theme="light"]`.

## Adding languages

i18n is handled by `lib/i18n/`.

1. **Messages**: In `lib/i18n/messages.ts`, add a new key to the `messages` object, e.g. `ja: { ... }` (copy from `en` and translate).
2. **Locale list**: Update the `locales` array (and any type) in `lib/i18n/context.tsx` to include the new code (e.g. `'ja'`).
3. **Language switcher**: `components/LanguageSwitcher.tsx` reads the same locale list; no change needed if you only add to `messages` and `locales`.
4. **Document lang**: If you want `<html lang="...">` to reflect the selected language, update `components/DocumentLang.tsx` (if present) or the root layout to use the current locale.

Course content can stay in one language; only UI strings need to be externalized in `messages`.

## Extending gamification

### XP and level

- **Level formula** is centralized: `xpToLevel(xp)` in `lib/services/learning-progress.ts` (Level = floor(sqrt(xp/100))). Change there to alter level curve.
- **Per-lesson XP**: Derived from `course.xpReward / course.lessons.length` in the UI; for different rules, adjust in `CourseContent` and lesson page or move to a small helper.

### Streaks

- **Logic**: `lib/services/streak.ts` — `getStreakData`, `recordActivity`. Streak “history” is an array of `{ date, completed }`. To add milestones (e.g. 7, 30, 100 days), add a function that reads `getStreakData(wallet)` and returns badges; then surface them in the dashboard or achievements section.

### Achievements

- **Implemented**: Achievement definitions in `lib/data/achievements.ts`; `getAchievements(wallet)` returns unlocked list; dashboard shows locked/unlocked badges. To add more, extend definitions and unlock logic in the service.

### Leaderboard

- **Course filter**: Already supported in the service: `getLeaderboard(timeframe, courseId?)`. Stub returns the same list; when you have an indexer, filter by course progress in the backend.

## Branding

- **Logo**: Replace or adjust the SVG in `components/Header.tsx` (LogoIcon) and any footer logo.
- **Favicon**: Replace `app/icon.*` / `app/apple-icon.*` per Next.js conventions.
- **Copy**: Hero and key CTAs are in `lib/i18n/messages.ts`; edit the `en` (and pt/es) objects.

## Feature flags

For gradual rollout, you can add a simple feature-flag layer (e.g. env or config object) and branch in components or pages. The codebase does not currently ship a flag system; add one in `lib/` and read it in the relevant components.
