"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useLocale, useTranslations } from "next-intl";
import {
  Sun,
  Moon,
  Menu,
  X,
  BookOpen,
  Trophy,
  Zap,
  Bell,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import { useEffect, useCallback, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { setLocale } from "@/i18n/actions";
import { localeNames, localeFlags, type Locale, locales } from "@/i18n/config";
import { AuthButton } from "@/components/auth/sign-in-button";
import { SuperteamAcademyLogo } from "@/components/icons/superteam-logo";
import { trackEvent } from "@/lib/analytics";
import { useNotificationUnreadCount } from "@/lib/hooks/use-notifications";

interface HeaderProps {
  /** Slot for app-specific controls (gamification stats, wallet button) rendered before the language selector */
  appSlot?: ReactNode;
}

const NAV_ITEMS = [
  { href: "/courses", labelKey: "courses" as const, icon: BookOpen },
  { href: "/challenges", labelKey: "challenges" as const, icon: Zap },
  { href: "/leaderboard", labelKey: "leaderboard" as const, icon: Trophy },
  {
    href: "/discussions",
    labelKey: "discussions" as const,
    icon: MessageSquare,
  },
];

export function Header({ appSlot }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const t = useTranslations("nav");
  const currentLocale = useLocale();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  const unreadCount = useNotificationUnreadCount();

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleLocaleChange(locale: Locale) {
    setLangMenuOpen(false);
    trackEvent({ name: "language_changed", params: { locale } });
    startTransition(async () => {
      await setLocale(locale);
      router.refresh();
    });
  }

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setLangMenuOpen(false);
      setMobileMenuOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [handleEscape]);

  return (
    <header className="sticky top-0 z-50 w-full glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <SuperteamAcademyLogo size={32} />
          <span className="hidden font-heading text-lg font-bold sm:block">
            Superteam <span className="text-gradient-gold">Academy</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-1">
          {/* App-specific controls (gamification stats, wallet) — only rendered inside (app) layout */}
          {appSlot}

          {/* Notifications */}
          <Link
            href="/notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className={cn(
                "flex h-9 items-center gap-1 rounded-lg px-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                isPending && "opacity-50",
              )}
              aria-label="Change language"
              aria-expanded={langMenuOpen}
              aria-haspopup="true"
            >
              <span className="text-base leading-none">
                {localeFlags[currentLocale as Locale]}
              </span>
              <ChevronDown className="h-3 w-3" />
            </button>
            {langMenuOpen && (
              <>
                <div
                  className="fixed inset-0"
                  onClick={() => setLangMenuOpen(false)}
                />
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-44 rounded-lg border border-border bg-popover p-1 shadow-lg"
                >
                  {locales.map((locale) => (
                    <button
                      key={locale}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted",
                        currentLocale === locale &&
                          "bg-primary/10 text-primary font-medium",
                      )}
                      role="menuitem"
                      onClick={() => handleLocaleChange(locale)}
                    >
                      <span>{localeFlags[locale]}</span>
                      <span>{localeNames[locale]}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Toggle theme"
          >
            {mounted && theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          {/* Auth */}
          <AuthButton />

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground md:hidden"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="border-t border-border px-4 py-3 md:hidden">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                <item.icon className="h-4 w-4" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
