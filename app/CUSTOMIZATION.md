# Customization Guide

This guide covers how to customize the branding, theme, language, and behavior of the Superteam Brazil Academy platform.

## Branding

### Logo

Replace the logo image at `public/imgs/logo.png`. The logo is displayed in:
- The dashboard sidebar (`src/components/sidebar/DashboardSidebar.tsx`)
- The public navigation bar (`src/components/PublicNav.tsx`)
- The landing page (`src/components/LandingClient.tsx`)

Recommended size: **200×50px** (SVG or PNG with transparent background).

### Platform Name

The platform name appears in several places. Search for `"Superteam Brazil Academy"` and `"Superteam Academy"` across the codebase:

```bash
grep -r "Superteam" src/ --include="*.tsx" --include="*.ts" -l
```

Key files to update:
- `src/app/layout.tsx` — page `<title>` and metadata
- `src/components/LandingClient.tsx` — landing page hero text
- `src/messages/en.json`, `pt-BR.json`, `es.json` — i18n strings
- `src/components/Footer.tsx` — footer copyright

### Favicon

Replace `public/favicon.ico` with your own favicon.

## Theme & Colors

The platform uses a dark Solana-inspired theme. Colors are defined in `src/app/globals.css` using CSS custom properties:

```css
/* Primary purple */
--primary: #9945FF;

/* Accent teal */
--accent: #14F195;
```

To change the color scheme, update the hex values in `globals.css` under `:root` (light) and `.dark`:

```css
:root {
  --background: #FFFFFF;      /* Page background */
  --foreground: #0F0F13;      /* Default text */
  --primary: #9945FF;         /* Brand color (buttons, links, highlights) */
  --primary-foreground: #FFFFFF;
  --card: #FFFFFF;            /* Card background */
  --border: #E5E7EB;          /* Border color */
  --muted: #F5F0FF;           /* Muted backgrounds */
  --muted-foreground: #6B7280; /* Muted text */
}

.dark {
  --background: #0F0F13;
  --foreground: #E2E8F0;
  --primary: #9945FF;
  --card: #1A1A2E;
  --border: #2D2D4E;
  --muted: #1E1E3F;
  --muted-foreground: #94A3B8;
}
```

Use [coolors.co](https://coolors.co) or [color.review](https://color.review) to check contrast ratios for accessibility.

## Internationalization (i18n)

The platform supports English, Português (Brasil), and Español out of the box.

### Adding or editing translations

All UI strings live in `src/messages/`:

```
src/messages/
├── en.json       # English (default)
├── pt-BR.json    # Portuguese (Brazil)
└── es.json       # Spanish
```

Edit these files to change any UI text. Keys are namespaced by feature:

```json
{
  "navigation": {
    "dashboard": "Dashboard",
    "courses": "Courses",
    "leaderboard": "Leaderboard"
  },
  "courses": {
    "enrollButton": "Enroll for Free",
    "enrolling": "Enrolling…"
  }
}
```

### Adding a new language

1. Create `src/messages/fr.json` (for French, for example)
2. Add `"fr"` to the locales list in `src/lib/locale.ts`
3. Add the language option to `src/components/LanguageSwitcher.tsx`

### Using translations in components

```tsx
import { useTranslations } from "next-intl"

export function MyComponent() {
  const t = useTranslations("courses")
  return <button>{t("enrollButton")}</button>
}
```

For server components:
```tsx
import { getTranslations } from "next-intl/server"

export async function MyServerComponent() {
  const t = await getTranslations("courses")
  return <h1>{t("enrollButton")}</h1>
}
```

## Course Tracks

Courses are organized into tracks. The available tracks and their on-chain IDs are:

| Track | On-chain ID | Description |
|-------|-------------|-------------|
| `fundamentals` | 1 | Solana basics, accounts, programs |
| `defi` | 2 | DeFi protocols, AMMs, lending |
| `nft` | 3 | NFTs, Metaplex, digital assets |
| `security` | 4 | Smart contract auditing, exploits |
| `frontend` | 5 | Wallet integration, dApp UIs |

To add a new track:
1. Add it to the `trackToU8()` function in `scripts/initialize-onchain-courses.ts`
2. Add it to the course filter options in `src/app/(consumer)/courses/page.tsx`
3. Add translations for the track name in `src/messages/*.json`

## XP & Leveling

XP rewards and level thresholds are configured in `src/services/xp.ts`:

```ts
// XP awarded per lesson completion
const LESSON_XP = 25

// Level thresholds — customize these
export function getLevel(xp: number): number {
  if (xp >= 10000) return 10
  if (xp >= 5000)  return 9
  // ...
}
```

Edit `getLevel()` to adjust the leveling curve for your community.

## Wallet Support

Supported wallets are configured in `src/app/WalletProviders.tsx`:

```tsx
const wallets = useMemo(() => [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
  new BackpackWalletAdapter(),
], [])
```

To add more wallets, install the adapter package and add it to this list. See the [Solana wallet adapter docs](https://github.com/solana-labs/wallet-adapter) for available wallets.

## Email Templates

Emails are sent via [Resend](https://resend.com). The OTP email template is in `src/lib/email.ts`. Customize the HTML to match your brand.

## Analytics

### Google Analytics

Set `NEXT_PUBLIC_GA_ID` in `.env` to your GA4 measurement ID (`G-XXXXXXXXXX`). Analytics events are fired from `src/lib/analytics.ts`.

### Sentry Error Tracking

Set `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` to enable error monitoring. Configuration is in `sentry.client.config.ts` and `sentry.edge.config.ts`.

## Deployment

### Vercel (recommended)

1. Push the repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add all environment variables from `.env`
4. Deploy

Note: `BACKEND_SIGNER_KEYPAIR` must be a base58 or JSON array string (not a file path) in production since the server won't have access to local files:

```env
# Production: use base58 format
BACKEND_SIGNER_KEYPAIR=5K7jXabcdef...   # base58 encoded private key

# Or JSON array format
BACKEND_SIGNER_KEYPAIR=[1,2,3,...]
```

Export from your keypair file:
```bash
# Get base58 from signer.json
node -e "const bs58=require('bs58'); const key=require('./wallets/signer.json'); console.log(bs58.encode(Buffer.from(key)))"
```

### Other Platforms

The app is a standard Next.js application and can be deployed anywhere that supports Node.js:

- **Railway** — connect GitHub repo, add env vars, deploy
- **Render** — use the Node.js service type
- **Self-hosted** — `npm run build && npm run start`
