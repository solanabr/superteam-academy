> Last synced: 2026-07-31

# Customization Guide

How to customize and extend Superteam Academy for your own needs.

## Theme Customization

> **Rendered reference:** `docs/design-system.html` — every token, both themes, live
> swatches, and the component variant matrices. It is **generated** from the files
> described below (`pnpm docs:design-system`); regenerate it after any token change
> and commit the diff. `pnpm docs:design-system:check` fails if it is stale.

### The pipeline

Styling flows in exactly one direction. Work at the highest layer that can express
what you need, and never skip a layer downwards.

```
apps/web/src/styles/globals.css        ← CSS custom properties (the ONLY place a raw hex lives)
  :root                                ← light values (baseline)
  [data-theme="dark"]                  ← dark overrides
        ↓
apps/web/tailwind.config.ts            ← semantic mapping: bg-primary, text-text-2, shadow-card, …
        ↓
apps/web/src/components/ui/*.tsx       ← cva primitives (Button is the model)
apps/web/src/lib/styles/styleClasses.ts← shared multi-class recipes
        ↓
component markup                       ← named tokens only
```

### CSS Custom Properties

Tokens live in `apps/web/src/styles/globals.css`. Both blocks are name-for-name
identical — **105 variables each** — so every token has a defined value in both
themes:

- `:root` — light mode (the baseline)
- `[data-theme="dark"]` — dark mode overrides

There is **no `.dark` class and no `.light` class.** next-themes is configured with
`attribute="data-theme"`, so it writes `data-theme="dark"` / `data-theme="light"` on
`<html>`. A selector such as `.dark .card` or `.light .pill` will never match.

A representative slice (see the generated reference for all 105):

```css
:root {
  /* Primary — Forest Emerald (dark enough for a light background) */
  --primary: #0a7055;
  --primary-hover: #08604a;
  --primary-dark: #065c44;
  --primary-dim: rgba(10, 112, 85, 0.09);

  /* XP — Warm Amber (aliased as --accent-*) */
  --xp: #f59e0b;
  --xp-dark: #b45309;
  --accent: #f59e0b;

  --streak: #ea580c; /* Flame orange */
  --freeze: #0284c7; /* Streak-freeze blue */
  --level: #7c3aed; /* Level purple */
  --success: #16a34a;
  --danger: #dc2626;

  /* Neutrals — warm cream */
  --bg: #fafaf7;
  --card: #ffffff;
  --border: rgba(0, 0, 0, 0.08);
  --border-default: rgba(0, 0, 0, 0.13);
  --border-strong: rgba(0, 0, 0, 0.22);
  --text: #1c1917;
  --text-2: #57534e;
  --text-3: #a8a29e;

  /* Radii */
  --r-xs: 4px;
  --r-sm: 8px;
  --r-md: 12px;
  --r-lg: 16px;
  --r-xl: 22px;
  --r-full: 999px;
  --radius: 12px;
}

[data-theme="dark"] {
  --primary: #2ecc8e; /* lifted for dark backgrounds */
  --primary-hover: #27bd82;
  --primary-dark: #0a7055; /* the light-mode primary becomes the dark shade */

  --xp: #f5a623;
  --streak: #f97316;
  --freeze: #38bdf8;
  --level: #a78bfa;
  --success: #3fb950;
  --danger: #f85149;

  --bg: #0e1117;
  --card: #161b27;
  --border: rgba(255, 255, 255, 0.07);
  --border-default: rgba(255, 255, 255, 0.11);
  --border-strong: rgba(255, 255, 255, 0.2);
  --text: #e6edf3;
  --text-2: #8b949e;
  --text-3: #78838f;
}
```

Token families: backgrounds/surfaces (10), borders (4), primary/secondary (12),
XP + accent + gold (12), streak + freeze (7), level (3), Solana brand (6), status
(13), text (4), difficulty-track gradients (3), activity heatmap (6), shadows (11),
radii (7), typography (3), misc (4).

### Changing the primary colour

