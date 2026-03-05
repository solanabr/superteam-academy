"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { WalletButton } from "@/components/wallet-button";
import {
  BookOpen,
  LayoutDashboard,
  Trophy,
  Users,
  Target,
  Moon,
  Sun,
  Globe,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/courses", labelKey: "common.courses", icon: BookOpen },
  { href: "/challenges", labelKey: "common.challenges", icon: Target },
  { href: "/instructors", labelKey: "common.instructors", icon: Users },
  { href: "/dashboard", labelKey: "common.dashboard", icon: LayoutDashboard },
  { href: "/leaderboard", labelKey: "common.leaderboard", icon: Trophy },
];

export function Header() {
  const t = useTranslations();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="mx-4 mt-2 rounded-2xl bg-[hsl(var(--brand-logo-yellow))] px-4 py-2 shadow-lg md:mx-6 md:px-6">
        <div className="container flex h-10 items-center justify-between pl-4 pr-6 md:h-12 md:pl-6 md:pr-8">
          <Link href="/" className="flex items-center">
            <Image
              src="/superteam-brasil-logo-header.png"
              alt="Superteam Brasil"
              width={120}
              height={32}
              className="h-6 w-auto md:h-7 drop-shadow-md"
              priority
            />
          </Link>
          <nav className="hidden items-center gap-1 md:flex md:gap-2">
            {nav.map(({ href, labelKey }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "rounded-md px-1.5 py-1 text-sm font-bold text-[hsl(var(--brand-emerald))] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand-emerald))]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--brand-logo-yellow))]",
                  pathname?.startsWith(href)
                    ? "underline underline-offset-4"
                    : "hover:opacity-80",
                )}
              >
                {t(labelKey)}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 pr-2 md:pr-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="rounded-lg text-[hsl(var(--brand-emerald))] transition-colors hover:bg-[hsl(var(--brand-emerald))]/10 hover:text-[hsl(var(--brand-emerald))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand-emerald))]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--brand-logo-yellow))] md:hidden"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-lg text-[hsl(var(--brand-emerald))] transition-colors hover:bg-[hsl(var(--brand-emerald))]/10 hover:text-[hsl(var(--brand-emerald))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand-emerald))]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--brand-logo-yellow))]"
                >
                  <Globe className="h-4 w-4" />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  className="z-[9999] w-36 rounded-xl border-2 border-[hsl(var(--brand-logo-green))] bg-[hsl(var(--brand-logo-yellow))] p-1 shadow-lg"
                >
                  {(["pt", "es", "en"] as const).map((loc) => (
                    <DropdownMenu.Item key={loc} asChild>
                      <Link
                        href={pathname ?? "/"}
                        locale={loc}
                        className="flex cursor-pointer items-center rounded-lg px-2 py-1.5 text-sm font-medium text-[hsl(var(--brand-emerald))] outline-none transition-colors hover:bg-[hsl(var(--brand-logo-yellow-light))] focus:bg-[hsl(var(--brand-logo-yellow-light))]"
                      >
                        {loc === "pt"
                          ? "Português"
                          : loc === "es"
                            ? "Español"
                            : "English"}
                      </Link>
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-lg text-[hsl(var(--brand-emerald))] transition-colors hover:bg-[hsl(var(--brand-emerald))]/10 hover:text-[hsl(var(--brand-emerald))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand-emerald))]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--brand-logo-yellow))]"
            >
              <Sun className="absolute h-4 w-4 -rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <Moon className="h-4 w-4 rotate-0 scale-100 transition-all dark:rotate-90 dark:scale-0" />
            </Button>
            <WalletButton />
          </div>
        </div>
      </div>
      {/* Mobile navigation panel */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out md:hidden",
          mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <nav className="mx-4 mt-1 rounded-2xl bg-[hsl(var(--brand-logo-yellow))] px-4 py-3 shadow-lg md:mx-6">
          <ul className="flex flex-col gap-1">
            {nav.map(({ href, labelKey, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-[hsl(var(--brand-emerald))] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand-emerald))]/30",
                    pathname?.startsWith(href)
                      ? "bg-[hsl(var(--brand-emerald))]/10 underline underline-offset-4"
                      : "hover:bg-[hsl(var(--brand-emerald))]/10",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {t(labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
