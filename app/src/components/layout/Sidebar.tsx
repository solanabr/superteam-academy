"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { useSession } from "next-auth/react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  BookOpen,
  LayoutDashboard,
  Trophy,
  Users,
  Search,
  Zap,
  Flame,
  Settings,
  Sparkles,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn, getLevel, getLevelProgress, formatXp } from "@/lib/utils";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { useXpBalance } from "@/hooks/useXpBalance";
import { useProgressStore } from "@/stores/progress-store";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

const SIDEBAR_EXPANDED = 220;
const SIDEBAR_COLLAPSED = 68;

export function Sidebar() {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const { data: session } = useSession();
  const { connected } = useWallet();
  const { xp } = useXpBalance();
  const streakDays = useProgressStore((s) => s.streakDays);
  const [collapsed, setCollapsed] = useState(false);

  function openGlobalSearch() {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
  }

  useEffect(() => {
    document.documentElement.setAttribute("data-sidebar", collapsed ? "collapsed" : "expanded");
  }, [collapsed]);

  const isAuthenticated = !!session?.user;
  const level = getLevel(xp);
  const levelProgress = getLevelProgress(xp);
  const showXp = isAuthenticated && connected && xp > 0;

  const navItems = [
    { href: "/courses" as const, label: t("courses"), icon: BookOpen },
    { href: "/dashboard" as const, label: t("dashboard"), icon: LayoutDashboard },
    { href: "/leaderboard" as const, label: t("leaderboard"), icon: Trophy },
    { href: "/community" as const, label: t("community"), icon: Users },
  ];

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        style={{ "--sidebar-w": `${collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED}px` } as React.CSSProperties}
        className={cn(
          "sidebar-root hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-40 border-r border-border/40 bg-background/95 backdrop-blur-xl transition-all duration-300 ease-out",
          collapsed ? "w-[68px]" : "w-[220px]"
        )}
      >
        {/* Logo + collapse toggle */}
        <div className="flex h-14 items-center justify-between px-3 border-b border-border/30 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 shrink-0 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary/80 to-secondary/60 shadow-lg shadow-primary/25">
              <Sparkles className="h-4.5 w-4.5 text-primary-foreground" aria-hidden="true" />
            </div>
            {!collapsed && (
              <span className="text-sm font-bold tracking-tight truncate sidebar-label">
                <span className="text-foreground">Super</span>
                <span className="gradient-text">team</span>
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-muted/60 hover:text-foreground"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronsRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronsLeft className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {/* Search trigger */}
        <div className="px-2.5 pt-3 pb-1 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={openGlobalSearch}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg border border-border/40 bg-muted/20 px-2.5 py-2 text-muted-foreground/70 transition-all hover:bg-muted/40 hover:text-foreground hover:border-border/60",
                  collapsed && "justify-center px-0"
                )}
              >
                <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
                {!collapsed && (
                  <>
                    <span className="text-xs flex-1 text-left">{tc("search")}</span>
                    <kbd className="inline-flex h-[18px] items-center rounded border border-border/50 bg-background/60 px-1 font-mono text-[9px] text-muted-foreground/50">
                      ⌘K
                    </kbd>
                  </>
                )}
              </button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="text-xs">
                {tc("search")} <kbd className="ml-1 font-mono text-[10px]">⌘K</kbd>
              </TooltipContent>
            )}
          </Tooltip>
        </div>

        {/* Navigation */}
        <nav aria-label={tc("mainNavigation")} className="flex-1 overflow-y-auto px-2.5 py-2 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            const linkContent = (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "sidebar-nav-item group flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[13px] font-medium transition-all duration-200 relative",
                  collapsed && "justify-center px-0",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
                )}
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                  aria-hidden="true"
                />
                {!collapsed && <span className="truncate sidebar-label">{item.label}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" className="text-xs font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }
            return linkContent;
          })}
        </nav>

        {/* XP Progress Card — only when authenticated */}
        {showXp && (
          <div className={cn("px-2.5 py-2 shrink-0", collapsed && "px-1.5")}>
            <Link href="/dashboard">
              <div
                className={cn(
                  "rounded-xl border border-primary/15 bg-gradient-to-b from-primary/5 to-transparent p-3 transition-all hover:border-primary/25 hover:from-primary/8",
                  collapsed && "p-2 flex items-center justify-center"
                )}
              >
                {collapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col items-center gap-1">
                        <Zap className="h-4 w-4 text-primary" aria-hidden="true" />
                        <span className="text-[10px] font-bold text-primary tabular-nums">{level}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-xs">
                      {formatXp(xp)} XP · Level {level}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                        <span className="text-xs font-bold text-primary tabular-nums">
                          {formatXp(xp)} XP
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        Lv.{level}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/40 mb-2">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-secondary/70 transition-all duration-700"
                        style={{ width: `${levelProgress}%` }}
                      />
                    </div>
                    {streakDays > 0 && (
                      <div className="flex items-center gap-1">
                        <Flame className="h-3 w-3 text-orange-500" aria-hidden="true" />
                        <span className="text-[11px] font-medium text-orange-500">
                          {streakDays}d streak
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Link>
          </div>
        )}

        {/* Bottom utilities */}
        <div className={cn(
          "border-t border-border/30 px-2.5 py-2 shrink-0 space-y-0.5",
          collapsed && "flex flex-col items-center"
        )}>
          {/* Settings link */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/settings"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                >
                  <Settings className="h-[18px] w-[18px]" aria-hidden="true" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">{t("settings")}</TooltipContent>
            </Tooltip>
          ) : (
            <Link
              href="/settings"
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            >
              <Settings className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
              <span className="sidebar-label">{t("settings")}</span>
            </Link>
          )}

          {/* Locale + Theme row */}
          <div className={cn(
            "flex items-center gap-0.5",
            collapsed ? "flex-col" : "px-1"
          )}>
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </aside>

    </TooltipProvider>
  );
}