1. Edit the `--primary-*` family in **both** `:root` and `[data-theme="dark"]`.
   Keep the relationship intact: in light mode `--primary-dark` is a deeper shade
   used for the button push shadow; in dark mode the light-mode primary becomes
   `--primary-dark`.
2. `--secondary` and `--ring` currently alias the primary — update them together.
3. Derived alpha tokens (`--primary-dim`, `--primary-light`, `--primary-bg`,
   `--primary-border`, `--primary-glow`, `--shadow-glow-primary`) carry the same
   RGB channel triple and must be recomputed by hand.
4. `--track-beg` / `--track-int` and `--sg-1..--sg-4` (the activity heatmap ramp)
   are built from the primary hue — restate them or the dashboard will clash.
5. No Tailwind change is needed: the config references the variables.
6. Regenerate `docs/design-system.html` and eyeball both theme columns.

### Tailwind configuration

`apps/web/tailwind.config.ts` maps CSS variables to semantic class names, so a
component never names a colour, only a role:

```typescript
darkMode: ["selector", "[data-theme='dark']"],
colors: {
  primary: { DEFAULT: "var(--primary)", hover: …, dark: …, light: …, bg: …, foreground: "#FFFFFF" },
  accent:  { DEFAULT: "var(--accent)",  hover: …, dark: …, light: …, bg: …, foreground: "#FFFFFF" },
  secondary: { DEFAULT: "var(--secondary)", light: …, bg: …, foreground: "#FFFFFF" },
  success: { DEFAULT: "var(--success)", dark: …, light: …, bg: … },
  streak:  { DEFAULT: "var(--streak)",  light: … },
  freeze:  { DEFAULT: "var(--freeze)",  fg: "var(--freeze-fg)", bg: "var(--freeze-bg)" },
  danger:  { DEFAULT: "var(--danger)",  dark: …, light: … },
  solana:  { purple: "var(--solana-purple)", green: "var(--solana-green)" },
  xp:      { DEFAULT: "var(--xp)", dim: "var(--xp-dim)", dark: "var(--xp-dark)" },
  gold:    { hi: "var(--gold-hi)", ink: "var(--gold-ink)" },
  level:   { DEFAULT: "var(--level)", dim: "var(--level-dim)" },
  sg:      { 0: "var(--sg-0)", 1: …, 2: …, 3: …, 4: …, today: "var(--sg-today)" },
  bg: "var(--bg)",
  card: { DEFAULT: "var(--card)", foreground: "var(--text)" },
  subtle: "var(--subtle)",
  warm: "var(--warm)",
  border: { DEFAULT: "var(--border)", hover: "var(--border-hover)", strong: "var(--border-strong)" },
  text: { DEFAULT: "var(--text)", 2: "var(--text-2)", 3: "var(--text-3)" },
  /* legacy shadcn aliases */
  background, foreground, destructive, muted, popover, input, ring
}
```

`darkMode: ["selector", "[data-theme='dark']"]` is what makes `dark:` variants key
off the same data attribute the CSS variables use — the two mechanisms can never
disagree.

**Named token vs. arbitrary value.** Prefer `bg-primary` over
`bg-[var(--primary)]`: identical pixels, but the named form keeps the token
greppable and forces new colours through the config. Arbitrary `var()` escapes are
legitimate only for the 43 variables the config deliberately does not map —
`--card-glass`, `--border-default`, `--r-xs`, `--shadow`, `--primary-dim`, and
friends. The generated reference marks exactly which rows those are.

To add a colour: define it in **both** theme blocks, then add the mapping in
`tailwind.config.ts`, then regenerate the reference.

**Legacy shadcn compatibility aliases:**

- `background` → `var(--bg)`
- `foreground` → `var(--text)`
- `destructive` → `var(--danger)` (white foreground)
- `muted` → `var(--subtle)` (with `--text-3` foreground)
- `popover` → `var(--card)` (with `--text` foreground)
- `input` → `var(--border)`
- `ring` → `var(--primary)`

**Border radius** (`--r-*` are theme-invariant):

