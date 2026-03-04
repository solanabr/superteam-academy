"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useLocale } from "@/contexts/locale-context";
import { useTheme } from "@/contexts/theme-context";
import { useLearning } from "@/contexts/learning-context";
import { calculateLevel } from "@/config/constants";
import type { SupportedLocale } from "@/config/constants";
import {
  BookOpen,
  LayoutDashboard,
  Trophy,
  Settings,
  Sun,
  Moon,
  Globe,
  Menu,
  X,
  Zap,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

const NAV_ITEMS = [
  { key: "courses", href: "/courses", icon: BookOpen },
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "leaderboard", href: "/leaderboard", icon: Trophy },
];

const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: "English",
  "pt-BR": "Portugues (BR)",
  es: "Espanol",
};

export function Header() {
  const pathname = usePathname();
  const { publicKey, disconnect, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { t, locale, setLocale } = useLocale();
  const { resolvedTheme, setTheme } = useTheme();
  const { xp } = useLearning();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const shortWallet = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : "";

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Superteam<span className="text-violet-500">Academy</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-violet-500/10 text-violet-500"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {t(`nav.${item.key}`)}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* XP Badge */}
          {connected && xp > 0 && (
            <Link
              href="/dashboard"
              className="hidden items-center gap-1.5 rounded-full bg-violet-500/10 px-3 py-1 text-sm font-medium text-violet-500 sm:flex"
            >
              <Zap className="h-3.5 w-3.5" />
              {xp.toLocaleString()} XP
              <span className="text-xs text-violet-400">
                Lv.{calculateLevel(xp)}
              </span>
            </Link>
          )}

          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Globe className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(Object.entries(LOCALE_LABELS) as [SupportedLocale, string][]).map(
                ([loc, label]) => (
                  <DropdownMenuItem
                    key={loc}
                    onClick={() => setLocale(loc)}
                    className={locale === loc ? "bg-accent" : ""}
                  >
                    {label}
                  </DropdownMenuItem>
                )
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* Wallet */}
          {connected ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex"
                >
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  {shortWallet}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    {t("nav.dashboard")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    {t("nav.settings")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => disconnect()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("nav.disconnect")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              size="sm"
              onClick={() => setVisible(true)}
              className="hidden bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 sm:flex"
            >
              {t("nav.connectWallet")}
            </Button>
          )}

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border/40 bg-background p-4 md:hidden">
          <nav className="flex flex-col gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-violet-500/10 text-violet-500"
                      : "text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {t(`nav.${item.key}`)}
                </Link>
              );
            })}
            <div className="mt-2 border-t border-border/40 pt-2">
              {connected ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    {shortWallet}
                    {xp > 0 && (
                      <span className="ml-auto text-violet-500">
                        {xp.toLocaleString()} XP
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      disconnect();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("nav.disconnect")}
                  </Button>
                </>
              ) : (
                <Button
                  className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600"
                  onClick={() => {
                    setVisible(true);
                    setMobileMenuOpen(false);
                  }}
                >
                  {t("nav.connectWallet")}
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
