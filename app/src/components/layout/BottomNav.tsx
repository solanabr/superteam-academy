"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { BookOpen, LayoutDashboard, Trophy, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const items = [
    { href: "/courses" as const, label: t("courses"), icon: BookOpen },
    { href: "/dashboard" as const, label: t("dashboard"), icon: LayoutDashboard },
    { href: "/leaderboard" as const, label: t("leaderboard"), icon: Trophy },
    { href: "/community" as const, label: t("community"), icon: Users },
  ];

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 bg-background/95 backdrop-blur-xl md:hidden safe-area-bottom"
    >
      <div className="flex items-center justify-around px-2 h-14">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "bottom-nav-item flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg transition-all",
                isActive && "bg-primary/15 shadow-sm shadow-primary/10"
              )}>
                <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
              </div>
              <span className={cn(
                "text-[10px] font-medium leading-none",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
