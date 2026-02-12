# Customization Guide

## Theme Customization

### Design Tokens

All colors use CSS custom properties defined in `apps/web/src/app/globals.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 262 83% 58%;        /* Solana purple */
  --primary-foreground: 210 40% 98%;
  /* ... more tokens */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... dark overrides */
}
```

To change the color scheme:
1. Edit the HSL values in `globals.css`
2. Update `solana` colors in `tailwind.config.ts`:
   ```ts
   solana: {
     purple: '#9945FF',   // Change brand primary
     green: '#14F195',    // Change brand accent
   }
   ```

### Fonts

Configured in `apps/web/src/app/layout.tsx`:
```ts
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' });
```

To change fonts:
1. Import your font from `next/font/google` (or `next/font/local`)
2. Update the CSS variable name
3. Reference in `tailwind.config.ts` under `fontFamily`

### Border Radius

Controlled by `--radius` in `globals.css`. Default: `0.5rem`.

---

## Adding a New Language

1. **Add locale to config** — `src/i18n/config.ts`:
   ```ts
   export const locales = ['pt-BR', 'en', 'es', 'fr'] as const;
   ```

2. **Create translation file** — `src/messages/fr.json`:
   - Copy `en.json` as a starting point
   - Translate all keys

3. **Add to language switcher** — `src/components/layout/language-switcher.tsx`:
   - Add the locale label (e.g., `{ code: 'fr', label: 'Français', flag: '🇫🇷' }`)

4. **CMS content** — Create French versions of courses in Sanity Studio

---

## Adding New Achievement Types

Achievements are defined in the `GamificationService` and stored in Supabase.

### 1. Define the Achievement

Add to the achievements table in Supabase:
```sql
INSERT INTO achievements (id, name, description, icon, category, requirement_type, requirement_value)
VALUES (
  'first-deploy',
  'First Deploy',
  'Deploy your first Solana program',
  '🚀',
  'milestone',
  'challenge_complete_count',
  1
);
```

### 2. Achievement Categories
- `milestone` — Progress-based (complete N lessons/courses)
- `streak` — Streak-based (maintain N-day streak)
- `skill` — Skill-based (complete challenges in specific topics)
- `social` — Community-based (help others, contribute)
- `special` — One-time events, seasonal

### 3. Trigger Logic

In `GamificationService.unlockAchievement()`, add check logic:
```ts
// After a challenge completion:
if (completedChallenges >= achievement.requirementValue) {
  await unlockAchievement(userId, achievement.id);
}
```

---

## Extending Gamification

### New XP Rules

Edit `GamificationService.getRewardConfig()`:
```ts
{
  lessonComplete: 20,       // Base XP per lesson
  challengeComplete: 50,    // Code challenge
  courseComplete: 200,       // Finish entire course
  streakBonus: 10,          // Daily streak multiplier
  dailyFirst: 15,           // First action of the day
  quizPerfectScore: 30,     // 100% quiz score
  // Add new rules:
  helpOther: 25,            // Answer a discussion question
  firstInCourse: 100,       // First to complete a course
}
```

### New Badge Categories

1. Add category to the `Achievement` type in `src/types/index.ts`
2. Add icon mapping in `src/components/profile/badge-grid.tsx`
3. Create badge artwork (SVG recommended, 128×128)
4. Insert achievements in Supabase with the new category

---

## Adding New Lesson Types

### 1. Extend the Type

In `src/types/index.ts`:
```ts
export type LessonType = 'content' | 'challenge' | 'quiz' | 'video' | 'simulation';
```

### 2. Create the Component

```tsx
// src/components/lessons/simulation-viewer.tsx
'use client';
export function SimulationViewer({ lesson }: { lesson: Lesson }) {
  // Your interactive simulation UI
}
```

### 3. Register in Lesson Content

In `src/components/lessons/lesson-content.tsx`, add to the type switch:
```tsx
case 'simulation':
  return <SimulationViewer lesson={lesson} />;
```

### 4. Add CMS Schema

In `apps/cms/schemas/lesson.ts`, add `simulation` to the type options and define any additional fields.

---

## Branding

### Logo
- Replace `public/logo.png` and `public/logo-dark.png`
- Update references in `src/components/layout/header.tsx`
- Recommended: SVG for crisp rendering at all sizes

### Colors
See [Theme Customization](#theme-customization) above.

### Favicon
- Replace `apps/web/src/app/favicon.ico`
- Add `apple-touch-icon.png` (180×180) to `public/`

### Open Graph Images
- Default OG image: `public/og-image.png` (1200×630)
- Referenced in root `layout.tsx` metadata

---

## Forking for Other Communities

Superteam Academy is designed to be forked by other Superteam chapters or Web3 communities.

### Quick Fork Checklist

1. **Fork & clone** the repository
2. **Branding:**
   - Replace logos, favicon, OG image
   - Update colors in `globals.css` and `tailwind.config.ts`
   - Change app name in `layout.tsx` metadata
3. **Content:**
   - Create a new Sanity project
   - Define your course catalog
   - Translate to your community's language(s)
4. **Auth:**
   - Set up your own OAuth credentials
   - Configure Supabase project
5. **Deploy:**
   - Push to your GitHub org
   - Deploy on Vercel (or any Node.js host)
6. **Customize:**
   - Add/remove lesson types
   - Adjust XP values and achievements
   - Modify RBAC roles if needed

### What to Keep
- Service interface architecture (swap implementations freely)
- Component library (shadcn/ui primitives)
- i18n infrastructure

### What to Replace
- Brand assets and colors
- CMS content
- Environment variables
- Community-specific features
