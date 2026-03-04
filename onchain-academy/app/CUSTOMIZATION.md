# Customization Guide

## Theme

- Base design tokens live in `src/app/globals.css`.
- Update `--brand`, `--background`, and `--foreground` to rebrand.
- Keep contrast accessible for dark-mode-first usage.

## Add New Language

1. Add locale code to `src/i18n/routing.ts`.
2. Add a translation file in `src/messages/<locale>.json`.
3. Ensure the locale switcher label is added in `SiteHeader`.

## Extend Gamification

- Keep new reward sources behind `LearningProgressService`.
- For on-chain rollout, replace local implementations in `src/services` with Anchor-backed calls.
- Use `trackEvent` for new analytics events to maintain funnel observability.
