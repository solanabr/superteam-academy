"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";

const ADMIN_TABS = [
  { key: "overview", href: "/admin" },
  { key: "users", href: "/admin/users" },
  { key: "courses", href: "/admin/courses" },
  { key: "analytics", href: "/admin/analytics" },
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useI18n();

  useEffect(() => {
    if (!loading && !profile?.is_admin) {
      router.replace("/dashboard");
    }
  }, [loading, profile, router]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-neutral-300 dark:border-neutral-600 border-t-neutral-900 dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile?.is_admin) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("nav.admin")}</h1>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 border-b border-neutral-200 dark:border-neutral-800">
        {ADMIN_TABS.map((tab) => {
          const isActive = tab.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                isActive
                  ? "border-neutral-900 dark:border-white text-neutral-900 dark:text-white"
                  : "border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
              }`}
            >
              {t(`admin.${tab.key}`)}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}
