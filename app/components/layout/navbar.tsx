"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ConnectButton } from "@/components/wallet/connect-button";
import { NetworkBadge } from "@/components/wallet/network-badge";
import { MobileNav } from "./mobile-nav";
import { getStreak, isActiveToday } from "@/lib/streak";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";

export function Navbar() {
  const t = useTranslations("common");
  const [streak, setStreak] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setStreak(getStreak());
  }, []);

  const currentLocale = routing.locales.find((l) =>
    pathname.startsWith(`/${l}`)
  ) ?? routing.defaultLocale;

  const switchLocale = (locale: Locale) => {
    const segments = pathname.split("/");
    if (routing.locales.includes(segments[1] as Locale)) {
      segments[1] = locale;
    } else {
      segments.splice(1, 0, locale);
    }
    router.push(segments.join("/") || "/");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-edge bg-surface/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="bg-solana-gradient bg-clip-text text-xl font-bold text-transparent">
              {t("appName")}
            </span>
          </Link>
          <NetworkBadge />
          <div className="hidden items-center gap-4 md:flex">
            <Link
              href="/"
              className="text-sm text-content-secondary transition-colors hover:text-content"
            >
              {t("backToCourses")}
            </Link>
            <Link
              href="/my-learning"
              className="text-sm text-content-secondary transition-colors hover:text-content"
            >
              {t("dashboard")}
            </Link>
            <Link
              href="/profile"
              className="text-sm text-content-secondary transition-colors hover:text-content"
            >
              {t("viewProfile")}
            </Link>
            <Link
              href="/leaderboard"
              className="text-sm text-content-secondary transition-colors hover:text-content"
            >
              {t("leaderboard")}
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-content-secondary transition-colors hover:text-content"
            >
              {t("creator")}
            </Link>
            <Link
              href="/settings"
              className="text-sm text-content-secondary transition-colors hover:text-content"
              aria-label="Settings"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {streak > 0 && isActiveToday() && (
            <span className="hidden items-center gap-1 text-sm text-orange-400 sm:flex">
              🔥 {streak} {t("streak")}
            </span>
          )}
          <select
            value={currentLocale}
            onChange={(e) => switchLocale(e.target.value as Locale)}
            aria-label={t("language")}
            className="hidden rounded-lg border border-edge bg-transparent px-2 py-1 text-xs text-content-secondary sm:block"
          >
            {routing.locales.map((l) => (
              <option key={l} value={l} className="bg-surface-secondary">
                {l === "en" ? "English" : l === "pt-BR" ? "Português" : "Español"}
              </option>
            ))}
          </select>
          <ConnectButton />
          <MobileNav />
        </div>
      </div>
    </nav>
  );
}
