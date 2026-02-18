# 🎨 Customization Guide — Superteam Academy

## Theme Customization

### Colors

Edit `tailwind.config.ts` to customize the color palette:

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#faf5ff',
          500: '#8b5cf6',  // Main brand color
          600: '#7c3aed',
          700: '#6d28d9',
        },
        accent: {
          500: '#3b82f6',  // Secondary accent
        },
      },
    },
  },
};
```

### Dark/Light Mode

The theme system uses CSS classes (`dark`/`light`) on `<html>`. Tailwind's `dark:` prefix works automatically.

To customize default theme, edit `src/lib/theme/context.tsx`:
```typescript
const [theme, setThemeState] = useState<Theme>('dark'); // Change default here
```

### Typography

The app uses Inter font. To change:
1. Edit `src/app/layout.tsx` — change the font import
2. Update `tailwind.config.ts` font family if needed

## Adding a Language

### 1. Add translations

Edit `src/lib/i18n/translations.ts`:

```typescript
export type Locale = 'pt-BR' | 'es' | 'en' | 'fr'; // Add new locale

export const translations: Record<Locale, Record<string, string>> = {
  // ... existing ...
  fr: {
    'nav.home': 'Accueil',
    'nav.courses': 'Cours',
    // ... all keys ...
  },
};
```

### 2. Add to language switcher

Edit `src/lib/i18n/context.tsx`:

```typescript
const locales = [
  // ... existing ...
  { code: 'fr' as Locale, label: 'Français', flag: '🇫🇷' },
];
```

### 3. Update HTML lang

The `<html lang>` attribute updates automatically via the i18n context.

## Extending Gamification

### Adding XP Events

Edit `src/lib/services/interfaces.ts` to add new XP event types:

```typescript
export interface XPEvent {
  type: 'lesson_complete' | 'challenge_complete' | 'course_complete'
    | 'streak_bonus' | 'first_daily'
    | 'community_help' | 'bug_report';  // Add new types
  amount: number;
  // ...
}
```

### Adding Achievements

Achievements use a 256-bit bitmap. To add new ones:

1. Define the achievement in your achievement service:
```typescript
const ACHIEVEMENTS = [
  // ... existing (indices 0-N) ...
  { id: 25, name: 'Speed Runner', category: 'progress', 
    description: 'Complete a course in under 48 hours', xpReward: 200 },
];
```

2. Add unlock condition logic in `AchievementService.checkAndUnlock()`

### Adding Streaks Milestones

Streak rewards at 7, 30, 100 days map to credential upgrades. To add more:
- Edit the streak checking logic in `LocalProgressService._updateStreak()`
- Map new milestones to achievement IDs

## Code Editor Configuration

The embedded Monaco Editor can be customized:

```typescript
// In code-editor component
<Editor
  theme="vs-dark"              // or "vs-light" for light mode
  language="rust"              // rust, typescript, json
  options={{
    fontSize: 14,
    minimap: { enabled: false },
    lineNumbers: 'on',
    wordWrap: 'on',
    suggestOnTriggerCharacters: true,
    tabSize: 4,
  }}
/>
```

## Adding Course Tracks

Learning tracks group related courses. To add a new track:

1. Add courses with matching `track` field in course data
2. The catalog page automatically groups by track
3. Credentials evolve within a track (one cNFT per track)

## Deployment Configuration

### Environment Variables

```env
# Solana
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com

# CMS (optional)
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_SENTRY_DSN=

# Database (optional)
DATABASE_URL=postgresql://...
```

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Preview deployments are automatic on PRs via Vercel GitHub integration.

## Forking for Other Communities

This platform is designed to be forkable:

1. Fork the repository
2. Update branding in `tailwind.config.ts` and components
3. Replace course content via CMS or `courses-data.ts`
4. Update i18n translations for your community's languages
5. Deploy to your own Vercel/Netlify
6. Connect your own Solana program for on-chain features
