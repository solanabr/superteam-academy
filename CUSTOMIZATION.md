# Customization Guide

## Theme
Edit `app/globals.css` to change colors. The primary green is `--primary: 142 76% 36%`.

## Adding a Language
1. Add locale to `app/i18n/config.ts`
2. Create `app/locales/[locale].json`
3. Add to middleware matcher

## Adding Gamification
XP rewards are configured per lesson in Sanity CMS or in `lib/services/stubs.ts`.
Level formula: `Math.floor(Math.sqrt(xp / 100))`

## Extending the AI Mentor
Edit `app/api/ai-mentor/route.ts` to change the prompt or model.