# Customization Guide

**Version:** 1.0.0  
**Last Updated:** March 2026  
**Audience:** Developers forking or white-labeling the Solana Academy Platform

---

## Overview

This guide covers every customization surface in the platform: branding, theming, i18n, wallet configuration, gamification, on-chain parameters, and environment settings. Each section tells you **what to change** and **where to change it**.

---

## Table of Contents

1. [Branding](#1-branding)
2. [Theming — Colors & Dark Mode](#2-theming--colors--dark-mode)
3. [Typography](#3-typography)
4. [Internationalization (i18n)](#4-internationalization-i18n)
5. [Wallet & Blockchain Configuration](#5-wallet--blockchain-configuration)
6. [On-Chain Program Constants](#6-on-chain-program-constants)
7. [Gamification & Achievements](#7-gamification--achievements)
8. [UI Components](#8-ui-components)
9. [Analytics & Monitoring](#9-analytics--monitoring)
10. [Content (CMS)](#10-content-cms)
11. [Environment Variables Reference](#11-environment-variables-reference)
12. [Feature Flags](#12-feature-flags)

---

## 1. Branding

### Logo & App Name

**Header** — `components/layout/Header.tsx`

```typescript
// Line 12 — Logo + brand name
<span className="text-2xl">⚡</span>
<span className="font-display text-xl font-bold text-neon-cyan">Superteam</span>
```

Change the emoji, text, and `text-neon-cyan` class to your brand.

**Footer** — `components/layout/Footer.tsx`

```typescript
// Brand column — update name and tagline
<span className="font-display text-xl font-bold text-neon-cyan">Superteam</span>
<p>{t('footer.tagline')}</p>   // ← i18n key, see section 4
```

**Auth Pages** — `app/auth/signin/page.tsx`

Update `t('auth.appTitle')` and `t('auth.appSubtitle')` translation keys.

### Social Links

**Footer** — `components/layout/Footer.tsx`

The Community column contains Discord, Twitter, and GitHub links. Update the `href` values:

```typescript
<a href="https://discord.gg/your-server">Discord</a>
<a href="https://twitter.com/your-handle">Twitter</a>
<a href="https://github.com/your-org">GitHub</a>
```

### Page Metadata

**Root layout** — `app/layout.tsx`

Update the `metadata` export:

```typescript
export const metadata = {
  title: 'Your Academy Name',
  description: 'Your description here',
};
```

### Favicon & Open Graph

Place files in `public/`:
- `public/favicon.ico`
- `public/og-image.png`

---

## 2. Theming — Colors & Dark Mode

### Color System

All custom colors are defined in **`tailwind.config.ts`**:

```typescript
colors: {
  foreground: 'hsl(210 40% 98%)',

  // Neon accent palette
  neon: {
    cyan:    '#00F0FF',   // Primary accent
    magenta: '#FF00FF',   // Secondary accent
    green:   '#00FF41',   // Success indicators
    yellow:  '#FFFF00',   // Warning indicators
  },

  // Terminal/dark theme surfaces
  terminal: {
    bg:      '#0A0E14',   // Base background
    surface: '#1A1F29',   // Card/panel backgrounds
    border:  '#2D3748',   // Border color
  },

  // Solana brand colors
  solana: {
    purple:  '#9945FF',   // Primary action color
    green:   '#14F195',   // Secondary action color
  },
}
```

To rebrand, change these values. The `neon-cyan` and `solana-purple` classes are used throughout the UI.

### Theme Color Tokens

**`lib/types/theme.ts`** — defines semantic color tokens for light and dark modes:

```typescript
export const THEME_COLORS = {
  light: {
    background: '#ffffff',
    foreground: '#000000',
    card:       '#f5f5f5',
    border:     '#e0e0e0',
    primary:    '#9945FF',   // ← Change to your brand primary
    accent:     '#00F0FF',   // ← Change to your brand accent
  },
  dark: {
    background: '#0a0e27',
    foreground: '#ffffff',
    card:       '#1a1f3a',
    border:     '#2d3748',
    primary:    '#9945FF',
    accent:     '#00F0FF',
  },
};
```

### CSS Custom Properties

**`app/globals.css`** — base CSS variables:

```css
:root {
  --background: 222 47% 11%;
  --foreground: 210 40% 98%;
}
```

Glow effects:

```css
.text-glow  { text-shadow: 0 0 10px rgba(0, 240, 255, 0.5); }
.border-glow { box-shadow: 0 0 15px rgba(0, 240, 255, 0.3); }
```

Change the `rgba(0, 240, 255, ...)` values to match your accent color.

### Background Pattern

The body has a subtle grid pattern (40px lines at 3% opacity):

```css
body {
  background-image:
    linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 240, 255, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
}
```

Remove or adjust for a different aesthetic.

### Custom Animations

**`tailwind.config.ts`** — two built-in animations:

| Animation | Effect                                    | Usage                    |
| --------- | ----------------------------------------- | ------------------------ |
| `glitch`  | Translate jitter (cyberpunk text effect)  | Decorative headings      |
| `glow`    | Box-shadow pulse with neon-cyan           | Interactive card hovers  |

### Dark Mode

Dark mode uses Tailwind's `class` strategy (`darkMode: 'class'` in `tailwind.config.ts`).

**Theme Store** — `lib/stores/theme.store.ts`:

```typescript
type Theme = 'light' | 'dark' | 'system';
```

- Persisted to `localStorage` key: `theme-storage`
- `getEffectiveTheme()` resolves `system` to actual light/dark based on `prefers-color-scheme`

**Theme Hook** — `lib/hooks/useTheme.ts`:

- Detects system preference via `matchMedia('(prefers-color-scheme: dark)')`
- Applies `dark` class to `<html>` element
- Returns: `{ theme, setTheme, isDark, toggleTheme, effectiveTheme }`

**Theme Provider** — `components/providers/ThemeProvider.tsx`:

Wraps the app and initializes theme detection. Hydration-safe (waits for mount).

**Theme Switcher** — `components/ui/ThemeSwitcher.tsx`:

Toggle button using Sun/Moon icons from `lucide-react`.

**Settings Page** — `app/settings/page.tsx`:

Dropdown with Light / Dark / Auto options.

---

## 3. Typography

### Font Stack

Defined in `app/layout.tsx` and referenced in `tailwind.config.ts`:

| Font            | CSS Variable      | Tailwind Class  | Usage                  |
| --------------- | ----------------- | --------------- | ---------------------- |
| Inter           | `--font-sans`     | `font-sans`     | Body text (default)    |
| JetBrains Mono  | `--font-mono`     | `font-mono`     | Code editor, terminals |
| Space Grotesk   | `--font-display`  | `font-display`  | Headlines, logo        |

### Changing Fonts

1. Update imports in `app/layout.tsx`:

```typescript
import { Your_Font } from 'next/font/google';
const yourFont = Your_Font({ subsets: ['latin'], variable: '--font-sans' });
```

2. Update `tailwind.config.ts`:

```typescript
fontFamily: {
  mono: ['Your Mono Font', 'monospace'],
  display: ['Your Display Font', 'sans-serif'],
},
```

---

## 4. Internationalization (i18n)

### Architecture

The platform uses a custom i18n system (not next-intl routing):

| File                        | Purpose                                      |
| --------------------------- | -------------------------------------------- |
| `lib/i18n/translations.ts`  | All translations (~1050 lines, 3 locales)   |
| `lib/hooks/useI18n.tsx`      | React context provider + `useI18n()` hook   |

### Supported Locales

| Code    | Language              |
| ------- | --------------------- |
| `en`    | English               |
| `pt-br` | Brazilian Portuguese |
| `es`    | Spanish               |

Language is stored in `localStorage` and selectable from Settings and Header.

### Translation Sections (15)

| Section        | Keys Cover                                         |
| -------------- | -------------------------------------------------- |
| `nav`          | Navigation labels (home, courses, dashboard, etc.) |
| `home`         | Hero, features, stats, testimonials, CTA           |
| `courses`      | Catalog filters, search, track names               |
| `courseDetail`  | Enrollment, progress, finalization, certificates   |
| `lesson`       | Content, challenge, navigation, completion         |
| `challenge`    | Code editor UI, run, submit, hints                 |
| `dashboard`    | Stats, streaks, progress, level info               |
| `leaderboard`  | Rankings, filters, user rank                       |
| `profile`      | Bio, stats, credentials, membership                |
| `settings`     | Account, privacy, theme, language, wallet          |
| `certificates` | Credential listing and detail pages                |
| `auth`         | Sign in, sign up, profile completion               |
| `achievements` | Titles, locked/unlocked states                     |
| `footer`       | Links, legal, copyright                            |
| `common`       | Loading, error, save, cancel, etc.                 |

### Adding a New Language

1. Add translations to `lib/i18n/translations.ts`:

```typescript
const translations = {
  en: { /* ... */ },
  'pt-br': { /* ... */ },
  es: { /* ... */ },
  // Add new locale:
  fr: {
    nav: {
      home: 'Accueil',
      courses: 'Cours',
      // ... copy all keys from 'en' and translate
    },
    // ... all 15 sections
  },
};
```

2. Update the language selector in `components/layout/Header.tsx` (dropdown options):

```typescript
// Add to the language selector options
{ code: 'fr', label: 'FR' }
```

3. Update the Settings page language dropdown in `app/settings/page.tsx`.

### Usage Pattern

```typescript
const { t, language, setLanguage } = useI18n();

// Simple key
<h1>{t('dashboard.title')}</h1>

// With template variable
<p>{t('dashboard.welcomeUser').replace('{name}', userName)}</p>
```

### Modifying Existing Translations

All strings are in `lib/i18n/translations.ts`. Find the section → key → update across all locales. The structure is flat dot-notation:

```typescript
en: {
  nav: {
    home: 'Home',        // t('nav.home')
    courses: 'Courses',  // t('nav.courses')
  },
}
```

---

## 5. Wallet & Blockchain Configuration

### Wallet Adapters

**`components/providers/WalletProvider.tsx`** — configures 12 wallet adapters:

```
Phantom, Solflare, WalletConnect, Ledger, Torus,
Coin98, BitKeep, Trust, Clover, Coinhub, Onto, Coinbase
```

To add/remove wallets, edit the `wallets` array:

```typescript
const wallets = useMemo(() => [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
  // Remove or add adapters here
], []);
```

**Settings:**
- `autoConnect: true` — automatically reconnects on page load
- localStorage key: `superteam-academy-wallet`

### Wallet Configuration

**`lib/wallet-config.ts`** — simplified wallet config:

```typescript
export const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
export const RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC || clusterApiUrl(NETWORK);
export const SUPPORTED_WALLETS = [PhantomWalletAdapter, SolflareWalletAdapter];
```

### RPC Endpoint

Set via environment variable:

```bash
NEXT_PUBLIC_SOLANA_RPC_URL=https://rpc.helius.xyz/?api-key=YOUR_KEY
```

Falls back to Solana's public devnet endpoint.

### Network Selection

```bash
# .env.local
NEXT_PUBLIC_SOLANA_NETWORK=devnet      # or mainnet-beta
```

---

## 6. On-Chain Program Constants

### Program ID

**`lib/anchor/constants.ts`**:

```typescript
export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID || 'ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf'
);
```

### Token & Program References

```typescript
export const TOKEN_2022_PROGRAM_ID = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');
export const MPL_CORE_PROGRAM_ID = new PublicKey('CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d');
```

### Devnet Addresses

```typescript
export const DEVNET = {
  CONFIG_PDA:            new PublicKey('...'),
  XP_MINT:               new PublicKey('...'),
  AUTHORITY:             new PublicKey('...'),
  MOCK_COURSE:           new PublicKey('...'),
  MOCK_TRACK_COLLECTION: new PublicKey('...'),
};
```

Replace these when deploying to a new environment or mainnet.

### PDA Seeds

```typescript
export const PDA_SEEDS = {
  config:              Buffer.from('config'),
  course:              Buffer.from('course'),
  enrollment:          Buffer.from('enrollment'),
  minter:              Buffer.from('minter'),
  achievement:         Buffer.from('achievement'),
  achievement_receipt: Buffer.from('achievement_receipt'),
};
```

### XP Configuration

```typescript
export const XP_DECIMALS = 0;      // Whole numbers only
export const MAX_LESSONS = 256;    // Per-course cap
```

### Backend Blockchain Config

**`backend/src/config.ts`**:

```typescript
export const SOLANA_CONFIG = {
  RPC_URL:                  process.env.SOLANA_RPC_URL,
  NETWORK:                  process.env.SOLANA_NETWORK || 'devnet',
  ANCHOR_PROGRAM_ID:        process.env.ANCHOR_PROGRAM_ID,
  XP_TOKEN_MINT:            process.env.XP_TOKEN_MINT,
  BACKEND_SIGNER_SECRET_KEY: process.env.BACKEND_SIGNER_SECRET_KEY,
  COMMITMENT:                'confirmed',
  TX_TIMEOUT_MS:            60_000,
  BLOCKHASH_VALIDITY_S:     90,
};
```

---

## 7. Gamification & Achievements

### Achievement Definitions

**`lib/services/achievement.service.ts`** — 9 built-in achievements:

| ID                | Title          | Criteria              | Rarity    | XP Reward |
| ----------------- | -------------- | --------------------- | --------- | --------- |
| `first-lesson`    | First Steps    | 1 lesson completed    | common    | 10        |
| `course-complete` | Course Master  | 1 course completed    | rare      | 50        |
| `three-courses`   | Triple Threat  | 3 courses completed   | epic      | 100       |
| `xp-100`          | XP Collector   | 100 XP earned         | common    | 10        |
| `xp-500`          | XP Master      | 500 XP earned         | rare      | 25        |
| `xp-1000`         | XP Legend      | 1000 XP earned        | legendary | 50        |
| `streak-3`        | On Fire        | 3-day streak          | rare      | 25        |
| `streak-7`        | Week Warrior   | 7-day streak          | epic      | 50        |
| `five-lessons-day`| Speed Learner  | 5 lessons in one day  | rare      | 25        |

### Adding New Achievements

Edit the `ACHIEVEMENTS` array in `lib/services/achievement.service.ts`:

```typescript
{
  id: 'your-achievement',
  title: 'Achievement Title',
  description: 'How to unlock this achievement',
  icon: '🏆',
  rarity: 'epic',           // common | uncommon | rare | epic | legendary
  xpReward: 50,
  criteria: {
    type: 'xp_threshold',   // lesson_complete | course_complete | xp_threshold | streak | lessons_in_day
    value: 2000,
  },
}
```

**Criteria types:**

| Type              | Value Meaning                     |
| ----------------- | --------------------------------- |
| `lesson_complete` | Number of lessons completed       |
| `course_complete` | Number of courses completed       |
| `xp_threshold`    | Total XP earned                   |
| `streak`          | Consecutive days active           |
| `lessons_in_day`  | Lessons completed in a single day |

### XP Configuration

XP amounts are set per-lesson and per-course in Sanity CMS (`xpReward` field). The award flow is handled by the `/api/xp/award` endpoint.

### Rarity Colors

Achievement rarity maps to visual styling in `components/achievements/AchievementBadge.tsx`. Adjust colors there to match your brand.

---

## 8. UI Components

### Utility Function

**`lib/utils/cn.ts`** — class name merger:

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Used everywhere for conditional Tailwind classes.

### Button Component

**`components/ui/Button.tsx`** — 3 variants, 3 sizes:

| Variant     | Style                                       |
| ----------- | ------------------------------------------- |
| `primary`   | `bg-solana-purple` with hover state         |
| `secondary` | `bg-gray-200` (light) / `bg-terminal-surface` (dark) |
| `ghost`     | Transparent with hover background           |

| Size | Padding           |
| ---- | ----------------- |
| `sm` | `px-3 py-1 text-sm` |
| `md` | `px-4 py-2`        |
| `lg` | `px-6 py-3 text-lg` |

Has `isLoading` prop that shows a spinner and disables the button.

### Card Component

**`components/ui/Card.tsx`** — with optional hover glow:

```typescript
<Card hover>          // Adds neon-cyan glow on hover (dark mode)
  <CardHeader>Title</CardHeader>
  <CardContent>Body</CardContent>
</Card>
```

### Available UI Primitives

All exported from `components/ui/index.ts`:

| Component        | Description                           |
| ---------------- | ------------------------------------- |
| `Button`         | Action button with variants           |
| `Card`           | Container with optional hover glow    |
| `CardHeader`     | Card header with bottom border        |
| `CardContent`    | Card body wrapper                     |
| `Input`          | Text input field                      |
| `ResizablePanel` | Draggable split panel (lesson layout) |
| `ThemeSwitcher`  | Light/dark toggle button              |

---

## 9. Analytics & Monitoring

### Analytics Providers

**`components/providers/AnalyticsProvider.tsx`** — initializes both:

| Service  | Config                                       |
| -------- | -------------------------------------------- |
| PostHog  | `NEXT_PUBLIC_POSTHOG_KEY` env var            |
| GA4      | Via `gtag.js` script in layout               |

**`lib/analytics/`** — unified analytics layer:

```
lib/analytics/
├── ga4.ts       ← Google Analytics 4
├── posthog.ts   ← PostHog product analytics
└── index.ts     ← Unified trackEvent interface
```

### Error Monitoring

**Sentry** (`@sentry/nextjs`):

```javascript
// next.config.js
sentry: {
  org: 'solana-academy',           // ← Change to your org
  project: 'solana-academy-platform', // ← Change to your project
  tunnelRoute: '/monitoring',
}
```

Environment variable: `SENTRY_DSN`

Instrumentation files:
- `instrumentation.ts` — server-side
- `instrumentation-client.ts` — client-side

### Disabling Analytics

Remove or comment out `<AnalyticsProvider>` in `app/layout.tsx`, or leave the env vars unset.

---

## 10. Content (CMS)

See [CMS_GUIDE.md](CMS_GUIDE.md) for full Sanity CMS documentation.

**Quick customization points:**

| What                | Where                                  |
| ------------------- | -------------------------------------- |
| Course schemas      | `sanity/schemaTypes/course.ts`         |
| Lesson schemas      | `sanity/schemaTypes/lesson.ts`         |
| Challenge config    | `sanity/schemaTypes/challenge.ts`      |
| GROQ queries        | `lib/sanity.ts`                        |
| Mock/fallback data  | `lib/services/course.service.ts` (MOCK_COURSES array) |
| Static Anchor data  | `lib/data/anchor-lessons.ts`           |

---

## 11. Environment Variables Reference

### Frontend (.env.local)

| Variable                          | Required | Default              | Description                     |
| --------------------------------- | -------- | -------------------- | ------------------------------- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID`   | Yes*     | —                    | Sanity project ID               |
| `NEXT_PUBLIC_SANITY_DATASET`      | Yes*     | `production`         | Sanity dataset name             |
| `NEXT_PUBLIC_SANITY_API_VERSION`  | No       | `2024-02-13`         | Sanity API version              |
| `SANITY_API_TOKEN`                | Yes*     | —                    | Sanity server-side read token   |
| `NEXT_PUBLIC_SOLANA_RPC_URL`      | Yes      | devnet public RPC    | Solana RPC endpoint             |
| `NEXT_PUBLIC_SOLANA_NETWORK`      | No       | `devnet`             | `devnet` or `mainnet-beta`      |
| `NEXT_PUBLIC_PROGRAM_ID`          | No       | `ACADBRCB3z...`      | Anchor program ID               |
| `NEXT_PUBLIC_POSTHOG_KEY`         | No       | —                    | PostHog analytics key           |
| `SENTRY_DSN`                      | No       | —                    | Sentry error tracking DSN       |
| `NEXTAUTH_URL`                    | Yes      | —                    | NextAuth base URL               |
| `NEXTAUTH_SECRET`                 | Yes      | —                    | NextAuth JWT secret             |
| `GOOGLE_CLIENT_ID`                | Yes      | —                    | Google OAuth client ID          |
| `GOOGLE_CLIENT_SECRET`            | Yes      | —                    | Google OAuth secret             |
| `GITHUB_ID`                       | Yes      | —                    | GitHub OAuth app ID             |
| `GITHUB_SECRET`                   | Yes      | —                    | GitHub OAuth secret             |

*\*Required for CMS mode. Platform falls back to mock data without Sanity.*

### Backend (backend/.env)

| Variable                    | Required | Description                          |
| --------------------------- | -------- | ------------------------------------ |
| `PORT`                      | No       | Server port (default: 3001)          |
| `NODE_ENV`                  | No       | `development` or `production`        |
| `SUPABASE_URL`              | Yes      | Supabase project URL                 |
| `SUPABASE_ANON_KEY`         | Yes      | Supabase anonymous key               |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes      | Supabase service role key            |
| `JWT_SECRET`                | Yes      | JWT signing secret                   |
| `FRONTEND_URL`              | Yes      | Frontend URL for CORS                |
| `SOLANA_RPC_URL`            | Yes      | Solana RPC endpoint                  |
| `ANCHOR_PROGRAM_ID`         | Yes      | Anchor program public key            |
| `SENTRY_DSN`                | No       | Sentry error tracking DSN            |

---

## 12. Feature Flags

The `.env.example` defines feature flags for selectively enabling functionality:

```bash
ENABLE_WALLET_CONNECTION=true    # Solana wallet integration
ENABLE_ON_CHAIN_XP=true          # On-chain XP token minting
ENABLE_LEADERBOARD=true          # Leaderboard page
```

When disabled, the corresponding UI elements are hidden and API endpoints return early.

---

## Quick Reference: Common Customizations

| I want to...                  | Edit                                           |
| ----------------------------- | ---------------------------------------------- |
| Change the brand name         | `Header.tsx`, `Footer.tsx`, i18n keys           |
| Change accent colors          | `tailwind.config.ts` → `neon` + `solana`       |
| Change fonts                  | `app/layout.tsx` + `tailwind.config.ts`         |
| Add a language                | `lib/i18n/translations.ts` + Header dropdown    |
| Add a wallet adapter          | `components/providers/WalletProvider.tsx`        |
| Switch to mainnet             | `.env.local` → `NEXT_PUBLIC_SOLANA_NETWORK`     |
| Add an achievement            | `lib/services/achievement.service.ts`           |
| Modify course schemas         | `sanity/schemaTypes/course.ts`                  |
| Change the RPC provider       | `.env.local` → `NEXT_PUBLIC_SOLANA_RPC_URL`     |
| Disable analytics             | Remove `<AnalyticsProvider>` from `layout.tsx`  |
| Customize the dark theme      | `THEME_COLORS` in `lib/types/theme.ts`          |
| Change button styles          | `components/ui/Button.tsx`                       |
| Modify code editor languages  | `sanity/schemaTypes/challenge.ts` (language list)|
| Update the background grid    | `app/globals.css` → `body` background-image     |

---

**Document Version**: 1.0.0  
**Last Updated**: March 2026  
**Maintained By**: Superteam Academy Team
