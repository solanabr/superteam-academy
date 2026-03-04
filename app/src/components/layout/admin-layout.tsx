"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, LogOut, Menu, Shield, ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { SessionPayload } from "@/lib/types/auth";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeToggle } from "./theme-toggle";

type AdminLayoutProps = {
  children: ReactNode;
  session: SessionPayload;
  locale: string;
};

type AdminNavItem = {
  href: string;
  key: string;
};

const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin", key: "nav.dashboard" },
  { href: "/admin/users", key: "nav.users" },
  { href: "/admin/challenges", key: "nav.challenges" },
  { href: "/admin/achievements", key: "nav.achievements" },
  { href: "/admin/leaderboard", key: "nav.leaderboard" },
  { href: "/admin/certificates", key: "nav.certificates" },
  { href: "/admin/logs", key: "nav.logs" },
];

function get_role_label_key(role: SessionPayload["role"]): string {
  if (role === "super_admin") return "role.superAdmin";
  if (role === "admin") return "role.admin";
  return "role.user";
}

function get_role_variant(role: SessionPayload["role"]): "default" | "outline" {
  if (role === "super_admin") return "default";
  if (role === "admin") return "outline";
  return "outline";
}

export function AdminLayoutShell({ children, session, locale }: AdminLayoutProps): ReactNode {
  const t = useTranslations("admin");
  const pathname = usePathname();
  const router = useRouter();
  const [is_mobile_nav_open, set_is_mobile_nav_open] = useState(false);

  const handle_logout = async (): Promise<void> => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(`/${locale}/login`);
  };

  const render_nav_link = (item: AdminNavItem): ReactNode => {
    const is_active = pathname === `/${locale}(web)${item.href}` || pathname === `/${locale}${item.href}`;
    return (
      <Link
        key={item.key}
        href={item.href}
        className={`flex items-center justify-between border-b px-3 py-2 text-sm font-mono uppercase tracking-wide ${
          is_active ? "bg-accent text-accent-foreground" : "hover:bg-muted"
        }`}
      >
        <span>{t(item.key)}</span>
      </Link>
    );
  };

  const email_initial = session.email.charAt(0).toUpperCase();
  const role_label_key = get_role_label_key(session.role);
  const role_variant = get_role_variant(session.role);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <header className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Shield className="size-4" />
            <span className="font-mono text-xs uppercase tracking-[0.2em]">
              {t("label")}
            </span>
          </div>
          <Separator orientation="vertical" className="h-6" />
          <span className="font-mono text-xs uppercase text-muted-foreground">
            {t("environment")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="hidden items-center gap-1 rounded-none border px-2 py-1 text-[10px] font-mono uppercase tracking-wide md:inline-flex"
            onClick={() => router.push(`/${locale}/dashboard`)}
          >
            <ArrowLeft />
            {t("backToUser")}
          </Button>
          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle />
            <LocaleSwitcher />
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <Badge variant={role_variant} className="gap-1 rounded-none px-2 py-1 text-[10px] font-mono uppercase">
              <ShieldCheck className="size-3" />
              {t(role_label_key)}
            </Badge>
            <span className="text-xs font-mono">{session.email}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                className="rounded-none border px-0 py-0"
                aria-label={t("profileMenu")}
              >
                <Avatar className="size-8 rounded-none border">
                  <AvatarFallback className="rounded-none text-xs font-mono">
                    {email_initial}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-none">
              <DropdownMenuLabel className="font-mono text-xs uppercase tracking-wide">
                {t("profileTitle")}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="flex items-center gap-2 text-xs font-mono uppercase tracking-wide"
                onClick={handle_logout}
              >
                <LogOut className="size-3" />
                {t("logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Sheet open={is_mobile_nav_open} onOpenChange={set_is_mobile_nav_open}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                className="ml-2 flex md:hidden"
                aria-label={t("toggleNav")}
              >
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-64 flex-col rounded-none border-r p-0">
              <div className="flex h-14 items-center justify-between border-b px-3">
                <span className="font-mono text-xs uppercase tracking-[0.2em]">
                  {t("label")}
                </span>
              </div>
              <ScrollArea className="flex-1">
                <nav className="flex flex-col">{ADMIN_NAV_ITEMS.map(render_nav_link)}</nav>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-56 border-r md:block">
          <div className="flex h-14 items-center border-b px-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em]">
              {t("navigation")}
            </span>
          </div>
          <nav className="flex flex-col">{ADMIN_NAV_ITEMS.map(render_nav_link)}</nav>
        </aside>
        <main className="flex-1 overflow-y-auto px-4 py-6">{children}</main>
      </div>
    </div>
  );
}

