"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Menu, Moon, Sun, Search, Globe, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

const NAV_ITEMS = [
  { href: "/courses", labelKey: "courses" },
  { href: "/dashboard", labelKey: "dashboard" },
  { href: "/leaderboard", labelKey: "leaderboard" },
] as const;

const LOCALES = [
  { code: "en", label: "English" },
  { code: "pt-BR", label: "Português" },
  { code: "es", label: "Español" },
] as const;

export function Header() {
  const t = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { connected } = useWallet();
  const { toggleSearch } = useUIStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [localeMenuOpen, setLocaleMenuOpen] = useState(false);

  const switchLocale = (newLocale: string) => {
    const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";
    window.location.href = `/${newLocale}${pathWithoutLocale}`;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 font-bold text-lg"
        >
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-superteam-purple to-superteam-green" />
          <span className="hidden sm:inline gradient-text">
            Superteam Academy
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const href = `/${locale}${item.href}`;
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={item.href}
                href={href}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <button
            onClick={toggleSearch}
            className="hidden md:flex items-center gap-2 h-9 px-3 rounded-md border border-input bg-background text-sm text-muted-foreground hover:bg-accent transition-colors"
          >
            <Search className="h-4 w-4" />
            <span className="hidden lg:inline">{t("search")}</span>
            <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>

          {/* Locale Switcher */}
          <div className="relative">
            <button
              onClick={() => setLocaleMenuOpen(!localeMenuOpen)}
              className="flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent transition-colors"
            >
              <Globe className="h-4 w-4" />
            </button>
            {localeMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setLocaleMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-50 min-w-[140px] rounded-md border border-border bg-popover p-1 shadow-lg">
                  {LOCALES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        switchLocale(l.code);
                        setLocaleMenuOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center rounded-sm px-3 py-2 text-sm transition-colors",
                        locale === l.code
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent"
                      )}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent transition-colors"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </button>

          {/* Wallet Button */}
          <div className="hidden sm:block">
            <WalletMultiButton />
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex md:hidden items-center justify-center h-9 w-9 rounded-md hover:bg-accent transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {NAV_ITEMS.map((item) => {
              const href = `/${locale}${item.href}`;
              const isActive = pathname.startsWith(href);
              return (
                <Link
                  key={item.href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  {t(item.labelKey)}
                </Link>
              );
            })}
            <div className="pt-2 border-t border-border">
              <WalletMultiButton />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
