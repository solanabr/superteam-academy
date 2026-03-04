# Customization Guide

## Design Tokens
Primary visual tokens live in:
- `app/src/app/globals.css`

Core groups:
- Brand colors (`--solana-*`, `--brand-*`)
- Surface/border/text tokens
- Motion/accessibility tokens

To reskin the app quickly:
1. Update color variables in `:root`
2. Validate contrast in dark/light themes
3. Re-run `npm run lint` and visual checks

## Theme Behavior
- Theme toggle supports dark/light/system.
- Root semantic variables drive shadcn-compatible aliases.
- Keep `--text-muted` and interactive states WCAG-aware.

## Typography
- Font stacks are local/system-first (no runtime Google fetch dependency).
- Update `--font-geist-sans` and `--font-geist-mono` as needed.

## i18n Customization
Files:
- `app/messages/en.json`
- `app/messages/pt-BR.json`
- `app/messages/es.json`
- routing config: `app/src/i18n/routing.ts`

Add a new locale:
1. Create `messages/<locale>.json`
2. Add locale in routing config
3. Ensure switcher/options include locale
4. Run locale smoke/audit scripts

## Content Customization
- Local lesson packs: `app/src/content/...`
- Sanity schema fields: `course`, `lesson`, optional `videoUrl`
- Seed pipeline: `npm run cms:seed`

## Gamification Customization
- XP and stub progress helpers: `app/src/lib/stubStorage.ts`
- Achievement logic/hooks: `app/src/hooks/useAchievements.ts`
- On-chain + demo mode controlled via signing mode and env readiness

## Analytics/Observability Customization
- GA4 and Clarity IDs set via env
- Sentry DSN + env/release tags via env
- Diagnostics route + env audit script available for readiness checks

## Safe Extension Patterns
- Prefer additive service interfaces over route-level rewrites
- Keep on-chain and stub paths behind clear abstractions
- Do not hardcode provider IDs/secrets in code
- Document any new env in `app/.env.example`
