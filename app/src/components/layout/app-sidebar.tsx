"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Trophy,
  Zap,
  MessageSquare,
  Bell,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { xpProgress } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { useLearningProgress } from "@/lib/hooks/use-learning-progress";
import { useNotificationUnreadCount } from "@/lib/hooks/use-notifications";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/challenges", label: "Daily Challenges", icon: Zap },
  { href: "/discussions", label: "Community", icon: MessageSquare },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { xp, isLoaded } = useLearningProgress();
  const notifCount = useNotificationUnreadCount();

  const xpData = xpProgress(xp);

  return (
    <aside
      className={cn(
        "relative flex shrink-0 flex-col border-r border-border bg-background transition-all duration-300",
        collapsed ? "w-16" : "w-56",
      )}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm hover:text-foreground"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 px-2 pt-6">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                collapsed ? "justify-center gap-0" : "gap-3",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {item.href === "/notifications" ? (
                <span className="relative shrink-0">
                  <item.icon className="h-4 w-4" />
                  {notifCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                      {notifCount > 99 ? "99+" : notifCount}
                    </span>
                  )}
                </span>
              ) : (
                <item.icon className="h-4 w-4 shrink-0" />
              )}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* XP Bar */}
      {isLoaded && (
        <div className={cn("mt-auto px-3 pb-6 pt-4", collapsed && "px-2")}>
          {collapsed ? (
            <div className="flex justify-center">
              <span className="text-xs font-bold text-muted-foreground">
                {xpData.level}
              </span>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium">Level {xpData.level}</span>
                <span>
                  {xp}/{xpData.nextLevelXp} XP
                </span>
              </div>
              <Progress value={xpData.progress} className="h-1.5" />
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
