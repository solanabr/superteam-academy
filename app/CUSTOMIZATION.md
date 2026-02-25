# Superteam Academy -- Customization Guide

This guide covers how to customize the Superteam Academy frontend: theming, internationalization, gamification, course content, wallet configuration, component structure, and deployment.

All file paths are relative to the `app/` directory unless stated otherwise.

---

## Table of Contents

1. [Theme Customization](#1-theme-customization)
2. [Adding a New Language](#2-adding-a-new-language)
3. [Gamification Extensions](#3-gamification-extensions)
4. [Adding New Course Tracks](#4-adding-new-course-tracks)
5. [Wallet and Chain Configuration](#5-wallet-and-chain-configuration)
6. [Component Customization](#6-component-customization)
7. [Deployment Configuration](#7-deployment-configuration)

---

## 1. Theme Customization

### Color Scheme via CSS Variables

The global color scheme is defined in `app/globals.css` using CSS custom properties and Tailwind CSS 4's `@theme inline` directive:

```css
/* app/globals.css */
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}
```

To change the base colors, update the hex values in `:root` (light mode) and the `prefers-color-scheme: dark` block (dark mode).

#### Adding Custom Brand Colors

Add new CSS variables and expose them to Tailwind through the `@theme inline` block:

```css
/* app/globals.css */
:root {
  --background: #ffffff;
  --foreground: #171717;
  --brand-primary: #7c3aed;
  --brand-secondary: #4f46e5;
  --brand-accent: #06b6d4;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-brand-primary: var(--brand-primary);
  --color-brand-secondary: var(--brand-secondary);
  --color-accent: var(--brand-accent);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
    --brand-primary: #a78bfa;
    --brand-secondary: #818cf8;
    --brand-accent: #22d3ee;
  }
}
```

Once registered, use them in any component:

```tsx
<div className="bg-brand-primary text-white">Branded element</div>
<button className="border-accent text-accent hover:bg-accent/10">Action</button>
```

**Note**: This project uses Tailwind CSS 4 with `@tailwindcss/postcss`. There is no `tailwind.config.js`/`tailwind.config.ts` file. All theme extensions go through the `@theme inline` directive in `app/globals.css` or via `@theme` in separate CSS files. See the [Tailwind v4 documentation](https://tailwindcss.com/docs/v4) for details.

### Switching Between Dark and Light Defaults

The theme provider is configured in the locale layout at `app/[locale]/layout.tsx`:

```tsx
<ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
```

- **`defaultTheme="dark"`** -- Users see dark mode by default. Change to `"light"` or `"system"`.
- **`enableSystem`** -- Respects the OS preference when set to `"system"`.
- **`attribute="class"`** -- Applies `dark` class to `<html>` for Tailwind dark mode utilities.

To default to light mode:

```tsx
<ThemeProvider attribute="class" defaultTheme="light" enableSystem>
```

The toggle button lives in `components/Nav.tsx` and uses `useTheme()` from `next-themes`:

```tsx
const { theme, setTheme } = useTheme();
// ...
<button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
```

### Typography Customization

The app uses the [Geist](https://vercel.com/font) font family loaded via `next/font/google` in `app/[locale]/layout.tsx`:

```tsx
import { Geist, Geist_Mono } from 'next/font/google';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
```

These are applied as CSS variable classes on the `<html>` element:

```tsx
<html className={`${geistSans.variable} ${geistMono.variable}`}>
```

And referenced in `globals.css`:

```css
@theme inline {
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

**To change the font family:**

1. Replace the import in `app/[locale]/layout.tsx`:

```tsx
import { Inter } from 'next/font/google';

const inter = Inter({ variable: '--font-custom-sans', subsets: ['latin'] });
```

2. Update `globals.css`:

```css
@theme inline {
  --font-sans: var(--font-custom-sans);
}
```

3. Update the `<html>` className to use your new variable.

The Monaco editor uses its own font stack configured in the challenge page (`app/[locale]/challenges/[id]/page.tsx`):

```tsx
options={{
  fontFamily: '"Geist Mono", "Fira Code", monospace',
}}
```

Change this string to use any monospace font you prefer.

---

## 2. Adding a New Language

The app uses [next-intl](https://next-intl.dev/) for internationalization with locale-aware routing.

### Step-by-Step: Adding a New Locale

**Step 1: Create the message file**

Copy an existing message file and translate all values:

```bash
cp messages/en.json messages/fr.json
```

Edit `messages/fr.json` with French translations. The structure must match exactly -- every key present in `en.json` must exist in `fr.json`:

```json
{
  "nav": {
    "home": "Accueil",
    "courses": "Cours",
    "dashboard": "Tableau de bord",
    "leaderboard": "Classement",
    "profile": "Profil",
    "settings": "Param\u00e8tres",
    "connect_wallet": "Connecter Portefeuille",
    "disconnect": "D\u00e9connecter"
  },
  "landing": {
    "hero_title": "Apprenez Solana & Web3",
    ...
  },
  ...
}
```

**Step 2: Register the locale in the routing config**

Edit `i18n/routing.ts`:

```tsx
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['pt-BR', 'en', 'es', 'fr'],  // <-- add 'fr'
  defaultLocale: 'pt-BR',
  pathnames: {
    '/': '/',
    '/courses': {
      'pt-BR': '/cursos',
      'en': '/courses',
      'es': '/cursos',
      'fr': '/cours',           // <-- localized path
    },
    '/dashboard': {
      'pt-BR': '/painel',
      'en': '/dashboard',
      'es': '/panel',
      'fr': '/tableau-de-bord',  // <-- localized path
    },
    '/leaderboard': {
      'pt-BR': '/classificacao',
      'en': '/leaderboard',
      'es': '/clasificacion',
      'fr': '/classement',       // <-- localized path
    },
  }
});
```

**Step 3: Add the locale to the Nav component**

In `components/Nav.tsx`, add the new locale to the `LOCALES` array and to `NAV_ITEMS`:

```tsx
const LOCALES = [
  { code: 'pt-BR', label: 'PT', flag: '\ud83c\udde7\ud83c\uddf7' },
  { code: 'en', label: 'EN', flag: '\ud83c\uddfa\ud83c\uddf8' },
  { code: 'es', label: 'ES', flag: '\ud83c\uddea\ud83c\uddf8' },
  { code: 'fr', label: 'FR', flag: '\ud83c\uddeb\ud83c\uddf7' },  // <-- add
] as const;
```

Also add `frPath` to each entry in `NAV_ITEMS` and update the `getNavPath` function to handle the new locale.

**Step 4: Add translations to mock data**

Course titles and descriptions in `lib/mock-data.ts` use a `CourseTitle` type with per-locale strings:

```tsx
export interface CourseTitle {
  'pt-BR': string;
  en: string;
  es: string;
}
```

Extend this interface and all course objects:

```tsx
export interface CourseTitle {
  'pt-BR': string;
  en: string;
  es: string;
  fr?: string;  // optional to avoid breaking existing data
}
```

### Translating Component Strings

Components use `useTranslations()` from `next-intl`:

```tsx
import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('courses');
  return <h1>{t('catalog_title')}</h1>;
}
```

For server components, use `getTranslations`:

```tsx
import { getTranslations } from 'next-intl/server';

export default async function Page() {
  const t = await getTranslations('courses');
  return <h1>{t('catalog_title')}</h1>;
}
```

All translatable strings should be added to every `messages/<locale>.json` file under the appropriate namespace (`nav`, `courses`, `dashboard`, etc.).

### RTL Considerations

The app does not currently include RTL support. To add an RTL locale (e.g., Arabic):

1. Add `dir` attribute to the `<html>` tag in `app/[locale]/layout.tsx`:

```tsx
const RTL_LOCALES = ['ar', 'he'];
const dir = RTL_LOCALES.includes(locale) ? 'rtl' : 'ltr';

return (
  <html lang={locale} dir={dir} suppressHydrationWarning className={...}>
```

2. Use Tailwind's logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`) instead of physical properties (`ml-*`, `mr-*`, `pl-*`, `pr-*`) throughout the components.

3. Use `rtl:` and `ltr:` modifiers for direction-specific styles:

```tsx
<div className="ltr:pl-4 rtl:pr-4">Content</div>
```

---

## 3. Gamification Extensions

### How the XP System Works

The XP and leveling system is defined in `lib/gamification.ts`.

**Level formula:**

```tsx
export function calcLevel(totalXP: number): number {
  return Math.floor(Math.sqrt(totalXP / 100));
}
```

This produces a quadratic progression curve:

| Level | Total XP Required |
|-------|-------------------|
| 0     | 0                 |
| 1     | 100               |
| 2     | 400               |
| 5     | 2,500             |
| 10    | 10,000            |
| 20    | 40,000            |
| 50    | 250,000           |

To make leveling faster or slower, change the divisor (`100`). Smaller values = faster leveling.

**XP rewards per activity:**

```tsx
export const XP_CONFIG = {
  lesson: { min: 10, max: 50 },
  challenge: { min: 25, max: 100 },
  courseCompletion: { min: 500, max: 2000 },
  streak: { multiplier7: 1.25, multiplier30: 1.5, multiplier100: 2.0 },
} as const;
```

**Streak multipliers:**

| Streak Days | XP Multiplier |
|-------------|---------------|
| < 7         | 1.0x          |
| 7+          | 1.25x         |
| 30+         | 1.5x          |
| 100+        | 2.0x          |

Applied via `applyStreakMultiplier(baseXP, streakDays)`.

**Level titles** are returned by `getLevelTitle(level)`:

```tsx
export function getLevelTitle(level: number): string {
  if (level >= 50) return 'Mestre Solana';
  if (level >= 30) return 'Expert Blockchain';
  if (level >= 20) return 'Desenvolvedor Senior';
  if (level >= 10) return 'Desenvolvedor';
  if (level >= 5) return 'Aprendiz Avancado';
  if (level >= 2) return 'Aprendiz';
  return 'Iniciante';
}
```

### Adding New Achievement Types

Achievements are defined in the `ACHIEVEMENTS` array in `lib/gamification.ts`:

```tsx
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_lesson',
    name: 'Primeira Licao',
    description: 'Completou a primeira licao',
    xp: 50,
    icon: 'target',
  },
  // ...
];
```

**To add a new achievement:**

1. Add the achievement definition:

```tsx
{
  id: 'defi_expert',
  name: 'Expert DeFi',
  description: 'Completou todos os cursos da trilha DeFi',
  xp: 1500,
  icon: 'bank',
},
```

2. Add the unlock condition in `checkAchievements()`:

```tsx
export function checkAchievements(
  completedLessons: number,
  completedCourses: number,
  streakDays: number,
  challengesCompleted: number,
  rank: number,
  credentialsEarned: number,
  isEarlyAdopter: boolean,
  completedDefiCourses: number,  // new param
): string[] {
  const unlocked: string[] = [];
  // ... existing checks
  if (completedDefiCourses >= 3) unlocked.push('defi_expert');
  return unlocked;
}
```

### Modifying the Leaderboard Scoring

The leaderboard in `app/[locale]/leaderboard/page.tsx` currently ranks by total XP. To change the scoring:

1. The `LEADERBOARD` data structure holds `xp`, `level`, and `streak` fields.

2. To rank by a weighted score instead of raw XP, add a computed field:

```tsx
function computeScore(entry: typeof LEADERBOARD[number]): number {
  return entry.xp + (entry.streak * 50) + (entry.level * 200);
}

const sorted = [...LEADERBOARD].sort((a, b) => computeScore(b) - computeScore(a));
```

3. The leaderboard supports three time periods (`semana`, `mes`, `todo`). To filter by period, you would need backend support or a `weeklyXP`/`monthlyXP` field on each entry.

### Adding New Reward Mechanics

**Custom badges**: Extend the `Achievement` interface:

```tsx
export interface Achievement {
  id: string;
  name: string;
  description: string;
  xp: number;
  icon: string;
  badge?: {
    color: string;      // Tailwind gradient, e.g. 'from-yellow-500 to-orange-500'
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  };
}
```

**Custom titles**: The `getLevelTitle()` function returns a string title based on level. To add achievement-based titles, create a separate function:

```tsx
export function getCustomTitle(achievements: string[]): string | null {
  if (achievements.includes('solana_dev') && achievements.includes('challenge_master')) {
    return 'Solana Grandmaster';
  }
  if (achievements.includes('streak_100')) {
    return 'Centurion';
  }
  return null;
}
```

---

## 4. Adding New Course Tracks

### How Tracks Work

Course tracks are defined as a union type in `lib/mock-data.ts`:

```tsx
export type CourseTrack = 'solana' | 'defi' | 'nft' | 'web3' | 'anchor';
```

Each course has a `track` field, a `thumbnail_color` (Tailwind gradient classes), and a `thumbnail_icon`.

### Adding a New Track

**Step 1: Extend the type**

```tsx
export type CourseTrack = 'solana' | 'defi' | 'nft' | 'web3' | 'anchor' | 'security' | 'mobile';
```

**Step 2: Add a course using the new track**

```tsx
{
  id: 'solana-auditing',
  slug: 'solana-auditing',
  title: {
    'pt-BR': 'Auditoria de Smart Contracts',
    en: 'Smart Contract Auditing',
    es: 'Auditoria de Smart Contracts',
  },
  description: {
    'pt-BR': 'Aprenda a auditar programas Solana...',
    en: 'Learn to audit Solana programs...',
    es: 'Aprende a auditar programas de Solana...',
  },
  level: 'advanced',
  track: 'security',
  xp_reward: 2500,
  lesson_count: 24,
  duration: '18h',
  thumbnail_color: 'from-red-600 to-rose-800',
  thumbnail_icon: 'shield',
  enrollments: 0,
  tags: ['security', 'audit', 'solana'],
},
```

**Step 3: Add a filter option in the courses page**

The course catalog (`app/[locale]/courses/page.tsx`) filters by track. Add the new track label to the filter buttons and to the `messages/<locale>.json` files:

```json
{
  "courses": {
    "filter_security": "Security",
    "filter_mobile": "Mobile"
  }
}
```

### Track Colors and Icons

Track colors use Tailwind gradient classes applied to the card header:

```tsx
thumbnail_color: 'from-purple-600 to-blue-600',   // Solana
thumbnail_color: 'from-green-500 to-emerald-700',  // DeFi
thumbnail_color: 'from-pink-500 to-purple-700',    // NFT
thumbnail_color: 'from-orange-500 to-red-600',     // Anchor
thumbnail_color: 'from-cyan-500 to-blue-700',      // Web3
```

To maintain visual consistency, pick a two-color gradient that is distinct from existing tracks. The color is rendered via:

```tsx
<div className={cn('h-28 bg-gradient-to-br', course.thumbnail_color)}>
```

The `thumbnail_icon` field is a string rendered as text (currently emoji). To use Lucide icons instead, modify the `CourseCard` component to map track names to icon components:

```tsx
import { Shield, Smartphone, Anchor, Coins, Image, Globe, Cpu } from 'lucide-react';

const TRACK_ICONS: Record<CourseTrack, React.ComponentType<{ className?: string }>> = {
  solana: Cpu,
  defi: Coins,
  nft: Image,
  web3: Globe,
  anchor: Anchor,
  security: Shield,
  mobile: Smartphone,
};
```

### Creating Track-Specific Challenge Types

Challenges are defined in `app/[locale]/challenges/[id]/page.tsx` in the `CHALLENGES` object. Each challenge has:

- `id` -- URL parameter
- `difficulty` -- displayed as a badge
- `starterCode` -- pre-filled in the Monaco editor
- `testCases` -- displayed in the test panel
- `hints` -- progressively revealed
- `solution` -- shown after completion

To add a challenge for a new track:

```tsx
'audit-overflow': {
  id: 'audit-overflow',
  title: 'Find the Integer Overflow',
  difficulty: 'Avancado',
  xp: 500,
  description: `## Find the Overflow\n\nReview the following Solana program and identify the integer overflow vulnerability...`,
  examples: [{ input: '...', output: '...', explanation: '...' }],
  starterCode: `// Analyze this code and fix the vulnerability\n...`,
  hints: ['Look at the arithmetic operations...', 'Check for checked_add usage...'],
  testCases: [
    { name: 'Detects overflow in deposit()', input: 'amount = u64::MAX', expected: 'Error::Overflow' },
  ],
  solution: `// Fixed version with checked arithmetic\n...`,
},
```

---

## 5. Wallet and Chain Configuration

### Switching from Devnet to Mainnet

The Solana network is configured in two places:

**1. The Wallet Provider (`components/WalletProviderWrapper.tsx`):**

```tsx
const endpoint = 'https://api.devnet.solana.com';
```

Change to mainnet:

```tsx
const endpoint = process.env.NEXT_PUBLIC_RPC_ENDPOINT
  ?? 'https://api.mainnet-beta.solana.com';
```

**2. The program helpers (`lib/solana-program.ts`):**

```tsx
export const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_RPC_ENDPOINT ?? 'https://api.devnet.solana.com';
```

For mainnet, set the environment variable:

```bash
NEXT_PUBLIC_RPC_ENDPOINT=https://api.mainnet-beta.solana.com
```

**3. The Solana Explorer links** in `lib/solana-program.ts`:

```tsx
export function explorerUrl(
  signature: string,
  cluster: 'devnet' | 'mainnet-beta' = 'devnet'  // change default to 'mainnet-beta'
): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
}
```

### Adding Additional Wallet Adapters

The wallet list is defined in `components/WalletProviderWrapper.tsx`:

```tsx
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';

const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
```

To add Solflare and Backpack:

```bash
npm install @solana/wallet-adapter-solflare @solana/wallet-adapter-backpack
```

```tsx
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { BackpackWalletAdapter } from '@solana/wallet-adapter-backpack';

const wallets = useMemo(
  () => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new BackpackWalletAdapter(),
  ],
  []
);
```

The `WalletMultiButton` component from `@solana/wallet-adapter-react-ui` will automatically display all registered adapters in its modal.

### Configuring the RPC Endpoint

For production, use a dedicated RPC provider (Helius, QuickNode, Triton, etc.) instead of the public endpoint:

```bash
# .env.local
NEXT_PUBLIC_RPC_ENDPOINT=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

Both `WalletProviderWrapper.tsx` and `lib/solana-program.ts` should read from this variable:

```tsx
const endpoint = process.env.NEXT_PUBLIC_RPC_ENDPOINT ?? clusterApiUrl(network);
```

---

## 6. Component Customization

### Modifying the Nav

The navigation component is at `components/Nav.tsx`. Key sections:

- **Logo** (lines 67-74): Gradient icon + text. Change `from-purple-600 to-indigo-600` for brand colors.
- **Nav items** (`NAV_ITEMS` array): Add or remove pages.
- **Language switcher** (`LOCALES` array): Controls the locale buttons.
- **Theme toggle**: Sun/Moon button using `next-themes`.
- **Wallet button**: `WalletMultiButton` with inline styles.

**To add a new nav link:**

```tsx
const NAV_ITEMS = [
  // ... existing items
  {
    key: 'certificates',
    path: '/certificados',
    enPath: '/certificates',
    esPath: '/certificados',
    label: { 'pt-BR': 'Certificados', en: 'Certificates', es: 'Certificados' },
    icon: Award,
  },
] as const;
```

### Modifying the Footer

The footer component is at `components/Footer.tsx`. It contains four columns:

1. Brand + social links
2. Learning links
3. Community links
4. Platform links

Social links and URLs are hardcoded. Update them directly:

```tsx
<a href="https://github.com/your-org" ...>
<a href="https://twitter.com/your-handle" ...>
```

### Adding New Pages

The app uses Next.js App Router with locale-based routing. All pages live under `app/[locale]/`.

**To add a new page (e.g., `/about`):**

1. Create the page file:

```bash
mkdir -p app/[locale]/about
```

Create `app/[locale]/about/page.tsx`:

```tsx
import { getTranslations } from 'next-intl/server';

export default async function AboutPage() {
  const t = await getTranslations('about');

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-4xl font-bold text-white">{t('title')}</h1>
      <p className="mt-4 text-gray-400">{t('description')}</p>
    </div>
  );
}
```

2. Add translations to every `messages/<locale>.json`:

```json
{
  "about": {
    "title": "About Superteam Academy",
    "description": "We are building the future of Web3 education."
  }
}
```

3. Optionally add the localized pathnames in `i18n/routing.ts`:

```tsx
pathnames: {
  // ...existing
  '/about': {
    'pt-BR': '/sobre',
    'en': '/about',
    'es': '/acerca',
  },
}
```

4. The middleware in `middleware.ts` automatically handles locale detection and routing for all paths matching the matcher pattern.

### Extending the Monaco Editor

The Monaco editor is loaded via `@monaco-editor/react` in `app/[locale]/challenges/[id]/page.tsx`:

```tsx
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
});
```

**Current configuration:**

```tsx
<MonacoEditor
  height="100%"
  defaultLanguage="typescript"
  value={code}
  onChange={(v) => setCode(v ?? '')}
  theme="vs-dark"
  options={{
    fontSize: 13,
    minimap: { enabled: false },
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    padding: { top: 12, bottom: 12 },
    fontFamily: '"Geist Mono", "Fira Code", monospace',
    fontLigatures: true,
    automaticLayout: true,
  }}
/>
```

**To add Rust language support:**

Change `defaultLanguage` per challenge:

```tsx
<MonacoEditor
  defaultLanguage={challenge.language ?? 'typescript'}
  // ...
/>
```

And add a `language` field to the challenge definition:

```tsx
'anchor-accounts': {
  id: 'anchor-accounts',
  language: 'rust',
  starterCode: `use anchor_lang::prelude::*;\n\n#[program]\npub mod my_program { ... }`,
  // ...
},
```

**To add a custom Monaco theme:**

```tsx
import { loader } from '@monaco-editor/react';

loader.init().then((monaco) => {
  monaco.editor.defineTheme('superteam-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'a78bfa' },
      { token: 'string', foreground: '34d399' },
      { token: 'number', foreground: 'fbbf24' },
    ],
    colors: {
      'editor.background': '#0a0a0a',
      'editor.foreground': '#e5e7eb',
      'editor.lineHighlightBackground': '#1f2937',
      'editorCursor.foreground': '#a78bfa',
      'editor.selectionBackground': '#4c1d95',
    },
  });
});
```

Then use it:

```tsx
<MonacoEditor theme="superteam-dark" ... />
```

---

## 7. Deployment Configuration

### Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_RPC_ENDPOINT` | No | Solana RPC URL. Defaults to devnet. |
| `NEXT_PUBLIC_PROGRAM_ID` | No | On-chain program address. |
| `NEXT_PUBLIC_SITE_URL` | No | Canonical site URL for OG metadata. |

