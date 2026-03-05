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
    <div className={cn("flex h-full flex-col", className)}>
      <nav className="flex flex-1 flex-col space-y-2 rounded-2xl border border-white/10 bg-black/20 p-3 backdrop-blur-md">
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
              <item.icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
                "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all",
                active
                  ? "border border-cyan-300/30 bg-gradient-to-r from-purple-600/30 to-cyan-600/20 text-white shadow-[0_0_30px_rgba(34,211,238,0.2)]"
                  : "text-zinc-300 hover:border hover:border-white/20 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className={cn("h-4 w-4", active ? "text-cyan-300" : "text-zinc-400 group-hover:text-cyan-300")} />
              {t(item.key)}
            </Link>
          );
        })}
      </nav>

      <div className="my-3 rounded-xl border border-primary/30 bg-primary/10 p-2">
        <Link
          href="/creator"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-all",
            pathname.startsWith("/creator") ? "bg-primary text-primary-foreground shadow-lg" : "text-primary hover:bg-primary/20"
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

      <div className="border-t border-border/60 pt-3">
        <Link href="/" className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
          <Home className="h-3.5 w-3.5" />
          {t("backHome")}
        </Link>
      </div>
    </div>
  );
}
