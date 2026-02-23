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
import { useEffect } from "react";

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

  useEffect(() => {
    setWalletAddress(wallet.publicKey?.toBase58());
  }, [wallet.publicKey, setWalletAddress]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-5">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/New Logo/Logo/HORIZONTAL/SVG/ST-OFF-WHITE-HORIZONTAL.svg"
              alt="Superteam Brasil"
              className="hidden h-8 dark:block"
            />
            <img
              src="/New Logo/Logo/HORIZONTAL/SVG/ST-DARK-GREEN-HORIZONTAL.svg"
              alt="Superteam Brasil"
              className="block h-8 dark:hidden"
            />
            <span className="sr-only">{tCommon("brand")}</span>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm transition",
                    active ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground/90",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Select value={locale} onValueChange={(value) => setLocale(value as Locale)}>
            <SelectTrigger className="hidden h-9 w-[108px] border-border bg-card text-xs text-foreground/90 sm:flex">
              <SelectValue placeholder={tCommon("language")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">EN</SelectItem>
              <SelectItem value="pt-BR">PT-BR</SelectItem>
              <SelectItem value="es">ES</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 border-border bg-card"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? <SunMedium className="size-4" /> : <Moon className="size-4" />}
          </Button>

          <div className="hidden md:block">
            <WalletMultiButton className="!h-9 !rounded-md !bg-gradient-to-r !from-[#2f6b3f] !to-[#ffd23f] !px-3 !text-st-dark" />
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="border-border bg-card md:hidden">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="border-border bg-st-dark text-foreground">
              <SheetHeader>
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-2">
                {navItems.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "block rounded-md px-3 py-2 text-sm",
                        active ? "bg-white/10 text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
              <div className="mt-6 space-y-3">
                <Select value={locale} onValueChange={(value) => setLocale(value as Locale)}>
                  <SelectTrigger className="h-9 w-full border-border bg-card text-xs text-foreground/90">
                    <SelectValue placeholder={tCommon("language")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">EN</SelectItem>
                    <SelectItem value="pt-BR">PT-BR</SelectItem>
                    <SelectItem value="es">ES</SelectItem>
                  </SelectContent>
                </Select>
                <WalletMultiButton className="!h-9 !w-full !rounded-md !bg-gradient-to-r !from-[#2f6b3f] !to-[#ffd23f] !px-3 !text-st-dark" />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
