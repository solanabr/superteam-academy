"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/lib/store/user-store";
import { useXp } from "@/hooks/use-xp";
import { useWallet } from "@solana/wallet-adapter-react";
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
  const walletAddress = useUserStore((state) => state.walletAddress);
  const { connected } = useWallet();
  const xp = useXp(walletAddress);

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex xl:w-60">
      <nav className="flex flex-col gap-0.5 p-3">
        {nav.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          const label = "label" in item ? item.label : t(item.labelKey);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
                active
                  ? "bg-sidebar-active/10 text-sidebar-active"
                  : "text-sidebar-foreground hover:bg-secondary/60 hover:text-foreground",
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-0.75 -translate-y-1/2 rounded-r-full bg-sidebar-active" />
              )}
              <Icon className={cn("size-4.5 transition-colors", active ? "text-sidebar-active" : "text-sidebar-foreground group-hover:text-foreground")} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {connected && (
        <div className="mt-auto border-t border-sidebar-border p-3">
          <div className="rounded-xl bg-secondary/40 p-3">
            <div className="flex items-center gap-2.5">
              <Avatar className="size-8 ring-2 ring-sidebar-active/20">
                <AvatarImage src={profile.avatar} alt={profile.displayName} />
                <AvatarFallback className="bg-sidebar-active/10 text-xs font-semibold text-sidebar-active">
                  {profile.displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{profile.displayName}</p>
                <p className="truncate text-[11px] text-muted-foreground">@{profile.username}</p>
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-between rounded-lg bg-background/60 px-2.5 py-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">XP</span>
              <span className="text-sm font-bold tabular-nums text-highlight">{xp.totalXp.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
