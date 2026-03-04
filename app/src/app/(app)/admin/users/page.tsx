"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/providers/I18nProvider";

interface AdminUser {
  id: string;
  display_name: string | null;
  email: string | null;
  created_at: string;
  total_xp: number;
  current_streak: number;
  enrollment_count: number;
}

export default function AdminUsersPage() {
  const { t } = useI18n();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetchUsers() {
      // Fetch profiles with their XP data
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, created_at, user_xp(total_xp, current_streak)")
        .order("created_at", { ascending: false });

      // Fetch enrollment counts per user
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("user_id");

      const enrollmentCounts: Record<string, number> = {};
      enrollments?.forEach((e) => {
        enrollmentCounts[e.user_id] = (enrollmentCounts[e.user_id] || 0) + 1;
      });

      const mappedUsers: AdminUser[] = (profiles ?? []).map((p: Record<string, unknown>) => {
        const xp = Array.isArray(p.user_xp) ? p.user_xp[0] : p.user_xp;
        return {
          id: p.id as string,
          display_name: p.display_name as string | null,
          email: null, // email is in auth.users, not accessible via client
          created_at: p.created_at as string,
          total_xp: (xp as Record<string, unknown> | null)?.total_xp as number ?? 0,
          current_streak: (xp as Record<string, unknown> | null)?.current_streak as number ?? 0,
          enrollment_count: enrollmentCounts[p.id as string] || 0,
        };
      });

      setUsers(mappedUsers);
      setLoading(false);
    }

    fetchUsers();
  }, []);

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.display_name?.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-neutral-300 dark:border-neutral-600 border-t-neutral-900 dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search */}
      <div>
        <input
          type="text"
          placeholder={t("admin.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-shadow"
        />
      </div>

      {/* Table */}
      <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 dark:border-neutral-800">
              <th className="text-left py-2 px-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">{t("admin.name")}</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">{t("admin.coursesEnrolled")}</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">{t("admin.totalXP")}</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">{t("admin.streak")}</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">{t("admin.joined")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                <td className="py-2.5 px-3 font-medium">{u.display_name || "—"}</td>
                <td className="py-2.5 px-3">{u.enrollment_count}</td>
                <td className="py-2.5 px-3">{u.total_xp.toLocaleString()}</td>
                <td className="py-2.5 px-3">{u.current_streak} {t("dashboard.days")}</td>
                <td className="py-2.5 px-3 text-neutral-500 dark:text-neutral-400">{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-neutral-400">{t("common.noResults")}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
