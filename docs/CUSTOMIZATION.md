# Customization Guide

This project is designed to be easily customizable, specifically regarding the visual theme (colors, borders, backgrounds) and internationalization (i18n).

## 🎨 Theme Customization

The project uses a unified theme system built on Tailwind CSS v4 variables. All primary aesthetic values are defined in `src/app/[locale]/globals.css`.

### Changing Colors

To modify the theme colors, you need to update the CSS variables in the `:root` and `.dark` blocks inside `globals.css`:

```css
/* src/app/[locale]/globals.css */

:root {
   /* 1. Base Structure */
   --color-sol-bg: #f7eacb;       /* Main background */
   --color-sol-surface: #fffdf4;  /* Slightly lifted elements like sidebars */
   --color-sol-card: #ffffff;     /* Cards and containers */
   
   /* 2. Text and Borders */
   --color-sol-text: #1b231d;     /* Primary text */
   --color-sol-subtle: #3a4a3e;   /* Secondary text */
   --color-sol-muted: #a89b72;    /* Muted/disabled text */
   --color-sol-border: #e6d9b0;   /* Borders and dividers */

   /* 3. Brand Colors */
   --color-sol-green: #008c4c;    /* Primary brand color (buttons, links) */
   --color-sol-green-dk: #006e3a; /* Darker variant for hover states */
   --color-sol-forest: #2f6b3f;   /* Accent color */
   --color-sol-yellow: #ffd23f;   /* Secondary/accent brand color */
   --color-sol-yellow-dk: #e6b800;/* Darker secondary variant */
}
```

If you add new custom tokens, you must also expose them to Tailwind inside the `@theme inline` block further down the file:

```css
@theme inline {
   /* ... existing tokens ... */
   --color-my-custom-color: var(--color-my-custom-color);
}
```

This allows you to use your new color as a Tailwind class, e.g., `text-my-custom-color` or `bg-my-custom-color`.

## 🌍 Adding Languages (i18n)

This application uses `next-intl` for App Router internationalization. The default supported languages are English (`en`), Spanish (`es`), and Portuguese (`pt`).

To add a new language (e.g., French `fr`), follow these simple steps:

### 1. Create a Messages File

Create a new JSON file for the language in the `messages/` folder at the root of the project:

```bash
touch messages/fr.json
```

Add your translations to this file, following the structure of the existing `en.json`.

```json
{
  "HomePage": {
    "title": "Titre",
    "description": "Description en français"
  }
}
```

### 2. Update the Routing Configuration

Update the `routing` configuration to include the new locale. Open `src/i18n/routing.ts` and add your locale identifier to the `locales` array:

```typescript
// src/i18n/routing.ts
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
   // Add your new locale here
   locales: ['en', 'es', 'pt', 'fr'],
   defaultLocale: 'en',
   localePrefix: {
      mode: 'as-needed'
   },
   // ... rest of config
});
```

### 3. Usage inside Components

Once configured, you can use the translations in any Server or Client Component using the `useTranslations` hook:

```tsx
import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('HomePage');
  return <h1>{t('title')}</h1>;
}
```

The app will automatically route users based on their browser language or the language prefix in the URL (e.g., `/fr/courses`).
