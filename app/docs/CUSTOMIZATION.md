# Customization Guide — Superteam Academy

How to customize the platform for your community, brand, or use case.

## Theme Customization

### Colors

The design system uses **oklch** color space via Tailwind CSS v4. Edit `src/app/globals.css`:

```css
@theme inline {
  --color-background: oklch(1 0 0);        /* white */
  --color-foreground: oklch(0.145 0 0);     /* near black */
  --color-primary: oklch(0.205 0 0);        /* black buttons */
  --color-accent: oklch(0.97 0 0);          /* light grey */
  /* ... more tokens */
}

.dark {
  --color-background: oklch(0.145 0 0);
  --color-foreground: oklch(0.985 0 0);
  /* ... dark overrides */
}
```

To add brand colors (e.g., Superteam green), update the primary tokens:

```css
--color-primary: oklch(0.65 0.2 145);        /* green */
--color-primary-foreground: oklch(1 0 0);     /* white text on green */
```

### Typography

Fonts are configured in `src/app/layout.tsx`:

```typescript
const inter = Inter({ variable: "--font-geist-sans", subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
```

Replace with any Google Font or local font file.

### Logo

Edit `src/components/layout/navbar.tsx` and `footer.tsx`. The logo is a simple `<div>` with a letter — replace with an `<Image>` or SVG.

## Adding Languages

### 1. Create locale file

Copy `src/i18n/messages/en.json` → `src/i18n/messages/fr.json` (for French).

Translate all keys.

### 2. Register the locale

Edit `src/i18n/config.ts`:

```typescript
export const locales = ["en", "pt-br", "es", "fr"] as const;
```

### 3. Add locale label

Edit `src/lib/constants.ts`:

```typescript
export const localeLabels: Record<string, string> = {
  en: "English",
  "pt-br": "Português",
  es: "Español",
  fr: "Français",
};
```

### 4. Add to settings page

The language selector in `src/app/settings/page.tsx` reads from `locales` — it auto-picks up new entries.

## Extending Gamification

### Adding Achievement Types

Edit `src/services/implementations/mock-achievement-service.ts`:

```typescript
{
  id: "new-achievement",
  name: "Protocol Expert",
  description: "Complete all DeFi courses",
  category: "learning",       // learning | streak | social | special
  icon: "🏛️",
  xpReward: 1000,
  isEarned: false,
  progress: 0,
  maxProgress: 3,
}
```

Categories control the badge color:
- `learning` → blue
- `streak` → amber
- `social` → emerald
- `special` → violet

### Modifying XP Curve

The leveling formula is in `src/lib/constants.ts`:

```typescript
export function getXPLevel(xp: number): { level: number; progress: number } {
  // Logarithmic curve — adjust BASE and SCALE
  const BASE = 100;   // XP for level 1→2
  const SCALE = 1.5;  // Growth factor per level
  // ...
}
```

### Adding Streak Rewards

Streak milestones can trigger achievements. Edit the streak service to emit events at thresholds (7 days, 30 days, 100 days).

## Adding Learning Tracks

### 1. Add track ID

Tracks are identified by numeric IDs (1-5). To add track 6:

Edit `src/lib/constants.ts`:

```typescript
export const trackLabels: Record<number, string> = {
  1: "Fundamentals",
  2: "Smart Contracts",
  3: "DeFi",
  4: "Frontend",
  5: "Mobile",
  6: "Security",  // new
};
```

### 2. Add track icon to landing page

Edit `src/app/page.tsx`, add to the `tracks` array:

```typescript
{ id: 6, icon: Shield, color: "bg-red-500/10 text-red-600 dark:text-red-400" },
```

### 3. Create courses for the track

Add courses with `trackId: 6` in Sanity CMS or mock data.

## Swapping Service Implementations

The service layer uses interfaces. To swap implementations:

```typescript
// src/services/index.ts
import { MyCustomLeaderboardService } from "./implementations/my-leaderboard";

export const leaderboardService: LeaderboardService = new MyCustomLeaderboardService();
```

Interface contracts are in `src/services/*-service.ts`.

## Offline / PWA Configuration

The app includes real offline course reading via Service Worker + IndexedDB.

### Key Files

| File | Purpose |
|------|---------|
| `public/sw.js` | Service Worker — caches static assets + course lesson pages |
| `src/lib/offline-store.ts` | IndexedDB wrapper (course metadata + pending completions) |
| `src/hooks/use-offline.ts` | React hooks (`useOnlineStatus`, `useOfflineCourse`, `useOfflineCompletion`) |
| `src/app/offline/page.tsx` | Offline fallback page with saved courses list |
| `src/app/api/progress/offline-sync/route.ts` | Sync endpoint for queued completions |

### Disabling Offline Support

Remove `ServiceWorkerRegistration` from `src/components/providers/index.tsx` and delete the files above.

### Customizing Cache Strategy

Edit `public/sw.js`:
- `CACHE_NAME` — bump version to clear stale static cache
- `COURSE_CACHE` — dedicated cache for saved course pages
- `OFFLINE_URLS` — list of pages to pre-cache on SW install

## Deploying to Production

### Vercel (recommended)

```bash
cd app
vercel --prod
```

Set all env vars in Vercel dashboard → Settings → Environment Variables.

### Self-hosted

```bash
pnpm build
pnpm start  # runs on port 3000
```

Use a reverse proxy (Caddy, Nginx) for HTTPS.

## Forking for Your Community

1. Fork the repo
2. Update branding (logo, colors, site name)
3. Update `src/lib/constants.ts` → `siteConfig`
4. Replace mock courses with your content
5. Set up Supabase project + Sanity CMS
6. Deploy
