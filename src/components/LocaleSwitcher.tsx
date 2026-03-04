"use client";

import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { routing, usePathname, useRouter } from "@/i18n/routing";
import { track } from "@/lib/analytics";

type LocaleSwitcherProps = {
  variant?: "nav" | "settings";
  onSwitched?: () => void;
  className?: string;
  fullWidth?: boolean;
};

type SupportedLocale = (typeof routing.locales)[number];

export function LocaleSwitcher({
  variant = "settings",
  onSwitched,
  className = "",
  fullWidth = false,
}: LocaleSwitcherProps) {
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale() as SupportedLocale;
  const pathname = usePathname();
  const router = useRouter();

  function changeLocale(newLocale: SupportedLocale) {
    if (newLocale === locale) return;
    track.languageSwitch(locale, newLocale);
    router.replace(pathname, { locale: newLocale });
    onSwitched?.();
  }

  const isNav = variant === "nav";

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <Globe
        size={14}
        style={{
          color: "var(--text-muted)",
          position: "absolute",
          left: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />
      <select
        value={locale}
        onChange={(e) => changeLocale(e.target.value as SupportedLocale)}
        className="appearance-none rounded-lg text-sm transition-colors outline-none"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-subtle)",
          color: "var(--text-primary)",
          padding: isNav ? "7px 30px 7px 30px" : "8px 32px 8px 34px",
          minHeight: isNav ? "36px" : "38px",
          width: fullWidth ? "100%" : "auto",
        }}
        aria-label={t("aria")}
      >
        <option value="en">{t("options.en")}</option>
        <option value="pt-BR">{t("options.ptBR")}</option>
        <option value="es">{t("options.es")}</option>
      </select>
    </div>
  );
}
