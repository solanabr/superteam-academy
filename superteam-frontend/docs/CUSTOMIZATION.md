# Customization Guide

How to customize and extend the Superteam Academy frontend.

## Theme Customization

### CSS Variables

The theme is defined through CSS custom properties in `app/globals.css`. All colors use HSL values (hue, saturation%, lightness%) without the `hsl()` wrapper -- the wrapper is applied in Tailwind config.

#### Light Theme (`:root`)

```css
:root {
  --background: 40 40% 97%;        /* Warm off-white */
  --foreground: 135 13% 12%;       /* Dark green-gray */
  --primary: 153 100% 27%;         /* Emerald green */
  --accent: 47 100% 63%;           /* Gold */
  --destructive: 0 72% 51%;        /* Red */
  --emerald: 153 100% 27%;         /* Brand emerald */
  --gold: 47 100% 63%;             /* Brand gold */
  /* ... see globals.css for all variables */
}
```

#### Dark Theme (`.dark`)

```css
.dark {
  --background: 135 13% 12%;       /* Dark green-gray */
  --foreground: 40 30% 93%;        /* Warm off-white */
  --primary: 153 100% 27%;         /* Same emerald */
  --accent: 47 100% 63%;           /* Same gold */
  /* ... see globals.css for all variables */
}
```

#### Variable Reference

| Variable | Purpose | Used By |
|----------|---------|---------|
| `--background` | Page background | `bg-background` |
| `--foreground` | Primary text | `text-foreground` |
| `--card` | Card backgrounds | `bg-card` |
| `--card-foreground` | Card text | `text-card-foreground` |
| `--primary` | Primary actions, links, XP indicators | `bg-primary`, `text-primary` |
| `--primary-foreground` | Text on primary backgrounds | `text-primary-foreground` |
| `--secondary` | Secondary backgrounds | `bg-secondary` |
| `--muted` | Muted backgrounds | `bg-muted` |
| `--muted-foreground` | Secondary text, labels | `text-muted-foreground` |
| `--accent` | Gold accents, highlights | `bg-accent` |
| `--destructive` | Error states, destructive actions | `bg-destructive` |
| `--border` | Borders | `border-border` |
| `--ring` | Focus rings | `ring-ring` |
| `--emerald` | Brand emerald (glow effects) | `.glow-green` |
| `--gold` | Brand gold (glow effects, streak) | `.glow-gold` |
| `--chart-1` through `--chart-5` | Chart colors | Recharts components |
| `--sidebar-*` | Sidebar-specific variants | Sidebar components |

#### Changing the Brand Color

To change the primary brand color from emerald to, for example, blue:

```css
:root {
  --primary: 217 91% 60%;          /* Blue */
  --ring: 217 91% 60%;
  --emerald: 217 91% 60%;          /* Used for glow effects */
  --chart-1: 217 91% 60%;
  --sidebar-primary: 217 91% 60%;
}

.dark {
  --primary: 217 91% 60%;
  --ring: 217 91% 60%;
  --emerald: 217 91% 60%;
  --chart-1: 217 91% 60%;
  --sidebar-primary: 217 91% 60%;
}
```

### Tailwind Configuration

The Tailwind config at `tailwind.config.ts` maps CSS variables to utility classes:

```typescript
// tailwind.config.ts
colors: {
  primary: {
    DEFAULT: "hsl(var(--primary))",
    foreground: "hsl(var(--primary-foreground))",
  },
  emerald: {
    DEFAULT: "hsl(var(--emerald))",
  },
  gold: {
    DEFAULT: "hsl(var(--gold))",
  },
  // ...
}
```

To add a new color token:

1. Add the CSS variable to both `:root` and `.dark` in `app/globals.css`.
2. Add the mapping in `tailwind.config.ts` under `theme.extend.colors`.
3. Use it as `bg-yourcolor`, `text-yourcolor`, etc.

### Fonts

Three font families are configured in `app/layout.tsx`:

| Variable | Font | Usage |
|----------|------|-------|
| `--font-inter` | Inter | Body text (`font-sans`) |
| `--font-archivo` | Archivo | Headings (h1-h6 via CSS rule) |
| `--font-jetbrains` | JetBrains Mono | Code editor |

To change a font, modify the import in `app/layout.tsx`:

