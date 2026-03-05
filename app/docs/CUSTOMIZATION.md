# Customization Guide

How to customize theming, languages, courses, wallets, analytics, and deployment.

## Theming

### Color System

The app uses CSS custom properties defined in `src/app/globals.css`. Both light and dark themes are fully customizable.

**Light theme** (`:root`):

| Variable | Default | Usage |
|----------|---------|-------|
| `--background` | `#fafaf8` | Page background |
| `--foreground` | `#0a0a0c` | Primary text |
| `--primary` | `#059669` | Accent color (emerald) |
| `--primary-foreground` | `#fafaf8` | Text on primary |
| `--secondary` | `#f4f4f2` | Secondary surfaces |
| `--muted` | `#f4f4f2` | Muted backgrounds |
| `--muted-foreground` | `#71717a` | Muted text |
| `--card` | `#ffffff` | Card backgrounds |
| `--border` | `#e4e4e7` | Border color |
| `--destructive` | `#ef4444` | Error/delete actions |
| `--success` | `#10b981` | Success indicators |
| `--xp` | `#d97706` | XP-related elements (amber) |

**Dark theme** (`.dark`):

| Variable | Default | Usage |
|----------|---------|-------|
| `--background` | `#0a0a0c` | Page background |
| `--foreground` | `#f5f5f5` | Primary text |
| `--primary` | `#34d399` | Accent color (emerald-300) |
| `--card` | `#111113` | Card backgrounds |
| `--border` | `#27272a` | Border color |
| `--success` | `#34d399` | Success indicators |
| `--xp` | `#eab308` | XP elements (yellow) |

### Modifying Colors

Edit the CSS variables in `src/app/globals.css`:

```css
:root {
  --primary: #6366f1;           /* Change accent to indigo */
  --ring: #6366f1;              /* Focus ring matches accent */
  --success: #22c55e;           /* Custom success color */
}

.dark {
  --primary: #818cf8;           /* Lighter indigo for dark mode */
  --ring: #818cf8;
}
```

### Course Accent Colors

Each course has its own `accent` property (hex color) used for:
- Course card header gradient
- Progress bars
- CTA buttons
- Module section indicators
- Instructor avatar backgrounds

Set per course in `data/courses.ts` or via Sanity CMS.

### Fonts

Configured in `app/layout.tsx`:

| Font | Variable | Usage |
|------|----------|-------|
| Outfit | `--font-sans` | UI text |
| Fira Code | `--font-mono` | Code editor, terminal |

To change fonts, modify the imports in `layout.tsx`:

```typescript
import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });
const jetBrains = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"] });
```

### Background Effects

Custom background classes in `globals.css`:

| Class | Usage |
|-------|-------|
| `bg-hero` | Landing page hero (emerald cone + gold accent) |
| `bg-mesh` | Section backgrounds (emerald/gold radial gradients) |
| `bg-glow-center` | Mid-page centered glow |
| `bg-glow-bottom` | CTA section bottom glow |
| `terminal-glow` | Code terminal box shadow |

### Animations

| Class | Duration | Usage |
|-------|----------|-------|
| `animate-drift-1` | 20s | Background gradient movement |
| `animate-drift-2` | 25s | Background gradient movement |
| `animate-float-1` | 18s | Floating blur orb |
| `animate-float-2` | 22s | Floating blur orb |
| `animate-blur-in` | 0.6s | Page element entrance |
| `animate-marquee-left/right` | 40s | Testimonial marquee |
| `animate-badge-float` | 3s | Achievement badge hover |

All animations respect `prefers-reduced-motion: reduce` — they disable automatically for users who prefer reduced motion.

### Theme Toggle

Controlled by `next-themes` via `ThemeProvider`. Default theme: `dark`. Options: `dark`, `light`, `system`.

Users change theme in Settings → persisted to `localStorage` and `class` attribute on `<html>`.

## Internationalization (i18n)

### Supported Locales

| Code | Language | File |
|------|----------|------|
| `en` | English | `i18n/en.json` |
| `pt-BR` | Portuguese (Brazil) | `i18n/pt-BR.json` |
| `es` | Spanish | `i18n/es.json` |

### Adding a New Language

1. Create the translation file `src/i18n/<locale>.json` by copying `en.json` and translating all values.

2. Register the locale in `src/i18n/config.ts`:

```typescript
export const locales = ["en", "pt-BR", "es", "fr"] as const;

export const localeNames: Record<Locale, string> = {
  en: "English",
  "pt-BR": "Português",
  es: "Español",
  fr: "Français",
};
```

3. Import and register in `src/providers/locale-provider.tsx`:

```typescript
import fr from "@/i18n/fr.json";

const messages: Record<Locale, Messages> = {
  en,
  "pt-BR": ptBR as Messages,
  es: es as Messages,
  fr: fr as Messages,
};
```

4. Add lesson content translations in `src/data/lesson-content-<locale>.ts` (for hardcoded lessons).

