"use client";

import { useI18n } from "@/lib/i18n/provider";
import { locales } from "@/lib/i18n/config";

export function LanguageSwitcher(): JSX.Element {
  const { locale, setLocale, t } = useI18n();

  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{t("common.language")}</span>
      <select
        className="rounded-md border bg-background px-2 py-1"
        value={locale}
        onChange={(event) => setLocale(event.target.value as (typeof locales)[number])}
        aria-label={t("common.language")}
      >
        {locales.map((option) => (
          <option key={option} value={option}>
            {option.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  );
}
