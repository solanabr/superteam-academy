# Customization Guide

This guide covers how to customize and extend Superteam Academy: theming, dark/light mode, internationalization, gamification mechanics, achievement types, course tracks, wallet adapters, and environment variables.

---

## Theming

### CSS Variables

All design tokens are defined as HSL CSS custom properties in `src/app/globals.css`. Tailwind v4 consumes them via the `@theme inline` block at the top of the file.

```css
/* src/app/globals.css */

:root {
  /* Primary — purple (Solana brand) */
  --primary:            262 83% 58%;
  --primary-foreground: 0 0% 100%;

  /* Secondary — green (Solana brand) */
  --secondary:            160 93% 51%;
  --secondary-foreground: 240 10% 3.9%;

  /* Accent — cyan */
  --accent:             189 100% 50%;
  --accent-foreground:  240 10% 3.9%;

  /* Surfaces */
  --background:         0 0% 100%;
  --foreground:         240 10% 3.9%;
  --card:               0 0% 100%;
  --muted:              240 4.8% 95.9%;
  --muted-foreground:   240 3.8% 43%;
  --destructive:        0 84.2% 60.2%;
  --border:             240 5.9% 90%;
  --input:              240 5.9% 90%;
  --ring:               262 83% 58%;

  /* Border radius */
  --radius: 0.75rem;
}

.dark {
  --background:       240 20% 3.9%;
  --foreground:       0 0% 95%;
  --card:             240 17% 6%;
  --muted:            240 5% 15%;
  --muted-foreground: 240 5% 64.9%;
  --primary:          262 83% 65%;  /* lighter for dark mode contrast */
  --secondary:        160 93% 55%;
  --border:           240 5% 17%;
  --input:            240 5% 17%;
}
```

### Changing Brand Colors

To rebrand, update the three color roles in both `:root` and `.dark`:

```css
:root {
  /* Example: change primary from purple to orange */
  --primary:            25 95% 53%;
  --primary-foreground: 0 0% 100%;
  --ring:               25 95% 53%;  /* ring should always match primary */
}

.dark {
  --primary: 25 95% 60%;  /* slightly lighter for dark-mode contrast */
  --ring:    25 95% 53%;
}
```

Because Tailwind v4 reads these via `@theme inline`, utility classes such as `bg-primary`, `text-primary`, `border-primary`, and `ring-primary` update automatically throughout the app.

Also update the hardcoded gradient utilities in `globals.css`:

| Class | Effect | HSL values to update |
|---|---|---|
| `.gradient-brand` | `linear-gradient(135deg, purple, green)` | `hsl(262 83% 58%)`, `hsl(160 93% 51%)` |
| `.gradient-text` | Text gradient (purple to cyan) | `hsl(262 83% 58%)`, `hsl(189 100% 50%)` |
| `.glow-primary` | Purple box-shadow glow | `hsl(262 83% 58%)` |
| `.glow-success` | Green box-shadow glow | `hsl(160 93% 51%)` |

### Border Radius

```css
:root {
  --radius: 0.75rem;  /* 0 = sharp, 0.5rem = subtle, 1.5rem = very rounded */
}
```

Derived Tailwind utilities: `--radius-sm` (radius − 4px), `--radius-md` (radius − 2px), `--radius-lg` (radius), `--radius-xl` (radius + 4px).

### Custom Animations

`globals.css` defines animation utility classes used throughout the UI:

| Class | Purpose |
|---|---|
| `.animate-fade-in` | Fade in with slight upward movement (0.3 s) |
| `.animate-slide-up` | Slide up from below (0.4 s) |
| `.animate-gradient` | Shifting gradient background (8 s infinite) |
| `.animate-float` | Floating orb effect (6 s infinite) |
| `.animate-fade-in-up-{1..5}` | Staggered fade-in-up with 0.1 s delay increments |
| `.shimmer` | Loading shimmer effect |
| `.xp-toast-float` | XP toast float-up animation (2.5 s) |

All animations are disabled globally when `prefers-reduced-motion: reduce` is set:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Dark and Light Mode

Dark mode is managed by `next-themes` with the `class` strategy. The `<html>` element gets a `dark` class, activating the `.dark` CSS selector.

### Configuration

In `src/app/[locale]/layout.tsx`:

```tsx
<ThemeProvider
  attribute="class"          // adds "dark" class to <html>
  defaultTheme="dark"        // default theme on first visit
  enableSystem               // respects OS preference
  disableTransitionOnChange  // prevents flash during toggle
>
```

To change the default theme:

```tsx
<ThemeProvider attribute="class" defaultTheme="light" enableSystem>
```

### Styling for Dark Mode

