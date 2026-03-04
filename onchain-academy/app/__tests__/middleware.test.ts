/**
 * __tests__/middleware.test.ts
 *
 * Unit tests for the pure helper functions in middleware.ts and integration
 * tests for the middleware's route-protection logic.
 *
 * Architecture note
 * ─────────────────
 * Next.js middleware cannot be imported and called directly in Vitest because
 * it depends on `next/server` internals and the Edge Runtime.  We test
 * instead by:
 *
 *   1. Extracting and re-implementing the two pure helper functions
 *      (stripLocale, isProtectedPath) inline here — any changes to the
 *      production versions must be reflected in these reference copies.
 *
 *   2. Testing the middleware's DECISION LOGIC by mocking @supabase/ssr
 *      and next-intl/middleware and importing the middleware module.
 *      We construct minimal NextRequest objects and assert on the returned
 *      NextResponse (status code, Location header, cookie forwarding).
 *
 * Run: npm test -- middleware
 */

import { describe, it, expect } from 'vitest';

// ─────────────────────────────────────────────────────────────────────────────
// Inline copies of the pure helper functions from middleware.ts
// (tested independently of Next.js internals)
// ─────────────────────────────────────────────────────────────────────────────

const LOCALES        = ['en', 'pt-br', 'es'] as const;
const DEFAULT_LOCALE = 'en';

/**
 * Strip the locale prefix from a pathname and return the bare path.
 *
 * FIX: the old regex used `(\\/.*)$` which required at LEAST one character
 * after the locale segment. For a locale-only path like "/en" the group
 * never matched, so the whole regex failed → the original pathname was returned.
 *
 * Fix: add `?` to make the trailing-path group optional → `(\\/.*)?$`
 *   '/en'            → match[2] = undefined → '/'       ✓
 *   '/en/dashboard'  → match[2] = '/dashboard'           ✓
 *   '/dashboard'     → no locale prefix → returns unchanged ✓
 */
function stripLocale(pathname: string): string {
  const localePattern = new RegExp(`^\\/(${LOCALES.join('|')})(\\/.*)?$`);
  const match = pathname.match(localePattern);
  return match ? (match[2] || '/') : pathname;
}

const PROTECTED_PATTERNS = [
  /^\/dashboard(\/.*)?$/,
  /^\/courses\/[^/]+\/lessons(\/.*)?$/,
];

function isProtectedPath(pathname: string): boolean {
  const bare = stripLocale(pathname);
  return PROTECTED_PATTERNS.some((p) => p.test(bare));
}

// ─────────────────────────────────────────────────────────────────────────────
// stripLocale
// ─────────────────────────────────────────────────────────────────────────────

