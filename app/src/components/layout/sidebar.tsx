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
    <aside className="hidden w-64 flex-col border-r border-white/10 bg-zinc-950/60 p-4 lg:flex">
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
                  ? "border-[#14F195]/30 bg-gradient-to-r from-[#9945FF]/25 to-[#14F195]/10 text-white"
                  : "border-transparent text-zinc-400 hover:border-white/10 hover:bg-zinc-900/70 hover:text-zinc-200",
              )}
            >
              <Icon className="size-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3 rounded-xl border border-white/10 bg-zinc-900/70 p-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-9 border border-white/15">
            <AvatarImage src={profile.avatar} alt={profile.displayName} />
            <AvatarFallback>{profile.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-zinc-100">{profile.displayName}</p>
            <p className="text-xs text-zinc-400">@{profile.username}</p>
          </div>
        </div>
        <div className="rounded-md border border-white/10 bg-zinc-950/70 px-3 py-2">
          <p className="text-xs uppercase tracking-wide text-zinc-500">XP</p>
          <p className="text-sm font-semibold text-[#14F195]">{profile.xp.toLocaleString()}</p>
        </div>
      </div>
    </aside>
  );
}