```typescript
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-inter",  // Reuse the same variable
  weight: ["400", "500", "600", "700"],
});
```

### Dark/Light Mode

Theme switching is powered by `next-themes`:

```typescript
// components/theme-provider.tsx
<ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
```

- `attribute="class"` -- Adds/removes the `dark` class on `<html>`.
- `defaultTheme="dark"` -- Default on first visit.
- `enableSystem` -- Respects `prefers-color-scheme` media query.

To change the default theme, modify `defaultTheme` in `components/providers/app-providers.tsx`.

### Custom Glow Effects

Two glow utility classes are defined in `app/globals.css`:

```css
.glow-green {
  box-shadow: 0 0 20px hsl(var(--emerald) / 0.15),
              0 0 60px hsl(var(--emerald) / 0.05);
}
.glow-gold {
  box-shadow: 0 0 20px hsl(var(--gold) / 0.15),
              0 0 60px hsl(var(--gold) / 0.05);
}
```

## Adding a New Language

### Step 1: Create the Message File

Create a new file in `messages/`. Copy `messages/en.json` as the starting template:

```bash
cp messages/en.json messages/fr.json
```

Translate all strings in the new file.

### Step 2: Register the Locale

Edit `i18n/config.ts`:

```typescript
export const locales = ["en", "pt-br", "es", "fr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  "pt-br": "Portugues (BR)",
  es: "Espanol",
  fr: "Francais",        // Add this
};

export const localeFlags: Record<Locale, string> = {
  en: "\u{1F1FA}\u{1F1F8}",
  "pt-br": "\u{1F1E7}\u{1F1F7}",
  es: "\u{1F1EA}\u{1F1F8}",
  fr: "\u{1F1EB}\u{1F1F7}",   // Add this
};
```

### Step 3: Verify

The `LanguageSwitcher` component automatically reads from `locales` and renders all registered locales. No changes needed to the switcher UI. The `i18n/request.ts` handler dynamically imports `messages/{locale}.json`, so the new file is picked up automatically.

### Translation File Structure

The message JSON is organized by namespace:

```json
{
  "nav": { "home": "Home", "courses": "Courses", ... },
  "footer": { "about": "About", "community": "Community", ... },
  "theme": { "light": "Light", "dark": "Dark", "system": "System" },
  "language": { "switchLanguage": "Switch Language", ... },
  "hero": { "title": "Build on Solana", "subtitle": "...", ... },
  "stats": { "developers": "Developers", "courses": "Courses", ... },
  "paths": { "title": "Learning Paths", ... },
  "features": { ... },
  "testimonials": { ... },
  "cta": { ... },
  "courses": { ... },
  "dashboard": { ... },
  "leaderboard": { ... },
  "profile": { ... },
  "settings": { ... },
  "common": { ... }
}
```

Use `useTranslations("namespace")` in client components and `getTranslations("namespace")` in server components to access strings.

## Extending Gamification

### Adding a New Achievement/Badge

Achievements are displayed on the dashboard and profile. To add a new badge:

#### Step 1: Add the Badge Definition

In `components/dashboard/dashboard-content.tsx`, extend the badge mappings:

```typescript
const badgeIcons: Record<string, typeof Zap> = {
  footprints: Footprints,
  swords: Swords,
  flame: Flame,
  trophy: Trophy,
  bug: Bug,
  building: Building,
  anchor: Anchor,
  zap: Zap,
  shield: Shield,     // New icon
};

const badgeNameToIcon: Record<string, string> = {
  "First Steps": "footprints",
  "Code Warrior": "swords",
  "Streak Master": "flame",
  "Top 100": "trophy",
  "Bug Hunter": "bug",
  "DeFi Builder": "building",
  "Anchor Pro": "anchor",
  "Speed Demon": "zap",
  "Security Expert": "shield",  // New badge
};
```

#### Step 2: Include the Badge in Identity Data

In `lib/services/identity-read-service.ts` or wherever identity snapshots are built, add the badge to the `badges` array:

```typescript
badges: [
  // ... existing badges
  { name: "Security Expert", earned: false },
]
```

#### Step 3: Implement Earning Logic

Badge earning is tracked in the `IdentityAchievement` type:

```typescript
type IdentityAchievement = {
  name: string;
  earned: boolean;
};
```

