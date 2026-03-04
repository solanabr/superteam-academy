'use client';

import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePathname } from 'next/navigation';

// Must match middleware.ts and i18n.ts exactly
const LOCALES = ['en', 'pt-br', 'es'] as const;
type SupportedLocale = typeof LOCALES[number];

const LANGUAGES: { code: SupportedLocale; name: string; flag: string }[] = [
  { code: 'en',    name: 'English',   flag: '🇺🇸' },
  { code: 'pt-br', name: 'Português', flag: '🇧🇷' },
  { code: 'es',    name: 'Español',   flag: '🇪🇸' },
];

// ── Read current locale from the URL (the only source of truth) ───────────────
// With localePrefix:'always', the URL is /{locale}/rest-of-path.
// We never read from Zustand or any other store — they go stale.
function getLocaleFromPath(pathname: string): SupportedLocale {
  const segment = pathname.split('/')[1] ?? '';
  return (LOCALES as readonly string[]).includes(segment)
    ? (segment as SupportedLocale)
    : 'en';
}

// ── Write NEXT_LOCALE cookie ──────────────────────────────────────────────────
// The middleware reads this cookie as a fallback when there's no locale in the URL.
// httpOnly:false so we can write it here from client JS.
function setLocaleCookie(locale: SupportedLocale): void {
  if (typeof document === 'undefined') return;
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `NEXT_LOCALE=${locale}; Max-Age=${oneYear}; Path=/; SameSite=Lax`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function LanguageSwitcher() {
  const pathname = usePathname(); // e.g. "/en/courses/solana-101"

  const currentLocale = getLocaleFromPath(pathname);
  const currentLang   = LANGUAGES.find((l) => l.code === currentLocale) ?? LANGUAGES[0];

  function switchLocale(newLocale: SupportedLocale): void {
    if (newLocale === currentLocale) return;

    // 1. Write cookie first — middleware will see it on the very next request
    setLocaleCookie(newLocale);

    // 2. Build new path by replacing the locale segment
    //    "/en/courses/solana-101" → "/pt-br/courses/solana-101"
    const segments = pathname.split('/');
    // segments: ['', 'en', 'courses', 'solana-101']
    if ((LOCALES as readonly string[]).includes(segments[1] ?? '')) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale); // fallback: prepend
    }
    const newPath = segments.join('/') || `/${newLocale}`;

    // 3. Hard navigation — not router.push().
    //    router.push() is client-side: middleware never re-runs, next-intl never
    //    reloads its messages, page stays in the old language despite the URL change.
    //    window.location.href forces a real browser request — middleware runs,
    //    next-intl loads the correct message bundle, page renders in the new language.
    window.location.href = newPath;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLang.name}</span>
          <span className="sm:hidden">{currentLang.flag}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => switchLocale(lang.code)}
            className="gap-2 cursor-pointer"
          >
            <span>{lang.flag}</span>
            <span>{lang.name}</span>
            {currentLocale === lang.code && (
              <span className="ml-auto text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
