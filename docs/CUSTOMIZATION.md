# Customization Guide — Superteam Academy

## Theme Customization

### Brand Themes
Two built-in brand themes: **Solana** (purple/green gradient) and **Brazil** (green/yellow).

Theme is controlled via `data-brand` attribute on `<html>`. Change the default in `app/[locale]/layout.tsx`:

```tsx
<BrandProvider defaultBrand="brazil">  // or "solana"
```

### CSS Variables
All colors are defined in `app/globals.css` using CSS custom properties:

```css
[data-brand="solana"] {
  --solana-purple: #9945FF;
  --solana-green: #14F195;
}

[data-brand="brazil"] {
  --solana-purple: #009739;
  --solana-green: #FEDD00;
}
```

Override any variable to create a custom brand theme.

### Light/Dark Mode
Powered by `next-themes`. The theme switcher lets users toggle between `light`, `dark`, and `system`. Add custom color schemes by extending the `.dark` class in `globals.css`.

---

## Adding a Language

1. **Create a message file** — Copy `messages/en.json` to `messages/<locale>.json` (e.g. `fr.json`)
2. **Translate all strings** — Translate every key in the new file
3. **Register the locale** — Add it to `i18n/routing.ts`:
   ```typescript
   export const routing = defineRouting({
     locales: ["en", "pt-BR", "es", "fr"],  // add here
     defaultLocale: "en",
   });
   ```
4. **Add to language switcher** — Update `components/language-switcher.tsx` to include the new locale entry
5. **Generate static params** — The `generateStaticParams()` in `layout.tsx` auto-reads from routing config

---

## Extending Gamification

### XP Formula
Level is derived from XP: `Level = floor(sqrt(totalXP / 100))`

To change the curve, edit `app/lib/services/local-xp.service.ts`:
```typescript
getLevel(xp: number): number {
    return Math.floor(Math.sqrt(xp / 100));
}
```

### Adding Achievements
Achievements are defined on-chain via `AchievementType` PDAs. For the local mock:
1. Edit the mock data in `app/lib/services/local-progress.service.ts`
2. Add achievement display strings to each locale file under your desired namespace

### Streak Configuration
Streaks are frontend-only (localStorage). The streak system is in the Dashboard client component. Milestone thresholds (7, 30, 100 days) can be adjusted there.

---

## Adding a New Page

1. Create `app/app/[locale]/your-page/page.tsx` (or inside `(protected)/` for auth-gated pages)
2. Add a nav link in `components/header.tsx`:
   - Public pages: add to `publicLinks` array
   - Auth-required pages: add to `authLinks` array
3. Add translation keys to all locale files under the `"Header"` section
4. Optionally add tutorial steps in `lib/tutorials.ts` for the new page

---

## Analytics

### Google Analytics 4
Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` in `.env.local`. The `Analytics` component in the root layout handles:
- Script loading
- Automatic page view tracking on route changes

Track custom events anywhere:
```typescript
import { trackEvent } from "@/components/analytics";
trackEvent("lesson_complete", { course_id: "anchor-101", lesson_index: 3 });
```

### Sentry Error Monitoring
Set `NEXT_PUBLIC_SENTRY_DSN` in `.env.local`. Sentry is configured with:
- Client-side error boundary (`ErrorBoundary` component wraps all pages)
- Server-side instrumentation via `instrumentation.ts`
- Session replay for debugging (10% sample, 100% on error)
- Tunnel route at `/monitoring` to bypass ad-blockers

### Heatmaps
Add PostHog, Hotjar, or Microsoft Clarity by adding their script tags to `app/[locale]/layout.tsx` or creating a similar component to `Analytics`.

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project ID |
| `NEXT_PUBLIC_SANITY_DATASET` | Sanity dataset (e.g. `production`) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 measurement ID |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN for error monitoring |
| `AUTH_SECRET` | NextAuth secret (random string) |
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `AUTH_GITHUB_ID` | GitHub OAuth client ID |
| `AUTH_GITHUB_SECRET` | GitHub OAuth client secret |