Prefer semantic utilities that reference CSS variables — they change automatically in both themes:

```tsx
<div className="bg-background text-foreground">
```

For one-off overrides use the `dark:` prefix:

```tsx
<div className="bg-white dark:bg-gray-950">
```

The theme toggle button is `src/components/layout/ThemeToggle.tsx` and uses `useTheme()` from `next-themes`.

---

## Adding a New Language

The app supports `pt-BR` (default), `en`, and `es`. Here is how to add `fr` (French) as an example.

### Step 1: Add the locale to the routing config

Edit `src/i18n/routing.ts`:

```typescript
export const routing = defineRouting({
  locales: ["pt-BR", "en", "es", "fr"] as const,  // add "fr"
  defaultLocale: "pt-BR",
});
```

### Step 2: Create the message file

```bash
cp src/i18n/messages/en.json src/i18n/messages/fr.json
```

Translate every string value in `fr.json`. The file is a namespaced flat JSON object:

```json
{
  "common": {
    "appName": "Superteam Academy",
    "loading": "Chargement...",
    "connectWallet": "Connecter le portefeuille"
  },
  "courses": {
    "title": "Cours",
    "subtitle": "Explorez nos cours"
  }
}
```

### Step 3: Update the locale layout type guard

In `src/app/[locale]/layout.tsx`:

```typescript
if (!routing.locales.includes(locale as "pt-BR" | "en" | "es" | "fr")) {
  notFound();
}
```

### Step 4: Add the locale to the LocaleSwitcher

In `src/components/layout/LocaleSwitcher.tsx`:

```typescript
const locales = [
  { code: "pt-BR", label: "Portugues" },
  { code: "en",    label: "English" },
  { code: "es",    label: "Espanol" },
  { code: "fr",    label: "Francais" },  // add this
];
```

### Step 5: Add the locale to Sanity schemas

In `src/lib/sanity/schemas/course.ts`:

```typescript
{ name: "locale", title: "Locale", type: "string",
  options: { list: ["pt-BR", "en", "es", "fr"] },
  initialValue: "pt-BR" }
```

### Step 6: Create CMS content for the new locale

In Sanity Studio, create `Course` and `Lesson` documents with `locale` set to `"fr"`. Use the same `slug` and `onChainCourseId` as the other locale variants.

---

## Adding New Achievement Types

Achievements are on-chain `AchievementType` PDAs seeded by `["achievement", achievementId]`. The client-side definitions live in `src/lib/gamification/achievements.ts`.

### Step 1: Define the achievement in the client

Edit `src/lib/gamification/achievements.ts`:

```typescript
export const ACHIEVEMENT_DEFINITIONS = [
  // ... existing definitions
  {
    id: "defi_pioneer",
    bitmapIndex: 15,           // next available index; must be unique
    name: "DeFi Pioneer",
    description: "Complete your first DeFi course.",
    xpReward: 200,
    icon: "TrendingUp",
  },
];
```

**The `bitmapIndex` must be unique across all achievement definitions.** It is the bit position in the on-chain achievements bitmap.

### Step 2: Create the on-chain AchievementType

Using the Anchor program's `create_achievement_type` instruction:

```typescript
await program.methods
  .createAchievementType(
    "defi_pioneer",               // achievementId — must match definition above
    "DeFi Pioneer",               // name
    "arweave://your-metadata-uri",// metadata URI (Arweave recommended)
    xpReward,                     // u64 XP reward
    maxSupply,                    // Option<u32> — null for unlimited
  )
  .accounts({ collection, authority, ... })
  .rpc();
```

### Step 3: Add the trigger condition

In `src/lib/services/AchievementTriggerService.ts`, add a handler inside the appropriate event function:

```typescript
async function handleCourseComplete(ctx: AchievementContext): Promise<void> {
  const promises: Promise<void>[] = [];
  // ... existing checks

  // defi_pioneer: completed a course whose trackId contains "defi"
  if (ctx.trackId && ctx.trackId.toLowerCase().includes("defi")) {
    promises.push(tryTrigger("defi_pioneer", ctx));
  }

  await Promise.allSettled(promises);
}
```

The `AchievementReceipt` PDA (`["achievement_receipt", achievementId, recipient]`) prevents double-issuance on-chain.

### Step 4: Pass context from the UI

In the component or hook that calls `completeLessonWithProgress` or `finalizeCourseWithProgress`, include the relevant context fields:

```typescript
achievementCtx: {
  unlockedBitmap,
  trackId: course.trackId,
  totalCoursesCompleted,
  onUnlocked: (id, xp) => toast(`Achievement unlocked: +${xp} XP`),
}
```

