# Customization Guide

How to customize and extend Solarium for your own needs.

## Theming

### CSS Custom Properties

The design system (v5) is built on CSS custom properties defined in `apps/web/src/styles/globals.css`. These control all colors across both light and dark modes. Values are plain hex or rgb — not HSL.

**Light Mode** (`:root`):

```css
:root {
  /* ── Primary — Deep Teal ── */
  --primary: #0d9488;
  --primary-hover: #0b7e73;
  --primary-dark: #087068;
  --primary-light: #ccfbf1;
  --primary-bg: #f0fdfa;

  /* ── Accent — Warm Amber ── */
  --accent: #f59e0b;
  --accent-hover: #d97706;
  --accent-dark: #b45309;
  --accent-light: #fef3c7;
  --accent-bg: #fffbeb;

  /* ── Secondary — Ink Teal ── */
  --secondary: #0f2f2d;
  --secondary-light: #134e4a;
  --secondary-bg: #e6fffb;

  /* ── Success — Botanical Green ── */
  --success: #16a34a;
  --success-dark: #15803d;
  --success-light: #dcfce7;
  --success-bg: #f0fdf4;

  /* ── Streak — Flame Orange ── */
  --streak: #ea580c;
  --streak-light: #fff7ed;

  /* ── Danger — Warm Coral ── */
  --danger: #e11d48;
  --danger-light: #ffe4e6;

  /* ── Solana Nod — SPARINGLY ── */
  --solana-purple: #9945ff;
  --solana-green: #14f195;

  /* ── Neutrals — warm cream ── */
  --bg: #fafaf7;
  --card: #ffffff;
  --subtle: #f5f3ee;
  --warm: #fdf8f0;
  --border: #e7e4dd;
  --border-hover: #d4d0c7;
  --text: #1c1917;
  --text-2: #57534e;
  --text-3: #a8a29e;

  /* ── Radii ── */
  --r-sm: 10px;
  --r-md: 14px;
  --r-lg: 18px;
  --r-xl: 24px;
}
```

**Dark Mode** (`.dark`):

```css
.dark {
  /* ── Neutrals — Soft Neutral Dark ── */
  --bg: #343431;
  --card: #3d3c38;
  --subtle: #46443f;
  --warm: #4a4843;
  --border: #57534e;
  --border-hover: #6a655e;
  --text: #f5f1ea;
  --text-2: #d4cec3;
  --text-3: #a79f93;

  /* ── Primary — lifted for dark readability ── */
  --primary: #2dd4bf;
  --primary-hover: #22c7b3;
  --primary-dark: #0b7e73;
  --primary-light: rgba(45, 212, 191, 0.15);
  --primary-bg: rgba(45, 212, 191, 0.1);

  /* ── Accent — lifted ── */
  --accent: #fbbf24;
  --accent-hover: #f59e0b;
  --accent-dark: #b45309;
  --accent-light: rgba(251, 191, 36, 0.18);
  --accent-bg: rgba(251, 191, 36, 0.1);

  /* etc. — see globals.css for the full set */
}
```

To change the color scheme, update the hex/rgba values in `globals.css`. All components reference these properties through Tailwind classes like `bg-primary`, `text-text`, `border-border`, etc.

### Tailwind Configuration

Extended theme values are defined in `apps/web/tailwind.config.ts`. Colors reference CSS variables so they respond to light/dark mode automatically.

**Color System:**

The Tailwind config maps semantic color names to CSS custom properties:

```typescript
colors: {
  primary: {
    DEFAULT: "var(--primary)",
    hover: "var(--primary-hover)",
    dark: "var(--primary-dark)",
    light: "var(--primary-light)",
    bg: "var(--primary-bg)",
    foreground: "#FFFFFF",
  },
  accent: {
    DEFAULT: "var(--accent)",
    hover: "var(--accent-hover)",
    dark: "var(--accent-dark)",
    light: "var(--accent-light)",
    bg: "var(--accent-bg)",
    foreground: "#FFFFFF",
  },
  secondary: {
    DEFAULT: "var(--secondary)",
    light: "var(--secondary-light)",
    bg: "var(--secondary-bg)",
    foreground: "#FFFFFF",
  },
  success: {
    DEFAULT: "var(--success)",
    dark: "var(--success-dark)",
    light: "var(--success-light)",
    bg: "var(--success-bg)",
  },
  streak: {
    DEFAULT: "var(--streak)",
    light: "var(--streak-light)",
  },
  danger: {
    DEFAULT: "var(--danger)",
    light: "var(--danger-light)",
  },
  solana: {
    purple: "var(--solana-purple)",
    green: "var(--solana-green)",
  },
  /* Neutrals */
  bg: "var(--bg)",
  card: { DEFAULT: "var(--card)", foreground: "var(--text)" },
  subtle: "var(--subtle)",
  warm: "var(--warm)",
  border: { DEFAULT: "var(--border)", hover: "var(--border-hover)" },
  text: { DEFAULT: "var(--text)", 2: "var(--text-2)", 3: "var(--text-3)" },
}
```

To add a new color group, define the CSS variables in `globals.css` (both `:root` and `.dark` blocks), then add the Tailwind mapping in `tailwind.config.ts`.

**Certificate Gradient:**

```typescript
backgroundImage: {
  "cert-gradient":
    "linear-gradient(135deg, var(--solana-purple) 0%, var(--solana-green) 100%)",
}
```

The Solana gradient is used sparingly (certificates only). A matching `.bg-cert-gradient` utility class is also available in `globals.css`.

**Custom Shadows:**

The config exposes several shadow tokens:

```typescript
boxShadow: {
  push: "0 4px 0 0 var(--shadow-push-color)",        // 3D push button
  "push-sm": "0 2px 0 0 var(--shadow-push-color)",
  "push-active": "0 1px 0 0 var(--shadow-push-color)",
  card: "var(--shadow-card)",                          // chunky card
  "card-hover": "var(--shadow-card-hover)",
  glow: "var(--shadow-glow)",                          // dark-mode glow
  cert: "var(--shadow-cert)",                          // certificate cards
  "cert-hover": "var(--shadow-cert-hover)",
  "cert-lg": "var(--shadow-cert-lg)",
}
```

**Custom Animations:**

- `accordion-down` / `accordion-up`: Radix accordion transitions
- `xp-pop`: XP gain popup (scale + float up + fade out)
- `shimmer`: Loading skeleton shimmer effect
- `breathe`: Gentle pulsing scale (used for emphasis)
- `pop`: Bounce-in entry animation
- `pulse-ring`: Pulsing glow ring (used on CTAs)
- `bounce-in`: Quick elastic scale-in

**CSS Utility Classes (in globals.css):**

Beyond Tailwind's generated classes, `globals.css` provides additional utilities:

- `.btn-push` / `.btn-push:active`: 3D push-button press effect
- `.card-chunky` / `.card-chunky:hover`: Bordered card with shadow lift on hover
- `.progress-fat` / `.progress-fat-fill`: Thick progress bar with inner highlight
- `.progress-fill-teal` / `.progress-fill-amber` / `.progress-fill-green`: Progress bar color variants
- `.banner-beginner` / `.banner-intermediate` / `.banner-advanced`: Difficulty-based gradient banners (with dark mode variants)
- `.font-display` / `.font-body`: Font family shortcuts

### Fonts

Three font families are configured in `apps/web/src/app/layout.tsx`:

| Variable         | Font              | Usage                  |
| ---------------- | ----------------- | ---------------------- |
| `--font-sans`    | Plus Jakarta Sans | Body text, UI elements |
| `--font-display` | Nunito            | Headings, display text |
| `--font-mono`    | JetBrains Mono    | Code blocks, editor    |

To change fonts, update the `next/font/google` imports in `layout.tsx`. The CSS variables are set automatically via Next.js's `variable` option, so `globals.css` and `tailwind.config.ts` need no changes.

### Dark/Light Mode Toggle

Theme switching is handled by `next-themes`:

- `ThemeProvider` in `components/layout/theme-provider.tsx` wraps the app
- `ThemeToggle` in `components/layout/theme-toggle.tsx` provides the UI toggle
- `darkMode: "class"` in `tailwind.config.ts` enables class-based dark mode

## Adding New Languages

The platform uses `next-intl` for internationalization. To add a new language:

