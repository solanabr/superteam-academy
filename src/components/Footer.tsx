"use client";

import Image from "next/image";
import { Github, Twitter } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

const NAV_LINKS = [
  { key: "courses", href: "/courses" },
  { key: "leaderboard", href: "/leaderboard" },
  { key: "dashboard", href: "/dashboard" },
  { key: "profile", href: "/profile" },
] as const;

const SOCIAL_LINKS = [
  {
    key: "github",
    href: "https://github.com/solanabr",
    icon: Github,
  },
  {
    key: "twitter",
    href: "https://x.com/superteambr",
    icon: Twitter,
  },
] as const;

export function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer
      className="mt-auto border-t"
      style={{
        borderColor: "var(--border-subtle)",
        background: "var(--bg-base)",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <Image
                src="/brand/solana-logomark-color.svg"
                alt={t("brand.solanaAlt")}
                width={24}
                height={20}
                className="shrink-0"
              />
              <span
                className="font-bold text-base gradient-solana-text"
                aria-label={t("brand.aria")}
              >
                {t("brand.name")}
              </span>
            </div>
            <p
              className="text-sm leading-relaxed max-w-[220px]"
              style={{ color: "var(--text-muted)" }}
            >
              {t("brand.description")}
            </p>
          </div>

          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: "var(--text-muted)" }}
            >
              {t("sections.platform")}
            </p>
            <ul className="space-y-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    prefetch={false}
                    className="text-sm transition-colors duration-150"
                    style={{ color: "var(--text-secondary)" }}
                    onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.color =
                      "var(--text-primary)")
                    }
                    onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.color =
                      "var(--text-secondary)")
                    }
                  >
                    {t(`nav.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: "var(--text-muted)" }}
            >
              {t("sections.community")}
            </p>
            <div className="flex gap-3">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.href}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t(`social.${s.key}`)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-muted)",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "var(--border-purple)";
                    el.style.color = "var(--text-purple)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "var(--border-subtle)";
                    el.style.color = "var(--text-muted)";
                  }}
                >
                  <s.icon size={16} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-6 text-xs"
          style={{
            borderTop: "1px solid var(--border-subtle)",
            color: "var(--text-muted)",
          }}
        >
          <span suppressHydrationWarning>{t("bottom.copyright", { year: new Date().getFullYear() })}</span>
          <div className="flex items-center gap-1.5">
            <span>{t("bottom.builtOn")}</span>
            <Image
              src="/brand/solana-logomark-white.svg"
              alt={t("brand.solanaAlt")}
              width={14}
              height={12}
            />
            <span>{t("bottom.solana")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
