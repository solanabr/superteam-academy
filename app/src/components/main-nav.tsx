"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { LayoutDashboard, GraduationCap, Trophy, Settings, MessageSquare, PenTool, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export function MainNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const t = useTranslations("MainNav");

  const items = [
    { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
    { key: "courses", href: "/courses", icon: GraduationCap },
    { key: "forum", href: "/forum", icon: MessageSquare },
    { key: "leaderboard", href: "/leaderboard", icon: Trophy },
    { key: "settings", href: "/settings", icon: Settings },
  ];

return (
  <div className={cn("flex h-full flex-col rounded-2xl border border-border/60 bg-card/60 p-3 backdrop-blur-md", className)}>
    <nav className="flex flex-1 flex-col space-y-2">
      {items.map((item) => {
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm font-medium transition-all duration-200",
              active
                ? "border-primary/30 bg-primary/15 text-foreground shadow-[0_0_20px_rgba(59,130,246,0.25)]"
                : "text-muted-foreground hover:border-primary/30 hover:bg-primary/10 hover:text-foreground"
            )}
          >
            <item.icon
              className={cn(
                "h-4 w-4",
                active ? "text-primary" : "text-muted-foreground group-hover:text-primary"
              )}
            />
            {t(item.key)}
          </Link>
        );
      })}

      {/* Creator Studio Block */}
      <div className="mt-4 rounded-2xl border border-fuchsia-400/25 bg-gradient-to-r from-purple-600/15 to-fuchsia-600/10 p-2">
        <Link
          href="/creator"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-all",
            pathname.startsWith("/creator")
              ? "bg-fuchsia-500 text-white shadow-[0_0_30px_rgba(217,70,239,0.5)]"
              : "text-fuchsia-200 hover:bg-fuchsia-500/20"
          )}
        >
          <PenTool className="h-4 w-4" />
          {t("creatorStudio")}
        </Link>
      </div>

      {/* Back to Home */}
      <div className="mt-auto border-t border-border/60 pt-3">
        <Link
          href="/"
          className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <Home className="h-3.5 w-3.5" />
          {t("backHome")}
        </Link>
      </div>
    </nav>
  </div>
);
}