### 1. Create the Message File

Create a new JSON file in `apps/web/src/messages/`. Copy the structure from `en.json` and translate all values. Every key must be present -- missing keys cause `MISSING_MESSAGE` errors at runtime.

```
apps/web/src/messages/fr.json
```

The top-level key structure to replicate:

```
common, nav, auth, landing, courses, lesson, dashboard,
gamification, certificates, profile, settings, a11y, footer,
notFound, error, errors, timeAgo, nameGenerator
```

### 2. Register the Locale

Update `apps/web/src/lib/i18n/config.ts`:

```typescript
export const locales = ["en", "pt-BR", "es", "fr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  "pt-BR": "Portugues (BR)",
  es: "Espanol",
  fr: "Francais",
};
```

### 3. Update Middleware

The middleware (`apps/web/src/middleware.ts`) reads from the `locales` array in `config.ts`, so no changes are needed there.

### 4. Verify

Run the development server and navigate to `http://localhost:3000/fr/` to verify the new locale loads correctly.

### Translation Guidelines

- All UI strings must be externalized in message files -- never hardcode text in components
- Use nested keys for organization (e.g., `dashboard.welcome`, `courses.difficulty.beginner`)
- Keep keys descriptive: `auth.connectWallet` not `btn1`
- Pluralization is supported via next-intl's ICU message format

## Adding New Wallet Adapters

The Solana wallet provider is configured in `apps/web/src/lib/solana/wallet-provider.tsx`.

### Wallet Standard Auto-Discovery

The platform uses the **Wallet Standard** protocol, which automatically discovers any wallet extension the user has installed (Phantom, Solflare, Backpack, MetaMask Snap, etc.). No wallet adapters are explicitly imported or instantiated:

```typescript
// Wallet Standard auto-discovers installed wallets
const wallets = useMemo(() => [], []);
```

This means:

- Any Wallet Standard-compliant wallet works out of the box
- No code changes are needed when new wallets are released
- The wallet selection modal shows whatever wallets the user has installed

### Adding a Legacy Wallet Adapter

If you need to support a wallet that does not implement the Wallet Standard, you can add a legacy adapter:

1. Install the adapter package:

   ```bash
   pnpm add @solana/wallet-adapter-wallets --filter @superteam-lms/web
   ```

2. Import and add the adapter in `wallet-provider.tsx`:

   ```typescript
   import { LegacyWalletAdapter } from "@solana/wallet-adapter-wallets";

   const wallets = useMemo(() => [new LegacyWalletAdapter()], []);
   ```

3. The wallet will automatically appear in the wallet selection modal alongside auto-discovered wallets.

### Network Configuration

The RPC endpoint is configured via the `NEXT_PUBLIC_SOLANA_RPC_URL` environment variable. It defaults to Solana Devnet if not set:

```typescript
const endpoint = useMemo(
  () => process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? clusterApiUrl("devnet"),
  []
);
```

To switch to mainnet, update the environment variable and set `NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta`.

## Extending the Gamification System

### Adding New XP Actions

1. Update the `XP_REWARDS` constant in `apps/web/src/lib/gamification/xp.ts`:

   ```typescript
   export const XP_REWARDS = {
     lesson: { min: 10, max: 50 },
     challenge: { min: 25, max: 100 },
     course: { min: 500, max: 2000 },
     dailyStreak: 10,
     firstDaily: 25,
     communityAnswer: 15, // new
     bugReport: 50, // new
   } as const;
   ```

2. For range-based rewards that scale with difficulty, add a calculation function using the existing `DIFFICULTY_MULTIPLIER` pattern:

   ```typescript
   export function calculateNewActionXp(difficulty: Difficulty): number {
     const { min, max } = XP_REWARDS.newAction;
     return Math.round(min + (max - min) * DIFFICULTY_MULTIPLIER[difficulty]);
   }
   ```

3. Call the XP award from the appropriate API route. XP is awarded server-side via the `HybridProgressService` (see `apps/web/src/lib/services/`), which implements the `LearningProgressService` interface from `packages/types/src/progress.ts`.

### Adding New Achievements

