# Superteam Academy — Customization Guide

**Version:** 1.0
**Last Updated:** 2026-03-04
**Applies to:** Next.js frontend (`app/`), i18n layer (`src/messages/`), on-chain gamification

---

## Overview

This guide covers three customization domains:

1. **Themes** — Visual appearance via CSS custom properties
2. **Languages** — Adding new locales via `next-intl`
3. **Gamification** — Extending XP sources, achievements, streaks, and leaderboard

---

## 1. Themes

### 1.1 How Themes Work

Themes are implemented as CSS class selectors on the `<html>` element. Each theme defines a complete set of CSS custom properties. The `ThemeProvider` context applies the correct class based on the user's stored preference (`profiles.preferred_theme` in Supabase).

Theme definitions live in:

```
app/src/app/globals.css
```

### 1.2 Built-In Themes

#### Light Theme (`:root`)

The default theme. Clean and neutral.

| Token | Value | Purpose |
|-------|-------|---------|
| `--background` | `#FAFAFA` | Page background |
| `--foreground` | `#1b231d` | Body text |
| `--primary` | `#2f6b3f` | Buttons, links, active states |
| `--primary-foreground` | `#f7eacb` | Text on primary color |
| `--card` | `#FFFFFF` | Card background |
| `--accent` | `#e8f5ec` | Highlight backgrounds |

#### Dark Theme (`.dark`)

High-contrast dark variant with gold primary.

| Token | Value | Purpose |
|-------|-------|---------|
| `--background` | `#09090B` | Page background |
| `--foreground` | `#FAFAFA` | Body text |
| `--primary` | `#ffd23f` | Buttons, links, active states |
| `--primary-foreground` | `#1b231d` | Text on primary color |
| `--card` | `#18181B` | Card background |
| `--accent` | `#27272A` | Highlight backgrounds |

#### Brasil Theme (`.brasil`)

Signature theme for Superteam Brazil. Uses Brazilian flag colors: deep forest green background with gold primary.

| Token | Value | Purpose |
|-------|-------|---------|
| `--background` | `#1b231d` | Deep forest green |
| `--foreground` | `#f7eacb` | Warm cream text |
| `--primary` | `#ffd23f` | Brazilian gold |
| `--primary-foreground` | `#1b231d` | Text on primary color |
| `--card` | `#243529` | Dark green card |
| `--accent` | `#2f6b3f` | Green accent |
| `--muted-foreground` | `#b3c4a8` | Subdued text |

### 1.3 Complete Design Token Reference

Every theme must define all of the following custom properties:

**Layout and Color**

```
--background          Page background
--foreground          Default text color

--primary             Primary interactive color (buttons, links, focus rings)
--primary-foreground  Text color on primary backgrounds

--secondary           Secondary button/surface color
--secondary-foreground

--muted               Subdued surface (input backgrounds, borders)
--muted-foreground    Subdued text (placeholders, captions)

--accent              Highlight surface (hover states, badges)
--accent-foreground

--card                Card/panel background
--card-foreground

--destructive         Error and delete actions (default: red hue)

--border              Border color
--input               Input field background
--ring                Focus ring color
```

**Charts (Recharts)**

```
--chart-1 through --chart-5   Data visualization palette
```

**Brand Colors**

```
--gold               Platform gold (used independently of --primary)
--green-brand        Brand green
--green-accent       Secondary green
```

**Shape**

```
--radius             Base border radius (default: 0.625rem)
```

**Typography**

```
--font-sans          Body text (Inter)
--font-heading       Headings (Archivo)
--font-mono          Code blocks (Geist Mono)
```

Typography tokens are set globally via `@font-face` declarations and are not expected to change per theme. Override them only if the theme requires a distinct typeface.

### 1.4 Dark Variant Selector

The app uses a Tailwind `@custom-variant` to scope dark-mode utility classes. Any theme that should be treated as a dark variant must be added to this selector so that `dark:` prefixed utilities activate correctly:

```css
@custom-variant dark (&:is(.dark *, .brasil *, .your-theme *));
```

This lives at the top of `globals.css`. Add your theme class here if it is a dark-background theme.

### 1.5 Adding a New Theme

**Step 1 — Define the CSS class**

Add a new selector block to `app/src/app/globals.css`. Copy the full set of tokens from an existing theme as a starting point:

