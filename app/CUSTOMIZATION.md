# Customization Guide

## Design System

The design is built on Tailwind CSS v4 and Shadcn/UI.

### Colors

Colors are defined in `src/app/globals.css` using CSS variables.

- `--primary`: Main brand color (Solana Purple `#9945FF`).
- `--secondary`: Success/Accent color (Green `#14F195`).
- `--background`: Deep dark background (`#0A0A0F`).

To change the theme, edit the `:root` variables in `globals.css`.

### Components

UI components reside in `src/components/ui`. They are built with Radix Primitives.

- **Buttons**: Edit `button.tsx` variants (`cyber`, `default`, `ghost`).
- **Cards**: Edit `card.tsx` for border styles and glassmorphism effects.

## Gamification

XP logic is central to `src/context/GamificationContext.tsx`.

- Modify `addXP` logic to change leveling curves.
- Edit `XPDisplay.tsx` to change the animation execution.

## Adding New Languages

1. Edit `src/i18n/routing.ts` to add the locale code (e.g., `'fr'`).
2. Create `messages/fr.json` with translations.
3. Update `src/components/layout/Navbar.tsx` to include the language in the dropdown.
