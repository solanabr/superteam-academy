# Customization Guide

How to customize Superteam Academy's design system, themes, languages, gamification, and on-chain configuration.

---

## Theme Customization

### Color Architecture

The design system uses a three-layer architecture in `src/app/globals.css`:

1. **Palette source values** (`--palette-*`) -- Raw hex colors from the Superteam Brazil brand guide. Defined once in `:root`.
2. **Semantic tokens** (`--background`, `--primary`, `--card`, etc.) -- Map palette values to UI roles. Redefined per theme (dark/light).
3. **Tailwind v4 theme** (`@theme inline`) -- Bridges CSS variables to Tailwind utility classes (`bg-primary`, `text-brazil-gold`, etc.).

### Palette Source Values

These are the brand colors. Edit these to rebrand the entire application.

| Variable | Hex | Usage |
|----------|-----|-------|
| `--palette-yellow-base` | `#c8b830` | Primary accent, CTAs, XP indicators |
| `--palette-yellow-surface` | `#ede08a` | Light gold backgrounds |
| `--palette-yellow-hover` | `#d4c23d` | Gold hover state |
| `--palette-yellow-pressed` | `#b8a028` | Gold active/pressed state |
| `--palette-yellow-border` | `#c4ba88` | Gold border accents |
| `--palette-green-base` | `#5b9a4b` | Primary brand green, buttons |
| `--palette-green-dark-base` | `#2d6b42` | Dark green, light-mode primary |
| `--palette-green-darkest-bg` | `#1e3a28` | Dark mode page background |
| `--palette-green-darkest-surface` | `#2a4d38` | Dark mode card/popover surface |
| `--palette-neutral-bg` | `#f2ebd4` | Light mode page background |
| `--palette-neutral-surface` | `#e8e0c6` | Light mode card surface |
| `--palette-text-on-light` | `#1a3020` | Text on cream/light backgrounds |
| `--palette-text-on-dark` | `#ede6d2` | Text on dark green backgrounds |

### Rebranding

To rebrand for a different organization, edit the `--palette-*` values in the first `:root` block of `src/app/globals.css`. All semantic tokens reference these palette values, so the entire UI updates automatically with no component changes.

```css
:root {
  /* Example: Blue brand instead of green */
  --palette-green-base: #4a7cb5;
  --palette-green-dark-base: #2d5a8b;
  --palette-green-darkest-bg: #1a2d4a;
  /* ... update all green variants */
}
```

### Dark / Light Mode

Theme switching uses `next-themes` with a `class` strategy.

- Dark mode tokens: defined in the second `:root` block (default theme)
- Light mode tokens: defined in the `.light` block
- `next-themes` adds/removes the `light` class on `<html>`

**Changing the default theme** -- edit `src/components/layout/theme-provider.tsx`:

```typescript
<NextThemesProvider
  attribute="class"
  defaultTheme="dark"      // change to "light" or "system"
  enableSystem              // respects prefers-color-scheme
>
```

**Adding a third theme** -- add a new class block in `globals.css`:

```css
.ocean {
  --background: #0a1628;
  --foreground: #e2e8f0;
  --card: #1a2744;
  --primary: #3b82f6;
  /* ... all semantic tokens */
}
```

Then update the theme toggle in the Header to cycle through `dark` / `light` / `ocean`.

### Typography

Fonts are loaded in `src/app/layout.tsx`:

```typescript
const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-sans", display: "swap" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });
```

Tailwind theme references in `globals.css`:

- `--font-sans` -- Body text, navigation, labels
- `--font-heading` -- Page titles, section headers
- `--font-mono` -- Code blocks, Monaco editor, wallet addresses

To change fonts, replace the `next/font/google` imports and keep the CSS variable names consistent.

### Component Styling Patterns

All UI components use semantic Tailwind classes:

```tsx
<button className="bg-primary text-primary-foreground hover:bg-primary/90">
<div className="rounded-2xl border border-border bg-card text-card-foreground p-6">
<span className="text-brazil-gold">500 XP</span>
```

Special CSS classes available:
- `.glass` -- Frosted-glass panels (adapts to dark/light mode)
- `.hover-gold` -- Superteam Brazil gold border gradient on hover
- `.text-gradient-brand` -- Green-to-teal gradient text
- `.text-gradient-gold` -- Gold gradient text

UI components in `components/ui/` use `class-variance-authority` (CVA) for variant management.