```css
.your-theme {
  --background: #...;
  --foreground: #...;
  --primary: #...;
  --primary-foreground: #...;
  --secondary: #...;
  --secondary-foreground: #...;
  --muted: #...;
  --muted-foreground: #...;
  --accent: #...;
  --accent-foreground: #...;
  --card: #...;
  --card-foreground: #...;
  --destructive: #...;
  --border: #...;
  --input: #...;
  --ring: #...;
  --chart-1: #...;
  --chart-2: #...;
  --chart-3: #...;
  --chart-4: #...;
  --chart-5: #...;
  --gold: #...;
  --green-brand: #...;
  --green-accent: #...;
  --radius: 0.625rem;
}
```

**Step 2 — Register as a dark variant (if applicable)**

If your theme uses a dark background, update the custom variant selector:

```css
@custom-variant dark (&:is(.dark *, .brasil *, .your-theme *));
```

**Step 3 — Register in ThemeProvider**

Add the theme identifier to `src/components/providers/theme-provider.tsx`. The `ThemeProvider` component manages the class applied to `<html>` and exposes the theme switcher API.

**Step 4 — Add i18n label**

Add a display name for the theme in each locale's message file. The settings section controls the label shown in the theme selector UI:

```json
// src/messages/en.json
{
  "settings": {
    "theme_your_theme": "Your Theme Name"
  }
}
```

Repeat for `pt-BR.json` and `es.json`, and any other supported locales.

**Step 5 — Persist user preference**

The `ThemeProvider` writes the selected theme to Supabase (`profiles.preferred_theme`) and reads it on session load. No additional wiring is needed beyond registering the theme identifier in Step 3.

---

## 2. Adding Languages (i18n)

### 2.1 How i18n Works

The app uses `next-intl` with the App Router `[locale]` dynamic segment. Supported locales are defined in the routing configuration. The middleware intercepts requests and redirects to the appropriate locale prefix.

**Supported locales (current):** `en`, `pt-BR`, `es`

**URL structure:** `/en/courses`, `/pt-BR/dashboard`, `/es/leaderboard`

User language preference is stored in `profiles.preferred_language` (Supabase) and synced on session load. Changing language triggers a `language_changed` analytics event.

### 2.2 Message File Structure

Message files live in `src/messages/{locale}.json`. Each file contains 795 strings organized by feature namespace:

```json
{
  "common": {
    "loading": "...",
    "error": "...",
    "save": "...",
    "cancel": "..."
  },
  "landing": {
    "hero_title": "...",
    "hero_subtitle": "..."
  },
  "courses": {
    "filter_difficulty": "...",
    "enroll": "...",
    "completed": "..."
  },
  "dashboard": {
    "your_courses": "...",
    "achievements": "...",
    "xp_earned": "..."
  },
  "leaderboard": {
    "weekly": "...",
    "monthly": "...",
    "alltime": "...",
    "rank": "..."
  },
  "settings": {
    "language": "...",
    "theme": "...",
    "notifications": "..."
  },
  "admin": {
    "approve": "...",
    "reject": "..."
  }
}
```

Course content (titles, lesson text, descriptions) is managed via Sanity CMS and remains in the original authored language. Only UI shell strings are translated.

### 2.3 Steps to Add a New Language

**Step 1 — Create the message file**

Copy `src/messages/en.json` to `src/messages/{locale}.json` and translate all 795 strings. Use BCP 47 locale tags (e.g., `fr`, `de`, `ja`, `zh-TW`).

```bash
cp app/src/messages/en.json app/src/messages/fr.json
# Translate app/src/messages/fr.json
```

**Step 2 — Register the locale in routing config**

Edit `src/i18n/routing.ts`:

```ts
export const routing = defineRouting({
  locales: ["en", "pt-BR", "es", "fr"],
  defaultLocale: "en",
});
```

The `next-intl` middleware reads this config and automatically handles locale detection, redirects, and the `[locale]` segment. No additional middleware changes are required.

**Step 3 — Add the locale label to message files**

Add a display name for the new locale to the language switcher in every existing message file. This ensures the language option appears correctly regardless of the user's current locale:

```json
// en.json, pt-BR.json, es.json — add to each
{
  "settings": {
    "language_fr": "French"
  }
}
```

**Step 4 — Verify**

Start the dev server and navigate to `/{locale}/courses`. The new locale should resolve correctly. Check that fallback behavior works for any missing keys (next-intl falls back to the default locale string).

