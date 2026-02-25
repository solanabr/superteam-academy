# Lighthouse Scores

Scores recorded using Lighthouse 13.0.3 (Chrome DevTools).

## Desktop

| Page | Performance | Accessibility | Best Practices | SEO |
|------|-------------|---------------|----------------|-----|
| Landing (`/en`) | 99 | 95 | 96 | 92 |
| Landing (`/en`) — mobile | 88 | 95 | 96 | 92 |
| Course Catalog (`/en/courses`) | — | — | — | — |
| Dashboard (`/en/dashboard`) | — | — | — | — |
| Lesson View (`/en/courses/[slug]/lessons/[id]`) | — | — | — | — |

> Rows marked `—` require manual Lighthouse runs (dashboard needs auth, lesson view needs a valid course/lesson route).

## How to Run

```bash
# Landing page (no auth required)
npx lighthouse https://superteam-academy.vercel.app/en \
  --only-categories=performance,accessibility,best-practices,seo \
  --output=json --output-path=./lighthouse-landing.json

# Course catalog (no auth required)
npx lighthouse https://superteam-academy.vercel.app/en/courses \
  --only-categories=performance,accessibility,best-practices,seo \
  --output=json --output-path=./lighthouse-courses.json

# Dashboard (requires auth — use Chrome DevTools Lighthouse tab with active session)
# Lesson view (requires valid route — use Chrome DevTools Lighthouse tab)
```

## Accessibility Fixes Applied

- **Color contrast**: Bumped `--c-text-muted` from `#71717A` to `#8B8B96` in dark mode (4.07:1 → 5.74:1 on `#09090B`)
- **HTML lang**: Server-rendered via `getLocale()` instead of client-side script injection
- **ARIA labels**: Added to `VoteButton`, `ReplyForm` textarea
- **SEO metadata**: All page titles/descriptions translated for `es` and `pt-br` locales
- **hreflang alternates**: Present on all public pages with canonical URLs using actual locale

## WCAG AA Contrast Audit (Dark Mode)

| Token | Hex | Background | Ratio | Status |
|-------|-----|------------|-------|--------|
| `--c-text` | `#FFFFFF` | `#09090B` | 19.8:1 | Pass |
| `--c-text-body` | `#D4D4D8` | `#09090B` | 13.3:1 | Pass |
| `--c-text-2` | `#ABABBA` | `#09090B` | 8.9:1 | Pass |
| `--c-text-muted` | `#8B8B96` | `#09090B` | 5.7:1 | Pass |
| `--c-text-muted` | `#8B8B96` | `#18181B` | 5.1:1 | Pass |
| Badge beginner | `#55E9AB` on `#55E9AB/10` | ~`#0E1E16` | >7:1 | Pass |
| Badge intermediate | `#FFC526` on `#FFC526/10` | ~`#1A1507` | >7:1 | Pass |
| Badge advanced | `#EF4444` on `#EF4444/10` | ~`#1A0B0B` | >7:1 | Pass |
