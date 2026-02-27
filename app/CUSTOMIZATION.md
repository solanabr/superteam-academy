# Superteam Academy — Customization Guide

## Changing the Theme

All design tokens are defined as CSS variables in `src/app/globals.css`.

### Color Tokens

```css
/* src/app/globals.css */
:root {
  --background: #0A0A0A;      /* Page background */
  --card: #111111;             /* Card background */
  --elevated: #1A1A1A;         /* Elevated card */
  --border: #1F1F1F;           /* Default border */
  --border-hover: #2E2E2E;     /* Hover border */
  --primary: #EDEDED;          /* Primary text */
  --muted-foreground: #666666; /* Muted text */
  --accent: #14F195;           /* Solana mint (main accent) */
  --accent-dim: #0D9E61;       /* Dimmed accent */
  --danger: #FF4444;           /* Error/danger */
  --warning: #F5A623;          /* Warning */
}
```

To change the accent color (e.g. to Solana purple):
```css
:root {
  --accent: #9945FF;
  --accent-dim: #7A35CC;
  --ring: #9945FF;
}
```

### Typography

Fonts are loaded via `next/font/google` in `src/app/layout.tsx`:

```typescript
import { Geist, Geist_Mono } from "next/font/google";
```

To swap fonts, change the import and variable names, then update `globals.css`:
```css
@theme inline {
  --font-sans: var(--font-your-sans);
  --font-mono: var(--font-your-mono);
}
```

## Adding a Language

1. Add the locale to `src/i18n/routing.ts`:
```typescript
export const routing = defineRouting({
  locales: ["en", "pt-BR", "es", "fr"],  // add "fr"
  defaultLocale: "en",
  // ...
});
```

2. Create the translation file:
```bash
cp src/i18n/messages/en.json src/i18n/messages/fr.json
# Translate all values in fr.json
```

3. Add the locale to `generateStaticParams` in `src/app/[locale]/layout.tsx` (handled automatically by `routing.locales`).

4. Add a flag/label to the language switcher in `src/components/layout/Header.tsx`.

## Adding a Track

1. Add to `TRACKS` in `src/types/index.ts`:
```typescript
export const TRACKS: Record<number, Omit<Track, "courses">> = {
  // ...existing tracks...
  6: { id: 6, name: "Your Track", description: "...", icon: "🔧", color: "#00D4FF" },
};
```

2. Create courses in Sanity with `trackId: 6`.

3. The landing page automatically picks up new tracks from the `TRACKS` constant.

## Configuring Analytics

### GA4
```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Add to `src/app/[locale]/layout.tsx`:
```typescript
import { GoogleAnalytics } from "@next/third-parties/google";
// ...
<GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!} />
```

### PostHog
```env
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxx
```

### Sentry
```env
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
```
Run `npx @sentry/wizard@latest -i nextjs` to configure.

## Stubbing vs. Live Implementation

The lesson completion flow currently uses a stub (`POST /api/lessons/complete` returns a mock signature). To implement the real backend:

1. Add backend keypair to environment:
```env
BACKEND_SIGNER_PRIVATE_KEY=[...array of bytes...]
```

2. Implement `src/app/api/lessons/complete/route.ts`:
```typescript
import { Keypair } from "@solana/web3.js";
// Load keypair from env
// Build complete_lesson transaction
// Sign with backend keypair
// Return real signature
```

3. Optionally add session validation (NextAuth session or wallet signature) before allowing completion.