### 2.4 i18n Notes

- Locale is part of the URL path, so locale changes trigger a navigation event.
- The `[locale]` segment is handled by the Next.js App Router layout at `app/src/app/[locale]/layout.tsx`.
- RTL languages require additional CSS work. Set `dir="rtl"` on the `<html>` element conditionally in the layout and audit layout components for directional assumptions.
- Date and number formatting should use `next-intl`'s `useFormatter()` hook, which respects the active locale's conventions automatically.

---

## 3. Extending Gamification

### 3.1 System Overview

Gamification in Superteam Academy spans two layers:

| Layer | What lives there |
|-------|-----------------|
| **On-chain** | XP token balance (Token-2022), AchievementType PDAs, AchievementReceipt PDAs, Credential NFTs |
| **Off-chain** | Streaks, daily challenges, leaderboard cache (Supabase) |

XP is the central unit. Level is derived as:

```
level = floor(sqrt(totalXP / 100))
```

This is a read-only calculation performed client-side from the on-chain XP balance. It requires no storage.

### 3.2 XP Sources

XP is minted on-chain via the `mint_xp` instruction, which requires a caller with an active `MinterRole` PDA. The backend service holds the `MinterRole` keypair.

**Current XP sources:**

| Source | Instruction | Amount |
|--------|-------------|--------|
| Lesson completion | `complete_lesson` | `course.xp_per_lesson` |
| Course completion bonus | `finalize_course` | `course.completion_bonus_xp` |
| Achievement award | `award_achievement` | `achievement_type.xp_reward` |
| Daily challenge correct answer | backend `mint_xp` call | Configured per challenge |

**Adding a new XP source:**

1. Add a route in `backend/src/routes/` that validates the qualifying action and calls the program's `mint_xp` instruction (or a relevant higher-level instruction) using the backend signer's `MinterRole`.

2. Add the new source identifier to the `XPTransaction.source` union type in the SDK or shared types file:

   ```ts
   type XPSource =
     | "lesson_completion"
     | "course_completion"
     | "achievement"
     | "daily_challenge"
     | "your_new_source";
   ```

3. The leaderboard sync job (`/api/leaderboard/sync`) queries on-chain XP balances via Helius DAS API. Because XP is stored on-chain as a Token-2022 balance, any new source is automatically reflected in the leaderboard without additional sync changes.

**XP cap enforcement:** The `MinterRole` PDA stores an optional per-call XP cap (`cap_per_call`). Set this when registering the minter to limit how much XP a single call can mint, preventing runaway reward bugs.

### 3.3 Achievements

#### How Achievements Work

Each achievement type is an on-chain `AchievementType` PDA. Awarding an achievement does two things:

1. Creates an `AchievementReceipt` PDA (prevents double-awarding via init collision).
2. Mints a soulbound Metaplex Core NFT to the learner's wallet.

The `AchievementCheckerService` runs client-side when users visit their dashboard. It evaluates eligibility criteria and surfaces claimable achievements.

#### Adding a New Achievement Type

**Step 1 — Create the type on-chain**

Use the admin dashboard (`/admin`) or call the backend API endpoint directly:

```
POST /admin/create-achievement-type
{
  "achievement_id": "streak_30",
  "name": "30-Day Streak",
  "metadata_uri": "https://arweave.net/...",
  "collection": "<collection_pubkey>",
  "xp_reward": 500,
  "supply_cap": 0
}
```

`supply_cap: 0` means unlimited. A nonzero cap limits the total number of awards globally.

**Step 2 — Define eligibility criteria**

Add a rule to `src/services/achievement-criteria.ts`. Each rule is a function that receives the user's current stats and returns a boolean:

```ts
{
  achievement_id: "streak_30",
  check: (stats: UserStats) => stats.longestStreak >= 30,
}
```

**Step 3 — Verify checker integration**

The `AchievementCheckerService` iterates all registered criteria on dashboard load. No additional wiring is required once the criterion is registered in `achievement-criteria.ts`.

#### Achievement Categories

Categories are metadata labels used for display grouping. They do not affect on-chain behavior. Current categories:

- `Progress` — Course and lesson milestones
- `Streak` — Consecutive activity milestones
- `Skill` — Topic or track mastery
- `Community` — Social and referral actions
- `Special` — Time-limited or event-based awards