5. Add course content translation keys to the new locale file:

```json
{
  "courseContent": {
    "solana-fundamentals": {
      "title": "Fondamentaux de Solana",
      "longDescription": "...",
      "m1": "Module 1: Introduction",
      "l1": "Leçon 1: Qu'est-ce que Solana?"
    }
  }
}
```

### Translation Key Structure

```
common.*           → Shared labels (courses, lessons, completed, duration, etc.)
nav.*              → Navigation items (home, courses, dashboard, etc.)
landing.*          → Landing page sections
courses.*          → Course catalog and detail pages
lesson.*           → Lesson viewer UI
dashboard.*        → Dashboard page
leaderboard.*      → Leaderboard page
profile.*          → Profile page
settings.*         → Settings page
certificates.*    → Certificate viewer
footer.*           → Footer links
courseContent.*    → Course-specific content (titles, descriptions, reviews)
```

### Using Translations

```tsx
import { useLocale } from "@/providers/locale-provider";

function MyComponent() {
  const { t, locale, setLocale } = useLocale();

  return (
    <div>
      <h1>{t("dashboard.title")}</h1>
      <p>{t("dashboard.welcomeBack", { name: "Alex" })}</p>
      <button onClick={() => setLocale("pt-BR")}>Português</button>
    </div>
  );
}
```

The `t()` function:
- Supports nested dot-notation keys: `t("courses.enrollNow")`
- Supports parameter interpolation: `t("key", { name: "value" })` replaces `{name}`
- Returns the key path as fallback if the translation is missing

Locale is persisted to `localStorage` (`academy_locale`) and `document.documentElement.lang` is updated on change.

## Adding Courses

### Via Hardcoded Data (Development)

See `data/courses.ts` for the full `CourseDetail` interface. Minimal example:

```typescript
{
  slug: "my-course",
  title: "My Course",
  description: "Learn something new",
  longDescription: "A comprehensive course...",
  difficulty: "Beginner",
  topic: "Core",
  topicLabel: "CORE",
  duration: "2h",
  lessons: 6,
  completed: 0,
  xp: 300,
  accent: "#10b981",
  icon: Blocks,
  codePreview: ["fn main() {", '    msg!(\"Hello\");', "}"],
  instructor: { name: "Jane", role: "Developer" },
  modules: [
    {
      id: "m1",
      title: "Getting Started",
      lessons: [
        { id: "l1", title: "Intro", duration: "5 min", type: "reading", completed: false },
        { id: "l2", title: "Quiz", duration: "10 min", type: "challenge", completed: false },
      ],
    },
  ],
  reviews: [],
}
```

### Via Sanity CMS (Production)

See [CMS_GUIDE.md](CMS_GUIDE.md) for the full workflow.

## Wallet Configuration

### Supported Wallets

The app uses Solana Wallet Standard. Phantom, Coinbase, and MetaMask auto-detect themselves. Only Solflare is manually added:

```typescript
// src/providers/wallet-provider.tsx
const wallets = useMemo(() => [new SolflareWalletAdapter()], []);
```

To add more wallets:

```typescript
import { SolflareWalletAdapter, TorusWalletAdapter } from "@solana/wallet-adapter-wallets";

const wallets = useMemo(() => [
  new SolflareWalletAdapter(),
  new TorusWalletAdapter(),
], []);
```

### Network Configuration

```env
# Devnet (default)
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com

# Mainnet (use Helius or other RPC provider)
NEXT_PUBLIC_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

Default fallback: `https://api.devnet.solana.com`

## Analytics

All analytics are optional and only initialize when their respective env vars are set.

### Google Analytics 4

```env
NEXT_PUBLIC_GA4_ID=G-XXXXXXXXXX
```

Tracks page views automatically. Custom events (10 types) are fired via `lib/analytics.ts`.

### PostHog

```env
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

Provides session recordings, heatmaps, and feature flags. Configured with `person_profiles: 'identified_only'`.

### Sentry

```env
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_AUTH_TOKEN=                 # For source map uploads during build
```

Error monitoring with 0.1 traces sample rate and 1.0 error replay rate. Loaded via dynamic import to avoid blocking.

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd app
vercel
```

Set all environment variables in the Vercel dashboard (Settings → Environment Variables).

Key settings:
- Framework Preset: Next.js
- Root Directory: `app`
- Build Command: `npm run build`
- Output Directory: `.next`

### Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Checklist (Production)

Required:
- [ ] `NEXTAUTH_SECRET` — Random secret for JWT signing
- [ ] `NEXTAUTH_URL` — Production URL

Recommended:
- [ ] Supabase configured for persistent user profiles
- [ ] Sanity CMS for content management
- [ ] At least one analytics service (GA4 or PostHog)
- [ ] Sentry for error monitoring
- [ ] Helius RPC for on-chain queries (better rate limits than public devnet)

Optional:
- [ ] Google/GitHub OAuth credentials
- [ ] Solana program deployed to devnet/mainnet
