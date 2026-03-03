"use client";

import Link from "next/link";
import { useI18n } from "../../i18n/I18nProvider";
import { SUPPORTED_LOCALES, type Locale } from "../../i18n/locales";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";

// Dynamically import WalletMultiButton with ssr: false to prevent hydration errors
const WalletMultiButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);
import { useState } from "react";
import {
  Zap,
  Menu,
  X,
  User,
  Globe,
} from "lucide-react";

export function SiteHeader() {
  const { t, locale, setLocale } = useI18n();
  const { publicKey } = useWallet();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLocaleChange = (value: string) => {
    if (value === locale) return;
    if (
      (SUPPORTED_LOCALES as { code: Locale }[]).some((l) => l.code === value)
    ) {
      setLocale(value as Locale);
    }
  };

  const navLinks = [
    { href: "/courses", label: t("nav.courses") },
    { href: "/dashboard", label: t("nav.dashboard") },
    { href: "/leaderboard", label: t("nav.leaderboard") },
    { href: "/challenges", label: "Challenges" },
    { href: "/community", label: "Community" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 glass">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo + Nav */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary transition-transform group-hover:scale-105">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold tracking-tight">
              Superteam{" "}
              <span className="gradient-text">Academy</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-primary hover:bg-primary/5"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Language */}
          <div className="hidden items-center gap-1.5 sm:flex">
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              className="rounded-md border border-border bg-background px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 focus:outline-none"
              value={locale}
              onChange={(e) => handleLocaleChange(e.target.value)}
            >
              {SUPPORTED_LOCALES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {/* Profile link */}
          {publicKey && (
            <Link
              href="/profile"
              className="hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-primary hover:bg-primary/5 sm:flex"
            >
              <User className="h-3.5 w-3.5" />
              Profile
            </Link>
          )}

          {/* Wallet */}
          <div className="flex items-center">
            <WalletMultiButton />
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="rounded-md p-2 text-muted-foreground transition-colors hover:text-primary md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="border-t border-border/50 px-4 py-3 md:hidden animate-slide-up">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-primary hover:bg-primary/5"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {publicKey && (
              <Link
                href="/profile"
                className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-primary hover:bg-primary/5"
                onClick={() => setMobileOpen(false)}
              >
                Profile
              </Link>
            )}
            <div className="mt-2 flex items-center gap-2 px-3">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                value={locale}
                onChange={(e) => handleLocaleChange(e.target.value)}
              >
                {SUPPORTED_LOCALES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
