"use client";

import NextLink from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { UserMenu } from "@/components/auth";
import { useAdmin } from "@/hooks/use-admin";
import { useAuth } from "@/components/providers/auth-provider";
import { useHasCreatedCourses } from "@/hooks/use-has-created-courses";
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
  PlusCircle,
  ShieldCheck,
  FolderOpen,
  MessageSquare,
  FileText,
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
  { href: "/community", labelKey: "community" as const, icon: MessageSquare },
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
  const currentLocale = useLocale();
  const { theme, setTheme } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAdmin } = useAdmin();
  const { isAuthenticated } = useAuth();
  const { hasCreatedCourses } = useHasCreatedCourses();

  const showMyCourses = isAuthenticated && (hasCreatedCourses || pathname.startsWith("/my-courses") || pathname.startsWith("/edit-course"));

  const switchLocale = (loc: string) => {
    document.cookie = `NEXT_LOCALE=${loc};path=/;max-age=31536000`;
    window.location.reload();
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <NextLink href="/" className="flex items-center gap-2.5 font-semibold text-lg tracking-tight">
          <Image
            src="/superteam-logo.jpg"
            alt="Superteam"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span>Superteam Academy</span>
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

          {/* My Courses (only if user has created courses) */}
          {showMyCourses && (
            <Link
              href="/my-courses"
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith("/my-courses") || pathname.startsWith("/edit-course")
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <FolderOpen className="h-4 w-4" />
              My Courses
            </Link>
          )}

          {/* Create Course */}
          {isAuthenticated && (
            <Link
              href="/create-course"
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith("/create-course")
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <PlusCircle className="h-4 w-4" />
              Create
            </Link>
          )}

          {/* Admin link */}
          {isAdmin && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith("/admin")
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <ShieldCheck className="h-4 w-4" />
              Admin
            </Link>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Docs */}
          <NextLink href="/docs">
            <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Documentation">
              <FileText className="h-4 w-4" />
            </Button>
          </NextLink>

          {/* Language */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Change language">
                <Globe className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {Object.entries(localeLabels).map(([loc, label]) => (
                <DropdownMenuItem
                  key={loc}
                  onClick={() => switchLocale(loc as "en" | "pt-br" | "es")}
                  className={cn(currentLocale === loc && "font-semibold")}
                >
                  {label}
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
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* Auth + Wallet */}
          <div className="hidden sm:flex items-center gap-2">
            <UserMenu />
          </div>

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Open menu">
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

                  {/* Mobile: My Courses (only if user has created courses) */}
                  {showMyCourses && (
                    <Link
                      href="/my-courses"
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        pathname.startsWith("/my-courses") || pathname.startsWith("/edit-course")
                          ? "bg-secondary text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      )}
                    >
                      <FolderOpen className="h-4 w-4" />
                      My Courses
                    </Link>
                  )}

                  {/* Mobile: Create Course */}
                  {isAuthenticated && (
                    <Link
                      href="/create-course"
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        pathname.startsWith("/create-course")
                          ? "bg-secondary text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      )}
                    >
                      <PlusCircle className="h-4 w-4" />
                      Create Course
                    </Link>
                  )}

                  {/* Mobile: Admin */}
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        pathname.startsWith("/admin")
                          ? "bg-secondary text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      )}
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Admin
                    </Link>
                  )}
                  {/* Mobile: Docs */}
                  <NextLink
                    href="/docs"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    Docs
                  </NextLink>
                </div>
                <div className="mt-auto border-t p-4 space-y-3">
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
