# Customization Guide — Superteam Academy

How to customize theming, i18n, gamification, and extend the platform.

## Theme Customization

### Design Tokens

All colors and spacing are defined as CSS custom properties in `app/src/app/globals.css`.

#### Changing the Primary Color

The primary color (default: purple `262 83% 58%`) is used throughout buttons, links, and accents. To change it:

```css
/* globals.css — :root (light mode) */
--primary: 220 90% 56%;            /* Change to blue */
--primary-foreground: 0 0% 98%;

/* globals.css — .dark */
--primary: 220 90% 56%;
--primary-foreground: 0 0% 98%;

/* Also update the ring color to match */
--ring: 220 90% 56%;
```

#### Changing the Accent Color

The accent color (default: teal `173 80% 40%`) is used for secondary highlights:

```css
--accent: 142 76% 36%;              /* Change to green */
--accent-foreground: 0 0% 98%;
```

#### Track Colors

Each learning track has its own color for badges and icons:

```css
--track-fundamentals: 262 83% 58%;  /* Purple */
--track-defi: 173 80% 40%;          /* Teal */
--track-nft: 328 85% 60%;           /* Pink */
--track-gaming: 38 92% 50%;         /* Orange */
--track-infrastructure: 200 95% 45%;/* Blue */
--track-security: 0 84% 60%;        /* Red */
```

To add a new track color, add the CSS variable and update the Badge variants in `app/src/components/ui/badge.tsx`.

#### Gamification Colors

```css
--xp: 50 100% 50%;                  /* Gold — XP displays */
--streak: 25 95% 53%;               /* Orange — streak fire */
--level: 262 83% 58%;               /* Purple — level badges */
```

Utility classes `.text-xp`, `.text-streak`, `.text-level` are defined in `globals.css`.

### Dark Mode

Dark mode is the primary theme (per bounty spec). The theme is managed by `next-themes` in `app/src/providers/theme-provider.tsx`.

To change the default theme:

```tsx
// providers/theme-provider.tsx
<NextThemesProvider
  attribute="class"
  defaultTheme="dark"    // Change to "light" or "system"
  enableSystem
>
```

### Typography

Fonts are loaded via `next/font/google` in `app/src/app/layout.tsx`:

```typescript
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
```

To use different fonts, swap the import and update the CSS variables:

```css
@theme inline {
  --font-sans: var(--font-your-font), system-ui, sans-serif;
  --font-mono: var(--font-your-mono), ui-monospace, monospace;
}
```

### Component Variants

UI components use `class-variance-authority` (CVA) for variants. Example — adding a button variant:

```tsx
// components/ui/button.tsx
const buttonVariants = cva("...", {
  variants: {
    variant: {
      // ... existing variants
      gradient: "bg-gradient-to-r from-primary to-accent text-white hover:opacity-90",
    },
  },
});
```

## Adding a Language

### 1. Define the locale

Add the locale code to `app/src/i18n/config.ts`:

```typescript
export const locales = ["en", "pt-BR", "es", "fr"] as const;  // added "fr"
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: "English",
  "pt-BR": "Português (BR)",
  es: "Español",
  fr: "Français",                     // added
};
```

### 2. Create the translation file

Copy `app/src/messages/en.json` to `app/src/messages/fr.json` and translate all values:

```json
{
  "nav": {
    "courses": "Cours",
    "dashboard": "Tableau de bord",
    "leaderboard": "Classement"
  }
}
```

### 3. Done

The language switcher in the header automatically picks up new locales from the config. No other code changes needed.

### Translation Key Structure

Keys are organized by section:

```
nav.*              — Navigation links
landing.hero.*     — Landing page hero section
landing.features.* — Landing page features
courses.*          — Course catalog and detail
dashboard.*        — Dashboard page
leaderboard.*      — Leaderboard page
profile.*          — Profile page
settings.*         — Settings page
certificate.*      — Certificate page
footer.*           — Footer links
common.*           — Shared strings (loading, error, etc.)
```

## Extending Gamification

### Adding an Achievement

1. Add the achievement to the stub data in `app/src/services/stub/gamification.ts`:

```typescript
{
  id: "new-achievement",
  title: "New Achievement",
  description: "Description of what triggers this",
  icon: "🏅",
  category: "progress",     // progress | streak | skill | community | special
  xpReward: 50,
  requirement: "Complete X",
  isUnlocked: false,
}
```

2. The achievement will automatically appear in the Dashboard and Profile pages.

### Modifying XP Rewards

XP values are configured per course in the stub data (`services/stub/courses.ts`):

| Action | Field | Typical Range |
|--------|-------|---------------|
| Complete lesson | `lesson.xpReward` | 10–50 |
| Complete challenge | `lesson.xpReward` (challenge type) | 25–100 |
| Complete course | `course.xpReward` | 500–2,000 |

### Level Formula

Level is derived from XP: `Level = floor(sqrt(totalXP / 100))`

This is implemented in `app/src/lib/utils.ts`:

```typescript
export function getLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100));
}
```

To change the formula, update `getLevel()` and `getXPProgress()` in `utils.ts`.

### Streak System

Streaks are tracked client-side via `localStorage` in the gamification stub. The streak data structure:

```typescript
interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;     // ISO date
  freezesAvailable: number;
  streakHistory: StreakDay[];
}
```

To persist streaks server-side, implement the `GamificationService.getStreak()` method with your database.

## Adding a Learning Track

1. Add the track type in `app/src/types/index.ts`:

```typescript
export type Track = "fundamentals" | "defi" | "nft" | "gaming" | "infrastructure" | "security" | "ai";
```

2. Add a track color in `globals.css`:

```css
:root {
  --track-ai: 280 80% 55%;
}
.dark {
  /* same or adjusted for dark mode */
}
```

3. Add a Badge variant in `app/src/components/ui/badge.tsx`:

```typescript
ai: "border-transparent bg-[hsl(var(--track-ai))] text-white",
```

4. Add the track to the learning paths in `app/src/components/landing/learning-paths-section.tsx`.

5. Add translation keys for the new track name in all locale files.

## Adding a New Page

1. Create the route: `app/src/app/your-page/page.tsx`
2. Create the component: `app/src/components/your-page/your-component.tsx`
3. Add navigation link in `app/src/components/layout/header.tsx` (the `navLinks` array)
4. Add translation keys for the page title and content

## Swapping the Service Layer

The service layer is designed for easy replacement. Each service is an interface in `services/interfaces.ts` with a stub in `services/stub/`.

To swap a service:

1. Create a new implementation:
   ```
   app/src/services/onchain/learning-progress.ts
   ```

2. Implement the interface:
   ```typescript
   import type { LearningProgressService } from '../interfaces';

   export class OnChainProgressService implements LearningProgressService {
     async getProgress(userId, courseId) { /* read from PDA */ }
     async completeLesson(userId, courseId, lessonIndex) { /* send tx */ }
     // ...
   }

   export const learningProgressService = new OnChainProgressService();
   ```

3. Update the export in `services/index.ts`:
   ```typescript
   export { learningProgressService } from "./onchain/learning-progress";
   ```

No component changes needed — they consume the service through the same interface.