```typescript
borderRadius: {
  sm: "var(--r-sm)",   //  8px
  md: "var(--r-md)",   // 12px
  lg: "var(--r-lg)",   // 16px
  xl: "var(--r-xl)",   // 22px
}
```

`--r-xs` (4px), `--r-full` (999px) and `--radius` (12px, the shadcn alias) have no
Tailwind mapping — use `rounded-[var(--r-full)]` or `rounded-full`.

**Custom shadows** (all theme-aware — the dark values are softer glows, the light
values are the chunky offset stack):

```typescript
boxShadow: {
  push: "0 4px 0 0 var(--shadow-push-color)",
  "push-sm": "0 2px 0 0 var(--shadow-push-color)",
  "push-active": "0 1px 0 0 var(--shadow-push-color)",
  card: "var(--shadow-card)",
  "card-hover": "var(--shadow-card-hover)",
  glow: "var(--shadow-glow)",
  "glow-xp": "var(--shadow-glow-xp)",
  cert: "var(--shadow-cert)",
  "cert-hover": "var(--shadow-cert-hover)",
  "cert-lg": "var(--shadow-cert-lg)",
}
```

**The Solana gradient.** `--sol-grad`
(`linear-gradient(135deg, #9945ff 0%, #00c2ff 50%, #14f195 100%)`) and its low-alpha
sibling `--sol-subtle` are the brand accent. The Tailwind `bg-cert-gradient`
utility and the matching `.bg-cert-gradient` class in `globals.css` are the
two-stop purple→green variant:

```typescript
backgroundImage: {
  "cert-gradient":
    "linear-gradient(135deg, var(--solana-purple) 0%, var(--solana-green) 100%)",
}
```

It is **not certificate-only**: it also drives the mastery bar, the deploy CTAs,
the Earn hand-off card, several landing surfaces, and a dozen rules in
`globals.css`. The rule is qualitative, not exclusive — use it for brand moments,
never behind body text.

**Custom animations** (from `tailwind.config.ts`):

| Name              | Duration / timing                       | Purpose                               |
| ----------------- | --------------------------------------- | ------------------------------------- |
| `accordion-down`  | 0.2s ease-out                           | Radix accordion open                  |
| `accordion-up`    | 0.2s ease-out                           | Radix accordion close                 |
| `xp-pop`          | 2s ease-out forwards                    | XP gain: scale, float, fade           |
| `shimmer`         | 2.2s infinite                           | Skeleton shimmer                      |
| `breathe`         | 2s infinite alternate ease-in-out       | Gentle pulsing scale                  |
| `pop`             | 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)  | Bounce-in entry                       |
| `pop-spring`      | 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)  | XP / achievement / certificate popups |
| `pulse-ring`      | 2s infinite                             | Pulsing ring on CTAs                  |
| `bounce-in`       | 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)  | Quick elastic scale-in                |
| `dash-amb-a`      | 14s ease-in-out infinite alternate      | Dashboard ambient drift A             |
| `dash-amb-b`      | 11s ease-in-out infinite alternate      | Dashboard ambient drift B             |
| `dm-in`           | 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) | Dashboard medal entry                 |
| `dm-glow`         | 3.5s ease-in-out infinite               | Amber medal glow                      |
| `dm-sol`          | 3.5s ease-in-out infinite               | Solana medal glow                     |
| `today-cell`      | 2s ease-in-out infinite                 | Heatmap "today" marker                |
| `col-breathe`     | 2.5s ease-in-out infinite               | Hero column breathing                 |
| `flicker`         | 1.5s ease-in-out infinite alternate     | Streak flame                          |
| `lv-canopy-pulse` | 3s ease-in-out infinite                 | Level badge (canopy tier)             |
| `lv-legend-pulse` | 3s ease-in-out infinite                 | Level badge (legend tier, Lv 50+)     |

Additional transition utilities: `duration-600` (600ms) and `ease-smooth`
(`cubic-bezier(0.4, 0, 0.2, 1)`).

**Tailwind plugins:** `tailwindcss-animate`, `@tailwindcss/typography`.

### Component primitives

