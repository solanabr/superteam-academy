# Customization Guide

How to customize and extend Solarium for your own needs.

## Theme Customization

### CSS Custom Properties

The design system is built on CSS custom properties defined in `apps/web/src/styles/globals.css`. These control all colors across both light and dark modes. Values are plain hex or rgba.

**Light Mode** (`:root`):

```css
:root {
  /* -- Primary: Deep Teal -- */
  --primary: #0d9488;
  --primary-hover: #0b7e73;
  --primary-dark: #087068;
  --primary-light: #ccfbf1;
  --primary-bg: #f0fdfa;

  /* -- Accent: Warm Amber -- */
  --accent: #f59e0b;
  --accent-hover: #d97706;
  --accent-dark: #b45309;
  --accent-light: #fef3c7;
  --accent-bg: #fffbeb;

  /* -- Secondary: Ink Teal -- */
  --secondary: #0f2f2d;
  --secondary-light: #134e4a;
  --secondary-bg: #e6fffb;

  /* -- Success: Botanical Green -- */
  --success: #16a34a;
  --success-dark: #15803d;
  --success-light: #dcfce7;
  --success-bg: #f0fdf4;

  /* -- Streak: Flame Orange -- */
  --streak: #ea580c;
  --streak-light: #fff7ed;

  /* -- Danger: Warm Coral -- */
  --danger: #e11d48;
  --danger-light: #ffe4e6;

  /* -- Solana Nod (used sparingly) -- */
  --solana-purple: #9945ff;
  --solana-green: #14f195;

  /* -- Neutrals: warm cream -- */
  --bg: #fafaf7;
  --card: #ffffff;
  --subtle: #f5f3ee;
  --warm: #fdf8f0;
  --border: #e7e4dd;
  --border-hover: #d4d0c7;
  --text: #1c1917;
  --text-2: #57534e;
  --text-3: #a8a29e;

  /* -- Radii -- */
  --r-sm: 10px;
  --r-md: 14px;
  --r-lg: 18px;
  --r-xl: 24px;
}
```

**Dark Mode** (`.dark`):

```css
.dark {
  /* -- Neutrals: Soft Neutral Dark -- */
  --bg: #343431;
  --card: #3d3c38;
  --subtle: #46443f;
  --warm: #4a4843;
  --border: #57534e;
  --border-hover: #6a655e;
  --text: #f5f1ea;
  --text-2: #d4cec3;
  --text-3: #a79f93;

  /* -- Primary: lifted for dark readability -- */
  --primary: #2dd4bf;
  --primary-hover: #22c7b3;
  --primary-dark: #0b7e73;
  --primary-light: rgba(45, 212, 191, 0.15);
  --primary-bg: rgba(45, 212, 191, 0.1);

  /* -- Accent: lifted -- */
  --accent: #fbbf24;
  --accent-hover: #f59e0b;
  --accent-dark: #b45309;
  --accent-light: rgba(251, 191, 36, 0.18);
  --accent-bg: rgba(251, 191, 36, 0.1);

  /* etc. -- see globals.css for the full set */
}
```

To change the color scheme, update the hex/rgba values in `globals.css`. All components reference these properties through Tailwind classes like `bg-primary`, `text-text`, `border-border`, etc.

### Changing the Primary Color Scheme

To rebrand from Deep Teal to a different primary color:

1. Update the `--primary-*` variables in both `:root` (light) and `.dark` blocks in `globals.css`
2. Update the `--accent-*` variables if desired
3. The Tailwind config (`apps/web/tailwind.config.ts`) references these CSS variables, so no Tailwind changes are needed
4. Confetti colors in `apps/web/src/components/gamification/level-up-overlay.tsx` use hardcoded hex values -- update those to match

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

**Legacy shadcn Compatibility:**

The config also includes compatibility aliases for shadcn/ui components:

- `background` -> `var(--bg)`
- `foreground` -> `var(--text)`
- `destructive` -> `var(--danger)` (with white foreground)
- `muted` -> `var(--subtle)` (with `--text-3` foreground)
- `popover` -> `var(--card)` (with `--text` foreground)
- `input` -> `var(--border)`
- `ring` -> `var(--primary)`

**Certificate Gradient:**

```typescript
backgroundImage: {
  "cert-gradient":
    "linear-gradient(135deg, var(--solana-purple) 0%, var(--solana-green) 100%)",
}
```

The Solana gradient is used sparingly (certificates only). A matching `.bg-cert-gradient` utility class is also available in `globals.css`.

**Border Radius:**