Set `earned: true` based on your criteria (XP threshold, course completion, etc.) when building the identity snapshot.

### Modifying XP Values

XP constants are defined in several places:

| Location | Constant | Value | Description |
|----------|----------|-------|-------------|
| `lib/server/activity-store.ts` | `XP_PER_LESSON` | 50 | XP recorded per lesson in activity feed |
| `lib/course-catalog.ts` | `course.xp` | varies | Total XP per course (2400-5200) |
| `components/lesson/code-editor.tsx` | Hardcoded | 120 | XP shown in challenge completion banner |

To change XP-per-lesson:
1. Update `XP_PER_LESSON` in `lib/server/activity-store.ts`.
2. Update the display value in the code editor completion banner.
3. The on-chain program has its own XP logic -- coordinate changes there.

### Level Calculation

The level system uses `xpToNext` from the identity snapshot. To modify the leveling curve, update the calculation in the identity service where `xpToNext` is computed.

## Adding a New Course

### Via Hardcoded Data (No CMS)

Edit `lib/course-catalog.ts` and add a new entry to the `courses` array:

```typescript
export const courses: Course[] = [
  // ... existing courses
  {
    slug: "token-extensions",
    title: "Token Extensions on Solana",
    description: "Learn to create tokens with transfer hooks, metadata, and more.",
    instructor: "Your Name",
    instructorAvatar: "YN",
    difficulty: "Intermediate",
    duration: "10h 15m",
    lessons: 30,
    rating: 4.7,
    enrolled: 0,
    tags: ["Token-2022", "Solana", "SPL"],
    progress: 0,
    xp: 2800,
    thumbnail: "/token-extensions.jpg",
    modules: [
      {
        title: "Introduction to Token Extensions",
        lessons: [
          {
            id: "te-1-1",
            title: "What are Token Extensions?",
            type: "reading",
            duration: "10m",
            completed: false,
          },
          {
            id: "te-1-2",
            title: "Creating a Token with Metadata",
            type: "challenge",
            duration: "25m",
            completed: false,
          },
        ],
      },
    ],
  },
];
```

Put a thumbnail image in the `public/` directory.

### Via CMS

See the CMS Guide (`docs/CMS_GUIDE.md`) for creating courses in Sanity.

### On-Chain Registration

When a user first enrolls in a course, the frontend calls `POST /api/academy/courses/ensure` to create the course PDA on-chain if it does not exist. The `courseId` used on-chain is the course `slug`. No manual on-chain setup is needed per course.

## Custom Analytics Events

### Tracking a New Event

Use the unified analytics API in `lib/analytics/index.ts`:

```typescript
import { analytics } from "@/lib/analytics";

// Track a custom event
analytics.trackEvent("challenge_completed", {
  courseSlug: "solana-fundamentals",
  lessonId: "1-3",
  timeSpentMs: 45000,
  attemptsCount: 3,
});

// Identify a user
analytics.identify(userId, {
  walletAddress: "...",
  level: 5,
});
```

This sends the event to both GA4 and PostHog simultaneously. If either service is not configured, the call is a no-op for that service.

### GA4 Custom Events

Events sent via `gtag.event()` appear in Google Analytics under **Events**. Custom parameters are included as event parameters. Use GA4 custom dimensions if you need to filter/report on custom parameters.

### PostHog Events

Events sent via `posthog.capture()` appear in PostHog under **Events**. All properties are automatically available for filtering. PostHog also captures:
- `$pageview` events (automatic via AnalyticsProvider)
- Session recordings (if enabled in PostHog settings)
- Feature flags (if configured)

### Adding a New Analytics Destination

To add a third analytics provider (e.g., Mixpanel):

1. Create `lib/analytics/mixpanel.ts` with `capture()`, `identify()`, `reset()` functions.
2. Import and call it in `lib/analytics/index.ts`:

```typescript
import * as mixpanelClient from "./mixpanel";

export const analytics = {
  trackEvent(name: string, params: EventParams = {}): void {
    gtag.event(name, params);
    posthogClient.capture(name, params);
    mixpanelClient.capture(name, params);  // Add this
  },
  // ...
};
```

## Modifying the Leaderboard

### Data Source