- `apps/web/src/components/ui/button.tsx` is the model cva primitive: three core
  variants (`primary`, `secondary`, `accent`), utility variants (`ghost`, `link`,
  `destructive`, `destructiveOutline`), backward-compat aliases (`default`, `push`,
  `pushSuccess`, `outline`, `pushOutline`, `pushAccent`), and four sizes
  (`default`, `sm`, `lg`, `icon`). Add a variant rather than restyling a call site.
- `Card` is intentionally static (`--r-lg` radius, `--border-default` border,
  `--card` background, `--shadow-card`); interactive cards opt into the hover lift
  through `styleClasses`.
- Pills/badges are plain CSS classes in `globals.css` (`.pill` + `.pill-beg`,
  `.pill-int`, `.pill-adv`, `.pill-xp`, `.pill-streak`, `.pill-level`, `.pill-sol`,
  `.pill-done`), not a cva primitive.
- `apps/web/src/lib/styles/styleClasses.ts` holds shared recipes (transitions,
  spacing, card and interactive-state class strings).

### Outside the token pipeline

Four surfaces use literal colours on purpose and must be updated by hand when
retheming: the Monaco editor themes (`components/editor/themes.ts`), transactional
email templates (`lib/email/templates.ts` — mail clients do not support custom
properties), third-party brand marks (`components/icons/*`), and a few canvas/SVG
literals in landing and dashboard components.

### Fonts

Three families are loaded with `next/font/google` in `apps/web/src/app/layout.tsx`
and self-hosted (no runtime request to `fonts.googleapis.com`, which is why the CSP
does not allow it):

| CSS variable     | Font              | Weights            | Tailwind                  | Usage                                    |
| ---------------- | ----------------- | ------------------ | ------------------------- | ---------------------------------------- |
| `--font-sans`    | Plus Jakarta Sans | 400, 500, 600, 700 | `font-sans` / `font-body` | Body text, UI — already set on `<body>`  |
| `--font-display` | Nunito            | 600, 700, 800, 900 | `font-display`            | Headings, numerals, buttons, pills       |
| `--font-mono`    | JetBrains Mono    | (default)          | `font-mono`               | Code, addresses, hashes, tabular figures |

`globals.css` also declares `--font-d` / `--font-b` / `--font-m` as fallbacks used
in raw CSS rules (`font-family: var(--font-display, var(--font-d))`), so a rule
still renders if the next/font variable is missing.

To change a font, edit the `next/font/google` import in `layout.tsx`. The `variable`
option sets the CSS custom property, so neither `globals.css` nor
`tailwind.config.ts` needs a change.

### Dark/Light mode toggle

Theme switching is handled by `next-themes`:

- `ThemeProvider` (`components/layout/theme-provider.tsx`) wraps the app in
  `app/[locale]/layout.tsx` with:
  ```tsx
  <ThemeProvider
    attribute="data-theme"
    defaultTheme="dark"
    enableSystem
    disableTransitionOnChange
    nonce={nonce}
  >
  ```
  The `nonce` comes from the CSP middleware (`lib/csp.ts`) and lets next-themes'
  inline anti-flash script run under the policy.
- `ThemeToggle` (`components/layout/theme-toggle.tsx`) flips between `"light"` and
  `"dark"`.
- The Monaco editor reads `resolvedTheme` directly to pick its own theme
  (`components/editor/code-editor.tsx`, `components/editor/monaco-field.tsx`).

Because every token is defined in both blocks, components normally need **no**
`dark:` variants at all — using `bg-card text-text border-border` is automatically
correct in both themes. Reach for a `dark:` variant only when the _structure_ of a
style changes between themes, not merely its colour.

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

#### 1. Add the achievement doc (in `solanabr/academy-courses`)

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

Merge in `academy-courses`, then bump `apps/web/content.lock` and recompile the
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

Then add a matching achievement doc in `academy-courses` with
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
`academy-courses` CI. Once your block ships in a released version of the schema,
content authors can use it; the change reaches the app via a `content.lock` bump
(see [ADMIN.md](./ADMIN.md)).
