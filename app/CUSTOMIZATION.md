# Customization Guide

This guide details how to customize the visual appearance of the Superteam Brazil Academy platform, including themes, colors, typography, and specific components.

## 1. Theming System

The LMS uses a robust CSS variables-based theming system integrated with Tailwind CSS. All base colors are defined as HSL values in `src/app/globals.css`.

The default theme includes two variations: Light and Dark. The `ThemeProvider` handles switching between these modes.

### Modifying Colors
To change the primary color scheme, edit the following CSS variables in `globals.css`:

```css
:root {
  /* ... */
  --primary: 263 90% 67%; /* Soft Purple */
  --secondary: 162 100% 47%; /* Vibrant Green */
  /* ... */
}
```

- `--background`: Base page background color
- `--foreground`: Default text color
- `--card`: Background color for cards (`.glass`) and panels
- `--border`: Color for borders and dividers
- `--muted`: Background for muted elements
- `--muted-foreground`: Text color for muted elements

### Changing to a Different Brand Color
To apply a new primary brand color (e.g., Superteam Blue `214 100% 50%`), simply update the `--primary` variable for both `:root` and `.dark` selectors. The Tailwind configuration will automatically apply this new color to all utility classes like `text-primary`, `bg-primary`, and `border-primary`.

## 2. Typography

The platform uses empty Google Fonts by default for modern typography:
- **Body Font:** Inter
- **Heading Font:** Outfit (Configured in `tailwind.config.ts`)
- **Monospace Font:** JetBrains Mono (For code editors)

To change these fonts:
1. Update the import links in `src/app/layout.tsx`.
2. Modify the `fontFamily` definitions in `tailwind.config.ts`.
3. If changing the code editor font, update the `fontFamily` option in the `MonacoEditor` component inside `LessonPage`.

## 3. UI Components (Glassmorphism)

Many components use a distinctive "glassmorphism" style. This is centrally managed by the `.glass` utility class in `globals.css`.

```css
.glass {
  background: hsl(var(--card) / 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid hsl(var(--border));
}
```

To remove or alter this effect globally, simply adjust the `.glass` class. For example, to make cards solid:
```css
.glass {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
}
```

## 4. Icons

The project uses `lucide-react` for iconography. To change icons:
1. Browse the [Lucide Icons](https://lucide.dev/icons) gallery.
2. Import the desired icon component in your React file.
3. Replace the existing icon, keeping the size and color classes (e.g., `<NewIcon className="w-5 h-5 text-primary" />`).

## 5. Adding New Locales

The application supports internationalization using `next-intl`. The default locales are `en` (English), `pt-BR` (Brazilian Portuguese), and `es` (Spanish).

To add a new language (e.g., French `fr`):
1. **Create Messages File:** Add a new JSON file `fr.json` in the `messages/` directory and populate it with translations mirroring the structure of `en.json`.
2. **Update Support:** Add the new locale code to the `locales` array (if explicitly defined in your `i18n` setup or `LocaleSwitcher` component).
3. **Locale Switcher:** Add an entry for French in the `LocaleSwitcher.tsx` component's `LOCALES` array.

```typescript
const LOCALES = [
    { code: "pt-BR", label: "PT", flag: "🇧🇷", name: "Português" },
    { code: "en", label: "EN", flag: "🇺🇸", name: "English" },
    { code: "es", label: "ES", flag: "🇪🇸", name: "Español" },
    { code: "fr", label: "FR", flag: "🇫🇷", name: "Français" }, // New addition
];
```

## 6. Adjusting Game Elements

### XP Values
The default XP awarded for completing a lesson is defined in the `Course` interface and mock data within `src/lib/courses.ts` via the `xpPerLesson` property.

### Levels
Leveling logic is encapsulated in `src/hooks/useXP.ts`. The progression curve can be modified by altering the `LEVEL_THRESHOLDS` array.

```typescript
const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500];
```
Add more levels by extending this array, or adjust the necessary XP by modifying the existing values.
