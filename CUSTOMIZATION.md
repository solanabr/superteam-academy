# Customization Guide

This document explains how to customize the Superteam Academy platform -- theming, fonts, internationalization, branding, analytics, and network configuration.

## Theming

### Color System

Colors are defined as CSS custom properties in `app/src/app/globals.css`. The design system uses two layers:

1. **Solana Foundation `nd-*` tokens** — the base palette matching solana.com's design language
2. **Semantic tokens** — mapped from `nd-*` values for specific UI roles (XP, streaks, achievements)

The dark theme is the default. A light theme is available via `[data-theme="light"]` overrides in the same file.

### Solana Brand Colors

These saturated brand colors are used for gamification accents:

| Token              | Value     | Usage                                       |
|--------------------|-----------|---------------------------------------------|
| `--solana-green`   | `#00FFA3` | Primary accent, XP values, CTAs             |
| `--solana-purple`  | `#DC1FFF` | Credential borders, gradient backgrounds    |
| `--solana-blue`    | `#03E1FF` | Secondary accent, links, highlights         |

### Foundation Palette (Dark Theme)

| Token                     | Value       | Usage                      |
|---------------------------|-------------|----------------------------|
| `--background`            | `#000000`   | Page background            |
| `--card`                  | `#0A090F`   | Card surfaces              |
| `--foreground`            | `#FFFFFF`   | Primary text               |
| `--nd-mid-em-text`        | `#ABABBA`   | Secondary/muted text       |
| `--nd-border-light`       | `#ECE4FD1F` | Subtle borders             |
| `--nd-border-prominent`   | `#ECE4FD33` | Prominent borders          |
| `--nd-highlight-green`    | `#55E9AB`   | Green highlight (desaturated) |
| `--nd-highlight-lavendar` | `#CA9FF5`   | Lavender highlight         |
| `--nd-highlight-blue`     | `#6693F7`   | Blue highlight             |
| `--nd-highlight-gold`     | `#FFC526`   | Gold highlight (streaks)   |
| `--nd-highlight-orange`   | `#F48252`   | Orange highlight (Rust)    |

### Semantic Tokens

| Token            | Value     | Usage                    |
|------------------|-----------|--------------------------|
| `--xp`           | `#55E9AB` | XP display values        |
| `--streak`       | `#FFC526` | Streak indicators        |
| `--achievement`  | `#CA9FF5` | Achievement badges       |

### Track Colors

Each learning track has a dedicated color, defined in both CSS variables and `app/src/lib/constants.ts`:

| Track      | Color     | CSS Variable          |
|------------|-----------|-----------------------|
| Rust       | `#F48252` | `--track-rust`        |
| Anchor     | `#CA9FF5` | `--track-anchor`      |
| Frontend   | `#6693F7` | `--track-frontend`    |
| Security   | `#EF4444` | `--track-security`    |
| DeFi       | `#55E9AB` | `--track-defi`        |
| Mobile     | `#EC4899` | `--track-mobile`      |

### Difficulty Badge Colors

| Level          | Color     | CSS Variable                |
|----------------|-----------|-----------------------------|
| Beginner       | `#55E9AB` | `--difficulty-beginner`     |
| Intermediate   | `#FFC526` | `--difficulty-intermediate` |
| Advanced       | `#EF4444` | `--difficulty-advanced`     |

### Changing the Palette

To change the platform's color scheme, edit the CSS custom properties in `app/src/app/globals.css`:

1. Modify the `:root` block for the dark theme defaults
2. Modify the `[data-theme="light"]` block for light theme overrides
3. Update the `@theme inline` block to expose new values as Tailwind utility classes
4. If changing track colors, also update the `TRACK_COLORS` and `DIFFICULTY_COLORS` objects in `app/src/lib/constants.ts` to keep them in sync

### Border Effects

The CSS file includes several signature border effects used throughout the UI:

