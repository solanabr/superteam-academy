"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/lib/store/user-store";
import { BarChart3, BookOpen, Home, Settings, Trophy, UserCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/courses", labelKey: "courses", icon: BookOpen },
  { href: "/dashboard", labelKey: "dashboard", icon: BarChart3 },
  { href: "/leaderboard", labelKey: "leaderboard", icon: Trophy },
  { href: "/profile/you", labelKey: "profile", icon: UserCircle },
  { href: "/settings", labelKey: "settings", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations("Common");
  const profile = useUserStore((state) => state.profile);

  return (
    <aside className="hidden w-64 flex-col border-r border-border bg-st-dark/60 p-4 lg:flex">
      <nav className="flex flex-col gap-2">
        {nav.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          const label = "label" in item ? item.label : t(item.labelKey);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition",
                active
                  ? "border-[#ffd23f]/30 bg-gradient-to-r from-[#2f6b3f]/25 to-[#ffd23f]/10 text-foreground"
                  : "border-transparent text-muted-foreground hover:border-border hover:bg-card hover:text-foreground/90",
              )}
            >
              <Icon className="size-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3 rounded-xl border border-border bg-card p-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-9 border border-border">
            <AvatarImage src={profile.avatar} alt={profile.displayName} />
            <AvatarFallback>{profile.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-foreground">{profile.displayName}</p>
            <p className="text-xs text-muted-foreground">@{profile.username}</p>
          </div>
        </div>
        <div className="rounded-md border border-border bg-st-dark/70 px-3 py-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground/70">XP</p>
          <p className="text-sm font-semibold text-[#ffd23f]">{profile.xp.toLocaleString()}</p>
        </div>
      </div>
    </aside>
  );
}
