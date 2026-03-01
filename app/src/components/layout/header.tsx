"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserStore } from "@/lib/store/user-store";
import type { Locale } from "@/types";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Menu, Moon, SunMedium } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/courses", label: "Courses" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leaderboard", label: "Leaderboard" },
] as const;

export function Header() {
  const tCommon = useTranslations("Common");
  const tHeader = useTranslations("Header");
  const locale = useUserStore((state) => state.locale);
  const setLocale = useUserStore((state) => state.setLocale);
  const setWalletAddress = useUserStore((state) => state.setWalletAddress);
  const { resolvedTheme, setTheme } = useTheme();
  const wallet = useWallet();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setWalletAddress(wallet.publicKey?.toBase58());
  }, [wallet.publicKey, setWalletAddress]);

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/New Logo/Logo/HORIZONTAL/SVG/ST-OFF-WHITE-HORIZONTAL.svg"
              alt="Superteam Brasil"
              className="hidden h-7 dark:block"
            />
            <img
              src="/New Logo/Logo/HORIZONTAL/SVG/ST-DARK-GREEN-HORIZONTAL.svg"
              alt="Superteam Brasil"
              className="block h-7 dark:hidden"
            />
            <span className="sr-only">{tCommon("brand")}</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
                    active ? "bg-primary/10 text-primary dark:text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          <Select value={locale} onValueChange={(value) => setLocale(value as Locale)}>
            <SelectTrigger className="hidden h-8 w-18 border-border/50 bg-transparent text-[11px] font-medium text-muted-foreground sm:flex">
              <SelectValue placeholder={tCommon("language")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">EN</SelectItem>
              <SelectItem value="pt-BR">PT-BR</SelectItem>
              <SelectItem value="es">ES</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {mounted && resolvedTheme === "dark" ? <SunMedium className="size-4" /> : <Moon className="size-4" />}
          </Button>

          <div className="hidden md:block">
            {mounted && (
              <WalletMultiButton className="h-8! rounded-lg! bg-gradient-cta! px-4! text-[13px]! font-medium! text-cta-foreground!" />
            )}
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground md:hidden">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="border-border bg-background text-foreground">
              <SheetHeader>
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-1">
                {navItems.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "block rounded-lg px-3 py-2.5 text-sm font-medium",
                        active ? "bg-primary/10 text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
              <div className="mt-6 space-y-3">
                <Select value={locale} onValueChange={(value) => setLocale(value as Locale)}>
                  <SelectTrigger className="h-9 w-full border-border bg-secondary/50 text-xs text-foreground/90">
                    <SelectValue placeholder={tCommon("language")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">EN</SelectItem>
                    <SelectItem value="pt-BR">PT-BR</SelectItem>
                    <SelectItem value="es">ES</SelectItem>
                  </SelectContent>
                </Select>
                {mounted && (
                  <WalletMultiButton className="h-9! w-full! rounded-lg! bg-gradient-cta! px-3! text-cta-foreground!" />
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
