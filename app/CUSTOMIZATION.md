# Superteam Academy - Customization Guide

This guide covers all common customizations: theming, fonts, languages, tracks, analytics, on-chain integration, and deployment.

## Design Tokens

All design tokens are defined as CSS variables in `src/app/globals.css`. This is the single source of truth for colors, radii, and typography.

### Color Variables

```css
/* src/app/globals.css — :root (dark mode, default) */
:root {
  /* Backgrounds */
  --background: #0A0A0A;       /* Page background */
  --card: #111111;              /* Card / panel background */
  --elevated: #1A1A1A;          /* Elevated card (e.g. modals) */
  --sidebar: #0D0D0D;           /* Sidebar background */

  /* Borders */
  --border: #1F1F1F;            /* Default border */
  --border-hover: #2E2E2E;      /* Border on hover */
  --input: #1F1F1F;             /* Input border */

  /* Text */
  --foreground: #EDEDED;        /* Primary text */
  --primary: #EDEDED;           /* Primary text (alias) */
  --muted-foreground: #666666;  /* Secondary / muted text */
  --subtle: #333333;            /* Very muted text */

  /* Accent (Solana mint green) */
  --accent: #14F195;            /* Main accent — buttons, highlights */
  --accent-dim: #0D9E61;        /* Hover / pressed accent */
  --ring: #14F195;              /* Focus ring color */

  /* Semantic colors */
  --danger: #FF4444;            /* Errors, destructive actions */
  --warning: #F5A623;           /* Warnings */
  --destructive: #FF4444;       /* shadcn/ui destructive variant */

  /* Chart / track colors */
  --chart-1: #14F195;           /* Track 1: Solana Basics */
  --chart-2: #9945FF;           /* Track 2: Anchor Framework */
  --chart-3: #F5A623;           /* Track 3: DeFi */
  --chart-4: #00D4FF;           /* Track 4: NFTs */
  --chart-5: #FF4444;           /* Track 5: Full-Stack Solana */

  /* Border radius */
  --radius: 6px;
}
```

### Light Mode Overrides

Light mode tokens live in the `.light` class (toggled by the theme switcher in the header):

```css
.light {
  --background: #F7F7F5;
  --foreground: #0A0A0A;
  --card: #FFFFFF;
  --accent: #0D9E61;       /* Darker green for contrast on white */
  --accent-dim: #0A8050;
  /* ... see globals.css for full list */
}
```

### Changing the Accent Color

To rebrand from Solana mint green to Solana purple:

```css
/* src/app/globals.css */
:root {
  --accent: #9945FF;
  --accent-dim: #7A35CC;
  --ring: #9945FF;
}
```

All components that use `text-[#14F195]` or `bg-[#14F195]` hardcoded in JSX will also need updating. Search for `#14F195` across `src/` to find them.

### Border Radius

Change the base radius to make the UI more or less rounded:

```css
:root {
  --radius: 4px;   /* sharper */
  /* or */
  --radius: 10px;  /* rounder */
}
```

## Typography - Font Swapping

Fonts are loaded via `next/font/google` in `src/app/layout.tsx`:

```typescript
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
```

To swap to different fonts (e.g. IBM Plex Sans + IBM Plex Mono):

1. Update `src/app/layout.tsx`:
```typescript
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";

const ibmSans = IBM_Plex_Sans({
  variable: "--font-ibm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ibmMono = IBM_Plex_Mono({
  variable: "--font-ibm-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

// In RootLayout:
<body className={`${ibmSans.variable} ${ibmMono.variable} antialiased`}>
```

2. Update `src/app/globals.css`:
```css
@theme inline {
  --font-sans: var(--font-ibm-sans);
  --font-mono: var(--font-ibm-mono);
}
```

The app uses `font-mono` (CSS variable) throughout for headings, code, and UI elements. Changing `--font-mono` updates all of them at once.

## Adding a New Language

The platform supports EN, PT-BR, and ES. To add French (fr):

### Step 1 - Register the Locale

Edit `src/i18n/routing.ts`:

```typescript
export const routing = defineRouting({
  locales: ["en", "pt-BR", "es", "fr"],   // add "fr"
  defaultLocale: "en",
  pathnames: {
    "/": "/",
    "/courses": {
      en: "/courses",
      "pt-BR": "/cursos",
      es: "/cursos",
      fr: "/cours",           // add path translations
    },
    // ... add other pathnames
  },
});
```

### Step 2 - Create the Translation File

```bash
cp src/i18n/messages/en.json src/i18n/messages/fr.json
```

Open `src/i18n/messages/fr.json` and translate all values. Keys must remain unchanged — only values change:

```json
{
  "nav": {
    "courses": "Cours",
    "leaderboard": "Classement",
    "dashboard": "Tableau de bord"
  },
  "hero": {
    "title": "Maîtrisez le Développement Solana",
    "subtitle": "Gagnez des XP et des credentials on-chain"
  }
}
```

### Step 3 - Add to the Language Switcher

Edit `src/components/layout/Header.tsx` to add the French option to the locale switcher dropdown. Find the locale options array and add:

```typescript
{ code: "fr", label: "Français", flag: "🇫🇷" }
```

### Step 4 - Verify

Start the dev server and visit `http://localhost:3000/fr`. The route should load with French translations. Any missing translation keys will fall back to English.

## Adding a New Track

### Step 1 - Register the Track in Code

Edit `src/types/index.ts`:

```typescript
export const TRACKS: Record<number, Omit<Track, "courses">> = {
  // ... existing tracks ...
  6: {
    id: 6,
    name: "Security & Auditing",
    description: "Audit Solana programs and write secure code",
    icon: "🔐",
    color: "#FF6B35",
  },
};
```

