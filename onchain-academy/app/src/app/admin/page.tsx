"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Users,
  BookOpen,
  Zap,
  TrendingUp,
  ExternalLink,
  RefreshCw,
  Edit2,
  Check,
  X,
  ChevronRight,
  Activity,
  Target,
  BarChart3,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { useLocale } from "@/providers/locale-provider";

type AdminKpis = {
  users: number;
  activeLearners: number;
  totalXp: number;
  lessonAttempts: number;
  conversionRate: number;
};

type AdminCourse = {
  id: string;
  slug: string;
  title: string;
  track: string;
  learners: number;
  avgCompletion: number;
};

type AdminUser = {
  id: string;
  username: string;
  displayName: string;
  wallets: number;
  providers: string[];
  coursesInProgress: number;
  createdAt: string;
};

type AdminUsersResponse = {
  total: number;
  page: number;
  pageSize: number;
  items: AdminUser[];
};

type Tab = "overview" | "courses" | "users";
type AdminCheckResponse = { isAdmin: boolean };

async function fetchAdmin<T>(
  path: string,
  adminWallet?: string,
): Promise<T> {
  const response = await fetch(path, {
    cache: "no-store",
    ...(adminWallet ? { headers: { "x-admin-wallet": adminWallet } } : {}),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(body.error?.trim() ?? `HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  suffix = "",
}: {
  label: string;
  value: number | null;
  icon: LucideIcon;
  accent: string;
  suffix?: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-5"
      style={{ borderColor: "rgba(255,255,255,0.08)", background: "#0c1017" }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 10% 10%, ${accent}18, transparent 70%)`,
        }}
      />
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-white/30 mb-2">
            {label}
          </p>
          <p
            className="font-mono font-bold text-3xl leading-none"
            style={{ color: accent }}
          >
            {value === null ? (
              <span className="animate-pulse text-white/20">—</span>
            ) : (
              <>
                {value.toLocaleString()}
                {suffix}
              </>
            )}
          </p>
        </div>
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${accent}15`, color: accent }}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function AdminPage(): React.JSX.Element {
  const { t } = useLocale();
  const { publicKey } = useWallet();
  const [tab, setTab] = useState<Tab>("overview");
  const [kpis, setKpis] = useState<AdminKpis | null>(null);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState("");

  const CMS_STUDIO_URL =
    typeof window !== "undefined" && window.location.hostname === "localhost"
      ? "http://localhost:3333"
      : "/studio";

  const loadData = useCallback(async () => {
    setStatus("loading");
    setErrorMessage("");
    const adminWallet = publicKey?.toBase58();
    if (!adminWallet) {
      setStatus("error");
      setErrorMessage(t("adminPage.connectWallet"));
      return;
    }

    try {
      const adminCheck = await fetchAdmin<AdminCheckResponse>(
        "/api/admin/is-admin",
        adminWallet,
      );
      if (!adminCheck.isAdmin) {
        setStatus("error");
        setErrorMessage(t("adminPage.unauthorized"));
        return;
      }

      const [fetchedKpis, fetchedCourses, fetchedUsers] = await Promise.all([
        fetchAdmin<AdminKpis>("/api/admin/kpis", adminWallet),
        fetchAdmin<AdminCourse[]>("/api/admin/courses", adminWallet),
        fetchAdmin<AdminUsersResponse>(
          "/api/admin/users?page=1&pageSize=50",
          adminWallet,
        ),
      ]);
      setKpis(fetchedKpis);
      setCourses(fetchedCourses);
      setUsers(fetchedUsers.items);
      setStatus("ready");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load data",
      );
      setStatus("error");
    }
  }, [publicKey, t]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const beginEdit = (user: AdminUser): void => {
    setEditingUserId(user.id);
    setEditUsername(user.username);
    setEditDisplayName(user.displayName);
    setSaveError("");
  };

  const cancelEdit = (): void => {
    setEditingUserId(null);
    setEditUsername("");
    setEditDisplayName("");
    setSaveError("");
  };

  const saveUser = async (userId: string): Promise<void> => {
    const username = editUsername.trim();
    const displayName = editDisplayName.trim();
    if (!username || !displayName) {
      setSaveError("Username and display name are required");
      return;
    }
    setSavingUserId(userId);
    setSaveError("");
    try {
      const adminWallet = publicKey?.toBase58();
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          ...(adminWallet ? { "x-admin-wallet": adminWallet } : {}),
        },
        body: JSON.stringify({ username, displayName }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error?.trim() ?? "Save failed");
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, username, displayName } : u,
        ),
      );
      cancelEdit();
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : t("adminPage.saveError"),
      );
    } finally {
      setSavingUserId(null);
    }
  };

  const TABS: Array<{
    id: Tab;
    label: string;
    icon: LucideIcon;
  }> = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "courses", label: "Courses", icon: BookOpen },
    { id: "users", label: "Users", icon: Users },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <div>
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-white/25 mb-1">
            SUPERTEAM ACADEMY
          </p>
          <h1 className="font-display text-2xl font-bold text-white">
            Admin Console
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={CMS_STUDIO_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 h-9 px-4 rounded-xl border text-xs font-semibold transition-all"
            style={{
              borderColor: "rgba(153,69,255,0.35)",
              background: "rgba(153,69,255,0.1)",
              color: "#9945FF",
            }}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Sanity Studio
          </a>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing || status === "loading"}
            className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Error banner */}
      <AnimatePresence>
        {status === "error" && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3"
          >
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            <p className="text-sm text-red-400">
              {errorMessage || "Failed to load admin data"}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06] w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className="flex items-center gap-2 h-8 px-4 rounded-lg text-xs font-semibold transition-all"
            style={
              tab === id
                ? { background: "#14F195", color: "#020a06" }
                : { color: "rgba(255,255,255,0.40)" }
            }
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <motion.div
          key="overview"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={t("adminPage.users")}
              value={kpis?.users ?? null}
              icon={Users}
              accent="#14F195"
            />
            <StatCard
              label={t("adminPage.activeLearners")}
              value={kpis?.activeLearners ?? null}
              icon={Activity}
              accent="#9945FF"
            />
            <StatCard
              label={t("adminPage.totalXpTracked")}
              value={kpis?.totalXp ?? null}
              icon={Zap}
              accent="#f59e0b"
            />
            <StatCard
              label="Conversion Rate"
              value={kpis?.conversionRate ?? null}
              icon={TrendingUp}
              accent="#38bdf8"
              suffix="%"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div
              className="rounded-2xl border p-5 space-y-3"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                background: "#0c1017",
              }}
            >
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] tracking-widest uppercase text-white/30">
                  Lesson Attempts
                </p>
                <Target className="h-4 w-4 text-white/20" />
              </div>
              <p className="font-mono font-bold text-4xl text-white/90">
                {kpis === null ? (
                  <span className="animate-pulse text-white/20">—</span>
                ) : (
                  kpis.lessonAttempts.toLocaleString()
                )}
              </p>
              <p className="text-xs text-white/25">
                Total attempts across all courses
              </p>
            </div>

            <div
              className="rounded-2xl border p-5 space-y-3"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                background: "#0c1017",
              }}
            >
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] tracking-widest uppercase text-white/30">
                  Content Management
                </p>
                <BookOpen className="h-4 w-4 text-white/20" />
              </div>
              <p className="text-sm text-white/50 leading-relaxed">
                Courses, lessons, and modules are managed via Sanity Studio.
              </p>
              <a
                href={CMS_STUDIO_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold rounded-lg px-3 py-2 transition-all border"
                style={{
                  background: "rgba(153,69,255,0.12)",
                  color: "#9945FF",
                  borderColor: "rgba(153,69,255,0.25)",
                }}
              >
                Open Sanity Studio
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {status === "ready" && courses.length > 0 && (
            <div
              className="rounded-2xl border overflow-hidden"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                background: "#0c1017",
              }}
            >
              <div
                className="px-5 py-4 border-b flex items-center justify-between"
                style={{ borderColor: "rgba(255,255,255,0.07)" }}
              >
                <p className="text-sm font-semibold text-white/80">
                  Top Courses
                </p>
                <button
                  type="button"
                  onClick={() => setTab("courses")}
                  className="text-xs font-mono text-white/30 hover:text-white/60 flex items-center gap-1 transition-colors"
                >
                  View all <ChevronRight className="h-3 w-3" />
                </button>
              </div>
              {courses.slice(0, 5).map((course, i) => (
                <div
                  key={course.id}
                  className="flex items-center gap-4 px-5 py-3 border-b last:border-0"
                  style={{ borderColor: "rgba(255,255,255,0.05)" }}
                >
                  <span className="font-mono text-[10px] text-white/20 w-4 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 truncate">
                      {course.title}
                    </p>
                    <p className="text-[11px] text-white/25 font-mono">
                      {course.track}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="font-mono text-xs text-white/50">
                        {course.learners}
                      </p>
                      <p className="font-mono text-[10px] text-white/20">
                        learners
                      </p>
                    </div>
                    <div className="w-16">
                      <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${course.avgCompletion}%`,
                            background:
                              course.avgCompletion >= 70
                                ? "#14F195"
                                : course.avgCompletion >= 40
                                  ? "#9945FF"
                                  : "#f59e0b",
                          }}
                        />
                      </div>
                      <p className="font-mono text-[10px] text-white/20 mt-0.5 text-right">
                        {course.avgCompletion}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ── COURSES ── */}
      {tab === "courses" && (
        <motion.div
          key="courses"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div
            className="flex items-center justify-between rounded-2xl border px-5 py-4"
            style={{
              borderColor: "rgba(153,69,255,0.2)",
              background: "rgba(153,69,255,0.06)",
            }}
          >
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-[#9945FF]" />
              <div>
                <p className="text-sm font-semibold text-white/90">
                  Course Editor
                </p>
                <p className="text-xs text-white/40">
                  Create and edit courses, modules, and lessons in Sanity Studio
                </p>
              </div>
            </div>
            <a
              href={CMS_STUDIO_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-bold transition-all"
              style={{ background: "#9945FF", color: "#fff" }}
            >
              Open Studio <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          {status === "loading" && (
            <div className="flex items-center justify-center h-40 gap-3">
              <div
                className="h-5 w-5 rounded-full border-t-2 animate-spin"
                style={{ borderColor: "#14F195" }}
              />
              <span className="font-mono text-xs text-white/25 animate-pulse">
                Loading…
              </span>
            </div>
          )}

          {status === "ready" && (
            <div
              className="rounded-2xl border overflow-hidden"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                background: "#0c1017",
              }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    {["Course", "Track", "Learners", "Avg Completion", ""].map(
                      (col) => (
                        <th
                          key={col}
                          className="px-5 py-3 text-left font-mono text-[10px] tracking-[0.15em] uppercase text-white/25"
                        >
                          {col}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {courses.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-12 text-center text-sm text-white/25"
                      >
                        No courses found. Add content via Sanity Studio.
                      </td>
                    </tr>
                  ) : (
                    courses.map((course) => (
                      <tr
                        key={course.id}
                        className="border-b transition-colors hover:bg-white/[0.025]"
                        style={{ borderColor: "rgba(255,255,255,0.05)" }}
                      >
                        <td className="px-5 py-3.5">
                          <p className="text-white/85 font-medium">
                            {course.title}
                          </p>
                          <p className="font-mono text-[11px] text-white/25">
                            /{course.slug}
                          </p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className="inline-flex items-center h-6 px-2.5 rounded-lg font-mono text-[10px] tracking-wide border"
                            style={{
                              borderColor: "rgba(153,69,255,0.3)",
                              color: "#9945FF",
                              background: "rgba(153,69,255,0.1)",
                            }}
                          >
                            {course.track}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-white/60 tabular-nums">
                          {course.learners.toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${course.avgCompletion}%`,
                                  background:
                                    course.avgCompletion >= 70
                                      ? "#14F195"
                                      : course.avgCompletion >= 40
                                        ? "#9945FF"
                                        : "#f59e0b",
                                }}
                              />
                            </div>
                            <span className="font-mono text-xs text-white/40 w-8 text-right tabular-nums">
                              {course.avgCompletion}%
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <a
                            href={CMS_STUDIO_URL}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg text-[11px] font-semibold border transition-all hover:bg-white/5"
                            style={{
                              borderColor: "rgba(255,255,255,0.12)",
                              color: "rgba(255,255,255,0.45)",
                            }}
                          >
                            <Edit2 className="h-3 w-3" /> Edit
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {/* ── USERS ── */}
      {tab === "users" && (
        <motion.div
          key="users"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {status === "ready" && (
            <p className="text-sm text-white/40">
              <span className="font-mono text-white/70 font-semibold">
                {users.length}
              </span>{" "}
              users loaded
            </p>
          )}

          {saveError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-400">{saveError}</p>
            </div>
          )}

          {status === "loading" && (
            <div className="flex items-center justify-center h-40 gap-3">
              <div
                className="h-5 w-5 rounded-full border-t-2 animate-spin"
                style={{ borderColor: "#14F195" }}
              />
              <span className="font-mono text-xs text-white/25 animate-pulse">
                Loading…
              </span>
            </div>
          )}

          {status === "ready" && (
            <div
              className="rounded-2xl border overflow-hidden"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                background: "#0c1017",
              }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    {[
                      "Username",
                      "Display Name",
                      "Wallets",
                      "Auth",
                      "Courses",
                      "Actions",
                    ].map((col) => (
                      <th
                        key={col}
                        className="px-5 py-3 text-left font-mono text-[10px] tracking-[0.15em] uppercase text-white/25"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-12 text-center text-sm text-white/25"
                      >
                        No users yet.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => {
                      const isEditing = editingUserId === user.id;
                      const isSaving = savingUserId === user.id;
                      return (
                        <tr
                          key={user.id}
                          className="border-b transition-colors hover:bg-white/[0.02]"
                          style={{ borderColor: "rgba(255,255,255,0.05)" }}
                        >
                          <td className="px-5 py-3">
                            {isEditing ? (
                              <input
                                value={editUsername}
                                onChange={(e) =>
                                  setEditUsername(e.target.value)
                                }
                                className="w-full rounded-lg border bg-white/5 px-2.5 py-1.5 text-sm text-white outline-none"
                                style={{
                                  borderColor: "rgba(255,255,255,0.15)",
                                }}
                              />
                            ) : (
                              <span className="font-mono text-xs text-white/70">
                                @{user.username}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            {isEditing ? (
                              <input
                                value={editDisplayName}
                                onChange={(e) =>
                                  setEditDisplayName(e.target.value)
                                }
                                className="w-full rounded-lg border bg-white/5 px-2.5 py-1.5 text-sm text-white outline-none"
                                style={{
                                  borderColor: "rgba(255,255,255,0.15)",
                                }}
                              />
                            ) : (
                              <span className="text-white/80">
                                {user.displayName}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3 font-mono text-white/40 text-center">
                            {user.wallets}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex gap-1 flex-wrap">
                              {user.providers.length > 0 ? (
                                user.providers.map((p) => (
                                  <span
                                    key={p}
                                    className="inline-flex h-5 items-center px-2 rounded font-mono text-[10px] border"
                                    style={{
                                      borderColor: "rgba(20,241,149,0.3)",
                                      color: "#14F195",
                                      background: "rgba(20,241,149,0.08)",
                                    }}
                                  >
                                    {p}
                                  </span>
                                ))
                              ) : (
                                <span className="text-white/20 text-xs">—</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3 font-mono text-white/40 text-center">
                            {user.coursesInProgress}
                          </td>
                          <td className="px-5 py-3">
                            {isEditing ? (
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => saveUser(user.id)}
                                  disabled={isSaving}
                                  className="h-7 w-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-50"
                                  style={{
                                    background: "rgba(20,241,149,0.15)",
                                    color: "#14F195",
                                  }}
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEdit}
                                  disabled={isSaving}
                                  className="h-7 w-7 rounded-lg flex items-center justify-center border border-white/10 text-white/40 hover:text-white/70 transition-all disabled:opacity-50"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => beginEdit(user)}
                                className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg text-[11px] font-semibold border transition-all hover:bg-white/5"
                                style={{
                                  borderColor: "rgba(255,255,255,0.12)",
                                  color: "rgba(255,255,255,0.45)",
                                }}
                              >
                                <Edit2 className="h-3 w-3" /> Edit
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