1. Add the achievement definition to the `ACHIEVEMENT_CATALOG` in `apps/web/src/lib/gamification/achievements.ts`:

   ```typescript
   {
     id: "ten-courses",
     name: "Decathlon",
     description: "Complete 10 courses",
     icon: "Trophy",
     category: "progress",
   },
   ```

2. Add the check condition in the `checks` map inside `checkNewAchievements()`. The map type is `Partial<Record<AchievementId, () => boolean>>`:

   ```typescript
   const checks: Partial<Record<AchievementId, () => boolean>> = {
     // ...existing checks...
     "ten-courses": () => state.completedCourses >= 10,
   };
   ```

3. Update the `UserState` interface (in the same file) if the check requires new data fields:

   ```typescript
   interface UserState {
     completedLessons: number;
     completedCourses: number;
     currentStreak: number;
     hasCompletedRustLesson: boolean;
     hasCompletedAnchorCourse: boolean;
     hasCompletedAllTracks: boolean;
     courseCompletionTimeHours: number | null;
     allTestsPassedFirstTry: boolean;
     userNumber: number;
   }
   ```

4. Add the achievement to Sanity CMS so it appears in the content management system as well.

### Adding New Streak Milestones

Update the `STREAK_MILESTONES` array in `apps/web/src/lib/gamification/streaks.ts`:

```typescript
export const STREAK_MILESTONES = [
  { days: 7, id: "week-warrior", name: "Week Warrior" },
  { days: 30, id: "monthly-master", name: "Monthly Master" },
  { days: 100, id: "consistency-king", name: "Consistency King" },
  { days: 365, id: "year-legend", name: "Year Legend" }, // new
] as const;
```

Then add a corresponding achievement definition in `ACHIEVEMENT_CATALOG` for the new milestone.

### Modifying the Leveling Curve

The level formula in `apps/web/src/lib/gamification/xp.ts`:

```typescript
export function calculateLevel(totalXp: number): number {
  return Math.floor(Math.sqrt(totalXp / 100));
}
```

To make leveling faster, decrease the divisor. To make it slower, increase it. The `xpForLevel()` function provides the inverse calculation, and both should stay in sync:

```typescript
export function xpForLevel(level: number): number {
  return level * level * 100;
}
```

## Creating New Course Types

The current lesson types are `content` and `challenge`, defined as a discriminated union in `packages/types/src/course.ts`. To add a new type:

### 1. Update the Sanity Schema

In `sanity/schemas/lesson.ts`, add the new type to the options list:

```typescript
defineField({
  name: "type",
  title: "Lesson Type",
  type: "string",
  options: {
    list: [
      { title: "Content", value: "content" },
      { title: "Challenge", value: "challenge" },
      { title: "Quiz", value: "quiz" },  // new
    ],
    layout: "radio",
  },
}),
```

### 2. Add Type-Specific Fields

Add fields that are conditionally shown based on the new type:

```typescript
defineField({
  name: "questions",
  title: "Quiz Questions",
  type: "array",
  hidden: ({ parent }) => parent?.type !== "quiz",
  of: [
    {
      type: "object",
      fields: [
        defineField({ name: "question", type: "string" }),
        defineField({ name: "options", type: "array", of: [{ type: "string" }] }),
        defineField({ name: "correctIndex", type: "number" }),
      ],
    },
  ],
}),
```

### 3. Update TypeScript Types

In `packages/types/src/course.ts`, add a new variant to the discriminated union. The existing types use a `LessonBase` interface with `ContentLesson` and `ChallengeLesson` extending it:

```typescript
interface LessonBase {
  _id: string;
  title: string;
  slug: string;
  order: number;
  difficulty?: Difficulty;
  xpReward: number;
}

export interface QuizLesson extends LessonBase {
  type: "quiz";
  content: string;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export type Lesson = ContentLesson | ChallengeLesson | QuizLesson;
```

### 4. Create the UI Component

Build a component to render the new lesson type in `apps/web/src/components/course/` or `apps/web/src/components/editor/`.

### 5. Update the Lesson Page

In `apps/web/src/app/[locale]/(platform)/courses/[slug]/lessons/[id]/page.tsx`, add rendering logic for the new type:

```typescript
if (lesson.type === "quiz") {
  return <QuizInterface lesson={lesson} />;
}
```
