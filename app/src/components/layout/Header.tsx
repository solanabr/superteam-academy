"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { WalletButton } from "@/components/wallet/WalletButton";
import { SignInButton } from "@/components/auth/SignInButton";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { Search, Menu, BookOpen, BarChart3, Award, Trophy, Users } from "lucide-react";
import { CommandPalette } from "@/components/search/CommandPalette";
import { NavGamification } from "@/components/layout/NavGamification";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";

const navItems = [
  { href: "/courses" as const, key: "courses" as const, icon: BookOpen },
  { href: "/dashboard" as const, key: "dashboard" as const, icon: BarChart3 },
  { href: "/certificates" as const, key: "certificates" as const, icon: Award },
  { href: "/leaderboard" as const, key: "leaderboard" as const, icon: Trophy },
  { href: "/community" as const, key: "community" as const, icon: Users },
];

function AcademyLogo() {
  return (
    <Image
      src="/superteam-brasil.png"
      alt="Superteam Brasil"
      width={30}
      height={30}
      className="rounded-md"
      priority
    />
  );
}

export function Header() {
  const tc = useTranslations("common");
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      role="banner"
      className="sticky top-0 z-40 w-full bg-background/94 dark:bg-[#08080B]/94 border-b border-border/30 dark:border-white/[0.045]"
      style={{
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      }}
    >
      {/* Gradient accent strip at bottom edge */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 right-0 h-[1px] pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(20,241,149,0.25) 25%, rgba(20,241,149,0.4) 50%, rgba(153,69,255,0.2) 75%, transparent 100%)",
        }}
      />

      <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 gap-1 lg:gap-2 xl:gap-3">

        {/* Left — Logo (fixed width, never shrinks) */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <AcademyLogo />
          <div className="hidden sm:flex items-center gap-2">
            <span
              className="text-[15px] font-bold tracking-tight text-foreground leading-none"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Super<span style={{ color: "var(--sol-green-hex)" }}>team</span>{" "}
              <span className="text-foreground">Academy</span>
            </span>
            <span
              className="hidden md:inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] leading-none border"
              style={{
                fontFamily: "var(--font-mono)",
                color: "#C9903A",
                borderColor: "rgba(201, 144, 58, 0.3)",
                background: "rgba(201, 144, 58, 0.08)",
              }}
            >
              Brasil
            </span>
          </div>
        </Link>

        {/* Center — Nav links (lg+ only, below that they go in Sheet) */}
        {/* flex-1 + min-w-0 lets this shrink gracefully instead of overflowing */}
        <nav
          aria-label={tc("mainNavigation")}
          className="hidden lg:flex flex-1 items-center justify-center min-w-0 overflow-hidden"
        >
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative shrink min-w-0 flex items-center gap-1 xl:gap-1.5 px-1.5 lg:px-2 xl:px-3 2xl:px-4 py-2 text-[10px] lg:text-[10.5px] xl:text-[11px] font-semibold tracking-[0.06em] lg:tracking-[0.07em] xl:tracking-[0.1em] transition-all duration-200 whitespace-nowrap truncate",
                  isActive
                    ? "text-[#0d9668] dark:text-[#14F195]"
                    : "text-[#5C5B6B] hover:text-foreground"
                )}
                style={{ fontFamily: "var(--font-mono)" }}
              >
                <Icon className={cn(
                  "h-3 w-3 xl:h-3.5 xl:w-3.5 shrink-0 transition-colors duration-200",
                  isActive ? "opacity-100" : "opacity-50 group-hover:opacity-75"
                )} aria-hidden="true" />
                {t(item.key).toUpperCase()}
                {isActive && (
                  <>
                    {/* Active dot */}
                    <span
                      className="absolute top-1.5 right-1 lg:right-1.5 xl:right-2 h-1 w-1 rounded-full"
                      style={{
                        background: "var(--sol-green-hex)",
                        boxShadow: "0 0 5px color-mix(in srgb, var(--sol-green-hex) 80%, transparent)",
                      }}
                    />
                    {/* Active underline */}
                    <span
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[1.5px]"
                      style={{
                        width: "calc(100% - 16px)",
                        background: "linear-gradient(90deg, transparent, var(--sol-green-hex), transparent)",
                      }}
                    />
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Spacer — pushes right actions to the end on mobile/tablet when nav is hidden */}
        <div className="flex-1 lg:hidden" />

        {/* Right — Actions (never shrinks, overflow hidden as safety net) */}
        <div className="flex items-center gap-0.5 lg:gap-0.5 xl:gap-1 shrink-0 overflow-hidden">
          {/* Gamification — only at 2xl (1536px+) when there's genuinely room */}
          <div className="hidden 2xl:flex shrink-0">
            <NavGamification />
          </div>

          {/* Search — visible at lg+ (hidden on tablet to save space) */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hidden lg:flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-muted shrink-0"
            aria-label={tc("search")}
            style={{ color: "#4A4958" }}
          >
            <Search className="h-3.5 w-3.5" />
          </button>

          {/* Notifications — visible at xl+ only (saves crucial space at lg) */}
          <div className="hidden xl:flex shrink-0">
            <NotificationCenter />
          </div>

          {/* Auth/wallet buttons — visible at lg+ */}
          <div className="hidden lg:flex items-center gap-0.5 xl:gap-1 shrink-0">
            <SignInButton />
            <WalletButton />
          </div>

          {/* Language & theme — visible at xl+ */}
          <div className="hidden xl:flex items-center gap-0.5 shrink-0">
            <LocaleSwitcher />
            <ThemeToggle />
          </div>

          {/* Hamburger button — visible below lg (covers mobile + tablet) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex lg:hidden h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-muted shrink-0"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 text-foreground/70" />
          </button>
        </div>
      </div>

      {/* Mobile slide-out menu */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="right"
          className="w-[280px] bg-background/98 dark:bg-[#08080B]/98 border-l border-border/30 p-0"
          style={{
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
          }}
        >
          <SheetHeader className="px-5 pt-5 pb-4 border-b border-border/20">
            <SheetTitle className="flex items-center gap-2.5">
              <AcademyLogo />
              <span
                className="text-[13px] font-bold tracking-tight text-foreground"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Super<span style={{ color: "var(--sol-green-hex)" }}>team</span>{" "}
                Academy
              </span>
            </SheetTitle>
          </SheetHeader>

          <nav className="flex flex-col px-3 py-4 gap-1" aria-label="Mobile navigation">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <SheetClose asChild key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md text-[12px] font-semibold tracking-[0.08em] transition-colors",
                      isActive
                        ? "text-[#0d9668] dark:text-[#14F195] bg-[#0d9668]/[0.08] dark:bg-[#14F195]/[0.06]"
                        : "text-foreground/65 hover:text-foreground hover:bg-muted/50"
                    )}
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    <Icon className={cn(
                      "h-4 w-4 shrink-0",
                      isActive ? "opacity-100" : "opacity-50"
                    )} aria-hidden="true" />
                    {t(item.key).toUpperCase()}
                  </Link>
                </SheetClose>
              );
            })}
          </nav>

          {/* Search inside sheet for mobile/tablet */}
          <div className="border-t border-border/20 px-4 py-3">
            <SheetClose asChild>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setTimeout(() => setSearchOpen(true), 150);
                }}
                className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-[12px] font-semibold tracking-[0.08em] text-foreground/65 hover:text-foreground hover:bg-muted/50 transition-colors"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                <Search className="h-3.5 w-3.5 shrink-0" />
                {tc("search").toUpperCase()}
              </button>
            </SheetClose>
          </div>

          <div className="border-t border-border/20 px-4 py-4 space-y-3">
            <SignInButton />
            <WalletButton />
          </div>

          <div className="border-t border-border/20 px-4 py-3 flex items-center gap-2">
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </SheetContent>
      </Sheet>

      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
