# Customization Guide

This guide details how to customize the Osmos Academy frontend, including styling, internationalization, and gamification features.

## 🎨 Theme Customization

The project uses **Tailwind CSS v4** combined with highly customized **Vanilla CSS**.

### 1. Colors & CSS Variables
Primary theme colors are defined using Tailwind v4's `@theme` directive in `app/globals.css`:
```css
@theme inline {
  --color-background: var(--background);
  --color-neon-green: #00ffa3;
  --color-neon-cyan: #00f0ff;
  --color-neon-purple: #9945ff;
  --color-surface: #0a0f1a;
}
```
Modify these hex codes to globally change the application's color palette.

### 2. Glassmorphism & Animations
Premium UI elements use utility classes defined in `globals.css`:
- `.glass-panel` / `.glass-panel-hover`: Applies a translucent, blurred background with hover states.
- **Neon Text**: Use `.text-glow`, `.text-glow-blue`, or `.text-glow-purple` to apply text shadows.
- **Animations**: Modulate `@keyframes` like `shimmer`, `float`, and `glow-pulse` in `globals.css` to tweak the dynamic feel of the app.

## 🌍 Adding Languages (i18n)

The application uses `next-intl` for localization. It features a dynamic `[locale]` route segment wrap.

### To add a new language:
1. **Update Configuration**: Add the new locale code (e.g., `es` for Spanish) to your Next.js and `next-intl` configuration files/middleware.
2. **Create Translation Files**: Create a new JSON dictionary file for your locale (e.g., `messages/es.json`).
3. **Translate Keys**: Duplicate the keys from the default language (English) and provide the translated strings. 

The application will automatically detect the user's browser language or allow manual selection, routing them to `/[locale]/courses` (e.g., `/es/courses`).

## 🎮 Extending Gamification

Gamification heavily drives user engagement through features like XP, Levels, and Streaks.

### 1. XP Integration
XP is fundamentally awarded via **Soulbound Tokens (cNFTs)** on the Solana blockchain.
- **Frontend Display**: XP is fetched by reading the user's wallet token balance.
- **Level Calculation**: Modifiable in the client logic. Default: `Level = floor(sqrt(totalXP / 100))`.

### 2. Modifying Rewards
Standard XP layouts (editable via the backend or Sanity schemas):
- Lessons: ~10-50 XP
- Challenges: ~25-100 XP
- Milestones and Courses yield larger rewards. Modify the `xpReward` field in the Sanity `milestone` schema to adjust these values dynamically.

### 3. Local Gamification (Streaks)
Daily streaks are often managed directly via the frontend (Local Storage) or the backend profile model. Extending streaks (e.g., Streak Freezes) would involve updating the user's profile schema in the backend and building UI components to reflect those bonuses in `/app/[locale]/dashboard/page.tsx`.
