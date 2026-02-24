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

## Extending the Component Library

The project uses a custom component library in `app/src/components/ui/` built with [CVA](https://cva.style) (class-variance-authority) for variant management.

### Adding a New Component

1. Create the component file in `app/src/components/ui/`:

```typescript
// app/src/components/ui/tooltip.tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const tooltipVariants = cva(
  "absolute z-50 rounded-[2px] px-3 py-1.5 text-xs font-mono",
  {
    variants: {
      variant: {
        default: "bg-[var(--c-bg-card)] text-[var(--c-text)] border border-[var(--c-border-subtle)]",
        accent: "bg-[#00FFA3] text-black",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

interface TooltipProps extends VariantProps<typeof tooltipVariants> {
  content: string;
  children: React.ReactNode;
}

export function Tooltip({ content, variant, children }: TooltipProps) {
  // implementation
}
```

2. Follow these conventions:
   - Use `cva()` for all variant-based styling
   - Import `cn()` from `@/lib/utils` for class merging
   - Use design tokens (`var(--c-*)`, `var(--nd-*)`) instead of hardcoded colors
   - Use `rounded-[2px]` (sharp corners matching the platform aesthetic)
   - Export named components (not default exports)

### Adding CVA Variants to Existing Components

To add a new variant to an existing component (e.g., a new button variant):

```typescript
// In app/src/components/ui/button.tsx, add to the variants object:
variant: {
  // ... existing variants ...
  accent: "bg-[#03E1FF] text-black hover:bg-[#03E1FF]/90",
},
```

### Available Base Components

| Component | File | Variants |
|-----------|------|----------|
| Button | `button.tsx` | default, secondary, outline, ghost, destructive, link, retro |
| Badge | `badge.tsx` | default, secondary, outline, destructive |
| Card | `card.tsx` | default |
| Input | `input.tsx` | default |
| Progress | `progress.tsx` | default |
| Tabs | `tabs.tsx` | TabsList, TabsTrigger, TabsContent |
| Avatar | `avatar.tsx` | default |
| Skeleton | `skeleton.tsx` | default |
| EmptyState | `empty-state.tsx` | icon + title + description pattern |
| ErrorState | `error-state.tsx` | error display with retry |
| FilterPill | `filter-pill.tsx` | active/inactive pill filter |
| SearchInput | `search-input.tsx` | search with icon |
| Toast | `toast.tsx` | success, error, info |

## Adding New Page Routes

All pages live under `app/src/app/[locale]/` for i18n support.

### Step 1: Create the page file

```bash
mkdir -p app/src/app/\[locale\]/my-page
```

Create `page.tsx`:

```typescript
// app/src/app/[locale]/my-page/page.tsx
"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

export default function MyPage() {
  const t = useTranslations("myPage");
  const params = useParams();
  const locale = params.locale as string;

  return (
    <div className="px-4 pb-8 pt-24 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-[var(--c-text)]">
        {t("title")}
      </h1>
      {/* Page content */}
    </div>
  );
}
```

### Step 2: Add translations

Add the key namespace to each locale file (`app/src/messages/en.json`, `pt-br.json`, `es.json`):

```json
{
  "myPage": {
    "title": "My Page"
  }
}
```

### Step 3: Add navigation link (optional)

Edit `app/src/components/layout/navbar.tsx` and add to the `links` array:

```typescript
const links = [
  // ... existing links ...
  { href: `/${locale}/my-page`, label: t("myPage") },
];
```

Add the nav translation key to `messages/en.json` under the `nav` namespace.

### Step 4: Add error boundary

Create `error.tsx` alongside your page:

```typescript
// app/src/app/[locale]/my-page/error.tsx
"use client";

import { useEffect } from "react";

export default function MyPageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("MyPage error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="mb-4 text-2xl font-bold text-[var(--c-text)]">
          Failed to load page
        </h1>
        <button onClick={reset} className="rounded-[2px] border border-[var(--solana-green)] bg-transparent px-6 py-2.5 text-sm font-medium text-[var(--solana-green)]">
          Try again
        </button>
      </div>
    </div>
  );
}
```

### Page conventions

- Always include `"use client"` for interactive pages
- Use `pt-24` top padding to clear the fixed navbar
- Every page must have exactly one `<h1>` element
- Heading hierarchy must not skip levels (h1 -> h2 -> h3)
- Use `useTranslations()` for all user-facing strings

## Extending Gamification (Concrete Examples)

### Example: Adding a "Code Streak" achievement

1. **Define the achievement** in `app/src/lib/services/courses.ts`:

```typescript
{
  id: "code-streak-7",
  name: "Code Streak",
  description: "Complete coding challenges 7 days in a row",
  icon: "code",
  xpReward: 300,
  category: "streak",
}
```

2. **Add the on-chain achievement type** (requires program authority):

```typescript
await program.methods
  .createAchievementType({
    achievementId: "code-streak-7",
    name: "Code Streak",
    uri: "https://arweave.net/<metadata-hash>",
    xpReward: new BN(300),
    maxSupply: null, // unlimited
  })
  .rpc();
```

3. **Trigger in the backend** when the streak condition is met, call `award_achievement`.

### Example: Adding a seasonal XP multiplier

1. Edit the XP calculation in the backend lesson completion handler
2. Display the multiplier in the `SeasonalEventBanner` component (`app/src/components/gamification/seasonal-event-banner.tsx`)
3. The on-chain `complete_lesson` instruction accepts the XP amount as a parameter, so the backend controls multiplied values

### Example: Adding a new daily challenge type

Edit `app/src/components/gamification/daily-challenges.tsx` to add a new challenge variant to the challenges array. Challenges are currently client-side generated; for persistent challenges, store them in Supabase and fetch via API.

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
