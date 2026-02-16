"use client";

const locales = [
  { code: "en", label: "EN" },
  { code: "pt-BR", label: "PT-BR" },
  { code: "es", label: "ES" },
] as const;

export function LocaleSwitcher() {
  // Full next-intl wiring deferred: Next 16 + Turbopack has known config resolution issue.
  // Messages live in src/messages/*.json; i18n/request.ts is ready. Re-enable plugin in next.config when fixed.
  const currentLocale = "en";

  function setLocale(code: string) {
    document.cookie = `locale=${code};path=/;max-age=31536000`;
    window.location.reload();
  }

  return (
    <nav className="flex items-center gap-1" aria-label="Language switcher">
      {locales.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          className={`text-sm transition-colors hover:text-text-primary ${
            currentLocale === code ? "text-solana font-medium" : "text-text-secondary"
          }`}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
