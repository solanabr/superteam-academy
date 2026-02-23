# Frontend Design Guidelines

Last updated: February 23, 2026

## 1. Design Intent

Deliver a developer-first LMS experience: high clarity, high trust, fast feedback loops, and strong progress motivation.

## 2. Visual System Direction

## 2.1 Theme priority

- Dark mode is primary experience (bounty expectation).
- Light mode still supported and polished.
- Keep current token architecture in `app/app/globals.css`, but tune hierarchy for dark-first contrast.

## 2.2 Brand and color behavior

- Keep Superteam identity colors as semantic tokens.
- Use one dominant action color per view.
- Reserve accent color for progress and achievement signaling.
- Avoid noisy gradients in data-dense screens.

## 2.3 Typography behavior

- Maintain readable scale and compact density for developer workflows.
- Use mono styling for addresses, tx signatures, and IDs.
- Keep headings action-oriented and short.

## 3. Layout and Interaction Rules

## 3.1 Shell

- Left navigation + top utility bar.
- Persistent context actions: wallet state, network, profile/settings.
- Keep primary CTA visible above fold on task pages.

## 3.2 Page composition

- Start with summary strip (progress + status) then detail blocks.
- Prefer cards/sections with explicit titles.
- Maintain predictable spacing rhythm.

## 3.3 Responsive behavior

- Mobile first with intentional rearrangement, not simple shrink.
- Sidebar becomes drawer.
- Complex tables gain mobile card alternative.

## 4. Component Behavior Standards

Core shared components required across app pages:
- `PageHeader`
- `EmptyState`
- `ProgressBar`
- `XpBadge`
- `WalletGuard`

Transaction UX rules:
- clear idle/pending/success/error states
- disable duplicate submissions while pending
- show tx signature link after success
- show concise actionable errors

## 5. Learning Experience Design

## 5.1 Courses list

- quick scanning: difficulty, duration, XP, completion
- visible filter and search controls
- clear enrolled/resume states

## 5.2 Course detail

- module/lesson hierarchy should be easy to parse
- prerequisite state should be explicit
- enrollment/continue CTA should be unambiguous

## 5.3 Lesson/challenge screen

- split editor/content layout with draggable divider
- challenge objective + test states always visible
- feedback should feel immediate and deterministic

## 5.4 Dashboard

- prioritize “continue learning”
- show XP/level progression prominently
- streak and achievements should motivate without clutter

## 6. Accessibility and Internationalization

- keyboard navigable controls and clear focus styles
- minimum touch target sizing
- high contrast in both dark and light themes
- text expansion resilience for PT/ES/EN translations

## 7. Performance and Motion

- motion should communicate state change, not decorate
- keep transitions short and meaningful
- use lazy loading for heavy editor/content modules
- avoid layout shift when loading async data

## 8. Design QA Checklist

Before merge:
- dark mode experience reviewed first
- loading/empty/error states implemented
- mobile and desktop screenshots reviewed
- key user tasks executable without confusion
- no visual regressions in wallet and tx components
