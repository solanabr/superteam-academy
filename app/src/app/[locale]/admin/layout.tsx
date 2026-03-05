"use client";

import { AdminGuard } from "@/components/admin-guard";
import { Link, usePathname } from "@/i18n/navigation";
import { ModeToggle } from "@/components/mode-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Users, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { ClipboardCheck, BookOpen, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const t = useTranslations("Admin");

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-[#060606]">
        <aside className="flex w-72 flex-col border-r border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-2 border-b border-white/10 px-6 text-lg font-bold text-fuchsia-200">
            <Sparkles className="h-4 w-4 text-cyan-300" /> {t("layoutTitle")}
          </div>
          <nav className="flex-1 space-y-2 p-4">
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 transition-all",
                pathname === "/admin" ? "bg-purple-500/20 text-white border border-purple-300/30" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
              )}
            >
              <LayoutDashboard className="h-4 w-4" /> {t("overview")}
            </Link>
            <Link
              href="/admin/courses"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 transition-all",
                pathname.startsWith("/admin/courses") ? "bg-cyan-500/20 text-white border border-cyan-300/30" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
              )}
            >
              <BookOpen className="h-4 w-4" /> {t("manageCourses")}
            </Link>
            <Link
              href="/admin/users"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 transition-all",
                pathname.startsWith("/admin/users") ? "bg-amber-500/20 text-white border border-amber-300/30" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
              )}
            >
              <Users className="h-4 w-4" /> {t("users")}
            </Link>
            <Link
              href="/admin/review"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 transition-all",
                pathname.startsWith("/admin/review") ? "bg-emerald-500/20 text-white border border-emerald-300/30" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
              )}
            >
              <ClipboardCheck className="h-4 w-4" /> {t("reviewSubmissions")}
            </Link>
          </nav>
          <div className="border-t border-white/10 p-4">
            <Link href="/dashboard" className="text-sm text-zinc-400 transition-colors hover:text-cyan-300">
              {t("backToApp")}
            </Link>
          </div>
        </aside>

        <main className="flex flex-1 flex-col">
          <header className="flex h-16 items-center justify-end gap-4 border-b border-white/10 bg-black/40 px-6">
            <ModeToggle />
            <LanguageSwitcher />
          </header>
          <div className="p-8">{children}</div>
        </main>
      </div>
    </AdminGuard>
  );
}