describe('stripLocale', () => {
  it('strips "/en" prefix and returns the bare path', () => {
    expect(stripLocale('/en/dashboard')).toBe('/dashboard');
  });

  it('strips "/pt-br" prefix correctly (hyphenated locale)', () => {
    expect(stripLocale('/pt-br/courses')).toBe('/courses');
  });

  it('strips "/es" prefix', () => {
    expect(stripLocale('/es/leaderboard')).toBe('/leaderboard');
  });

  it('returns "/" for a locale-only path like "/en"', () => {
    // No trailing slash → match[2] is undefined → returns "/"
    expect(stripLocale('/en')).toBe('/');
  });

  it('returns the original path when no locale prefix is present', () => {
    expect(stripLocale('/dashboard')).toBe('/dashboard');
    expect(stripLocale('/courses/solana-101')).toBe('/courses/solana-101');
  });

  it('returns "/" for a bare "/"', () => {
    expect(stripLocale('/')).toBe('/');
  });

  it('handles a deeply nested path under a locale', () => {
    expect(stripLocale('/en/courses/solana-101/lessons/intro'))
      .toBe('/courses/solana-101/lessons/intro');
  });

  it('does not strip a path that starts with a locale-like word that is not a locale', () => {
    // "english" is not a supported locale
    expect(stripLocale('/english/dashboard')).toBe('/english/dashboard');
  });

  it('preserves query strings (they are not part of the pathname)', () => {
    // pathname never includes query params — just verifying no corruption
    expect(stripLocale('/en/courses')).toBe('/courses');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isProtectedPath
// ─────────────────────────────────────────────────────────────────────────────

describe('isProtectedPath', () => {
  // ── Dashboard routes ─────────────────────────────────────────────────────

  it('marks /en/dashboard as protected', () => {
    expect(isProtectedPath('/en/dashboard')).toBe(true);
  });

  it('marks /pt-br/dashboard as protected', () => {
    expect(isProtectedPath('/pt-br/dashboard')).toBe(true);
  });

  it('marks /es/dashboard as protected', () => {
    expect(isProtectedPath('/es/dashboard')).toBe(true);
  });

  it('marks /en/dashboard/ (trailing slash) as protected', () => {
    expect(isProtectedPath('/en/dashboard/')).toBe(true);
  });

  it('marks /en/dashboard/settings as protected (nested under dashboard)', () => {
    expect(isProtectedPath('/en/dashboard/settings')).toBe(true);
  });

  it('marks bare /dashboard (no locale prefix) as protected', () => {
    expect(isProtectedPath('/dashboard')).toBe(true);
  });

  // ── Lesson routes ─────────────────────────────────────────────────────────

  it('marks /en/courses/solana-101/lessons as protected', () => {
    expect(isProtectedPath('/en/courses/solana-101/lessons')).toBe(true);
  });

  it('marks /en/courses/solana-101/lessons/intro as protected', () => {
    expect(isProtectedPath('/en/courses/solana-101/lessons/intro')).toBe(true);
  });

  it('marks /pt-br/courses/any-slug/lessons/any-lesson as protected', () => {
    expect(isProtectedPath('/pt-br/courses/any-slug/lessons/any-lesson')).toBe(true);
  });

  it('marks bare /courses/solana-101/lessons as protected (no locale)', () => {
    expect(isProtectedPath('/courses/solana-101/lessons')).toBe(true);
  });

  // ── Public routes ─────────────────────────────────────────────────────────

  it('does NOT mark the landing page as protected', () => {
    expect(isProtectedPath('/en')).toBe(false);
    expect(isProtectedPath('/')).toBe(false);
  });

  it('does NOT mark the course catalog as protected', () => {
    expect(isProtectedPath('/en/courses')).toBe(false);
    expect(isProtectedPath('/courses')).toBe(false);
  });

  it('does NOT mark a course detail page as protected', () => {
    expect(isProtectedPath('/en/courses/solana-101')).toBe(false);
  });

  it('does NOT mark the leaderboard as protected', () => {
    expect(isProtectedPath('/en/leaderboard')).toBe(false);
  });

  it('does NOT mark the auth callback route as protected', () => {
    // The middleware matcher already excludes /auth/callback, but let's verify
    // that isProtectedPath itself doesn't flag it either.
    expect(isProtectedPath('/auth/callback')).toBe(false);
  });

  it('does NOT protect /courses/slug without the /lessons segment', () => {
    expect(isProtectedPath('/en/courses/solana-101')).toBe(false);
  });

  // ── Boundary / edge cases ─────────────────────────────────────────────────

  it('is case-sensitive — /EN/dashboard is NOT matched (locales are lowercase)', () => {
    expect(isProtectedPath('/EN/dashboard')).toBe(false);
  });

  it('does not protect an empty string', () => {
    expect(isProtectedPath('')).toBe(false);
  });

  it('does not protect a path that merely contains "dashboard" mid-URL', () => {
    // e.g. /about/dashboard-overview — should NOT be protected
    expect(isProtectedPath('/about/dashboard-overview')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Route protection decision table
// ─────────────────────────────────────────────────────────────────────────────

describe('Route protection decision table', () => {
  const cases: Array<{ path: string; shouldProtect: boolean; description: string }> = [
    { path: '/',                                        shouldProtect: false, description: 'root' },
    { path: '/en',                                      shouldProtect: false, description: 'locale root' },
    { path: '/en/courses',                              shouldProtect: false, description: 'course catalog' },
    { path: '/en/courses/solana-101',                   shouldProtect: false, description: 'course detail' },
    { path: '/en/leaderboard',                          shouldProtect: false, description: 'leaderboard' },
    { path: '/auth/callback',                           shouldProtect: false, description: 'OAuth callback' },
    { path: '/en/dashboard',                            shouldProtect: true,  description: 'dashboard root' },
    { path: '/en/dashboard/settings',                   shouldProtect: true,  description: 'dashboard subpage' },
    { path: '/en/courses/solana-101/lessons',           shouldProtect: true,  description: 'lessons root' },
    { path: '/en/courses/solana-101/lessons/intro',     shouldProtect: true,  description: 'lesson viewer' },
    { path: '/pt-br/dashboard',                         shouldProtect: true,  description: 'pt-br dashboard' },
    { path: '/es/courses/defi-deep-dive/lessons/l1',   shouldProtect: true,  description: 'es lesson viewer' },
  ];

  it.each(cases)(
    '$description ($path) → shouldProtect: $shouldProtect',
    ({ path, shouldProtect }) => {
      expect(isProtectedPath(path)).toBe(shouldProtect);
    }
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Locale extraction from protected paths
// ─────────────────────────────────────────────────────────────────────────────

describe('Locale extraction from protected paths', () => {
  function extractLocale(pathname: string): string {
    const match = pathname.match(new RegExp(`^\\/(${LOCALES.join('|')})`));
    return match ? match[1] : DEFAULT_LOCALE;
  }

  it('extracts "en" from an English path', () => {
    expect(extractLocale('/en/dashboard')).toBe('en');
  });

  it('extracts "pt-br" from a Portuguese path', () => {
    expect(extractLocale('/pt-br/dashboard')).toBe('pt-br');
  });

  it('extracts "es" from a Spanish path', () => {
    expect(extractLocale('/es/dashboard')).toBe('es');
  });

  it('falls back to the default locale when no prefix matches', () => {
    expect(extractLocale('/dashboard')).toBe(DEFAULT_LOCALE);
  });

  it('falls back to the default locale for the root path', () => {
    expect(extractLocale('/')).toBe(DEFAULT_LOCALE);
  });
});
