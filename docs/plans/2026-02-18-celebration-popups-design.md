# Celebration Popups — Design

**Date:** 2026-02-18
**Approach:** Option A — Extend existing event-driven popup pattern
**Scope:** 4 files modified, 2 new files

## Problem

When a learner unlocks an achievement or earns a certificate, the only feedback is a silent `trackEvent` call. The design system defines a `popup` pattern (pill-shaped, bouncy `pop` animation, 3D push shadow) that should be used for these moments. Both popups must be clickable and navigate to the relevant page.

## Files

| File                                                                                 | Change                                                                                                                                   |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/components/gamification/achievement-popup.tsx`                         | **New** — `AchievementPopup` component + `dispatchAchievementUnlock()` helper                                                            |
| `apps/web/src/components/gamification/certificate-popup.tsx`                         | **New** — `CertificatePopup` component + `dispatchCertificateMinted()` helper                                                            |
| `apps/web/src/components/gamification/gamification-overlays.tsx`                     | Mount both new components                                                                                                                |
| `apps/web/src/app/[locale]/(platform)/courses/[slug]/lessons/[id]/lesson-client.tsx` | Call dispatch helpers after API response; add `credentialMinted` boolean and `certificateId` field to the `CompletionResponse` interface |
| `apps/web/src/app/api/lessons/complete/route.ts`                                     | Change certificate insert to `.select("id").single()` and include `certificateId` in the JSON response                                   |

## Visual Design

Both components use the design system `popup` spec:

- **Shape:** `rounded-full px-6 py-3` (pill)
- **Font:** `font-display font-black text-[17px]` (Nunito 900)
- **Animation:** `animate-pop` — uses the existing `pop` keyframe in `tailwind.config.ts` (`cubic-bezier(0.34, 1.56, 0.64, 1)`)
- **Shadow:** `shadow-push` (3D push effect)
- **Position:** `fixed bottom-20 left-6 z-50` — same anchor column as `XpPopup`
- **Pointer events:** `pointer-events-auto cursor-pointer` (unlike `XpPopup` which is pointer-events-none)

### Achievement popup — `popup.badge` variant

- Background: `bg-primary`, text: `text-white`
- Dark shadow: `dark:shadow-[0_4px_0_0_rgba(0,0,0,0.4)]`
- Content: `🏆 {achievementName}`
- Auto-dismiss: 4 000 ms
- Multiple achievements stack vertically (one pill per achievement, `space-y-2`)

### Certificate popup — `popup.done` variant

- Background: `bg-success`, text: `text-white`
- Dark shadow: `dark:shadow-[0_4px_0_0_rgba(0,0,0,0.4)]`
- Content: `🎓 Certificate Earned!`
- Auto-dismiss: 5 000 ms

## Event Bus

Same `window.dispatchEvent` pattern as `XpPopup` and `LevelUpOverlay`.

```ts
// achievement-popup.tsx
dispatchAchievementUnlock(id: string, name: string): void
// fires: CustomEvent<{ id: string; name: string }> on "superteam:achievement-unlock"

// certificate-popup.tsx
dispatchCertificateMinted(courseTitle: string, certificateId: string): void
// fires: CustomEvent<{ courseTitle: string; certificateId: string }> on "superteam:certificate-minted"
```

## Navigation

Both popups use `useRouter().push()` + `useParams()` to derive the locale.

| Popup       | Destination                              |
| ----------- | ---------------------------------------- |
| Achievement | `/{locale}/profile#achievements`         |
| Certificate | `/{locale}/certificates/{certificateId}` |

Clicking immediately dismisses the popup (clears the event from state before the auto-dismiss timer fires).

## API Change

In `apps/web/src/app/api/lessons/complete/route.ts`:

- Change: `.insert({...})` → `.insert({...}).select("id").single()`
- Add `certificateId: string` to the JSON response (only set when `credentialMinted === true`)

In `lesson-client.tsx`:

- Add `certificateId?: string` to `CompletionResponse` interface
- After API returns: call `dispatchAchievementUnlock(a.id, a.name)` for each new achievement, call `dispatchCertificateMinted(courseTitle, certificateId)` when `credentialMinted && certificateId`

## Design Rules Applied

- No raw hex — all via Tailwind tokens
- `animate-pop` keyframe already in `tailwind.config.ts` (no new CSS needed)
- `shadow-push` with `dark:` override for dark mode push color
- Stacking handled by `flex-col` container, same pattern as `XpPopup` multi-event array
- `aria-live="polite"` on the container for screen readers