The `color` value is used as the track's accent color on the landing page and course cards.

### Step 2 - Create Courses in Sanity

In Sanity Studio, create courses with `trackId: 6`. The landing page reads the `TRACKS` constant and automatically groups courses by track ID.

### Step 3 - Register On-Chain (if needed)

If courses in this track will have on-chain enrollment, register each course via the Anchor `initialize_course` instruction with the corresponding `track_id: 6`.

## Analytics Configuration

### PostHog (Product Analytics)

```env
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com  # or your self-hosted URL
```

PostHog is initialized in `src/lib/analytics.ts`. Custom events are tracked at:
- Course enrollment
- Lesson completion
- Credential minted
- Leaderboard viewed

### GA4 (Traffic Analytics)

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Add the Google Analytics script to `src/app/[locale]/layout.tsx`:

```typescript
import { GoogleAnalytics } from "@next/third-parties/google";

// Inside the layout JSX:
<GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!} />
```

### Sentry (Error Tracking)

```env
NEXT_PUBLIC_SENTRY_DSN=https://xxxxxxxx@oxxxxxx.ingest.sentry.io/xxxxxxx
```

Run the Sentry wizard to auto-configure source maps and error boundary:

```bash
npx @sentry/wizard@latest -i nextjs
```

This creates `sentry.client.config.ts`, `sentry.server.config.ts`, and `sentry.edge.config.ts`. Errors in Server Components, API routes, and the client are automatically captured.

## Swapping Stubs for Real On-Chain Calls

### Lesson Completion (Most Critical)

Currently `POST /api/lessons/complete` returns a mock signature. To implement real backend signing:

**Step 1 - Generate a backend keypair**:

```bash
solana-keygen new --outfile wallets/backend-signer.json
# Get the public key:
solana-keygen pubkey wallets/backend-signer.json
```

**Step 2 - Register the backend signer on-chain**:

```bash
anchor run update-config -- --backend-signer <PUBKEY>
```

**Step 3 - Add the private key to environment variables**:

```env
# .env.local (NEVER commit this)
BACKEND_SIGNER_PRIVATE_KEY=[12,34,56,...] # byte array from wallets/backend-signer.json
```

**Step 4 - Implement the API route** in `src/app/api/lessons/complete/route.ts`:

```typescript
import { Keypair, Connection, Transaction } from "@solana/web3.js";
import { getServerSession } from "next-auth";

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { courseId, lessonIndex } = await request.json();

  // Load backend keypair
  const secretKey = JSON.parse(process.env.BACKEND_SIGNER_PRIVATE_KEY!);
  const backendKeypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));

  // Build complete_lesson transaction using your Anchor program client
  const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL!);
  // ... build and sign transaction ...
  const signature = await connection.sendRawTransaction(tx.serialize());

  return Response.json({ signature });
}
```

### Course Finalization and Credential Issuance

These are backend-only operations triggered after full lesson bitmap completion:

1. Monitor `LessonCompleted` events on-chain (via Helius webhook or polling)
2. When all lessons complete: call `finalize_course` with the backend keypair
3. After finalization: call `issue_credential` to mint the Metaplex Core NFT to the learner

See `docs/SPEC.md` in the monorepo root for full instruction parameters.

## Deploying to Vercel

### Initial Setup

1. Push your fork to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Set **Framework Preset** to **Next.js**.
4. Set **Root Directory** to `app` (the Next.js app subfolder).

### Environment Variables

In Vercel dashboard → your project → **Settings** → **Environment Variables**, add:

| Variable | Environment | Value |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | All | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | Supabase anon key |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | All | Sanity project ID |
| `NEXT_PUBLIC_PROGRAM_ID` | All | `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf` |
| `NEXT_PUBLIC_CLUSTER` | All | `devnet` (or `mainnet-beta`) |
| `NEXT_PUBLIC_XP_MINT` | All | XP mint address |
| `NEXT_PUBLIC_HELIUS_API_KEY` | All | Helius API key |
| `NEXTAUTH_SECRET` | All | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Production | `https://your-app.vercel.app` |
| `GOOGLE_CLIENT_ID` | All | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | All | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | All | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | All | GitHub OAuth app secret |
| `BACKEND_SIGNER_PRIVATE_KEY` | Production | Byte array of backend keypair |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Production | `G-XXXXXXXXXX` |
| `NEXT_PUBLIC_POSTHOG_KEY` | Production | PostHog project key |
| `NEXT_PUBLIC_SENTRY_DSN` | Production | Sentry DSN |

### OAuth Redirect URIs

After getting your Vercel deployment URL, update your OAuth apps:

**Google Cloud Console** (`console.cloud.google.com`):
- Authorized redirect URIs: `https://your-app.vercel.app/api/auth/callback/google`

**GitHub Developer Settings**:
- Authorization callback URL: `https://your-app.vercel.app/api/auth/callback/github`

**Sanity CORS**:
- Add `https://your-app.vercel.app` to allowed origins

### Preview Deployments

Vercel creates a preview deployment for every push to any branch. Set preview environment variables separately if needed (you may want to use a separate Sanity dataset or Supabase project for previews).

### Redeployment

Push to `main` to trigger a production deployment. Vercel caches Node modules and build output — full rebuilds take ~2-3 minutes, incremental builds ~30 seconds.

## PWA / Icons

Icons are generated by Next.js at build time:

- `src/app/icon.tsx` → `/favicon.ico` (32x32)
- `src/app/apple-icon.tsx` → `/apple-touch-icon.png` (180x180)
- `public/icon.svg` → referenced in `public/manifest.json`
- `public/sw.js` → Service Worker for offline support

To change the icon design, edit the `ImageResponse` JSX in `src/app/icon.tsx` and `src/app/apple-icon.tsx`.