---

## Adding New Languages

The i18n system uses `next-intl` with cookie-based locale switching. Currently supported: English (`en`), Portuguese Brazil (`pt-BR`), Spanish (`es`).

### Step 1: Add the Locale

Edit `src/i18n/config.ts`:

```typescript
export const locales = ["en", "pt-BR", "es", "fr"] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: "English",
  "pt-BR": "Portugues",
  es: "Espanol",
  fr: "Francais",
};

export const localeFlags: Record<Locale, string> = {
  en: "US",
  "pt-BR": "BR",
  es: "ES",
  fr: "FR",
};
```

### Step 2: Create the Translation File

```bash
cp src/messages/en.json src/messages/fr.json
```

Translate all strings. The JSON uses namespaced keys:

```json
{
  "nav": {
    "courses": "Cours",
    "dashboard": "Tableau de bord",
    "leaderboard": "Classement"
  },
  "home": {
    "hero_title": "De zero a developpeur Solana"
  }
}
```

### Step 3: Verify

Run the dev server. The new language appears automatically in the Header locale switcher dropdown. No middleware, routing, or URL prefix changes are needed.

### Translation Key Completeness

A test in `src/__tests__/i18n-completeness.test.ts` verifies that all locale files have the same set of keys. Run `pnpm test` to catch missing translations.

---

## Extending Gamification

### Achievement System

The app includes 20 built-in achievements across 5 categories, defined in `src/lib/services/learning-progress.ts`:

| Category | Count | Examples |
|----------|-------|---------|
| `progress` | 4 | First Steps, Course Conqueror, Halfway There, Knowledge Collector |
| `streaks` | 4 | On Fire (3-day), Week Warrior (7-day), Consistency King (30-day), Unstoppable (100-day) |
| `skills` | 4 | Anchor Apprentice, Rust Wrangler, DeFi Degen, Security Sentinel |
| `community` | 4 | Welcome Aboard, Referral Rookie, Social Butterfly, Top 10 |
| `special` | 4 | Early Adopter, Challenge Accepted, Streak Saver, Credential Holder |

### Adding a New Achievement

Add a new entry to the `DEFAULT_ACHIEVEMENTS` array in `src/lib/services/learning-progress.ts`:

```typescript
{
  id: 21,
  name: "Speed Runner",
  description: "Complete 3 lessons in one hour",
  icon: "timer",              // Lucide icon name
  category: "special",        // progress | streaks | skills | community | special
  xpReward: 150,
  claimed: false,
}
```

The achievement ID must be unique (1-256, matching the on-chain bitmap capacity). Add the claim logic in the relevant component or hook.

### Adding a New Achievement Category

1. Update the `Achievement` type in `src/types/index.ts`:

```typescript
export interface Achievement {
  // ...
  category: "progress" | "streaks" | "skills" | "community" | "special" | "exploration";
}
```

2. Add achievements with the new category to `DEFAULT_ACHIEVEMENTS`.
3. Update the achievement display components in `src/components/gamification/` to render the new category tab.

### Daily Quests

Daily quests are generated deterministically from the date in `src/lib/hooks/use-gamification.tsx`. Three quests are picked daily from four templates:

| Template | Type | Variants |
|----------|------|----------|
| Lesson Learner | `lessons` | Complete 1/2/3 lessons (25/50/75 XP) |
| XP Hunter | `xp` | Earn 30/50/100 XP (15/30/50 XP reward) |
| Code Warrior | `challenge` | Complete 1 challenge (50 XP) |
| Streak Keeper | `streak` | Keep streak alive (25 XP) |

To add a new quest template, add an entry to the `QUEST_TEMPLATES` array:

```typescript
{
  id: "explorer",
  type: "lessons",  // lessons | xp | challenge | streak
  title: "Explorer",
  variants: [
    { description: "Visit 3 different courses", target: 3, xpReward: 30 },
  ],
},
```

### Combo Multiplier

The combo system rewards completing multiple lessons within a 30-minute window:

| Consecutive Completions | Multiplier |
|------------------------|------------|
| 1 | 1x |
| 2 | 1.25x |
| 3-4 | 1.5x |
| 5+ | 2x |

To adjust, edit the `getComboMultiplier()` function and `COMBO_TIMEOUT_MS` constant in `use-gamification.tsx`.

### Streak System

Streaks are tracked in localStorage via `LocalStorageProgressService`. Key behaviors:

