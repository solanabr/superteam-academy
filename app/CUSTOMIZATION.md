# Superteam Academy -- Customization Guide

A developer reference for extending, theming, and deploying the Superteam Academy platform.

---

## Theme Customization

### Color System

The app uses **Tailwind CSS v4** with the **oklch** perceptual color space. All design tokens are defined as CSS custom properties in `src/app/globals.css`.

Light and dark themes are declared in `:root` and `.dark` respectively:

```css
:root {
  --primary: oklch(0.541 0.267 293);     /* Purple */
  --accent: oklch(0.592 0.176 152);       /* Green */
  --destructive: oklch(0.577 0.245 27.325); /* Red */
  /* ... */
}

.dark {
  --primary: oklch(0.637 0.249 293);
  --accent: oklch(0.637 0.176 152);
  /* ... */
}
```

### shadcn/ui Integration

All UI components come from shadcn/ui and consume the CSS custom properties. This means changing a single variable propagates across all components that use it (buttons, badges, cards, progress bars, etc.).

### Theme Switching

Themes are managed by `next-themes` via the `ThemeProvider` component (`src/components/providers/theme-provider.tsx`). Three modes are supported:
- **Light** (default)
- **Dark** (class `.dark` applied to `<html>`)
- **System** (follows OS preference)

### Changing the Primary Color

1. Open `src/app/globals.css`
2. Update `--primary` in both `:root` (light) and `.dark` (dark) blocks
3. Update `--primary-foreground` if needed for contrast
4. The change immediately applies to all primary-colored elements

**Example -- switching to blue:**

```css
:root {
  --primary: oklch(0.55 0.2 250);
  --primary-foreground: oklch(0.985 0 0);
}
.dark {
  --primary: oklch(0.65 0.2 250);
  --primary-foreground: oklch(0.985 0 0);
}
```

