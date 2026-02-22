# Customization Guide

How to brand, theme, and configure Superteam Academy for your deployment.

## Theme System

The entire visual identity is controlled through CSS custom properties in `app/app/globals.css`. No component-level hardcoded colors.

### Color Tokens

| Token | Light Default | Purpose |
|-------|--------------|---------|
| `--color-primary` | `#008c4c` | Buttons, links, active states |
| `--color-secondary` | `#2f6b3f` | Secondary actions, gradients |
| `--color-gold` | `#ffd23f` | Accent, XP badges, achievements |
| `--color-cream` | `#f7eacb` | Warm surface tones |
| `--color-forest` | `#2f6b3f` | Deep brand color for gradients |
| `--color-green` | `#008c4c` | Primary brand green |
| `--color-dark` | `#1b231d` | Text on light backgrounds |
| `--color-background` | `#faf6ee` | Page background |
| `--color-card` | `#ffffff` | Card/container background |
| `--color-muted` | `#f0e9d8` | Subtle backgrounds |
| `--color-border` | `#e2d9c4` | Borders and dividers |
| `--color-destructive` | `#dc2626` | Errors, streak-at-risk |

### Dark Mode

Dark mode tokens follow the same names under `.dark`:

```css
.dark {
  --color-background: #0f1510;
  --color-card: #1a231d;
  --color-foreground: #e8e5df;
  /* ...etc */
}
```

Toggle: handled by `next-themes` with `ThemeProvider` in `app/providers.tsx`. Set `defaultTheme` to `"system"`, `"light"`, or `"dark"`.

### Typography

Three font families loaded via Google Fonts:

| Variable | Font | Usage |
|----------|------|-------|
| `--font-sans` | DM Sans | Body text |
| `--font-display` | Bricolage Grotesque | Headings, hero text |
| `--font-mono` | JetBrains Mono | Code blocks, addresses |

To change fonts, update both:
1. The `<link>` tag in `app/app/layout.tsx`
2. The `@theme` variables in `globals.css`

### Border Radius

```css
--radius: 0.625rem;
--radius-sm: 0.375rem;
--radius-md: 0.5rem;
--radius-lg: 0.75rem;
--radius-xl: 1rem;
--radius-2xl: 1.25rem;
```

## Branding

### Logo

Replace `app/public/logo.svg` with your SVG logo. Logo is imported as a React component via `@svgr/webpack`.

Referenced in:
- `app/components/navigation/site-header.tsx`
- `app/components/navigation/site-footer.tsx`
- `app/components/navigation/navigation-system.tsx` (uses `next/image`)

### Favicon & Icons

Place icons in `app/public/icons/`. Update `app/public/manifest.json` (see PWA section) with icon paths.

### Hero Wave

The decorative SVG on the landing page is `app/public/hero-wave.svg`. Replace to match your brand shape.

## Content Configuration

### Course Catalog

Course seed data is in `app/app/[locale]/page.tsx` (`FEATURED_COURSES`, `TOPICS`, `TESTIMONIALS`). For production, courses come from Sanity CMS — see `docs/CMS_GUIDE.md`.

### Navigation

- `app/components/navigation/site-header.tsx` — Top navigation links
- `app/components/navigation/site-footer.tsx` — Footer links and social URLs

### Localization

Locales are configured in `packages/i18n/src/config.ts`. Translation files:

```
packages/i18n/src/messages/
├── en.json
├── es.json
└── pt-BR.json
```

Add new locales:
1. Create `packages/i18n/src/messages/<code>.json`
2. Add locale entry to `packages/i18n/src/config.ts`

## Analytics Configuration

### Google Analytics 4

Set `NEXT_PUBLIC_GA_ID` environment variable. The script is injected in `app/app/[locale]/layout.tsx`.

### PostHog (Heatmaps & Session Recording)

Set `NEXT_PUBLIC_POSTHOG_KEY` and optionally `NEXT_PUBLIC_POSTHOG_HOST`. Heatmaps and session recording are enabled by default.

### Sentry (Error Monitoring)

Configured in `app/instrumentation.ts`. Set `SENTRY_DSN` environment variable.

## Solana Program Configuration

### Program ID

Update program ID everywhere using the script:

```bash
./scripts/update-program-id.sh <NEW_PROGRAM_ID>
```

### RPC Endpoint

Set `NEXT_PUBLIC_SOLANA_RPC_URL` for the Helius or custom RPC endpoint.

### Network

Set `NEXT_PUBLIC_SOLANA_NETWORK` to `devnet` or `mainnet-beta`.

## Wallet Configuration

Supported wallets are configured in `app/config/wallet.ts`:
- Phantom
- Solflare

To add wallets, install the adapter package and add to the wallet list.

## Gamification Tuning

### XP Rewards

XP calculation config in `packages/gamification/src/xp-calculation.ts`:

```typescript
export const DEFAULT_XP_CONFIG = {
  baseXP: { lesson: 50, challenge: 100, course: 500 },
  multipliers: { streak: 1.5, firstCompletion: 2.0 },
};
```

### Level Formula

```
Level = floor(sqrt(totalXP / 100))
```

Defined in `packages/gamification/src/index.ts`.

### Streak System

Streak configuration in `packages/gamification/src/streak-system.ts`:

```typescript
export const DEFAULT_STREAK_CONFIG = {
  activityWindowHours: 24,
  maxFreezes: 3,
  rewards: {
    7: { xpBonus: 50 },
    30: { xpBonus: 250 },
    100: { xpBonus: 1000 },
  },
};
```

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SOLANA_RPC_URL` | Yes | Solana RPC endpoint |
| `NEXT_PUBLIC_SOLANA_NETWORK` | Yes | `devnet` or `mainnet-beta` |
| `NEXT_PUBLIC_PROGRAM_ID` | Yes | Academy program address |
| `NEXT_PUBLIC_GA_ID` | No | Google Analytics measurement ID |
| `NEXT_PUBLIC_POSTHOG_KEY` | No | PostHog project API key |
| `NEXT_PUBLIC_POSTHOG_HOST` | No | PostHog host (default: us.i.posthog.com) |
| `SENTRY_DSN` | No | Sentry error reporting DSN |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | No | Sanity CMS project ID |
| `NEXT_PUBLIC_SANITY_DATASET` | No | Sanity dataset name |
| `SANITY_API_READ_TOKEN` | No | Sanity read API token |
| `SANITY_API_WRITE_TOKEN` | No | Sanity write API token |
| `BETTER_AUTH_SECRET` | Yes | Auth session secret |

## Deployment

### Vercel

The project includes `vercel.json` with monorepo configuration. Set the root directory to `app/` and configure environment variables in the Vercel dashboard.

### Self-Hosted

```bash
bun install
bun run build
bun run start
```

The Next.js app serves from `app/` directory. Ensure all environment variables are set.
