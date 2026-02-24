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
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/config", label: "Config", icon: Settings },
  { href: "/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/minters", label: "Minters", icon: KeyRound },
  { href: "/admin/achievements", label: "Achievements", icon: Award },
  { href: "/admin/api-keys", label: "API Keys", icon: Key },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin, role, isLoading } = useIsAdmin();
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
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-2 border-b border-border pb-4">
        {adminNavItems.map(({ href, label, icon: Icon, exact }) => {
          const active = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {Icon && <Icon className="h-4 w-4 shrink-0" />}
              {label}
              {active && <ChevronRight className="h-4 w-4 shrink-0" />}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
