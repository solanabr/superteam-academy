"use client";

import NextLink from "next/link";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { UserMenu } from "@/components/auth";
import {
  BookOpen,
  LayoutDashboard,
  Trophy,
  User,
  Menu,
  X,
  Sun,
  Moon,
  Globe,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useAppStore } from "@/stores/app-store";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/courses", labelKey: "courses" as const, icon: BookOpen },
  { href: "/dashboard", labelKey: "dashboard" as const, icon: LayoutDashboard },
  { href: "/leaderboard", labelKey: "leaderboard" as const, icon: Trophy },
  { href: "/profile", labelKey: "profile" as const, icon: User },
];

const localeLabels: Record<string, string> = {
  en: "English",
  "pt-br": "Português",
  es: "Español",
};

export function Navbar() {
  const t = useTranslations("navigation");
  const pathname = usePathname();
  const { theme, setTheme } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <NextLink href="/" className="flex items-center gap-2.5 font-semibold text-lg tracking-tight">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            S
          </div>
          <span className="hidden sm:inline">Superteam Academy</span>
        </NextLink>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <item.icon className="h-4 w-4" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Language */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Globe className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {Object.entries(localeLabels).map(([loc, label]) => (
                <DropdownMenuItem key={loc} asChild>
                  <Link href={pathname} locale={loc as "en" | "pt-br" | "es"}>
                    {label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={toggleTheme}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* Auth + Wallet */}
          <div className="hidden sm:flex items-center gap-2">
            <WalletMultiButton
              style={{
                height: "36px",
                fontSize: "14px",
                borderRadius: "8px",
                backgroundColor: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
                fontFamily: "inherit",
                fontWeight: 500,
                padding: "0 16px",
                border: "none",
              }}
            />
            <UserMenu />
          </div>

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                {mobileOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex flex-col h-full">
                <div className="border-b p-4">
                  <span className="font-semibold text-lg">Superteam Academy</span>
                </div>
                <div className="flex flex-col gap-1 p-4">
                  {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-secondary text-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {t(item.labelKey)}
                      </Link>
                    );
                  })}
                </div>
                <div className="mt-auto border-t p-4 space-y-3">
                  <WalletMultiButton
                    style={{
                      width: "100%",
                      height: "40px",
                      fontSize: "14px",
                      borderRadius: "8px",
                      backgroundColor: "hsl(var(--primary))",
                      color: "hsl(var(--primary-foreground))",
                      fontFamily: "inherit",
                      fontWeight: 500,
                      justifyContent: "center",
                      border: "none",
                    }}
                  />
                  <UserMenu />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
