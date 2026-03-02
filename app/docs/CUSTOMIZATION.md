# Customization Guide

## Theme

Edit `tailwind.config.ts` to customize colors:

```typescript
superteam: {
  purple: "#9945FF",   // Primary brand
  green: "#14F195",    // XP / success
  blue: "#00D1FF",     // Secondary accent
  pink: "#F087FF",     // Highlight
  orange: "#FFA726",   // Streak / warning
  dark: "#0D0D0D",     // Background
  darker: "#080808",   // Deep background
}
```

CSS variables in `globals.css` control the shadcn/ui theme (background, foreground, primary, etc.).

## Adding a New Page

1. Create `src/app/[locale]/your-page/page.tsx`
2. Add translations to `messages/{en,pt-BR,es}.json`
3. Add navigation link in `components/layout/header.tsx`
4. Add search entry in `components/layout/command-search.tsx`

## Adding a New Language

1. Add locale code to `src/i18n/routing.ts` locales array
2. Create `messages/xx.json` with all translation keys
3. Update `middleware.ts` if needed

## Service Layer

To replace stubs with real implementations:

1. Set `NEXT_PUBLIC_USE_STUBS=false`
2. Implement the on-chain service classes in `lib/services/`
3. Ensure all environment variables are configured

## Wallet Adapters

Edit `components/providers/wallet-provider.tsx` to add/remove wallet adapters.

## CMS Content

See `docs/CMS_GUIDE.md` for creating courses and lessons in Sanity.

## Analytics

Set environment variables to enable:
- PostHog: `NEXT_PUBLIC_POSTHOG_KEY`
- GA4: `NEXT_PUBLIC_GA4_MEASUREMENT_ID`
- Sentry: `NEXT_PUBLIC_SENTRY_DSN`