- **`.solana-border`** — Pill-shaped border with animated Solana gradient shimmer on hover (nav buttons, CTAs)
- **`.solana-border-card`** — Card variant with sharp corners and the same shimmer effect
- **`.metallic-border`** — Premium metallic conic gradient for certificate/credential display
- **`.credential-border`** — Legacy gradient border using `--solana-purple` to `--solana-green`
- **`.glow-border`** — Subtle green glow on hover for interactive cards

## Fonts

The platform uses a hybrid font stack:

### Brand Fonts (Solana Foundation)

Loaded via `@font-face` declarations in `globals.css` from `/public/fonts/`:

- **Diatype** — Used for headings and brand text. Available in Regular (400), Medium (500), and Bold (700). Files in `/public/fonts/diatype/`.
- **DSemi** (Diatype Semi-Mono) — Used for stats, numbers, and data displays. Available in Regular (400) and Medium (500). Files in `/public/fonts/semimono/`.

### System Fonts

Loaded via `next/font/google` in the Next.js layout:

- **Geist Sans** — Primary body text font
- **Geist Mono** — Code blocks and monospace text

### Font Variables in Tailwind

```css
--font-brand: "Diatype", var(--font-geist-sans), sans-serif;
--font-brand-mono: "DSemi", var(--font-geist-mono), monospace;
--font-sans: var(--font-geist-sans), sans-serif;
--font-mono: var(--font-geist-mono), monospace;
```

### Typography Scale

The CSS file provides a complete `nd-*` typography scale matching the Solana Foundation design system. Classes like `nd-heading-2xl`, `nd-heading-xl`, `nd-heading-l` through `nd-body-xs` include responsive font sizes, line heights, and letter spacing with breakpoints at 768px and 1280px.

## i18n / Adding a Language

The app uses `next-intl` for UI translations. Course content is English-only (see `CMS_GUIDE.md`).

### Current Locales

| Code    | Label      | Message File                      |
|---------|------------|-----------------------------------|
| `en`    | English    | `app/src/messages/en.json`        |
| `pt-br` | Portugues | `app/src/messages/pt-br.json`     |
| `es`    | Espanol    | `app/src/messages/es.json`        |

### Adding a New Language

1. **Add the locale code** to the `locales` array in `app/src/i18n/config.ts`:

```typescript
export const locales = ["en", "pt-br", "es", "fr"] as const;
```

2. **Add a label** in the `localeLabels` object in the same file:

```typescript
export const localeLabels: Record<Locale, string> = {
  en: "English",
  "pt-br": "Portugues",
  es: "Espanol",
  fr: "Francais",
};
```

3. **Create the message file** at `app/src/messages/fr.json`. Copy `en.json` as a template and translate all values:

```bash
cp app/src/messages/en.json app/src/messages/fr.json
```

4. The language switcher in the navbar will automatically pick up the new locale.

## Tracks

To add a new learning track:

1. **Add to type union** in `app/src/lib/services/types.ts`:

```typescript
export type Track = "rust" | "anchor" | "frontend" | "security" | "defi" | "mobile" | "ai";
```

2. **Add to constants** in `app/src/lib/constants.ts`:

```typescript
export const TRACK_TYPES = ["rust", "anchor", "frontend", "security", "defi", "mobile", "ai"] as const;

export const TRACK_LABELS: Record<TrackType, string> = {
  // ... existing entries ...
  ai: "AI",
};

export const TRACK_COLORS: Record<TrackType, string> = {
  // ... existing entries ...
  ai: "#818CF8",
};
```

3. **Add a CSS variable** in `globals.css`:

```css
--track-ai: #818CF8;
```

4. **Add courses** for the new track in `app/src/lib/services/courses.ts`.

## Branding

### Logo

The logo is a custom SVG component at `app/src/components/ui/superteam-logo.tsx`. It appears in:

