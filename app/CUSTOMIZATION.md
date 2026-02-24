# Customization Guide

## Theme System

The app uses CSS custom properties with Tailwind semantic tokens. All colors are defined in `app/globals.css`.

### CSS Variables

```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f4f4f5;
  --bg-tertiary: #e4e4e7;
  --bg-card: rgba(0, 0, 0, 0.02);
  --bg-card-hover: rgba(0, 0, 0, 0.04);
  --text-primary: #09090b;
  --text-secondary: #52525b;
  --text-muted: #71717a;
  --border-primary: rgba(0, 0, 0, 0.1);
  --border-secondary: rgba(0, 0, 0, 0.06);
}

.dark {
  /* ... dark mode overrides */
}
```

### Tailwind Tokens

| Token | CSS Variable | Usage |
|---|---|---|
| `bg-surface` | `--bg-primary` | Page background |
| `bg-surface-secondary` | `--bg-secondary` | Card/section background |
| `bg-card` | `--bg-card` | Subtle card backgrounds |
| `bg-card-hover` | `--bg-card-hover` | Card hover state |
| `text-content` | `--text-primary` | Primary text |
| `text-content-secondary` | `--text-secondary` | Secondary text |
| `text-content-muted` | `--text-muted` | Muted labels |
| `border-edge` | `--border-primary` | Primary borders |
| `border-edge-soft` | `--border-secondary` | Subtle borders |

### Brand Colors (unchanged across themes)
- `solana-purple`: `#9945FF`
- `solana-green`: `#14F195`
- `solana-cyan`: `#00C2FF`

### Customizing Colors

Edit CSS variables in `globals.css`. The theme toggle (Light/Dark/System) is on the Settings page.

## Adding Languages

1. Add locale code to `i18n/routing.ts`:
   ```ts
   locales: ["en", "pt-BR", "es", "fr"]
   ```
2. Create `messages/fr.json` with all translation keys (copy from `en.json`)
3. Add language option to the navbar `<select>` and settings page
4. Add locale to `middleware.ts` matcher if needed

## Gamification Extension

### Adding Achievement Types

1. Define achievement in `lib/achievements.ts`
2. Integrate with on-chain `achievement_type` and `achievement_receipt` PDAs
3. PDA seeds: `["achievement", achievementId]` and `["achievement_receipt", achievementId, recipient]`

### XP Economics
- Lesson completion: `course.xp_per_lesson` per lesson
- Completion bonus: `floor(xp_per_lesson * lesson_count / 2)`
- Creator reward: `course.creator_reward_xp` (gated by `min_completions`)

## Course Tracks

Tracks are identified by numeric IDs. To add a new track:
1. Create the track on-chain (authority instruction)
2. Add track color mapping in `components/course/course-card.tsx` (`TRACK_COLORS`)
3. Optionally add track metadata to Sanity CMS

## Forking Guide

1. Fork this repo
2. Deploy your own Anchor program (see `superteam-academy/docs/DEPLOY-PROGRAM.md`)
3. Update `.env.local` with your program addresses
4. Customize theme colors in `globals.css`
5. Update translations in `messages/`
6. Deploy to Vercel: `npx vercel`
