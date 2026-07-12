> Last synced: 2026-03-02

# Customization Guide

How to customize and extend Superteam Academy for your own needs.

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

The top-level namespace structure to replicate (21 namespaces):

```
common, nav, auth, landing, courses, lesson, dashboard,
gamification, certificates, profile, settings, a11y, footer,
notFound, error, errors, timeAgo, nameGenerator, deploy,
community, programErrors
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
- Use nested keys for organization (e.g., `courses.difficulty.beginner`)
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

**Server-side XP cap**: `xpReward` is capped by the content schema (`MAX_XP_PER_MINT`, `packages/content-schema/src/constants.ts`), and the API routes cap awards independently (max 100 XP per lesson completion, max 2000 per generic award). The Supabase `award_xp()` function does enforce a daily community-XP cap but does not cap the per-call amount — the API route controls it.

### Adding New Achievements

**Unlock logic is content, not TypeScript.** Since the content-standard cutover,
each achievement carries a declarative `award` rule, and the app holds one
predicate **per award kind** — not per achievement. Adding a normal achievement
therefore requires **no app code change at all**.

#### 1. Add the achievement doc (in `solanabr/courses-academy`)

Create `achievements/<slug>.yaml`:

```yaml
id: achievement-ten-courses
name: Decathlon
description: Complete 10 courses
icon: trophy
glyph: "10"
category: progress # progress | streaks | skills | community | special
xpReward: 50
maxSupply: 0 # 0 = unlimited
award:
  kind: lessons-completed
  gte: 10
```

The `id` convention is `achievement-{slug}` and it is validated by
`packages/content-schema/src/achievement.ts` (Zod). `award` is **required** — an
achievement with no award rule can never be earned.

Available `award.kind` values:

| `kind`                        | Params          | Unlocks when                                    |
| ----------------------------- | --------------- | ----------------------------------------------- |
| `lessons-completed`           | `gte`           | total completed lessons >= `gte`                |
| `lessons-completed-in-course` | `course`, `gte` | completed lessons in that course >= `gte`       |
| `course-completed`            | `course`        | that course is fully completed                  |
| `path-completed`              | `path`          | every course in that learning path is completed |
| `streak`                      | `days`          | current streak >= `days`                        |
| `user-number`                 | `lte`           | signup order <= `lte` (early-adopter style)     |
| `community-stat`              | `stat`, `gte`   | that community stat >= `gte`                    |
| `manual`                      | —               | never auto-fires; admin-granted only            |

No course or path id is hardcoded in the app — `course` and `path` name real
content docs and are validated by the linter.

#### 2. Publish it

Merge in `courses-academy`, then bump `apps/web/content.lock` and recompile the
bundle (see [ADMIN.md](./ADMIN.md)). The achievement now exists in the app.

#### 3. Deploy on-chain

From `/admin/courses`, deploy the achievement. This creates the AchievementType PDA
and its Metaplex Core collection, and records `achievement_pda` +
`collection_address` in the Supabase `onchain_deployments` table.

> **ID convention**: the full content `_id` (e.g. `achievement-first-steps`) is the
> on-chain PDA seed, used **verbatim**. Never strip the `achievement-` prefix —
> stripping it derives a different PDA and the award fails silently.

#### When you DO need app code

Only when you need a genuinely new **kind** of condition. Then:

1. Add the variant to the `Award` discriminated union in
   `packages/content-schema/src/achievement.ts` (and to `AWARD_KINDS`).
2. Add the matching predicate to `PREDICATES` in
   `apps/web/src/lib/gamification/achievements.ts`. It is declared
   `satisfies Record<AwardKind, Predicate>`, so a missing kind is a **compile
   error** — you cannot forget this step.
3. If the predicate needs a new signal, add the field to `UserState` and populate
   it in `buildUserState()`.

The current `UserState`:

```typescript
interface UserState {
  completedLessons: number;
  completedLessonsByCourse: Record<string, number>; // courseId → count
  completedCourseIds: ReadonlySet<string>;
  completedPathIds: ReadonlySet<string>;
  currentStreak: number;
  userNumber: number; // signup order (1 = first user)
  community: Record<CommunityStat, number>;
}
```

> `perfect-score` was **dropped**, not deferred: block results are transient by
> design, so there is no durable "passed on first try" signal to key it on.

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

Then add a matching achievement doc in `courses-academy` with
`award: { kind: streak, days: 365 }`. No predicate change is needed — `streak` is
already a supported kind.

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

## Adding a New Lesson Block Type

A lesson is **not** typed `content` vs `challenge` any more. A lesson is an ordered
`blocks[]` array — a page builder. Adding a new capability means adding a new
**block type**, not a new lesson type.

The current block types (`packages/content-schema/src/blocks/`):

| `type`                  | Graded  | Required | Purpose                                   |
| ----------------------- | ------- | -------- | ----------------------------------------- |
| `prose`                 | no      | no       | Markdown body                             |
| `video`                 | no      | no       | Embedded video                            |
| `code`                  | **yes** | **yes**  | Monaco challenge (starter/solution/tests) |
| `quiz`                  | **yes** | **yes**  | Multiple-choice questions                 |
| `openEnded`             | no      | **yes**  | Free-text reflection prompt               |
| `wallet-funding`        | no      | no       | Devnet airdrop widget                     |
| `program-explorer`      | no      | no       | IDL-driven program explorer               |
| `deployed-program-card` | no      | no       | Shows the learner's deployed program      |

### 1. Define the schema

Add the Zod schema in `packages/content-schema/src/blocks/<name>.ts` and register
it in the `Block` discriminated union in `blocks/index.ts`.

### 2. Register it

Add an entry to `BLOCK_REGISTRY` in the same file:

```typescript
export const BLOCK_REGISTRY = {
  // ...existing...
  myBlock: { graded: false, required: true },
} satisfies Record<BlockType, BlockMeta>;
```

`satisfies Record<BlockType, BlockMeta>` makes an unregistered block type a
**compile error**. This is the fail-closed seam: the lesson-completion gate
dispatches on this registry, and a block type with no registered grader is
**DENIED** — an unknown type can never silently pass a lesson.

- `graded: true` → the block returns pass/fail, and failing it blocks lesson completion.
- `required: true` → the learner must interact with it before the lesson can complete.

### 3. Add the projected type

Add the matching variant to the `LessonBlock` union in
`packages/types/src/course.ts` (discriminated on `_type`), and project it in
`apps/web/src/lib/content/project.ts`.

### 4. Create the renderer

Add the component and register it in the lesson page's block renderer registry —
which keys on the same `_type` string as the schema and `BLOCK_REGISTRY`.

### 5. Grade it (if `graded: true`)

Add the grader to the grader map. All three maps — renderer, grader, and
`BLOCK_REGISTRY` — key on the same discriminant, so a missing one is caught at
compile time or fails closed at runtime.

### 6. Lint + publish

The content linter (`packages/content-lint`) validates every block in
`courses-academy` CI. Once your block ships in a released version of the schema,
content authors can use it; the change reaches the app via a `content.lock` bump
(see [ADMIN.md](./ADMIN.md)).