All `NEXT_PUBLIC_*` variables are exposed to the browser. Do not prefix secrets with `NEXT_PUBLIC_`.

For private server-side variables (API keys, database URLs), use unprefixed names and access them only in server components or API routes.

### Vercel-Specific Settings

The project is pre-configured for Vercel:

- **Framework Preset**: Next.js (auto-detected)
- **Build Command**: `next build` (from `package.json`)
- **Output Directory**: `.next` (default)
- **Node.js Version**: 20.x recommended

**Vercel deployment steps:**

1. Push to your Git repository.
2. Import the project in the Vercel dashboard.
3. Set the root directory to `app/` if deploying from the monorepo root.
4. Add environment variables in the Vercel dashboard under Settings > Environment Variables.
5. Deploy.

**Important**: The `next.config.ts` disables ESLint during builds to prevent CI failures:

```tsx
const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
};
```

Remove this once all lint issues are resolved.

### Self-Hosting with Docker

Create a `Dockerfile` in the `app/` directory:

```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

To use the standalone output, add to `next.config.ts`:

```tsx
const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: { ignoreDuringBuilds: true },
};
```

**Build and run:**

```bash
docker build -t superteam-academy .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_RPC_ENDPOINT=https://api.mainnet-beta.solana.com \
  superteam-academy
```

**Docker Compose example:**

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_RPC_ENDPOINT=https://api.mainnet-beta.solana.com
    restart: unless-stopped
```
