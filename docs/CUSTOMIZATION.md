> Last synced: 2026-08-24

# Customization Guide

How to retheme, translate, and extend Superteam Academy.

## Theming

The design system is **Solarium v9** — an "ink" construction of cream outlines,
forest-green and amber fills, chips, and pressed-key button affordances. It is
deliberately _not_ the Solana purple-to-teal gradient, which is now reserved for
credentials. The rendered reference is `docs/design-system.html` (the brand
guide); `apps/web/src/styles/globals.css` is the implementation and the only CSS
file in the app.

### Where the tokens live

Light mode is the `:root` baseline. Dark mode is **`[data-theme="dark"]`**, an
attribute — not a `.dark` class.

```css
:root {
  --bg: #fafaf7; /* warm cream page */
  --surface: #ffffff;
  --card: #ffffff;
  --primary: #0a7055; /* Forest Emerald — dark enough for a light ground */
  --xp: #f59e0b; /* Warm Amber */
  --border: rgba(0, 0, 0, 0.08);
}

[data-theme="dark"] {
  --bg: #111111; /* neutral gray, not blue-black */
  --surface: #181818;
  --card: #1b1b1b;
  --primary: #2ecc8e; /* lifted mint for a dark ground */
  --border: rgba(255, 255, 255, 0.07);
}
```

The dark neutrals are the luminance-matched grays of the blue-tinted surfaces
they replaced, so every contrast ratio the palette was tuned for is unchanged —
only the hue is gone. The blue cast fought the ink construction, whose cream
outlines and green/amber fills are meant to carry the only colour on those
surfaces.

The token families, so you know what you are reaching for:

| Family         | Tokens                                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| Surfaces       | `--bg`, `--surface`, `--card`, `--card-hover`, `--card-alt`, `--inset`, `--input`                           |
| Borders        | `--border`, `--border-default`, `--border-strong`, `--keyline{,-hover,-raised}`                             |
| Brand          | `--primary{,-hover,-dark,-dim,-light,-bg,-border}`                                                          |
| XP / accent    | `--xp`, `--xp-dim`, `--xp-dark`, and the `--accent*` Tailwind aliases                                       |
| **Ink**        | `--ink-line`, `--ink-bright`, `--ink-cream`, `--ink-dark`, `--ink-green`, `--ink-orange`, `--ink-on-orange` |
| Buttons        | `--btn-fill{,-hover,-press,-disabled}`, `--btn-label`, `--btn-line`                                         |
| Identity chips | `--avatar-bg`, `--avatar-fg`, `--xp-chip-{bg,fg}`, `--streak-chip-{bg,fg}`                                  |
| Code islands   | `--code-bg`, `--code-fg`                                                                                    |
| Layout         | `--header-h`, `--rim-h`, `--chip-radius`, `--focus-ring`                                                    |
| Semantic       | `--danger*`, `--error`, `--freeze*`, `--gold-ink`, `--gold-hi`                                              |

The ink family is the one to understand before making changes. Only `--ink-line`
flips between themes; the rest hold across both so outlined chrome reads as one
system in either mode.

### Rebranding

1. Change the `--primary-*` and `--xp-*` values in **both** the `:root` and
   `[data-theme="dark"]` blocks. Dark needs a lifted variant — the light-mode
   value will not carry on a `#111` ground.
2. Nothing in `tailwind.config.ts` needs touching. Every colour there is a
   `var(--token)` reference, so it follows automatically.
3. Confetti colours in the celebration layer are hardcoded hex — update them to
   match.

To add a whole new colour group, define the variables in both blocks in
`globals.css`, then add the Tailwind mapping in `tailwind.config.ts`.

### Tailwind

`darkMode: ["selector", "[data-theme='dark']"]` — the `dark:` variant keys on
the same attribute `next-themes` writes, so the CSS variables and the Tailwind
utilities can never disagree about which mode is active.

Beyond the colour mappings the config extends `borderRadius`, `fontFamily`,
`boxShadow` (including the push-button and card-lift shadows the ink system
relies on), and a set of keyframe animations for XP pops, shimmer, breathe, and
pulse rings. Plugins: `tailwindcss-animate` and `@tailwindcss/typography` (the
latter styles rendered lesson markdown).

`globals.css` also carries the component classes that are too structural for
utilities: `.patch` / `.chip` (with `data-cat` and `data-locked` variants),
`.nav-pill`, `.lv-badge`, the `.prog-*` progress system, `.banner-*` difficulty
banners, `.term-*` and `.hero-*` landing animations, `.ach-ring*`, and the
sidebar rules.