- **Navbar** — `app/src/components/layout/navbar.tsx` (small, with "Superteam Academy" text)
- **Footer** — wherever the footer component is defined

The `gradient-solana` CSS class (purple-to-green gradient) should only be applied to small logo icons, not large surfaces.

### OG Image

The Open Graph image is generated at build time via `app/src/app/opengraph-image.tsx`. It renders:

- A gradient logo box with "SA" initials
- "Superteam Academy" heading
- "Master Solana Development" subheading
- Feature highlights: "Earn XP", "On-Chain Credentials", "Gamified Learning"

Edit this file to change the social media preview card.

### App Name

The app name constant is defined in `app/src/lib/constants.ts`:

```typescript
export const APP_NAME = "Superteam Academy";
```

## Analytics

### Google Analytics 4

Set the measurement ID to enable GA4 tracking:

```
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### PostHog

Set these variables to enable PostHog product analytics:

```
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

### Sentry

Set the DSN to enable error tracking:

```
NEXT_PUBLIC_SENTRY_DSN=https://xxxx@sentry.io/xxxx
```

## Network Configuration

Switch between Solana devnet and mainnet-beta:

```
NEXT_PUBLIC_SOLANA_NETWORK=devnet        # or mainnet-beta
```

This variable is read in `app/src/lib/constants.ts` and controls:

- **RPC URL** — `https://api.devnet.solana.com` vs `https://api.mainnet-beta.solana.com`
- **Explorer links** — appends `?cluster=devnet` when on devnet
- **Token/program addresses** — all on-chain addresses should match the target network

For production use with higher rate limits, set a Helius API key:

```
NEXT_PUBLIC_HELIUS_API_KEY=your_helius_api_key
```

## Environment Variables

Full list of environment variables from `.env.example`:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_SOLANA_NETWORK` | No | `devnet` | Solana cluster: `devnet` or `mainnet-beta` |
| `NEXT_PUBLIC_HELIUS_API_KEY` | No | — | Helius RPC API key for higher rate limits |
| `NEXT_PUBLIC_XP_MINT_ADDRESS` | No | — | Token-2022 mint address for the XP soulbound token |
| `NEXT_PUBLIC_PROGRAM_ID` | No | — | Deployed Anchor program ID |
| `NEXT_PUBLIC_CREDENTIAL_COLLECTION` | No | — | Bubblegum cNFT collection address for credentials |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | No | — | Sanity CMS project ID. If unset, static course data is used |
| `NEXT_PUBLIC_SANITY_DATASET` | No | `production` | Sanity dataset name |
| `NEXT_PUBLIC_SUPABASE_URL` | No | — | Supabase project URL (for future backend features) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | — | Supabase anonymous key |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | No | — | Google Analytics 4 measurement ID |
| `NEXT_PUBLIC_POSTHOG_KEY` | No | — | PostHog project API key |
| `NEXT_PUBLIC_POSTHOG_HOST` | No | `https://us.i.posthog.com` | PostHog ingestion host |
| `NEXT_PUBLIC_SENTRY_DSN` | No | — | Sentry DSN for error tracking |

All variables are optional. The app runs fully functional with no env vars set, using devnet and the static course catalog.

## File Reference

| File | Purpose |
|------|---------|
| `app/src/app/globals.css` | CSS custom properties, theme definitions, animations |
| `app/src/lib/constants.ts` | Track/difficulty types, colors, XP formulas, network config |
| `app/src/lib/services/types.ts` | TypeScript type definitions for Track, Difficulty, etc. |
| `app/src/i18n/config.ts` | Locale list, labels, default locale |
| `app/src/messages/*.json` | Translation message files per locale |
| `app/src/components/layout/navbar.tsx` | Navbar with logo, nav links, language switcher |
| `app/src/components/ui/superteam-logo.tsx` | SVG logo component |
| `app/src/app/opengraph-image.tsx` | OG image generation |
| `app/.env.example` | Environment variable template |