The leaderboard reads data from on-chain `LearnerProfile` accounts via `getAllLearnerProfilesOnChain()`. The cache in `lib/server/leaderboard-cache.ts` refreshes every 5 minutes.

### Changing the Cache TTL

```typescript
// lib/server/leaderboard-cache.ts
const CACHE_MS = 5 * 60 * 1000; // Change this value
```

### Changing the Sort Order

By default, entries are sorted by XP descending:

```typescript
.sort((a, b) => b.xp - a.xp);
```

To sort by streak, level, or a composite score:

```typescript
// Sort by level first, then XP
.sort((a, b) => b.level - a.level || b.xp - a.xp);

// Composite score
.sort((a, b) => {
  const scoreA = a.xp + a.streak * 100 + a.level * 500;
  const scoreB = b.xp + b.streak * 100 + b.level * 500;
  return scoreB - scoreA;
});
```

### Adding Filters

The `LeaderboardEntry` type includes:

```typescript
type LeaderboardEntry = {
  wallet: string;
  authority: string;
  xp: number;
  level: number;
  streak: number;
  rank: number;
};
```

To add time-based or track-based filtering, extend the leaderboard API route at `app/api/leaderboard/route.ts` to accept query parameters and filter the cached entries.

### Leaderboard Display

The leaderboard widget on the dashboard shows the top 5 entries (`leaderboardEntries.slice(0, 5)`). The full leaderboard page in `components/leaderboard/LeaderboardPage.tsx` shows all entries. Modify these components to change the display format, add pagination, or add filter dropdowns.

## Adding New Wallet Adapters

The wallet configuration is in `components/providers/web3-provider.tsx`:

```typescript
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";

const wallets = useMemo(
  () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
  [],
);
```

### Adding a New Wallet

1. Install the adapter package:

```bash
npm install @solana/wallet-adapter-backpack
```

2. Import and add it to the wallets array:

```typescript
import { BackpackWalletAdapter } from "@solana/wallet-adapter-backpack";

const wallets = useMemo(
  () => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new BackpackWalletAdapter(),
  ],
  [],
);
```

The wallet modal UI from `@solana/wallet-adapter-react-ui` will automatically show the new wallet option. No other changes needed.

### Supported Wallet Features

The app requires wallets that support:
- `signMessage` -- For wallet authentication (nonce signing)
- `sendTransaction` -- For `init_learner` and `enroll` transactions

Wallets that do not support `signMessage` will not be able to complete the authentication flow. The `WalletAuthProvider` checks for `signMessage` availability and throws a descriptive error if missing.

## Deployment Customization

### Vercel (Default)

No special configuration needed beyond environment variables. Vercel auto-detects Next.js.

For monorepo deployments, set **Root Directory** to `superteam-frontend`.

### Netlify

1. Install the Netlify Next.js adapter:

```bash
npm install @netlify/plugin-nextjs
```

2. Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

3. Set environment variables in the Netlify dashboard.

### Docker

Example `Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

For Docker, add `output: "standalone"` to `next.config.mjs`:

```javascript
const nextConfig = {
  output: "standalone",
  // ...
};
```

### Custom Server

For self-hosted deployments behind nginx or another reverse proxy:

```bash
npm run build
npm run start  # Starts on port 3000
```

Configure your reverse proxy to forward to `localhost:3000`. Set `NEXT_PUBLIC_APP_URL` to your public domain.

### RPC Endpoint

For production deployments, use a dedicated Helius RPC endpoint:

1. Create an account at [helius.dev](https://www.helius.dev/).
2. Get an API key for mainnet or devnet.
3. Set `NEXT_PUBLIC_ACADEMY_RPC_URL` to your Helius endpoint.

The default devnet endpoint is rate-limited and should not be used in production.

### Cluster Configuration

To switch between devnet and mainnet:

1. Deploy the Solana program to the target cluster.
2. Update `NEXT_PUBLIC_ACADEMY_PROGRAM_ID` with the new program address.
3. Update `NEXT_PUBLIC_ACADEMY_CLUSTER` to `mainnet-beta` or `devnet`.
4. Update `NEXT_PUBLIC_ACADEMY_RPC_URL` to the corresponding RPC endpoint.

The `lib/generated/academy-program.ts` file contains the current hardcoded values. Override them with environment variables or regenerate the file after deployment.
