"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, BookOpen, LayoutDashboard, Trophy } from "lucide-react";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { WalletButton } from "@/components/auth/WalletButton";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";

const navItems = [
  { href: "/courses", labelKey: "header.courses" as const, icon: BookOpen },
  { href: "/dashboard", labelKey: "header.dashboard" as const, icon: LayoutDashboard },
  { href: "/leaderboard", labelKey: "header.leaderboard" as const, icon: Trophy },
];

export function Header(): JSX.Element {
  const { t } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg solana-gradient">
            <span className="text-sm font-bold text-white">S</span>
          </div>
          <span className="font-semibold tracking-tight">
            <span className="hidden sm:inline">{t("common.brand")}</span>
            <span className="sm:hidden">Academy</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-solana-purple/10 text-solana-purple"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-3.5 w-3.5" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher />
          <ThemeToggle />
          <WalletButton />
        </div>

        {/* Mobile menu button */}
        <Button
          variant="outline"
          size="sm"
          className="md:hidden"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-border/50 bg-background/95 px-4 py-4 backdrop-blur-lg md:hidden">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-solana-purple/10 text-solana-purple"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </nav>
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/50 pt-4">
            <LanguageSwitcher />
            <ThemeToggle />
            <WalletButton />
          </div>
        </div>
      )}
    </header>
  );
}