Add new categories by using the category string in the admin creation flow and updating the filter UI if category-based filtering is displayed.

### 3.4 Streaks

Streak logic is entirely off-chain. State is stored in the Supabase `user_stats` table.

**Key fields:**

| Field | Description |
|-------|-------------|
| `current_streak` | Consecutive days of activity |
| `longest_streak` | All-time best streak |
| `last_activity_date` | ISO date of most recent qualifying activity |
| `streak_freezes` | Remaining freezes this month (max 3, refreshes monthly) |

**Entry point:** `src/services/gamification.ts` — `recordActivity()`

This function is called on lesson completion. It:

1. Checks if activity was already recorded today (idempotent).
2. If the last activity was yesterday, increments `current_streak`.
3. If the last activity was more than one day ago, checks for a streak freeze to consume before resetting.
4. Updates `longest_streak` if the current streak exceeds it.
5. Fires milestone events at 3, 7, 14, and 30 days.

**Modification reference:**

| Change | Location |
|--------|----------|
| Change freeze count | Initial value in `user_stats` table default + `recordActivity()` reset logic |
| Add streak milestones | Threshold array in `src/hooks/use-player-stats.ts` |
| Change streak reset window | Date comparison logic in `recordActivity()` |
| Change freeze refresh period | Month boundary check in `recordActivity()` |

### 3.5 Daily Challenges

Daily challenges are quiz-format questions managed in the Supabase `daily_challenges` table. One challenge is surfaced per user per day.

**Table schema:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `question` | text | The challenge question |
| `options` | jsonb | Array of answer strings |
| `correct_index` | int | Zero-based index of correct answer |
| `xp_reward` | int | XP minted on correct answer |
| `category` | text | Free-form category string |
| `active` | boolean | Whether the challenge is in rotation |

**Adding challenges:** Use the admin dashboard (`/admin` -> Daily Challenges tab). Categories are free-form strings. Any category string used in the `category` column will appear automatically in filtering UI without code changes.

**XP on correct answer:** The backend validates the submitted answer and calls `mint_xp` via the MinterRole. The XP amount is taken from `xp_reward` on the challenge record.

### 3.6 Leaderboard

The leaderboard pulls XP balances from Helius DAS API and caches rankings in Supabase. Rankings are available in three timeframes: weekly (7 days), monthly (30 days), and all-time.

**Supported filters:**

| Filter | Description |
|--------|-------------|
| Timeframe | `weekly`, `monthly`, `alltime` |
| Course | Restrict to XP earned in a specific course |
| Source | Restrict to a specific XP source type |

**Adding new filters:**

1. Extend the params accepted by `LeaderboardService.getLeaderboard()` in `src/services/leaderboard.ts`.
2. Update the Supabase query to apply the new filter condition.
3. Update the leaderboard UI component to expose the new filter control.

**Sync job:** `/api/leaderboard/sync` reads on-chain XP balances via Helius and writes ranked snapshots to Supabase. Because XP is a Token-2022 balance on-chain, the sync job does not need updating when new XP sources are added — it reads the total balance regardless of source.

---

## Quick Reference

### Theme Checklist

- [ ] CSS class added to `globals.css` with all required tokens
- [ ] Added to `@custom-variant dark` selector if dark-background theme
- [ ] Registered in `theme-provider.tsx`
- [ ] Display name added to all locale message files under `settings`

### Language Checklist

- [ ] `src/messages/{locale}.json` created with all 795 strings translated
- [ ] Locale added to `locales` array in `src/i18n/routing.ts`
- [ ] Locale label added to all existing message files
- [ ] RTL CSS handled if applicable

### Gamification Checklist

| Task | File(s) |
|------|---------|
| New XP source | `backend/src/routes/`, shared `XPSource` type |
| New achievement type | Admin dashboard + `src/services/achievement-criteria.ts` |
| New streak milestone | `src/hooks/use-player-stats.ts` |
| New daily challenge | Admin dashboard (`/admin`) |
| New leaderboard filter | `src/services/leaderboard.ts` + leaderboard UI component |

---

## Related Documentation

- `docs/SPEC.md` — On-chain program specification (XP minting, achievement instructions)
- `docs/ARCHITECTURE.md` — System diagrams, account maps, PDA derivation
- `docs/INTEGRATION.md` — Frontend integration guide (PDA derivation, instruction usage)
