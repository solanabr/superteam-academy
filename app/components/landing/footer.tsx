"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-edge-soft bg-surface-secondary">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <p className="text-sm font-bold text-content">Superteam Academy</p>
            <p className="mt-2 text-xs text-content-muted">{t("tagline")}</p>
          </div>

          {/* Platform */}
          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-content-muted">{t("platform")}</p>
            <nav className="space-y-2">
              <Link href="/#catalog" className="block text-xs text-content-secondary hover:text-content">{t("courses")}</Link>
              <Link href="/leaderboard" className="block text-xs text-content-secondary hover:text-content">{t("leaderboard")}</Link>
              <Link href="/my-learning" className="block text-xs text-content-secondary hover:text-content">{t("dashboard")}</Link>
            </nav>
          </div>

          {/* Resources */}
          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-content-muted">{t("resources")}</p>
            <nav className="space-y-2">
              <a href="https://solana.com" target="_blank" rel="noopener noreferrer" className="block text-xs text-content-secondary hover:text-content">Solana</a>
              <a href="https://www.anchor-lang.com" target="_blank" rel="noopener noreferrer" className="block text-xs text-content-secondary hover:text-content">Anchor</a>
              <a href="https://superteam.fun" target="_blank" rel="noopener noreferrer" className="block text-xs text-content-secondary hover:text-content">Superteam</a>
            </nav>
          </div>

          {/* Community */}
          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-content-muted">{t("community")}</p>
            <nav className="space-y-2">
              <a href="https://github.com/solanabr/superteam-academy" target="_blank" rel="noopener noreferrer" className="block text-xs text-content-secondary hover:text-content">GitHub</a>
              <a href="https://x.com/SuperteamBR" target="_blank" rel="noopener noreferrer" className="block text-xs text-content-secondary hover:text-content">Twitter / X</a>
            </nav>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-edge-soft pt-6 sm:flex-row">
          <p className="text-[10px] text-content-muted">
            {t("copyright", { year: new Date().getFullYear() })}
          </p>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-content-muted">{t("poweredBy")}</span>
            <span className="text-xs font-bold bg-solana-gradient bg-clip-text text-transparent">Solana</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