```typescript
borderRadius: {
  sm: "var(--r-sm)",   // 10px
  md: "var(--r-md)",   // 14px
  lg: "var(--r-lg)",   // 18px
  xl: "var(--r-xl)",   // 24px
}
```

**Custom Shadows:**

```typescript
boxShadow: {
  push: "0 4px 0 0 var(--shadow-push-color)",        // 3D push button
  "push-sm": "0 2px 0 0 var(--shadow-push-color)",   // Small push button
  "push-active": "0 1px 0 0 var(--shadow-push-color)", // Pressed push button
  card: "var(--shadow-card)",                          // Chunky card
  "card-hover": "var(--shadow-card-hover)",            // Card hover lift
  glow: "var(--shadow-glow)",                          // Dark-mode glow
  cert: "var(--shadow-cert)",                          // Certificate cards
  "cert-hover": "var(--shadow-cert-hover)",            // Certificate hover
  "cert-lg": "var(--shadow-cert-lg)",                  // Large certificate
}
```

**Custom Animations:**

| Name             | Duration / Timing                      | Purpose                                     |
| ---------------- | -------------------------------------- | ------------------------------------------- |
| `accordion-down` | 0.2s ease-out                          | Radix accordion open transition             |
| `accordion-up`   | 0.2s ease-out                          | Radix accordion close transition            |
| `xp-pop`         | 2s ease-out (forwards)                 | XP gain popup: scale up, float up, fade out |
| `shimmer`        | 2s infinite                            | Loading skeleton shimmer effect             |
| `breathe`        | 2s infinite alternate ease-in-out      | Gentle pulsing scale for emphasis           |
| `pop`            | 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) | Bounce-in entry for popups                  |
| `pulse-ring`     | 2s infinite                            | Pulsing glow ring on CTAs                   |
| `bounce-in`      | 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) | Quick elastic scale-in                      |

**Additional transition utilities:**

- `duration-600`: 600ms transition duration
- `ease-smooth`: `cubic-bezier(0.4, 0, 0.2, 1)` timing function

**CSS Utility Classes (in globals.css):**

Beyond Tailwind's generated classes, `globals.css` provides additional utilities:

- `.btn-push` / `.btn-push:active`: 3D push-button press effect
- `.card-chunky` / `.card-chunky:hover`: Bordered card with shadow lift on hover
- `.progress-fat` / `.progress-fat-fill`: Thick progress bar with inner highlight
- `.progress-fill-teal` / `.progress-fill-amber` / `.progress-fill-green`: Progress bar color variants
- `.banner-beginner` / `.banner-intermediate` / `.banner-advanced`: Difficulty-based gradient banners (with dark mode variants)
- `.font-display` / `.font-body`: Font family shortcuts

**Tailwind Plugins:**

- `tailwindcss-animate`: Animation utility classes
- `@tailwindcss/typography`: Prose styling for Markdown content

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

All color tokens have separate light and dark values. Components use `dark:` Tailwind variants or the CSS variable system (which switches automatically based on the `.dark` class on `<html>`).

## Adding New Languages (i18n)

The platform uses `next-intl` for internationalization.

### Current Locales

Three locales are currently supported (files in `apps/web/src/messages/`):

- `en.json` -- English (default)
- `pt-BR.json` -- Portuguese (Brazil)
- `es.json` -- Spanish

### Step 1: Create the Message File

Create a new JSON file in `apps/web/src/messages/`. Copy the structure from `en.json` and translate all values. Every key must be present -- missing keys cause `MISSING_MESSAGE` errors at runtime.

```
apps/web/src/messages/fr.json
```

The top-level namespace structure to replicate (19 namespaces):

```
common, nav, auth, landing, courses, lesson, dashboard,
gamification, certificates, profile, settings, a11y, footer,
notFound, error, errors, timeAgo, nameGenerator, deploy
```

### Step 2: Register the Locale

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

### Step 3: No Middleware Changes Needed

The middleware (`apps/web/src/middleware.ts`) imports from `config.ts`:

```typescript
import { locales, defaultLocale } from "@/lib/i18n/config";
```

It reads from the `locales` array dynamically, so no separate middleware update is needed.

The i18n request handler (`apps/web/src/lib/i18n/request.ts`) also imports from `config.ts` and dynamically loads the message file:

```typescript
messages: (await import(`@/messages/${locale}.json`)).default,
```

### Step 4: Verify

Run the development server and navigate to `http://localhost:3000/fr/` to verify the new locale loads correctly.

### Translation Guidelines

