# Customization — Superteam Academy

How to customize theme, languages, and gamification.

---

## Theme

- **Design tokens**: Edit `app/src/app/globals.css`. Variables under `:root` and `.light` control colors (background, foreground, primary, muted, border, radius).
- **Dark mode**: Default theme is dark; toggle via ThemeSwitcher (next-themes). Class `dark` on `html` uses `:root` variables; `light` uses `.light`.
- **Tailwind**: `tailwind.config.ts` maps tokens to utilities (`bg-background`, `text-primary`, etc.). Change tokens or add new utilities as needed.

---

## Adding a language

1. **Messages**: Add `app/messages/<locale>.json` with the same keys as `en.json` (e.g. `fr.json`).
2. **Routing**: In `app/src/i18n/routing.ts`, add the locale to `locales` (e.g. `'fr'`).
3. **Language switcher**: In `app/src/components/layout/language-switcher.tsx`, add `{ value: 'fr', label: 'FR' }` to `LOCALES`.
4. **Middleware**: Matcher in `app/src/middleware.ts` already uses routing; ensure the new locale is included if you use a strict matcher.

---

## Gamification

- **XP / level**: Level is derived as `floor(sqrt(xp / 100))`. To change formula, update `levelFromXP` in `app/src/lib/utils.ts` and any duplicate logic.
- **Stub rewards**: In `stub-learning-progress.ts`, lesson XP and streak logic are local; adjust numbers or rules there. On-chain rewards are configured in the program (see SPEC.md).
- **Achievements**: Stubbed; 256 slots supported on-chain via bitmap. Add achievement definitions in a config or CMS and map indices to badges in the UI.
- **Streaks**: Stub uses `lastActivityDate` and consecutive-day logic. On-chain uses UTC day boundaries; keep consistent when connecting backend.

---

## Extending the service

To replace the stub with a real implementation:

1. Implement `LearningProgressService` (see `app/src/lib/learning-progress-service.ts`).
2. Use RPC/Helius for XP balance and token accounts; Photon/DAS for credentials; your API or indexer for leaderboard.
3. Inject the implementation (e.g. React context or module default) so all pages use it instead of `createStubLearningProgressService()`.
