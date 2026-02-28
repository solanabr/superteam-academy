# ADR 0005: Cookie-Based i18n Without URL Prefixes

**Date:** 2026-02-12
**Status:** Accepted

## Context

The bounty requires internationalization from day one with three locales: Portuguese (PT-BR), Spanish (ES), and English (EN). All UI strings must be externalized with a language switcher in the header and settings.

Common i18n strategies for Next.js:

1. **URL prefix** (`/en/courses`, `/pt-BR/courses`) — locale in path
2. **Subdomain** (`en.academy.superteam.fun`) — locale in hostname
3. **Cookie/header** — locale stored client-side, no URL change

## Decision

Use **next-intl** with **cookie-based locale resolution** and no URL prefixes.

### Implementation

- **484 translation keys** per locale across `en.json`, `pt-BR.json`, `es.json`
- Locale stored in a `locale` cookie with 1-year TTL
- Server-side resolution via `next-intl/server` `getRequestConfig()`
- `NextIntlClientProvider` wraps the app in the root layout
- Language switcher in header (globe icon dropdown with flag icons)
- Language preference also editable in Settings > Preferences tab
- Server action `setLocale()` writes the cookie and triggers `router.refresh()`
- ICU MessageFormat for plurals (e.g., `"{count, plural, one {# course} other {# courses}}"`)

### Translation Coverage

All strings are externalized, including:

- Navigation, buttons, labels, placeholders
- Error messages (9 route-specific error pages)
- Empty states, tooltips, achievement names/descriptions
- Gamification text (quests, streaks, levels, XP)
- Course metadata (difficulty labels, track names)

## Consequences

### Positive

- **Clean URLs**: `/courses/solana-101` is the same URL regardless of locale. No duplicate content concerns for SEO. No need for `hreflang` alternate links.
- **Simple sharing**: Shared links work for all users. The recipient sees the page in their preferred language, not the sharer's.
- **No route duplication**: Every `page.tsx`, `loading.tsx`, and `error.tsx` exists once. No `[locale]/` segment in the route tree.
- **Server-side rendering**: `getTranslations()` from `next-intl/server` resolves translations at render time. No flash of untranslated content.
- **Automated testing**: An i18n completeness test (`i18n-completeness.test.ts`) verifies all 3 locale files have identical key sets — no missing translations.

### Negative

- **Not crawlable per-locale**: Search engines see one URL per page. If locale-specific SEO becomes important, URL prefixes would be needed. For an LMS targeting a known audience (Solana developers), this is acceptable.
- **Cookie dependency**: First-time visitors get the default locale (EN) until they switch. Browser `Accept-Language` header detection is not implemented but could be added to `getRequestConfig()`.
- **No locale in SSG**: `generateStaticParams` cannot pre-render per-locale variants. Pages are rendered with the requesting user's cookie. ISR caches one variant per locale per path (handled automatically by Next.js full-route cache keying on cookies).

### Alternatives Considered

- **URL prefix routing** (`/[locale]/...`): next-intl supports this natively. Would improve per-locale SEO but doubles the route tree complexity and breaks simple link sharing. Overkill for an LMS with a known, multilingual user base.
- **Subdomain routing**: Requires DNS configuration per locale. Adds deployment complexity without benefit for a single-domain application.
- **react-i18next**: More widely used, but next-intl's server component integration is superior for App Router. `react-i18next` requires client-side initialization and doesn't support `getTranslations()` in server components.