- All UI strings must be externalized in message files -- never hardcode text in components
- Use nested keys for organization (e.g., `dashboard.welcome`, `courses.difficulty.beginner`)
- Keep keys descriptive: `auth.connectWallet` not `btn1`
- Pluralization is supported via next-intl's ICU message format
- Root-level files (`not-found.tsx`, `error.tsx`) cannot use `next-intl` because they render outside the `[locale]` layout. They use inline translation objects.

### Critical vs Optional Namespaces

All namespaces are required for a complete translation. The most critical ones (used on every page):

- `common` -- shared buttons, labels, app name
- `nav` -- navigation links
- `auth` -- wallet connection, sign in/out
- `footer` -- footer links and text
- `a11y` -- accessibility labels (screen readers)

The remaining namespaces are page-specific and can be translated incrementally, though missing keys will show `MISSING_MESSAGE` warnings.

## Adding New Wallet Adapters

The Solana wallet provider is configured in `apps/web/src/lib/solana/wallet-provider.tsx`.

### Wallet Standard Auto-Discovery

The platform uses the **Wallet Standard** protocol, which automatically discovers any wallet extension the user has installed (Phantom, Solflare, Backpack, MetaMask Snap, etc.). No wallet adapters are explicitly imported or instantiated:

```typescript
const wallets = useMemo(() => [], []);
```

This means:

- Any Wallet Standard-compliant wallet works out of the box
- No code changes are needed when new wallets are released
- The wallet selection modal shows whatever wallets the user has installed

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

3. Call the XP award from the appropriate API route. XP is awarded server-side via the Supabase `award_xp()` function (SECURITY DEFINER, called with service_role key from API routes).

**Server-side XP cap**: The on-chain `xpPerLesson` field has a max of 100 (enforced in the Sanity schema: `rule.min(1).max(100)`). The Supabase `award_xp()` function itself has no cap -- the API route controls the amount.

### Adding New Achievements

Adding a new achievement requires changes in three places: Sanity (metadata), TypeScript (unlock logic), and on-chain (deployment via admin panel).

#### 1. Create the Achievement in Sanity

Create a new Achievement document in Sanity Studio with:

- **name** (required): Display name (e.g., "Decathlon")
- **description**: What the learner did to earn it (e.g., "Complete 10 courses")
- **icon**: Icon identifier (e.g., `trophy`)
- **category** (required): One of `progress`, `streaks`, `skills`, `community`, `special`
- **xpReward** (required): XP awarded on unlock (default: 50)
- **maxSupply**: Maximum awards (0 = unlimited)

Use the `_id` convention: `achievement-{slug}` (e.g., `achievement-ten-courses`).

#### 2. Add Unlock Logic

Add the check condition to the `UNLOCK_CHECKS` map in `apps/web/src/lib/gamification/achievements.ts`:

```typescript
const UNLOCK_CHECKS: Record<string, (state: UserState) => boolean> = {
  // ...existing checks...
  "ten-courses": (s) => s.completedCourses >= 10,
};
```

The function receives a `UserState` object with these fields:

```typescript
interface UserState {
  completedLessons: number; // Total lessons completed across all courses
  completedCourses: number; // Number of fully completed courses
  currentStreak: number; // Current consecutive-day streak
  hasCompletedRustLesson: boolean;
  hasCompletedAnchorCourse: boolean;
  hasCompletedAllTracks: boolean; // Deferred (always false currently)
  courseCompletionTimeHours: number | null; // Deferred (always null currently)
  allTestsPassedFirstTry: boolean; // Deferred (always false currently)
  userNumber: number; // User's signup order (1 = first user)
}
```

**Deferred signals**: Three fields (`hasCompletedAllTracks`, `courseCompletionTimeHours`, `allTestsPassedFirstTry`) require cross-course tracking infrastructure that is not yet implemented. Achievements depending on these signals (`full-stack-solana`, `speed-runner`, `perfect-score`) are currently unearnable.

Achievement IDs in `UNLOCK_CHECKS` must match the Sanity `_id` minus the `achievement-` prefix. For example, Sanity document `achievement-first-steps` maps to key `"first-steps"`.

#### 3. Deploy On-Chain

Use the admin panel to deploy the achievement on-chain. This creates an AchievementType PDA and a Metaplex Core collection. The admin panel writes back `achievementPda` and `collectionAddress` to Sanity, setting the status to `"synced"`.

#### Current Achievement Catalog

The 15 built-in achievements and their unlock conditions:

