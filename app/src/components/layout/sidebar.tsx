"use client";

import { cn } from "@/lib/utils";
import { BarChart3, BookOpen, Home, Settings, Trophy, UserCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", labelKey: "dashboard", icon: Home },
  { href: "/courses", labelKey: "courses", icon: BookOpen },
  { href: "/dashboard", labelKey: "dashboard", icon: BarChart3 },
  { href: "/leaderboard", labelKey: "leaderboard", icon: Trophy },
  { href: "/profile/you", labelKey: "profile", icon: UserCircle },
  { href: "/settings", labelKey: "settings", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations("Common");

  return (
    <aside className="hidden w-64 flex-col border-r border-white/10 bg-zinc-950/60 p-4 lg:flex">
      <nav className="flex flex-col gap-2">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                active
                  ? "bg-gradient-to-r from-[#9945FF]/25 to-[#14F195]/10 text-white"
                  : "text-zinc-400 hover:bg-zinc-900/70 hover:text-zinc-200",
              )}
            >
              <Icon className="size-4" />
              <span>{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
