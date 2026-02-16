"use client";

import { Link, usePathname } from "@/i18n/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { BookOpen, LayoutDashboard, Trophy, Code2, Menu, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { WalletButton } from "@/components/wallet/wallet-button";
import { WalletModal } from "@/components/wallet/wallet-modal";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

const NAV_KEYS = [
  { href: "/courses" as const, key: "courses", icon: BookOpen },
  { href: "/practice" as const, key: "practice", icon: Code2 },
  { href: "/dashboard" as const, key: "dashboard", icon: LayoutDashboard },
  { href: "/leaderboard" as const, key: "leaderboard", icon: Trophy },
  { href: "/profile" as const, key: "profile", icon: User },
];

export function Header() {
  const pathname = usePathname();
  const t = useTranslations("header");
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-[#1b231d] shadow-sm">
                <Image src="/logo.png" alt="Superteam Academy" width={28} height={28} />
              </div>
              <span className="hidden text-lg font-bold sm:inline-block">
                superteam <span className="text-solana-purple">brazil</span>
              </span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {NAV_KEYS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                    pathname === item.href || pathname.startsWith(item.href + "/")
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {t(item.key)}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LocaleSwitcher />
            <WalletButton onConnectClick={() => setWalletModalOpen(true)} />
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetTitle>{t("navigation")}</SheetTitle>
                <nav className="mt-8 flex flex-col gap-2">
                  {NAV_KEYS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors hover:bg-accent",
                        pathname === item.href || pathname.startsWith(item.href + "/") ? "bg-accent" : ""
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {t(item.key)}
                    </Link>
                  ))}
                </nav>
                <div className="mt-4 px-3">
                  <LocaleSwitcher />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <WalletModal open={walletModalOpen} onOpenChange={setWalletModalOpen} />
    </>
  );
}
