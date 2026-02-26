"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/app/ThemeToggle";
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";
import { LanguageSwitcher } from "@/components/app/LanguageSwitcher";
import { useIsAdmin } from "@/hooks";
import { useTranslations } from "next-intl";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

const NAV_LINKS = [
  { key: "leaderboard" as const, href: "/leaderboard" },
  { key: "challenges" as const, href: "/challenges" },
];

const COURSES = [
  { titleKey: "Solana Fundamentals", levelKey: "beginner" as const, href: "/courses/solana-fundamentals" },
  { titleKey: "Anchor Program Development", levelKey: "beginner" as const, href: "/courses/anchor-development" },
  { titleKey: "Token Extensions", levelKey: "advanced" as const, href: "/courses/token-extensions" },
  { titleKey: "Metaplex Core NFTs", levelKey: "advanced" as const, href: "/courses/defi" },
];

export function Navbar() {
  const { isAdmin } = useIsAdmin();
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Floating navbar */}
      <div className="relative flex justify-center pt-4">
        <div className="w-[95%] md:w-[90%] lg:w-[85%] max-w-7xl
                    rounded-2xl border border-white/10
                    bg-background/70 backdrop-blur-md shadow-lg">
          <div className="px-6 py-4 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <p className="font-game font-bold text-2xl">
                {tCommon("appName")}
              </p>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8 ">
              <NavigationMenu>
                <NavigationMenuList className="gap-4">
                  {/* Courses dropdown */}
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="font-game text-xl">
                      {t("courses")}
                    </NavigationMenuTrigger>

                    <NavigationMenuContent>
                      <ul className="grid grid-cols-2 gap-3 p-4 w-[520px]">
                        {COURSES.map((course) => (
                          <li key={course.href}>
                            <NavigationMenuLink asChild>
                              <Link
                                href={course.href}
                                className="block rounded-md p-3 hover:bg-accent transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <h4 className="font-game text-xl">
                                    {course.titleKey}
                                  </h4>
                                  <span className="text-xs text-yellow-400 font-game">
                                    {t(course.levelKey)}
                                  </span>
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground" />
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

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
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <ThemeToggle />
              <WalletConnectButton />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}