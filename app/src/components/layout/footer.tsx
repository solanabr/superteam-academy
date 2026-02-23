"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { SuperteamLogo } from "@/components/ui/superteam-logo";

export function Footer({ locale }: { locale: string }) {
  const t = useTranslations("footer");
  const pathname = usePathname();

  // Hide footer on lesson pages (IDE/challenge fills viewport)
  if (/\/courses\/[^/]+\/lessons\//.test(pathname)) return null;

  return (
    <footer className="v9-footer" role="contentinfo" aria-label="Site footer">
      <div className="v9-footer-left">
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <SuperteamLogo size={14} className="currentColor" />
          <em>{t("tagline")}</em>
        </span>
      </div>

      <nav className="v9-footer-nav" aria-label="Footer navigation">
        <Link href={`/${locale}/courses`}>{t("courses")}</Link>
        <Link href={`/${locale}/dashboard`}>{t("dashboard")}</Link>
        <Link href={`/${locale}/leaderboard`}>{t("leaderboard")}</Link>
      </nav>

      <div className="v9-footer-right">{t("builtOn")}</div>
    </footer>
  );
}
