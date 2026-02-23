# Customization Guide

This guide explains how to customize the Superteam Academy platform for your community.

## Theme Customization

### Design Tokens

The platform uses the Solana Foundation's `nd-*` design system. All tokens are defined in `app/src/app/globals.css` within the `@theme inline` block.

#### Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--nd-bg-primary` | `#0A0A0A` | Page background |
| `--nd-bg-card` | `#0D0C11` | Card backgrounds |
| `--nd-text-primary` | `#FFFFFF` | Headings |
| `--nd-text-secondary` | `#ABABBA` | Body text |
| `--nd-text-body` | `#E0E0EC` | Content text |
| `--nd-border` | `#ECE4FD1F` | Default borders |
| `--nd-border-hover` | `#ECE4FD33` | Hover borders |
| `--nd-highlight-green` | `#55E9AB` | Primary accent |
| `--nd-saturated-green` | `#00FFA3` | Gamification accent |
| `--nd-blue` | `#03E1FF` | Secondary accent |
| `--nd-purple` | `#DC1FFF` | Credential accent |

To customize colors, edit the `:root` variables and the `@theme inline` block in `globals.css`.

#### Track Colors

Each learning track has a dedicated color defined in `app/src/lib/constants.ts`:

```typescript
export const TRACK_COLORS = {
  rust: "#F97316",      // Orange
  anchor: "#8B5CF6",    // Purple
  frontend: "#06B6D4",  // Cyan
  security: "#EF4444",  // Red
  defi: "#22C55E",      // Green
  mobile: "#EC4899",    // Pink
};
```

### Fonts

The platform uses ABC Diatype for headings and Geist for body text. Font files are in `app/src/fonts/`. To change fonts:

1. Replace font files in `app/src/fonts/`
2. Update `@font-face` declarations in `globals.css`
3. Update `--font-brand` and `--font-brand-mono` in the `@theme inline` block

### Typography Scale

CSS classes for consistent typography:

| Class | Size | Usage |
|-------|------|-------|
| `nd-heading-2xl` | 3.5rem/4.5rem | Hero titles |
| `nd-heading-xl` | 3rem | Page titles |
| `nd-heading-l` | 2rem | Section headers |
| `nd-heading-m` | 1.5rem | Subsection headers |
| `nd-heading-s` | 1.25rem | Card titles |
| `nd-heading-xs` | 1.125rem | Small headings |
| `nd-body-xl` | 1.25rem | Hero subtitles |
| `nd-body-l` | 1.125rem | Large body |
| `nd-body-m` | 1rem | Default body |
| `nd-body-s` | 0.875rem | Small body |
| `nd-body-xs` | 0.75rem | Captions |

### Signature Effects

- `.solana-border` — Animated shimmer border for pill elements
- `.solana-border-card` — Shimmer border for cards
- `.metallic-border` — Premium conic-gradient border for certificates/credentials
- `.gradient-text-hero` — Multi-color gradient text for hero headings

### Dark/Light Mode

The platform supports dark (default), light, and system modes via `next-themes`. The theme toggle is in the navbar and settings page.

## Adding Languages

### Step 1: Add locale to config

Edit `app/src/i18n/config.ts`:

```typescript
export const locales = ["en", "pt-br", "es", "fr"] as const; // Add your locale
export const localeLabels: Record<string, string> = {
  en: "English",
  "pt-br": "Portugues",
  es: "Espanol",
  fr: "Francais", // Add label
};
```

### Step 2: Create translation file

Copy `app/src/messages/en.json` to `app/src/messages/fr.json` and translate all strings.

### Step 3: Update routing

Edit `app/src/i18n/routing.ts` to include the new locale in the routing configuration.

### Step 4: Add to language switcher

The navbar and settings language switcher auto-populate from the config, so no additional UI changes are needed.

## Extending Gamification

### Adding Achievements

Achievements are defined in `app/src/lib/services/courses.ts` in the `achievements` array:

```typescript
{
  id: "new-achievement",
  name: "Bug Hunter",
  description: "Report 5 bugs in course content",
  icon: "shield",       // Lucide icon name
  xpReward: 200,
  category: "special",   // learning | streak | social | special
}
```

Available icons: trophy, flame, fire, code, users, star, shield, zap, crown, rocket.

The on-chain program supports up to 256 achievements via bitmap.

### XP Configuration

XP rewards are configurable per course in `courses.ts`:

| Action | Default Range |
|--------|---------------|
| Complete lesson | 10-50 XP |
| Complete challenge | 25-100 XP |
| Complete course | 500-2,000 XP |
| Daily streak bonus | 10 XP |
| First completion of day | 25 XP |

### Streak Milestones

Streak milestones trigger achievement unlocks:

| Days | Achievement |
|------|-------------|
| 7 | Week Warrior |
| 30 | Monthly Master |
| 100 | Consistency King |

### Adding Learning Tracks

1. Add the track type to `app/src/lib/services/types.ts`:
   ```typescript
   export type Track = "rust" | "anchor" | ... | "your-track";
   ```

2. Add label, color, and icon in `app/src/lib/constants.ts`

3. Add track icon mapping in `app/src/components/course/course-card.tsx`

4. Create courses with the new track in `courses.ts` or Sanity CMS

## CMS Integration

See [CMS_GUIDE.md](CMS_GUIDE.md) for detailed Sanity CMS setup and course creation workflow.

## Analytics

### GA4 Custom Events

| Event | Properties | When |
|-------|-----------|------|
| `course_viewed` | course_id, track | Course detail page load |
| `lesson_started` | course_id, lesson_id | Lesson page load |
| `lesson_completed` | course_id, lesson_id, xp_earned | Lesson marked complete |
| `challenge_run` | course_id, lesson_id, passed | Code challenge executed |
| `course_enrolled` | course_id | User enrolls in course |
| `wallet_connected` | wallet_type | Wallet connected |
| `achievement_unlocked` | achievement_id | Achievement earned |
| `search_performed` | query | Course search |
| `filter_applied` | filter_type, value | Filter used |

### PostHog

PostHog captures all GA4 events plus automatic page views and session recordings. Configure heatmaps in the PostHog dashboard.

### Sentry

Sentry captures unhandled exceptions and performance metrics. Configure alerts and issue tracking in the Sentry dashboard.

## Environment Variables

See the root [README.md](../README.md) for the complete list of environment variables.