---

## Extending Gamification

### XP Level Formula

The XP-to-level formula is implemented in `src/lib/services/LearningProgressService.ts`:

```typescript
// level = floor(sqrt(xp / 100))
export function getLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100));
}

// percentage progress toward next level (0–100)
export function getLevelProgress(xp: number): number {
  const currentLevel = getLevel(xp);
  const xpForCurrentLevel = currentLevel * currentLevel * 100;
  const xpForNextLevel = (currentLevel + 1) * (currentLevel + 1) * 100;
  const range = xpForNextLevel - xpForCurrentLevel;
  return range === 0 ? 0 : Math.round(((xp - xpForCurrentLevel) / range) * 100);
}
```

Level thresholds:

| Level | XP Required |
|---|---|
| 1 | 100 |
| 2 | 400 |
| 5 | 2,500 |
| 10 | 10,000 |
| 20 | 40,000 |
| 50 | 250,000 |

Because XP is soulbound on-chain, the formula is purely a UI concern — change it freely without affecting on-chain data.

### Streak Mechanics

Streak logic lives in `src/stores/progress-store.ts` in the `recordActivity()` method:

| Condition | Result |
|---|---|
| Last activity was yesterday | Streak + 1 |
| Last activity was today | No change |
| Last activity was any other day | Streak reset to 1 |
| Exactly 1 day missed + freeze available | Freeze consumed, streak + 1 |

**Streak freeze awards at milestones:**
- 7-day milestone → +1 freeze token
- 30-day milestone → +2 freeze tokens
- 100-day milestone → +3 freeze tokens

**Daily XP bonuses (per `recordActivity`):**
- First activity of the day: +25 XP
- Continuing a streak: +10 XP

To change milestone thresholds, edit the `[7, 30, 100]` array in `recordActivity()` and update the achievement definitions accordingly.

### XP Reward Ranges

Defined as constants in `src/lib/services/LearningProgressService.ts`:

```typescript
export const XP_RANGES = {
  lesson:    { min: 10,  max: 50   },
  challenge: { min: 25,  max: 100  },
  course:    { min: 500, max: 2000 },
} as const;

export const XP_BONUSES = {
  dailyStreak:          10,
  firstCompletionOfDay: 25,
} as const;
```

Note: per-lesson XP amounts are set on-chain via `create_course` and cannot be changed retroactively for a deployed course.

### Adding New Course Tracks

Courses are grouped by a numeric `trackId`. To add a new track:

**On-chain:** Use the new `trackId` value in `create_course`. Track IDs are arbitrary unsigned integers.

**Frontend:** Define track metadata in a constants file and add UI filtering to `CourseGrid`:

```typescript
// src/lib/constants/tracks.ts
export const TRACKS = [
  { id: 1, name: "Core Solana",   icon: "Shield",     color: "purple" },
  { id: 2, name: "DeFi",          icon: "TrendingUp", color: "green"  },
  { id: 3, name: "NFTs & Gaming", icon: "Palette",    color: "cyan"   },
  { id: 4, name: "Payments",      icon: "CreditCard", color: "orange" },
  // add more tracks here
];
```

**Sanity:** Set the `trackId` field on each Course document.

---

## Wallet Adapter Configuration

### Current wallets

```typescript
// src/components/wallet/WalletProvider.tsx
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";

const wallets = useMemo(
  () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
  []
);
```

### Adding a new wallet

1. Install the adapter:

```bash
npm install @solana/wallet-adapter-backpack
```

2. Add it to the wallets array:

```typescript
import { BackpackWalletAdapter } from "@solana/wallet-adapter-backpack";

const wallets = useMemo(
  () => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new BackpackWalletAdapter(),
  ],
  []
);
```

3. If the package is separate, add it to `optimizePackageImports` in `next.config.ts`.

---

## Environment Variables Reference

Copy `.env.example` to `.env.local` and fill in all values.

### Solana

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SOLANA_RPC_URL` | Yes | Helius RPC endpoint (e.g., `https://devnet.helius-rpc.com/?api-key=KEY`) |
| `NEXT_PUBLIC_SOLANA_NETWORK` | Yes | `devnet` or `mainnet-beta` |
| `NEXT_PUBLIC_PROGRAM_ID` | Yes | Deployed on-chain program address |
| `NEXT_PUBLIC_XP_MINT` | Yes | Token-2022 XP mint address |
| `BACKEND_SIGNER_KEYPAIR` | Yes | JSON byte array of 64 numbers — **server-only, never expose to client** |
| `HELIUS_API_KEY` | Yes | Helius API key for DAS queries (leaderboard, credentials, XP balances) |

