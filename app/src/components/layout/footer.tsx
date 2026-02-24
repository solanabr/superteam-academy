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
    <footer
      role="contentinfo"
      aria-label={t("siteFooter")}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "24px clamp(20px, 8vw, 120px)",
        borderTop: "1px solid var(--c-border-subtle)",
        background: "var(--background)",
        fontFamily: "var(--font-mono)",
        fontSize: "10px",
        letterSpacing: "0.1em",
        color: "var(--c-text-muted)",
        flexWrap: "wrap",
        gap: "16px",
      }}
    >
      <div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <SuperteamLogo size={14} className="currentColor" />
          <em
            style={{
              fontStyle: "italic",
              fontFamily: "var(--font-brand)",
              fontSize: "12px",
              letterSpacing: 0,
            }}
          >
            {t("tagline")}
          </em>
        </span>
      </div>

      <nav
        aria-label={t("footerNavigation")}
        style={{ display: "flex", gap: "24px" }}
      >
        <Link
          href={`/${locale}/courses`}
          style={{
            textTransform: "uppercase",
            color: "var(--c-text-muted)",
            textDecoration: "none",
            transition: "color 0.2s",
          }}
        >
          {t("courses")}
        </Link>
        <Link
          href={`/${locale}/dashboard`}
          style={{
            textTransform: "uppercase",
            color: "var(--c-text-muted)",
            textDecoration: "none",
            transition: "color 0.2s",
          }}
        >
          {t("dashboard")}
        </Link>
        <Link
          href={`/${locale}/leaderboard`}
          style={{
            textTransform: "uppercase",
            color: "var(--c-text-muted)",
            textDecoration: "none",
            transition: "color 0.2s",
          }}
        >
          {t("leaderboard")}
        </Link>
      </nav>

      <div style={{ textTransform: "uppercase" }}>{t("builtOn")}</div>
    </footer>
  );
}
