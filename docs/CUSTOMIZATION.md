# Customization Guide — Superteam Academy

## Theme Customization

### Design Tokens (tailwind.config.ts)
```typescript
// Modify these to match your brand
colors: {
  primary: { ... },    // Main brand color
  secondary: { ... },  // Accent color
  background: { ... }, // Page backgrounds
  card: { ... },       // Card backgrounds
  muted: { ... },      // Subtle backgrounds
  accent: { ... },     // Highlights
}

// Fonts
fontFamily: {
  sans: ['Inter', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
}
```

### Dark Mode
Dark mode is the primary theme. Light mode is secondary.
Toggle via `ThemeToggle` component (uses next-themes).

### For Octant Fork:
```typescript
colors: {
  primary: { DEFAULT: '#FF9602' },  // Octant orange
  background: { DEFAULT: '#171717' }, // Octant dark
  card: { DEFAULT: '#FEFDF4' },      // Octant cream
}
```

## Adding Languages

### 1. Create dictionary file
Copy `lib/i18n/dictionaries/en.json` to your language (e.g., `fr.json`).

### 2. Translate all keys
Keep the same JSON structure, translate values only.

### 3. Register language
In `lib/i18n/config.ts`, add to the `locales` array:
```typescript
export const locales = ['en', 'pt-br', 'es', 'fr'] as const;
export const localeNames = {
  en: 'English',
  'pt-br': 'Português',
  es: 'Español',
  fr: 'Français',
};
```

### 4. Add to middleware
The i18n middleware auto-detects browser language and redirects.

## Extending Gamification

### Adding New Achievements
In `lib/gamification/achievements.ts`:
```typescript
export const ACHIEVEMENTS = [
  // Add new achievement (index = bitmap position)
  {
    id: 'new_achievement',
    index: 25, // bitmap position (0-255)
    name: 'Achievement Name',
    description: 'How to earn it',
    icon: '🏆',
    check: (user: UserStats) => user.someMetric >= threshold,
  },
];
```

### Adjusting XP Rewards
In `lib/gamification/xp.ts`:
```typescript
export const XP_REWARDS = {
  COMPLETE_LESSON: { min: 10, max: 50 },
  COMPLETE_CHALLENGE: { min: 25, max: 100 },
  COMPLETE_COURSE: { min: 500, max: 2000 },
  DAILY_STREAK: 10,
  FIRST_COMPLETION: 25,
};
```

### Changing Level Formula
```typescript
// Default: Level = floor(sqrt(xp / 100))
export const getLevel = (xp: number) => Math.floor(Math.sqrt(xp / 100));

// Alternative: faster early levels
export const getLevel = (xp: number) => Math.floor(Math.log2(xp / 50 + 1));
```

## Forking for Another Community

1. Clone the repo
2. Update `tailwind.config.ts` with your brand colors
3. Replace content in Sanity with your courses
4. Update `lib/i18n/dictionaries/` with your languages
5. Update `lib/solana/constants.ts` with your program IDs (if using on-chain)
6. Deploy to Vercel: `vercel --prod`

The service interface pattern means you can swap Supabase for any backend without touching UI components.