### Fonts

Three families, self-hosted through `next/font/google` in
`apps/web/src/app/layout.tsx` — no runtime request to Google, so the CSP does
not need to allow one.

| Variable   | Font              | Used for            |
| ---------- | ----------------- | ------------------- |
| `--font-d` | Nunito            | Headings, display   |
| `--font-b` | Plus Jakarta Sans | Body, UI            |
| `--font-m` | JetBrains Mono    | Code blocks, editor |

Swapping a font is an edit to the `next/font/google` import; the CSS variable is
wired by Next's `variable` option, so neither `globals.css` nor the Tailwind
config changes.

### Theme switching

`next-themes` with `attribute="data-theme"`, mounted by
`components/layout/theme-provider.tsx` and toggled by `theme-toggle.tsx`. Because
selection is an attribute on `<html>`, both the CSS variables and Tailwind's
`dark:` variant switch from a single source.

## Adding a language

`next-intl`, three locales today: `en` (default), `pt-BR`, `es`. Message files
are `apps/web/src/messages/<locale>.json`.

**1. Create the message file.** Copy `en.json` and translate every value. All
locale files must have identical key structures — a missing key is a runtime
`MISSING_MESSAGE` error, and two test suites enforce it
(`src/messages/__tests__/parity.test.ts` and `no-duplicate-keys.test.ts`). There
are currently 31 top-level namespaces; take the list from `en.json` rather than
from this document, which will rot.

**2. Register it** in `apps/web/src/lib/i18n/config.ts`:

```typescript
export const locales = ["en", "pt-BR", "es", "fr"] as const;
export const defaultLocale: Locale = "en";
export const localeNames: Record<Locale, string> = {
  en: "English",
  "pt-BR": "Portugues (BR)",
  es: "Espanol",
  fr: "Francais",
};
```

**3. That is all.** The middleware and `lib/i18n/request.ts` both read from
`config.ts` — the middleware iterates `locales`, and the request handler imports
`@/messages/${locale}.json` dynamically. `localePrefix` is `"always"`, so the new
locale is live at `/fr/` immediately.

Two conventions worth keeping: never hardcode a UI string in a component, and
remember that the root-level `not-found.tsx` and `error.tsx` render _outside_ the
`[locale]` layout — they cannot use `next-intl` and carry inline translation
objects keyed off `usePathname()` instead.

## Wallets

`apps/web/src/lib/solana/wallet-provider.tsx` configures the external-wallet
layer. It relies on the **Wallet Standard**, so the adapter array is empty:

```typescript
const wallets = useMemo(() => [], []);
```

Any Wallet Standard-compliant extension the learner has installed is discovered
automatically. No code changes when a new wallet ships.

Embedded wallets are a separate, optional layer: Dynamic, gated entirely on
`NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID`. Unset it and no provider mounts, no SDK
loads, and no network call happens — SIWS with an external wallet stays the
guaranteed way in. Read the flag only through
`lib/dynamic/config.ts` (`isDynamicEnabled` / `getDynamicEnvironmentId`).

> `NEXT_PUBLIC_*` values are inlined at **build** time. Changing the Dynamic
> environment id needs a redeploy with build cache **disabled** — a cache-reusing
> redeploy silently keeps the old value baked into the served chunks.

The RPC endpoint comes from `NEXT_PUBLIC_SOLANA_RPC_URL` and must carry no
privileged key; the server-side `SOLANA_RPC_URL` is the one that may hold the
Helius key. To move clusters, change both and set
`NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta`.

## Adding a course

Course content is not in this repo. It lives in
[`solanabr/academy-courses`](https://github.com/solanabr/academy-courses), is
compiled by `pnpm --filter web compile-content` at the SHA pinned in
`apps/web/content.lock`, and ships as a committed bundle.

Adding or changing a course is therefore three steps, in order:

1. Merge the content change in `academy-courses`. Its CI runs the content linter
   (`packages/content-lint`), which is what certifies a tree as publishable.
2. In this repo, bump `"sha"` in `apps/web/content.lock`, run
   `pnpm --filter web compile-content`, and commit the lock **and** the
   regenerated bundle together. CI byte-compares a fresh recompile against what
   you committed, so a stale bundle or a hand-edit fails the build.
3. Deploy it on-chain from `/admin` — a course stays invisible to learners until
   its `onchain_deployments` row is `synced` and active. See
   [ADMIN.md](./ADMIN.md).

Never hand-edit `apps/web/src/content/generated/*`; an ESLint rule also bans
importing it outside `src/lib/content/`.

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
