# Customization Guide

Theme customization, adding languages, and extending gamification in Superteam Academy.

## 1. Theme & Brand Customization

### Brand Palette

Superteam Brasil brand colors follow the official brand guidelines:

| Token | Hex | Usage |
|-------|-----|-------|
| `st-yellow` | `#ffd23f` | Accent, highlights |
| `st-cream` | `#f7eacb` | Light mode base tint |
| `st-green` | `#2f6b3f` | Primary (dark green) |
| `st-emerald` | `#008c4c` | CTA gradients, badges |
| `st-dark` | `#1b231d` | Near-black text |

### Design Token System

All colors are managed through CSS custom properties in `src/app/globals.css` using Tailwind CSS v4's `@theme inline` directive.

**Key token categories:**

| Category | Tokens | Purpose |
|----------|--------|---------|
| Base | `--background`, `--foreground` | Page background and text |
| Card | `--card`, `--card-foreground` | Card surfaces |
| Primary | `--primary`, `--primary-foreground` | Brand primary |
| Surface | `--surface`, `--surface-alt` | Elevated surfaces |
| Highlight | `--highlight` | Accent color (yellow dark / green light) |
| CTA | `--cta-from`, `--cta-to`, `--cta-foreground` | Call-to-action gradient |
| Sidebar | `--sidebar`, `--sidebar-active`, `--sidebar-border` | Sidebar-specific |
| Status | `--success`, `--warning`, `--info`, `--danger` | Feedback colors |
| Podium | `--podium-gold`, `--podium-silver`, `--podium-bronze` | Leaderboard |

### Modifying Colors

1. Open `src/app/globals.css`
2. Edit values in `:root` (light mode) and `.dark` (dark mode) blocks
3. The `@theme inline` block maps CSS vars to Tailwind classes automatically

Example - changing the primary color:

```css
:root {
  --primary: #your-color;
  --primary-foreground: #contrast-color;
}
.dark {
  --primary: #your-dark-variant;
  --primary-foreground: #contrast-color;
}
```

### CTA Gradient

The main call-to-action buttons use a custom gradient utility:

```css
.bg-gradient-cta {
  background: linear-gradient(135deg, var(--cta-from), var(--cta-to));
  color: var(--cta-foreground);
}
```

Update `--cta-from` and `--cta-to` to change the CTA gradient across the entire app.

### Custom Utilities

| Class | Effect |
|-------|--------|
| `.bg-gradient-cta` | CTA button gradient |
| `.bg-gradient-hero` | Hero section background |
| `.bg-noise` | Subtle noise texture overlay |
| `.glow-green` | Green box-shadow glow |
| `.glow-yellow` | Yellow box-shadow glow |

### Fonts

- Primary: **Archivo** (loaded from `public/New Logo/fonts/Archivo/`)
- Monospace: **JetBrains Mono** (from Google Fonts)

To change the primary font, update the `@font-face` declarations and `--font-sans` in `globals.css`.

### Theme Mode

- Theme state stored in Zustand (`user-store.ts`, `theme` field)
- `ThemeProvider` (next-themes) bridges store state with system preference
- Toggle available in Header and Settings page
- Supports: `dark`, `light`, `system`

## 2. Adding Languages

### Current Locales

- English (`en`) - `src/messages/en.json`
- Portuguese Brazil (`pt-BR`) - `src/messages/pt-BR.json`
- Spanish (`es`) - `src/messages/es.json`

### Add a New Locale

1. **Create dictionary file:**

```bash
cp src/messages/en.json src/messages/fr.json
# Translate all values in fr.json
```

2. **Register in IntlProvider** (`src/components/providers/intl-provider.tsx`):

```typescript
const dictionaries: Record<Locale, any> = {
  en: enMessages,
  "pt-BR": ptBrMessages,
  es: esMessages,
  fr: frMessages, // add
};
```

3. **Extend Locale type** (`src/types/index.ts`):

```typescript
export type Locale = "en" | "pt-BR" | "es" | "fr";
```

4. **Add selector option** in Header (`src/components/layout/header.tsx`) and Settings (`src/app/settings/page.tsx`).

### Translation Namespaces

Dictionaries use namespaced keys: `Common`, `Courses`, `Dashboard`, `Auth`, `Leaderboard`, `Settings`, `Profile`.

```tsx
const t = useTranslations("Courses");
return <h1>{t("title")}</h1>;
```

Keep key parity across all locale files.

## 3. Extending Gamification

### XP System

- XP is tracked on-chain as Token-2022 soulbound tokens
- `useXp` hook combines on-chain balance with local streak data
- Level calculation via `levelFromXp()` in user store
- XP per lesson defined in the on-chain program (default: 100)

### Streaks

- Tracked locally in Zustand (`streakDays: string[]`, last 90 days)
- `recordActivity()` action called on lesson completion
- `computeStreak()` in `use-xp.ts` builds 28-day grid + current/longest streaks
- To change streak window, modify the constants in `use-xp.ts`

### Achievements

- Defined in `src/lib/services/achievement-service.ts`
- Interface: `listAchievements(userId)`, `claimAchievement(userId, id)`
- Current implementation returns mock achievements
- To add new achievements, extend the achievement data and add unlock conditions

### Leaderboard

- Real on-chain data via `fetchXpLeaderboard()` (fetches all Token-2022 accounts for XP mint)
- Enriched with `rank` and `level` in `/api/leaderboard` route
- Timeframe filter (All Time / Monthly / Weekly) on the frontend
- Top 3 displayed as podium cards with gold/silver/bronze styling

### Adding New Gamification Elements

1. Define the data model in `src/types/index.ts`
2. Add interface method to the relevant service
3. Implement in the local service class
4. Create a React hook in `src/hooks/`
5. Build UI component in `src/components/gamification/`
6. Wire into the relevant page

## 4. Layout Customization

### App Shell

| Component | File | Purpose |
|-----------|------|---------|
| Root Layout | `src/app/layout.tsx` | Provider composition, global styles, GA4/Sentry |
| Header | `src/components/layout/header.tsx` | Navigation, wallet, theme, language |
| Sidebar | `src/components/layout/sidebar.tsx` | Page navigation, user card, XP display |
| Footer | `src/components/layout/footer.tsx` | Links, social, branding |

### Navigation Links

- **Header nav**: `navItems` array in `header.tsx`
- **Sidebar links**: `nav` array in `sidebar.tsx`
- **Footer columns**: `columns` array in `footer.tsx`

### Adding a New Page

1. Create `src/app/your-page/page.tsx`
2. Add navigation link in Header and/or Sidebar
3. Add translations to all locale files if using i18n
4. The root layout shell (Header, Sidebar, Footer) wraps all pages automatically

## 5. Component Library

UI primitives from shadcn/ui (`src/components/ui/`):

Badge, Button, Card, Dialog, Input, Progress, Select, Sheet, Tabs, Tooltip, Sonner (toast).

All components use the design token system. No hardcoded colors - everything flows through CSS custom properties.

To add new shadcn components:

```bash
npx shadcn@latest add [component-name]
```
