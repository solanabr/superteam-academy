"use client";

import { useLocale, useTranslations } from "next-intl";
import { Translate } from "@phosphor-icons/react";
import { localeNames, type Locale } from "@/lib/i18n/config";

/**
 * Shown when a course is being read in a language it does not have (content
 * i18n, academy-courses PR #51). The course still renders — in its source
 * language — so links never break; this just says so, once, above the copy.
 *
 * Renders nothing when the reader's UI locale is one the course ships, which
 * is the common case and must cost no layout.
 */
export function CourseLanguageNotice({
  sourceLocale,
  availableLocales,
  className,
}: {
  sourceLocale: string | null | undefined;
  availableLocales: string[] | null | undefined;
  className?: string;
}) {
  const locale = useLocale();
  const t = useTranslations("courses");
  if (!sourceLocale || !availableLocales) return null;
  if (availableLocales.includes(locale)) return null;

  const name = (l: string): string => localeNames[l as Locale] ?? l;

  return (
    <p
      role="status"
      className={`flex items-start gap-2 rounded-md border-[2px] border-border bg-[var(--card-alt)] px-3 py-2 text-sm text-text-2 ${className ?? ""}`}
    >
      <Translate
        size={18}
        weight="duotone"
        className="mt-0.5 shrink-0 text-primary"
        aria-hidden="true"
      />
      <span>
        {t("languageNotice", {
          language: name(locale),
          source: name(sourceLocale),
        })}
      </span>
    </p>
  );
}