**Tip:** Use the [oklch color picker](https://oklch.com) to find values. The three components are Lightness (0-1), Chroma (0-0.4), and Hue (0-360).

---

## Adding a New Track

Tracks require both CMS content and a few code-side mappings:

### 1. Create the Track Document in Sanity

In Sanity Studio, create a new Track document with:
- A unique `trackId` (e.g., `"5"`)
- `name`, `description`, `icon`, `color`

### 2. Update `TRACK_LABELS` Map

In `src/app/[locale]/(platform)/profile/[wallet]/page.tsx`, add the new track to the `TRACK_LABELS` record:

```typescript
const TRACK_LABELS: Record<number, string> = {
  1: 'Solana Core',
  2: 'DeFi',
  3: 'NFT',
  4: 'Security',
  5: 'Your New Track',  // <-- add here
};
```

This map drives the skill radar chart on user profiles.

### 3. Add Track Gradient in Course Cards

In `src/components/courses/course-card.tsx`, add a gradient for the new track ID:

```typescript
const TRACK_GRADIENTS: Record<number, string> = {
  1: 'from-purple-600 via-violet-600 to-indigo-700',  // Solana Core
  2: 'from-blue-600 via-cyan-600 to-teal-600',        // DeFi
  3: 'from-pink-600 via-rose-500 to-orange-500',       // NFT
  4: 'from-orange-600 via-amber-600 to-yellow-600',    // Security
  5: 'from-emerald-600 via-green-600 to-lime-600',    // <-- your gradient
};
```

Courses without a matching track ID fall back to `from-primary via-primary/80 to-accent`.

### 4. Add Icon Mapping (if using custom icons)

If the `icon` field in the Track document references a custom icon, ensure it maps to an actual icon component in the track badge component (`src/components/courses/track-badge.tsx`).

---

## Adding a New Course

Standard courses are **purely CMS-driven** -- no code changes required:

1. Create Track, Lessons, Modules, and Course documents in Sanity Studio
2. The app automatically renders the course in the catalog, course detail, and lesson views

See **CMS_GUIDE.md** for the detailed step-by-step process.

Code changes are only needed if you want custom track gradients (see above) or new lesson types (see below).

---

## Adding New Lesson Types

The lesson content system uses typed content sections rendered sequentially.

### Current Section Types

Defined in `src/lib/sanity/seed-data.ts` as the `SeedContentSection` interface:

| Type | Purpose |
|---|---|
| `text` | Markdown/plain text paragraph |
| `code` | Syntax-highlighted code block (with `language` field) |
| `admonition` | Callout box with variant: `tip`, `warning`, or `info` |
| `key-concepts` | Bulleted list of key concepts (array of strings) |

### Adding a New Type

1. **Extend the interface** in `src/lib/sanity/seed-data.ts`:

```typescript
export interface SeedContentSection {
  type: 'text' | 'code' | 'admonition' | 'key-concepts' | 'quiz'; // add here
  content?: string;
  language?: string;
  admonitionType?: 'tip' | 'warning' | 'info';
  concepts?: string[];
  quizOptions?: string[];     // new field for your type
  quizAnswer?: number;        // new field for your type
}
```

2. **Add a case in the renderer** -- locate the component that switches on `section.type` and add your rendering logic.

3. **Update the Sanity schema** if this content is authored in the CMS (rather than seed data only). Add the new block type to the rich text configuration in `sanity/schemas/lesson.ts`.

---

## Adding a New Language

The app supports `en` (English), `pt` (Portuguese), and `es` (Spanish). To add a new locale:

### 1. Add to Routing Config

In `src/i18n/routing.ts`, add the locale code to the `locales` array:

```typescript
export const routing = defineRouting({
  locales: ['en', 'pt', 'es', 'fr'],  // add 'fr' for French
  defaultLocale: 'en',
});
```

### 2. Create a Message Bundle

Create `src/messages/fr.json` (or whatever your locale is). Copy the structure from an existing locale file (e.g., `en.json`) and translate all values.

### 3. Update Sanity Localized Helpers

In `sanity/schemas/helpers/localized.ts`, add the new locale field to each helper function:

```typescript
export function localizedString(name: string, title: string) {
  return defineField({
    name,
    title,
    type: 'object',
    fields: [
      { name: 'en', type: 'string', title: 'English' },
      { name: 'pt', type: 'string', title: 'Portuguese' },
      { name: 'es', type: 'string', title: 'Spanish' },
      { name: 'fr', type: 'string', title: 'French' },  // add
    ],
  });
}
```

Apply the same change to `localizedText` and `localizedBlock`.

### 4. Update Middleware Matcher

In `src/middleware.ts`, add the new locale to the URL matcher pattern:

```typescript
export const config = {
  matcher: [
    '/',
    '/(en|pt|es|fr)/:path*',  // add 'fr'
    '/((?!api|_next|_vercel|studio|.*\\..*).*)',
  ],
};
```

### 5. Add CMS Content

For all existing Sanity documents (tracks, courses, modules, lessons, achievements, daily challenges), fill in the new locale's sub-fields. The app falls back to English if a translation is missing, but mixed-language pages are not ideal.

---

## Adding New Pages

### 1. Create the Route

Add a page component at:

```
src/app/[locale]/(platform)/your-page/page.tsx
```

The `(platform)` route group wraps pages with the sidebar layout. Use `(marketing)` for public-facing pages without the platform shell.

### 2. Add Navigation Item

In `src/components/layout/sidebar.tsx`, add an entry to the `NAV_ITEMS` array:

```typescript
import { YourIcon } from 'lucide-react';

const NAV_ITEMS: NavItem[] = [
  // ... existing items
  { href: '/your-page', labelKey: 'yourPage', icon: YourIcon },
];
```

### 3. Add Translations

Add the `yourPage` key to the `nav` section of each message bundle (`src/messages/{locale}.json`).

### 4. Add Metadata for SEO

Export a `metadata` object or `generateMetadata` function from your page for proper SEO:

```typescript
export const metadata = {
  title: 'Your Page | Superteam Academy',
  description: 'Page description for search engines.',
};
```

---

## Extending the Gamification System

### XP and Levels

The level formula lives in `src/lib/solana/xp.ts`:

```typescript
// Level = floor(sqrt(xp / 100))
export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100));
}
```

This produces a smooth curve: Level 1 at 100 XP, Level 2 at 400 XP, Level 3 at 900 XP, Level 10 at 10,000 XP.

Level titles are defined as:

```
Newcomer, Explorer, Builder, Developer, Engineer,
Architect, Specialist, Expert, Master, Grandmaster, Legend
```

To modify the progression curve, update `calculateLevel` and its inverse `xpForLevel`. Make sure the test suite (`src/lib/solana/__tests__/xp.test.ts`) still passes.

### Achievements

Achievement definitions live in Sanity CMS. The evaluation engine lives in `src/lib/solana/achievements.ts`:

```typescript
export function evaluateAchievementCondition(
  condition: { type: string; value: number },
  context: AchievementContext,
): boolean {
  switch (condition.type) {
    case 'courses_completed': ...
    case 'streak_days': ...
    case 'challenges_completed': ...
    case 'forum_answers': ...
    case 'total_xp': ...
    case 'lessons_completed': ...
  }
}
```

To add a new condition type:
1. Add a new case to the switch statement
2. Add the corresponding field to the `AchievementContext` interface
3. Populate the context field wherever achievements are evaluated
4. Create the achievement document in Sanity with the new condition type

### Streaks

Streak tracking is localStorage-based, managed by the Zustand store in `src/lib/stores/user-store.ts`. The logic:
- Active today: no-op
- Active yesterday: increment streak
- Any other gap: reset to 1
- Persisted under the key `superteam-streak`

To migrate streaks to server-side / on-chain storage, replace the `loadPersistedStreak` and `persistStreak` functions with API calls.

### Daily Challenges

Daily challenges are CMS-driven via the `dailyChallenge` document type. The app queries by the current date (`YYYY-MM-DD`). To add automated challenge generation, create a scheduled function that creates dailyChallenge documents in Sanity via the Mutations API.

---

## Deploying to Production

### Vercel (Recommended)

```bash
vercel deploy
```

Or connect the GitHub repository for automatic deployments on push. The app is a standard Next.js application -- Vercel handles all configuration automatically.

### Self-Hosted

```bash
pnpm build && pnpm start
```

The build produces a Node.js server. Run it behind a reverse proxy (nginx, Caddy) with TLS termination.

### Docker

If a Dockerfile is present:

```bash
docker build -t superteam-academy .
docker run -p 3000:3000 --env-file .env superteam-academy
```

---

## Environment Variables Reference

Copy `.env.example` to `.env.local` and fill in the values:

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | No* | Sanity project ID. *Mock data is used if unset |
| `NEXT_PUBLIC_SANITY_DATASET` | No* | Sanity dataset name (default: `production`) |
| `BACKEND_SIGNER_KEYPAIR` | Yes | Base58-encoded Solana keypair for server-side transaction signing |
| `NEXT_PUBLIC_PROGRAM_ID` | No | On-chain program address (defaults to the academy program) |
| `NEXT_PUBLIC_XP_MINT` | No | XP token mint address |
| `NEXT_PUBLIC_AUTHORITY` | No | Program authority public key |
| `NEXT_PUBLIC_CLUSTER` | No | Solana cluster: `devnet`, `testnet`, or `mainnet-beta` |
| `NEXT_PUBLIC_HELIUS_RPC_URL` | No | Custom RPC URL (uses public devnet endpoint if unset) |
| `NEXT_PUBLIC_BASE_URL` | No | Site URL for SEO meta tags (defaults to `academy.superteam.fun`) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | No | Google Analytics measurement ID |
| `SENTRY_DSN` | No | Sentry error tracking DSN |
| `SENTRY_AUTH_TOKEN` | No | Sentry authentication token for source maps |
| `NEXT_PUBLIC_SUPABASE_URL` | No | Supabase project URL (for community forum features) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Supabase anonymous/public key |

**Note:** Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Never put secrets in `NEXT_PUBLIC_` variables. The `BACKEND_SIGNER_KEYPAIR` is server-only and must never be exposed client-side.
