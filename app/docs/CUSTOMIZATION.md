# Customization Guide — Superteam Academy

## Theme Customization

### Colors

The entire color palette is defined via CSS custom properties in `src/app/globals.css`. To rebrand:

```css
:root {
  --primary: 262 83% 58%;     /* Purple — change hue for different brand */
  --accent: 160 84% 39%;      /* Emerald — secondary brand color */
  --background: 0 0% 100%;    /* Light mode background */
  --foreground: 0 0% 3.9%;    /* Light mode text */
}

.dark {
  --primary: 262 83% 58%;
  --accent: 160 84% 39%;
  --background: 240 10% 4%;   /* Dark mode background */
  --foreground: 0 0% 98%;     /* Dark mode text */
}
```

### Gradients

The hero gradient and brand gradients are defined as CSS custom properties:

```css
--gradient-primary: linear-gradient(135deg, #9945FF 0%, #14F195 100%);
--gradient-hero: linear-gradient(135deg, #0f0520 0%, #1a0e3e 50%, #0a1628 100%);
```

### Typography

The default font is **Inter**. To change, update `src/app/layout.tsx`:

```typescript
import { Outfit } from 'next/font/google';  // or any Google Font
const outfit = Outfit({ subsets: ['latin'], variable: '--font-sans' });
```

## Adding New Languages

1. **Create translation file**: Copy `messages/en.json` to `messages/{locale}.json`
2. **Register locale** in `src/lib/constants.ts`:
   ```typescript
   export const LOCALES = ['en', 'pt-BR', 'es', 'fr'] as const;
   export const LOCALE_LABELS = { ..., fr: 'Français' };
   export const LOCALE_FLAGS = { ..., fr: '🇫🇷' };
   ```
3. **Import in i18n config** (`src/i18n/request.ts`):
   ```typescript
   import fr from '../../messages/fr.json';
   const messages = { ..., fr };
   ```

## Adding New Course Tracks

Update `src/lib/constants.ts`:

```typescript
export const TRACKS = [
  ...existingTracks,
  { id: 'gaming', name: 'Gaming & GameFi', color: '#FD4659', icon: '🎮' },
];
```

## Connecting a Real Backend

The service layer in `src/services/index.ts` is designed to be swappable. Each service uses the same interface regardless of data source. To connect real APIs:

1. **Course data**: Replace `MOCK_COURSES` references with Sanity/API calls.
2. **XP & Progress**: Replace `localStorage` calls with on-chain reads + backend API.
3. **Leaderboard**: Replace mock data with Helius DAS API calls to index XP balances.
4. **Credentials**: Replace with Helius `getAssetsByOwner` calls.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SOLANA_NETWORK` | Solana cluster (devnet/mainnet) | ✅ |
| `NEXT_PUBLIC_RPC_URL` | Custom RPC endpoint | Optional |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project ID | For CMS |
| `NEXT_PUBLIC_SANITY_DATASET` | Sanity dataset | For CMS |
| `NEXT_PUBLIC_HELIUS_API_KEY` | Helius API for DAS | For NFTs |
| `SENTRY_DSN` | Sentry error tracking | Optional |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog analytics | Optional |