| ID                  | Condition                                      |
| ------------------- | ---------------------------------------------- |
| `first-steps`       | Complete 1 lesson                              |
| `course-completer`  | Complete 1 course                              |
| `speed-runner`      | Complete a course in under 24 hours (deferred) |
| `week-warrior`      | 7-day streak                                   |
| `monthly-master`    | 30-day streak                                  |
| `consistency-king`  | 100-day streak                                 |
| `rust-rookie`       | Complete a Rust lesson                         |
| `anchor-expert`     | Complete an Anchor course                      |
| `full-stack-solana` | Complete all tracks (deferred)                 |
| `early-adopter`     | Be among the first 100 users                   |
| `perfect-score`     | Pass all tests on first try (deferred)         |

Achievements without a `UNLOCK_CHECKS` entry (e.g., `bug-hunter`, `helper`, `first-comment`, `top-contributor`) are admin-granted and not automatically checked.

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

Then add a corresponding achievement definition in Sanity and an `UNLOCK_CHECKS` entry for the new milestone.

### Streak Logic

Streaks are tracked in two places:

**Supabase** (`supabase/schema.sql`, `award_xp()` function): The server-side `award_xp()` SECURITY DEFINER function handles streak tracking atomically alongside XP awards:

- If `last_activity_date` is NULL: first activity ever, set streak to 1
- If `last_activity_date` is today: already active today, keep current streak
- If `last_activity_date` is yesterday: consecutive day, increment streak by 1
- If gap > 1 day: reset streak to 1
- `longest_streak` is always `GREATEST(longest_streak, new_streak)`

The `user_xp` table stores: `current_streak`, `longest_streak`, `last_activity_date`.

**Client-side** (`apps/web/src/lib/gamification/streaks.ts`): Provides utilities for streak display, calendar generation, and milestone tracking. The client-side `updateStreak()` function mirrors the server logic for optimistic UI updates.

### Modifying the Leveling Curve

The level formula in `apps/web/src/lib/gamification/xp.ts`:

```typescript
export function calculateLevel(totalXp: number): number {
  return Math.floor(Math.sqrt(totalXp / 100));
}
```

The inverse calculation:

```typescript
export function xpForLevel(level: number): number {
  return level * level * 100;
}
```

This means Level 1 = 100 XP, Level 2 = 400 XP, Level 5 = 2500 XP, Level 10 = 10000 XP.

To make leveling faster, decrease the divisor (100). To make it slower, increase it. Both functions must stay in sync. The same formula is also implemented in the Supabase `award_xp()` function: `floor(sqrt(total_xp / 100.0))::int`.

### Gamification Event Bus (Popup System)

Gamification popups use a custom event bus pattern. Components dispatch browser `CustomEvent`s, and listener components render popups in response.

**Event types and their dispatchers:**

| Event Name                     | Dispatch Function                          | Source File             | Detail Shape                                |
| ------------------------------ | ------------------------------------------ | ----------------------- | ------------------------------------------- |
| `xp-gain`                      | `dispatchXpGain(amount)`                   | `xp-popup.tsx`          | `{ amount: number, id: number }`            |
| `superteam:level-up`           | `dispatchLevelUp(newLevel)`                | `level-up-overlay.tsx`  | `{ newLevel: number }`                      |
| `superteam:achievement-unlock` | `dispatchAchievementUnlock(id, name)`      | `achievement-popup.tsx` | `{ id: string, name: string, uid: number }` |
| `superteam:certificate-minted` | `dispatchCertificateMinted(certificateId)` | `certificate-popup.tsx` | `{ certificateId: string, uid: number }`    |

**How it works:**

1. An API response or client action calls the dispatch function (e.g., `dispatchXpGain(50)`)
2. The dispatch function creates and fires a `CustomEvent` on `window`
3. The corresponding popup component listens for the event via `window.addEventListener`
4. The popup renders with an animation (`animate-xp-pop`, `animate-pop`, etc.)
5. The popup auto-dismisses after a timeout (XP: 2.5s, achievements: 4s, certificates: 5s, level-up: 3s)

**Listener mount point:** `GamificationOverlays` (`apps/web/src/components/gamification/gamification-overlays.tsx`) mounts all popup components. It only renders when a user is authenticated. The component is included in the platform layout.

**Adding a new popup type:**

1. Create a new component in `apps/web/src/components/gamification/` following the existing pattern:
   - Export a `dispatch*()` function that fires a `CustomEvent`
   - Export a React component that listens for the event and renders a popup
2. Add the component to `GamificationOverlays`
3. Call the dispatch function from the relevant API response handler or client action

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

In the lesson page component, add rendering logic for the new type:

```typescript
if (lesson.type === "quiz") {
  return <QuizInterface lesson={lesson} />;
}
```
