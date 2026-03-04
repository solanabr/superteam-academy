"use client";

import { LanguageSwitcher } from "@/components/app/LanguageSwitcher";
import { ThemeToggle } from "@/components/app/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";
import { useIsAdmin } from "@/hooks";
import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { NotificationBell } from "@/components/app/NotificationBell";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";

const NAV_LINKS = [
  { key: "courses" as const, href: "/courses/intro-to-solana" },
  { key: "leaderboard" as const, href: "/leaderboard" },
  { key: "challenges" as const, href: "/challenges" },
  { key: "discussions" as const, href: "/discussions" },
];

export function Navbar() {
  const [openMobile, setOpenMobile] = useState(false);
  const { isAdmin } = useIsAdmin();
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Floating navbar */}
      <div className="relative flex justify-center px-2 pt-2 sm:pt-4 sm:px-0">
        <div className="w-full sm:w-[95%] md:w-[90%] lg:w-[85%] max-w-7xl
                    rounded-xl sm:rounded-2xl border border-white/10
                    bg-background/70 backdrop-blur-md shadow-lg">
          <div className="px-3 py-3 sm:px-6 sm:py-4 flex items-center justify-between gap-2">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0 min-w-0">
              <Image
                src="/HORIZONTAL-LOGO/ST-DARK-GREEN-HORIZONTAL.png"
                alt="Superteam Academy"
                width={160}
                height={36}
                className="h-7 w-auto object-contain dark:hidden sm:h-9"
              />
              <Image
                src="/HORIZONTAL-LOGO/ST-OFF-WHITE-HORIZONTAL.png"
                alt="Superteam Academy"
                width={160}
                height={36}
                className="h-7 w-auto object-contain hidden dark:block sm:h-9"
              />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8 ">
              <NavigationMenu>
                <NavigationMenuList className="gap-4">
                  {NAV_LINKS.map((link) => (
                    <NavigationMenuItem key={link.href}>
                      <NavigationMenuLink asChild>
                        <Link
                          href={link.href}
                          className="font-game text-xl hover:text-yellow-400 transition-colors"
                        >
                          {t(link.key)}
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  ))}

                  {isAdmin && (
                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <Link
                          href="/admin"
                          className="font-game text-xl hover:text-yellow-400 transition-colors"
                        >
                          {tCommon("admin")}
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  )}
                </NavigationMenuList>
              </NavigationMenu>
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <div className="hidden sm:flex items-center gap-2 sm:gap-4">
                <LanguageSwitcher />
                <ThemeToggle />
              </div>
              <div className="hidden sm:flex">
                <NotificationBell />
              </div>
              <div className="hidden md:block">
                <WalletConnectButton />
              </div>

              {/* Mobile nav trigger */}
              <Sheet open={openMobile} onOpenChange={setOpenMobile}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden size-9">
                    <Menu className="size-5" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[min(18rem,100vw)] flex flex-col gap-6 pt-12">
                  <SheetHeader className="sr-only">
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  {/* Links on top (same order as app sidebar) */}
                  <nav className="flex flex-col gap-2 flex-1 min-h-0">
                    {NAV_LINKS.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setOpenMobile(false)}
                        className="font-game text-xl py-2 px-3 rounded-lg hover:bg-accent hover:text-yellow-400 transition-colors"
                      >
                        {t(link.key)}
                      </Link>
                    ))}
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setOpenMobile(false)}
                        className="font-game text-xl py-2 px-3 rounded-lg hover:bg-accent hover:text-yellow-400 transition-colors"
                      >
                        {tCommon("admin")}
                      </Link>
                    )}
                  </nav>
                  {/* Language, theme, wallet on bottom */}
                  <div className="flex flex-col gap-4 sm:hidden mt-2 mx-3 pt-4 border-t border-border">
                    <LanguageSwitcher triggerClassName="w-full justify-between py-2 px-3 rounded-lg font-game text-xl" />
                    <ThemeToggle showLabel />
                    <WalletConnectButton className="w-full justify-center" />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