`BACKEND_SIGNER_KEYPAIR` must be a JSON byte array (e.g., `[12,34,56,...]`) that exactly matches the `backend_signer` stored in the on-chain `Config` PDA.

### Authentication (NextAuth v5)

| Variable | Required | Description |
|---|---|---|
| `AUTH_SECRET` | Yes | Random secret — generate with `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` | Yes | Google OAuth 2.0 client ID |
| `AUTH_GOOGLE_SECRET` | Yes | Google OAuth 2.0 client secret |
| `AUTH_GITHUB_ID` | Yes | GitHub OAuth App client ID |
| `AUTH_GITHUB_SECRET` | Yes | GitHub OAuth App client secret |

### Sanity CMS

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Yes | Sanity project ID (from [sanity.io/manage](https://sanity.io/manage)) |
| `NEXT_PUBLIC_SANITY_DATASET` | Yes | Dataset name (usually `production`) |
| `SANITY_API_TOKEN` | Yes | API token with write access — **server-only** |

### Analytics (all optional)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | Google Analytics 4 (format: `G-XXXXXXXXXX`) |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project API key |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog ingestion host (default: `https://app.posthog.com`) |
| `NEXT_PUBLIC_CLARITY_ID` | Microsoft Clarity project ID |
| `SENTRY_DSN` | Sentry DSN for error monitoring |
| `SENTRY_AUTH_TOKEN` | Sentry auth token for source map uploads |

### Application

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Yes | Full public URL (e.g., `https://academy.superteam.fun`) |

---

## Adding New Pages

All user-facing pages live under `src/app/[locale]/`. The `[locale]` segment is required for i18n routing.

### Page template

```typescript
import { setRequestLocale, getTranslations } from "next-intl/server";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "yourNamespace" });
  return { title: t("title") };
}

export const revalidate = 60;  // ISR interval in seconds

export default async function YourPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  // fetch data, render UI
  return <div>...</div>;
}
```

### Checklist

1. Create `src/app/[locale]/your-route/page.tsx` (and optionally `loading.tsx`).
2. Add translations to all three message files.
3. Add navigation link in `src/components/layout/Header.tsx`.
4. Set an appropriate `revalidate` value.

### API routes

API routes live in `src/app/api/` and are excluded from i18n middleware:

```typescript
// src/app/api/your-feature/route.ts
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(`your-feature:${ip}`, 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  return NextResponse.json({ success: true });
}
```

---

## Custom Components

### shadcn/ui Pattern

All base UI components live in `src/components/ui/` and follow the shadcn/ui pattern with `class-variance-authority` (CVA) for variants and `tailwind-merge` for class deduplication.

To add a new shadcn/ui component:

```bash
npx shadcn@latest add <component-name>
```

### Server vs. Client Components

- **Server Components** (default — no `"use client"` directive): can `async/await`, access server data, use `getTranslations()` from `next-intl/server`.
- **Client Components** (marked `"use client"`): can use React hooks, Zustand stores, wallet adapter, `useTranslations()` from `next-intl`.

Prefer Server Components for data fetching and static rendering. Use Client Components only for interactive elements.

### Wallet-Aware Component Pattern

```typescript
"use client";
import { useWallet } from "@solana/wallet-adapter-react";

export function MyWalletFeature() {
  const { publicKey, connected, signMessage } = useWallet();
  if (!connected) return <ConnectWalletPrompt />;
  // use publicKey, signMessage, sendTransaction, etc.
}
```

---

## Adding a New Analytics Event

Unified event tracking (GA4 + PostHog simultaneously) is in `src/lib/analytics/events.ts`:

```typescript
import { trackEvent } from "./ga4";
import { getPostHog } from "./posthog";

export function trackCustomEvent(param: string): void {
  trackEvent("custom_event", { param });
  getPostHog()?.capture("custom_event", { param });
}
```

Then call `trackCustomEvent(...)` from the relevant component or service.

---

## Switching Networks (Devnet → Mainnet)

1. Set `NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta`
2. Set `NEXT_PUBLIC_SOLANA_RPC_URL` to a mainnet Helius endpoint
3. Update `NEXT_PUBLIC_XP_MINT` to the mainnet XP mint address
4. Update `NEXT_PUBLIC_PROGRAM_ID` to the mainnet program address (if redeployed)
5. Update `BACKEND_SIGNER_KEYPAIR` to the mainnet backend signer keypair
6. Update preconnect hints in `src/app/[locale]/layout.tsx` if the RPC domain changes

```html
<!-- Change from devnet to mainnet -->
<link rel="preconnect" href="https://mainnet.helius-rpc.com" crossOrigin="anonymous" />
```
