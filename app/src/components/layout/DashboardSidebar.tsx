"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useSidebar } from "@/components/layout/SidebarContext";
import { useI18n } from "@/components/providers/I18nProvider";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const NAV_ITEMS = [
  {
    key: "dashboard" as const,
    href: "/dashboard",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
    ),
  },
  {
    key: "courses" as const,
    href: "/courses",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
    ),
  },
  {
    key: "leaderboard" as const,
    href: "/leaderboard",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
    ),
  },
  {
    key: "profile" as const,
    href: "/profile",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
    ),
  },
  {
    key: "settings" as const,
    href: "/settings",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
    ),
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar();
  const { t } = useI18n();

  const displayName =
    profile?.display_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Learner";

  const avatarInitial = (
    profile?.display_name || user?.email || "U"
  )
    .charAt(0)
    .toUpperCase();

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
        aria-label="Open sidebar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="8" x2="20" y2="8"/><line x1="4" y1="16" x2="20" y2="16"/></svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col transition-all duration-300 ease-in-out
          ${collapsed ? "w-[72px]" : "w-[260px]"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
        `}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-4 h-16 border-b border-neutral-100 dark:border-neutral-800 flex-shrink-0 ${collapsed ? "px-3" : "px-5"}`}>
          <Link
            href="/"
            className={`text-lg font-semibold tracking-tight hover:opacity-70 transition-opacity ${collapsed ? "hidden" : "block"}`}
          >
            Caminho.
          </Link>
          {collapsed && (
            <Link href="/" className="text-lg font-semibold tracking-tight hover:opacity-70 transition-opacity mx-auto">
              C.
            </Link>
          )}

          {/* Collapse toggle (desktop only) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
            >
              <path d="m11 17-5-5 5-5" />
              <path d="m18 17-5-5 5-5" />
            </svg>
          </button>

          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-400"
            aria-label="Close sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const label = t(`nav.${item.key}`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                  ${isActive
                    ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white"
                  }
                  ${collapsed ? "justify-center px-0" : ""}
                `}
              >
                <span className={`flex-shrink-0 ${isActive ? "text-white dark:text-neutral-900" : "text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-300"}`}>
                  {item.icon}
                </span>
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}

          {/* Admin link (only for admins) */}
          {profile?.is_admin && (
            <>
              <div className="my-2 border-t border-neutral-100 dark:border-neutral-800" />
              {(() => {
                const isAdminActive = pathname.startsWith("/admin");
                const adminLabel = t("nav.admin");
                return (
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? adminLabel : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                      ${isAdminActive
                        ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm"
                        : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white"
                      }
                      ${collapsed ? "justify-center px-0" : ""}
                    `}
                  >
                    <span className={`flex-shrink-0 ${isAdminActive ? "text-white dark:text-neutral-900" : "text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-300"}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </span>
                    {!collapsed && <span>{adminLabel}</span>}
                  </Link>
                );
              })()}
            </>
          )}
        </nav>

        {/* Theme & Language (only when expanded) */}
        {!collapsed && (
          <div className="px-4 pb-2 flex items-center gap-2">
            <ThemeToggle compact />
            <LanguageSwitcher compact />
          </div>
        )}

        {/* User section */}
        <div className={`border-t border-neutral-100 dark:border-neutral-800 p-3 flex-shrink-0 ${collapsed ? "px-2" : "px-4"}`}>
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-neutral-900 dark:bg-white flex items-center justify-center text-xs font-bold text-white dark:text-neutral-900">
                {avatarInitial}
              </div>
              <button
                onClick={signOut}
                title={t("common.signOut")}
                className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-neutral-900 dark:bg-white flex items-center justify-center text-xs font-bold text-white dark:text-neutral-900 flex-shrink-0">
                {avatarInitial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{displayName}</p>
                <p className="text-[11px] text-neutral-400 truncate">
                  {user?.email || t("profile.walletUser")}
                </p>
              </div>
              <button
                onClick={signOut}
                title={t("common.signOut")}
                className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 flex-shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
