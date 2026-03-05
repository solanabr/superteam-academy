"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Sun, Moon, Menu, Wallet, LogOut, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { useLocale } from "@/providers/locale-provider";
import { locales, localeNames, type Locale } from "@/i18n/config";
import { useState, useRef, useEffect } from "react";
import { events as analyticsEvents } from "@/lib/analytics";

export function Header() {
  const { theme, setTheme } = useTheme();
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const { locale, setLocale, t } = useLocale();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { href: "/courses", label: t("nav.courses") },
    { href: "/dashboard", label: t("nav.dashboard") },
    { href: "/leaderboard", label: t("nav.leaderboard") },
    { href: "/profile", label: t("nav.profile") },
  ];

  const truncatedAddress = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : null;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setShowLangMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-200 ${scrolled ? "bg-background/80 backdrop-blur-md border-b border-border/50" : "bg-transparent"}`}>
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6 pt-2">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary">
            <span className="text-xs font-bold text-primary-foreground">S</span>
          </div>
          <span className="text-sm font-semibold tracking-tight">
            Superteam Academy
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Button key={link.href} variant="ghost" size="sm" asChild>
              <Link href={link.href} className="text-muted-foreground">
                {link.label}
              </Link>
            </Button>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <div className="relative" ref={langRef}>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowLangMenu(!showLangMenu)}
              aria-label="Change language"
            >
              <Globe className="size-4" />
            </Button>
            {showLangMenu && (
              <div className="absolute right-0 top-full mt-1 w-36 rounded-lg border border-border/40 bg-background/95 backdrop-blur-sm p-1 shadow-lg">
                {locales.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => {
                      setLocale(loc as Locale);
                      analyticsEvents.languageChanged(loc);
                      setShowLangMenu(false);
                    }}
                    className={`w-full rounded-md px-3 py-1.5 text-left text-xs transition-colors ${
                      locale === loc
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {localeNames[loc as Locale]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              const next = theme === "dark" ? "light" : "dark";
              setTheme(next);
              analyticsEvents.themeChanged(next);
            }}
            aria-label="Toggle theme"
          >
            <Sun className="hidden size-4 dark:block" />
            <Moon className="block size-4 dark:hidden" />
          </Button>

          {/* Wallet */}
          {connected && truncatedAddress ? (
            <div className="hidden md:flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 font-mono text-xs"
              >
                <Wallet className="size-3.5" />
                {truncatedAddress}
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => disconnect()}
                aria-label="Disconnect wallet"
              >
                <LogOut className="size-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              className="hidden md:inline-flex"
              onClick={() => setVisible(true)}
            >
              {t("common.connectWallet")}
            </Button>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="md:hidden"
                aria-label="Menu"
              >
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <nav className="flex flex-col gap-1 pt-8">
                {navLinks.map((link) => (
                  <Button
                    key={link.href}
                    variant="ghost"
                    asChild
                    className="justify-start"
                  >
                    <Link href={link.href}>{link.label}</Link>
                  </Button>
                ))}
                {connected && truncatedAddress ? (
                  <div className="mt-4 space-y-2">
                    <div className="rounded-lg border border-border/40 px-3 py-2 text-xs font-mono text-center">
                      {truncatedAddress}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => disconnect()}
                    >
                      {t("common.disconnect")}
                    </Button>
                  </div>
                ) : (
                  <Button className="mt-4" onClick={() => setVisible(true)}>
                    {t("common.connectWallet")}
                  </Button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
