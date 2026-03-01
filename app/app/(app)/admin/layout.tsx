"use client";

import { useIsAdmin } from "@/hooks";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import {
  Settings,
  BookOpen,
  KeyRound,
  Award,
  ChevronRight,
  Key,
  BarChart2,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminLoginGate } from "@/components/app/AdminLoginGate";

const adminNavItems = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/config", label: "Config", icon: Settings },
  { href: "/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/credentials", label: "Credentials", icon: Award },
  { href: "/admin/minters", label: "Minters", icon: KeyRound },
  { href: "/admin/achievements", label: "Achievements", icon: Award },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/admin/api-keys", label: "API Keys", icon: Key },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin, isLoading } = useIsAdmin();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace("/dashboard");
    }
  }, [isAdmin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <nav className="flex flex-wrap items-center gap-2 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 sm:border-4 border-border bg-card">
          <div className="flex flex-wrap gap-2">
          {adminNavItems.map(({ href, label, icon: Icon, exact }) => {
            const active = exact
              ? pathname === href
              : pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base font-game transition-colors border-2",
                  active
                    ? "bg-yellow-400/20 text-yellow-400 border-yellow-400/40"
                    : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground hover:border-border"
                )}
              >
                {Icon && <Icon className="h-4 w-4 shrink-0" />}
                {label}
              </Link>
            );
          })}
          </div>
          <a
            href="/studio"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base font-game border-2 border-yellow-400/40 bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20 transition-colors w-full sm:w-auto sm:ml-auto"
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            Content Studio
          </a>
        </nav>
        <AdminLoginGate>{children}</AdminLoginGate>
      </div>
  );
}