- Consecutive day detection based on date strings (`YYYY-MM-DD`)
- Freeze mechanic: if the user missed exactly 1 day and has `streakFreezes > 0`, the freeze is consumed and the streak continues
- Longest streak is tracked separately
- Activity calendar stores a `Record<string, boolean>` of active dates

Streak milestones are defined in `src/lib/constants.ts`:

```typescript
export const STREAK_MILESTONES = [7, 30, 100, 365];
```

---

## Adding New Tracks

Tracks organize courses into learning domains.

### 1. Update Constants

Edit `src/lib/constants.ts`:

```typescript
export const TRACKS: Record<number, { name: string; display: string; color: string; icon: string }> = {
  // ...existing tracks 0-6...
  7: { name: "mobile", display: "Mobile dApps", color: "#8b5cf6", icon: "Smartphone" },
};
```

### 2. Update Credential Display

The credential reader in `src/lib/onchain/credentials.ts` has a local `trackNames` map. Update it:

```typescript
const trackNames: Record<number, string> = {
  // ...existing entries...
  7: "Mobile dApps",
};
```

### 3. Create Course Content

When creating courses in Sanity Studio, set `trackId` to the new track number (e.g., `7`). The course catalog will automatically group and filter by the new track.

### 4. On-Chain Registry

The on-chain program supports up to 65535 track IDs (u16). New tracks are implicitly registered when a course with a new `track_id` is created via `create_course`.

---

## Environment Variables Reference

### Solana / On-Chain

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_SOLANA_RPC_URL` | `https://api.devnet.solana.com` | Solana RPC endpoint |
| `NEXT_PUBLIC_SOLANA_NETWORK` | `devnet` | Network identifier |
| `NEXT_PUBLIC_RPC_URL` | `https://api.devnet.solana.com` | Alternative RPC URL used by on-chain services |
| `NEXT_PUBLIC_HELIUS_RPC_URL` | Falls back to `NEXT_PUBLIC_RPC_URL` | Helius RPC endpoint for DAS API (credentials + leaderboard) |
| `NEXT_PUBLIC_CLUSTER` | `devnet` | Cluster identifier (`devnet`, `mainnet-beta`, `localnet`) |
| `NEXT_PUBLIC_HELIUS_API_KEY` | -- | Helius API key (optional, for enhanced RPC) |

### Sanity CMS

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | -- | Sanity project ID. If unset, app uses mock data. |
| `NEXT_PUBLIC_SANITY_DATASET` | `production` | Sanity dataset name |
| `SANITY_API_TOKEN` | -- | Server-side read token for draft access |

### Analytics

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | -- | Google Analytics 4 measurement ID |
| `NEXT_PUBLIC_POSTHOG_KEY` | -- | PostHog project API key |
| `NEXT_PUBLIC_POSTHOG_HOST` | -- | PostHog instance host |
| `NEXT_PUBLIC_CLARITY_PROJECT_ID` | -- | Microsoft Clarity project ID (heatmaps & session recordings) |
| `NEXT_PUBLIC_SENTRY_DSN` | -- | Sentry error tracking DSN |

### Authentication

| Variable | Default | Description |
|----------|---------|-------------|
| `AUTH_SECRET` | -- | NextAuth.js secret for session encryption |

### Database (Optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | -- | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | -- | Supabase anonymous key |

---

## Custom RPC Configuration

### Standard Solana RPC

Set `NEXT_PUBLIC_RPC_URL` in `.env.local`:

```env
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
```

This is used by the `OnChainProgressService` for all account reads and transaction submissions.

### Helius RPC (DAS API)

For credentials and leaderboard features, a Helius RPC endpoint is required because standard Solana RPC does not support the DAS API methods (`getAssetsByOwner`, `getTokenAccounts`).

```env
NEXT_PUBLIC_HELIUS_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY
```

If `NEXT_PUBLIC_HELIUS_RPC_URL` equals the standard devnet RPC (`https://api.devnet.solana.com`), the credential and leaderboard functions return empty arrays as a safeguard (DAS API is not available on standard RPC).

### Mainnet Configuration

For mainnet deployment, update both RPC URLs:

```env
NEXT_PUBLIC_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
NEXT_PUBLIC_HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
NEXT_PUBLIC_CLUSTER=mainnet-beta
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
```

The program ID in `src/lib/onchain/constants.ts` would also need to be updated to the mainnet deployment address.
