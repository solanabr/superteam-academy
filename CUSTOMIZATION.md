# Customization

## Theme Customization

Primary design tokens live in:

- `app/globals.css`
- `tailwind.config.ts`

Update color tokens in `:root` and `.dark`.

Reusable UI utility classes are defined in `app/globals.css`:

- `.panel`
- `.panel-soft`
- `.btn-primary`
- `.btn-secondary`
- `.chip`
- `.input-field`

## Add a New Language

1. Extend `Locale` in `lib/types.ts`.
2. Add dictionary entries in `lib/i18n/messages.ts`.
3. Add language option in `components/i18n/language-switcher.tsx`.
4. Verify there are no hardcoded UI strings left in routes/components.

Recommended checks:

```bash
npm run lint
npm run typecheck
```

## Extend Gamification

Main extension points:

- `lib/services/learning-progress-service.ts` for API contract evolution
- `lib/services/local-learning-progress-service.ts` for local behavior
- `lib/services/hybrid-learning-progress-service.ts` for read integration behavior
- feature surfaces:
  - `components/dashboard/dashboard-client.tsx`
  - `components/leaderboard/leaderboard-client.tsx`
  - `components/profile/profile-client.tsx`

Examples:

- daily quests
- seasonal events
- streak freeze
- course-specific ranking buckets

## Replace Stub with Real On-chain Adapter

1. Create `lib/services/onchain-learning-progress-service.ts`.
2. Implement `LearningProgressService`.
3. Export it from `lib/services/index.ts`.
4. Keep the interface stable so routes/components do not change.
