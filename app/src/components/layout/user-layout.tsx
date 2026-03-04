"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Trophy,
  User,
  FileCheck,
  Settings,
  Shield,
  Menu,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { WalletStatus } from "@/components/layout/wallet-status";
import { useTheme } from "next-themes";
import Image from "next/image";

const USER_NAV: { href: string; key: string; icon: React.ElementType }[] = [
  { href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { href: "/leaderboard", key: "leaderboard", icon: Trophy },
  { href: "/profile", key: "profile", icon: User },
  { href: "/certificates", key: "certificates", icon: FileCheck },
  { href: "/settings", key: "settings", icon: Settings },
];

function getRoleKey(role: string): string {
  if (role === "super_admin") return "role.superAdmin";
  if (role === "admin") return "role.admin";
  return "role.user";
}

type UserLayoutProps = {
  children: ReactNode;
  pageTitle?: string;
};

export function UserLayout({ children, pageTitle }: UserLayoutProps): ReactNode {
  const t = useTranslations("user");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const session = useAuthStore((s) => s.session);
  const isLoaded = useAuthStore((s) => s.is_loaded);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isDark = useTheme().theme === "dark";
  const logoSrc = isDark ? "/dark-logo.jpg" : "/light-logo.jpg";

  const isAdmin = session?.role === "admin" || session?.role === "super_admin";
  const roleKey = session?.role ? getRoleKey(session.role) : "role.user";

  const derivedTitle = (() => {
    if (pageTitle) return pageTitle;
    if (pathname === "/dashboard" || pathname.startsWith("/dashboard")) return t("nav.dashboard");
    if (pathname.startsWith("/leaderboard")) return t("nav.leaderboard");
    if (pathname.startsWith("/profile")) return t("nav.profile");
    if (pathname.startsWith("/certificates")) return t("nav.certificates");
    if (pathname.startsWith("/settings")) return t("nav.settings");
    if (pathname.startsWith("/admin")) return t("nav.admin");
    return t("nav.dashboard");
  })();

  const navContent = (
    <nav
      className="flex flex-col gap-0.5 p-2"
      aria-label={t("nav.dashboard")}
    >
      {USER_NAV.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link
            key={item.key}
            href={item.href}
            onClick={() => setMobileNavOpen(false)}
            className={`flex items-center gap-3 rounded-none border-2 px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive
                ? "border-foreground bg-accent text-accent-foreground"
                : "border-transparent bg-transparent text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground"
              }`}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {t(`nav.${item.key}`)}
          </Link>
        );
      })}
      {isAdmin && (
        <>
          <Separator className="my-2" />
          <Link
            href="/admin"
            onClick={() => setMobileNavOpen(false)}
            className="flex items-center gap-3 rounded-none border-2 border-transparent px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Shield className="size-4 shrink-0" aria-hidden />
            {t("nav.admin")}
          </Link>
        </>
      )}
    </nav>
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <header className="z-40 flex h-14 shrink-0 items-center justify-between border-b-2 border-border bg-background px-4">
        <div className="flex items-center gap-3">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-none border-2 md:hidden"
                aria-label={t("header.openProfile")}
              >
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="flex w-64 flex-col rounded-none border-r-2 p-0"
            >
              <div className="flex h-14 items-center border-b-2 border-border px-3">
                <span className="font-semibold text-foreground">
                  {tCommon("siteName")}
                </span>
              </div>
              <ScrollArea className="flex-1 py-2">{navContent}</ScrollArea>
              <div className="shrink-0 space-y-3 border-t-2 border-border p-3">
                <WalletStatus variant="sidebar" />
                <LocaleSwitcher />
                <ThemeToggle />
                {session && (
                  <>
                    <Separator className="my-2" />
                    <p className="truncate text-xs font-medium text-foreground">
                      {session.email}
                    </p>
                    <p className="text-xs text-muted-foreground">{t(roleKey)}</p>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
          <Link href="/" className="hover:scale-95 transition-transform duration-200">
            <Image
              src={logoSrc}
              alt="Superteam Academy"
              width={100}
              height={24}
              loading="eager"
            />
          </Link>
          <h1 className="text-lg font-bold text-foreground">
            {derivedTitle}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex md:items-center md:gap-3">
            <WalletStatus variant="sidebar" />
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
          {isLoaded && session && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-none border-2 gap-2 px-4 py-3"
                  aria-label={t("header.openProfile")}
                >
                  <Avatar className="size-7 rounded-none border-2 border-border">
                    <AvatarFallback className="rounded-none text-xs font-bold">
                      {session.email?.charAt(0).toUpperCase() ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-[120px] truncate text-sm font-medium sm:inline">
                    {session.email}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-none border-2">
                <DropdownMenuLabel className="text-xs font-semibold">
                  {session.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer font-medium">
                    {t("header.goToSettings")}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside
          className="hidden w-56 shrink-0 flex-col overflow-hidden border-r-2 border-border bg-background md:flex"
          aria-label={t("nav.dashboard")}
        >
          <ScrollArea className="flex-1 py-2">
            {navContent}
          </ScrollArea>
          <div className="shrink-0 space-y-3 border-t-2 border-border p-3">
            <div className="space-y-2 md:hidden">
              <WalletStatus variant="sidebar" />
              <LocaleSwitcher />
              <ThemeToggle />
            </div>
            {session && (
              <>
                <Separator className="my-2 md:hidden" />
                <p className="truncate text-xs font-medium text-foreground">
                  {session.email}
                </p>
                <p className="text-xs text-muted-foreground">{t(roleKey)}</p>
              </>
            )}
          </div>
        </aside>
        <main className="min-h-0 min-w-0 flex-1 overflow-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
