# Customization Guide

## Theming

### Colors

The color system is defined in `src/app/globals.css` using Tailwind v4's `@theme inline` directive:

```css
@theme inline {
  --color-background: #fdfdfc;
  --color-foreground: #111111;
  --color-surface: #ffffff;
  --color-surface-dark: #111111;
  --color-surface-dark-alt: #1a1a1a;
  --color-surface-dark-inner: #222222;
  --color-accent: #a5b4fc;
  --color-accent-hover: #818cf8;
}
```

To change the accent color, update `--color-accent` and `--color-accent-hover`.

### Dark Mode

Dark mode is implemented using Tailwind's `dark:` variant and `next-themes`:

- All components use `dark:` utility classes for dark mode styles
- The theme preference is stored in a cookie for SSR consistency
- Three modes available: Light, Dark, System

To customize dark mode colors, edit the `dark:` variants in the CSS or component styles.

### Typography

Fonts are loaded via `next/font/google`:
- **Sans**: Geist Sans (body text, headings)
- **Mono**: Geist Mono (code, numbers)

To change fonts, update `src/app/layout.tsx`:

```typescript
const customFont = YourFont({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
```

### Design System

The full design system is documented in `.cursor/rules/ui-design-system.mdc` and includes:
- Color palette
- Typography scale
- Spacing system
- Border radius conventions
- Shadow styles
- Animation patterns

## Internationalization (i18n)

### Adding a New Language

1. Create a new translation file in `src/lib/i18n/translations/`:

```typescript
// src/lib/i18n/translations/fr.ts
import type { TranslationKeys } from "./en";

const fr: TranslationKeys = {
  common: {
    loading: "Chargement...",
    // ... all other keys
  },
  // ... all other sections
};

export default fr;
```

2. Register it in `src/lib/i18n/index.ts`:

```typescript
import fr from "./translations/fr";

export type Locale = "en" | "pt-br" | "es" | "fr";

export const LOCALES = [
  // ... existing locales
  { code: "fr", label: "Francais", flag: "🇫🇷" },
];

const translations: Record<Locale, TranslationKeys> = {
  // ... existing
  fr,
};
```

3. The language switcher will automatically include the new locale.

### Adding New Translation Keys

1. Add the key to `src/lib/i18n/translations/en.ts`
2. Add the translated version to all other locale files (pt-br.ts, es.ts)
3. Use it with `t("section.keyName")` or `t("section.keyName", { param: value })` for interpolation

## Wallet Configuration

### Adding Wallet Adapters

Edit `src/components/providers/WalletProvider.tsx`:

```typescript
import { PhantomWalletAdapter, SolflareWalletAdapter, BackpackWalletAdapter } from "@solana/wallet-adapter-wallets";

const wallets = useMemo(() => [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
  new BackpackWalletAdapter(),
  // Add more adapters here
], []);
```

### Switching Networks

Update `.env.local`:

```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
```

## Gamification

### XP Rewards

XP values are configured in `src/lib/types/learning.ts`:

```typescript
export const XP_REWARDS = {
  LESSON_COMPLETE: 10,
  CHALLENGE_COMPLETE: 25,
  MODULE_COMPLETE: 50,
  COURSE_COMPLETE: 200,
  STREAK_7: 50,
  STREAK_30: 200,
  FIRST_LESSON: 25,
};
```

### Leveling Formula

```
Level = floor(sqrt(totalXp / 100))
MinXP(level) = level^2 * 100
```

To change the leveling curve, edit `xpToLevel()` and `levelToMinXp()` in `src/lib/types/learning.ts`.

### Achievements

Achievements are defined as a bitmap system in `src/lib/types/learning.ts`. Each achievement has:
- `id` - unique identifier
- `name` - display name
- `description` - unlock criteria
- `icon` - Lucide icon name
- `bit` - position in the bitmap

## Content Layout

### Adding New Pages

1. **Public page**: Create in `src/app/(public)/your-page/page.tsx`
2. **Authenticated page**: Create in `src/app/(app)/your-page/page.tsx`
3. Add navigation link to the appropriate layout component

### Adding Sidebar Items

Edit the `NAV_ITEMS` array in `src/components/layout/DashboardSidebar.tsx`:

```typescript
const NAV_ITEMS = [
  // ... existing items
  {
    key: "yourPage" as const,
    href: "/your-page",
    icon: <YourIcon />,
  },
];
```

Then add the corresponding translation key in all locale files under `nav.yourPage`.

## Code Editor

The code editor (CodeMirror 6) is configured in `src/components/editor/CodeEditor.tsx`.

### Adding Language Support

1. Install the CodeMirror language package:
   ```bash
   npm install @codemirror/lang-python
   ```

2. Add it to the `getLanguageExtension` function:
   ```typescript
   import { python } from "@codemirror/lang-python";

   function getLanguageExtension(lang: CodeLanguage) {
     switch (lang) {
       case "python": return python();
       // ... existing cases
     }
   }
   ```

3. Update the `CodeLanguage` type:
   ```typescript
   export type CodeLanguage = "rust" | "typescript" | "javascript" | "json" | "python" | "text";
   ```

### Editor Themes

The editor supports light and dark themes:
- Light: Custom minimal theme
- Dark: One Dark theme from `@codemirror/theme-one-dark`

To customize, edit the `lightTheme` object in `CodeEditor.tsx`.
