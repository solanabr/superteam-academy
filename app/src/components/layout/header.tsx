"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "./theme-toggle";
import { LocaleSwitcher } from "./locale-switcher";
import { UserMenu } from "@/components/auth/user-menu";
import { Menu, GraduationCap, Trophy, LayoutDashboard, Sparkles } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

export function Header() {
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);
  const navLinks = [
    { href: "/courses" as const, label: t("courses"), icon: GraduationCap },
    { href: "/dashboard" as const, label: t("dashboard"), icon: LayoutDashboard },
    { href: "/leaderboard" as const, label: t("leaderboard"), icon: Trophy },
    { href: "/community" as const, label: t("community"), icon: Sparkles },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="hidden text-xl font-bold sm:inline-block">
              {t("appName")}
            </span>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-border">|</span>
              <span className="text-xs text-muted-foreground">by</span>
              <Image
                src="/logos/ST-YELLOW-HORIZONTAL.svg"
                alt="Superteam Brasil"
                width={130}
                height={22}
                className="hidden dark:inline-block"
              />
              <Image
                src="/logos/ST-DARK-GREEN-HORIZONTAL.svg"
                alt="Superteam Brasil"
                width={130}
                height={22}
                className="inline-block dark:hidden"
              />
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button variant="ghost" size="sm" className="gap-2">
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Button>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <ThemeToggle />
          <div className="hidden md:flex items-center ml-1">
            <UserMenu />
          </div>

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <nav className="mt-8 flex flex-col gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                  >
                    <Button variant="ghost" className="w-full justify-start gap-3">
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </Button>
                  </Link>
                ))}
                <div className="my-2 border-t" />
                <div className="px-2">
                  <UserMenu />
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
