import { Link } from "@/i18n/navigation";
import {
  Users,
  BookOpen,
  TrendingUp,
  ExternalLink,
  MessageSquare,
  MessagesSquare,
} from "lucide-react";
import type { Metadata } from "next";
import { getAdminStats, getRecentSignups, getRecentThreads } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Superteam Academy admin panel",
};

const COURSES = [
  {
    title: "Solana Fundamentals",
    difficulty: "beginner",
    enrollments: 342,
    completion: 68,
    xp: 500,
    slug: "solana-fundamentals",
  },
  {
    title: "Anchor Framework Basics",
    difficulty: "intermediate",
    enrollments: 198,
    completion: 54,
    xp: 1200,
    slug: "anchor-framework-basics",
  },
  {
    title: "Token-2022 & Extensions",
    difficulty: "advanced",
    enrollments: 87,
    completion: 41,
    xp: 2000,
    slug: "token-2022-extensions",
  },
  {
    title: "DeFi on Solana",
    difficulty: "advanced",
    enrollments: 134,
    completion: 38,
    xp: 2500,
    slug: "defi-on-solana",
  },
  {
    title: "Solana Program Security",
    difficulty: "advanced",
    enrollments: 156,
    completion: 45,
    xp: 2200,
    slug: "solana-program-security",
  },
] as const;

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "#14F195",
  intermediate: "#F1C40F",
  advanced: "#E74C3C",
};

const maxEnrollments = Math.max(...COURSES.map((c) => c.enrollments));

function truncateWallet(wallet: string | null): string {
  if (!wallet) return "—";
  if (wallet.length <= 8) return wallet;
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

function truncateTitle(title: string, max = 40): string {
  return title.length > max ? `${title.slice(0, max)}…` : title;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AdminPage() {
  const [stats, recentSignups, recentThreads] = await Promise.all([
    getAdminStats(),
    getRecentSignups(5),
    getRecentThreads(5),
  ]);

  const STATS = [
    { label: "Total Users", value: stats.totalUsers.toLocaleString(), icon: Users },
    { label: "Active Courses", value: "5", icon: BookOpen },
    { label: "Forum Threads", value: stats.totalThreads.toLocaleString(), icon: MessageSquare },
    { label: "Forum Replies", value: stats.totalReplies.toLocaleString(), icon: MessagesSquare },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Warning banner */}
      <div className="flex items-center gap-3 px-4 py-3 border border-yellow-600/50 bg-yellow-950/30 rounded text-sm font-mono text-yellow-400">
        <span className="text-base">⚠</span>
        <span>Admin Panel — Development Mode. Do not share this URL.</span>
      </div>

      {/* Page header */}
      <div>
        <h1 className="font-mono text-3xl font-bold text-foreground mb-1">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Platform overview and course management.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">{label}</p>
              <Icon className="h-4 w-4 text-[#14F195]" />
            </div>
            <p className="font-mono text-2xl font-bold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {/* Enrollments bar chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="h-4 w-4 text-[#14F195]" />
          <h2 className="font-mono text-sm font-semibold text-foreground uppercase tracking-widest">
            Enrollments by Course
          </h2>
        </div>
        <div className="space-y-3">
          {COURSES.map((course) => (
            <div key={course.slug} className="flex items-center gap-3">
              <span className="font-mono text-xs text-muted-foreground w-44 shrink-0 truncate">
                {course.title}
              </span>
              <div className="flex-1 bg-background rounded-sm h-5 overflow-hidden">
                <div
                  className="h-full bg-[#14F195]/70 rounded-sm flex items-center justify-end pr-2 transition-all"
                  style={{ width: `${(course.enrollments / maxEnrollments) * 100}%` }}
                >
                  <span className="font-mono text-[10px] text-black font-bold">
                    {course.enrollments}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Courses management table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[#14F195]" />
            <h2 className="font-mono text-sm font-semibold text-foreground uppercase tracking-widest">
              Courses
            </h2>
          </div>
          <Link
            href="/courses"
            className="text-xs font-mono text-muted-foreground hover:text-[#14F195] transition-colors flex items-center gap-1"
          >
            View All <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Title", "Difficulty", "Enrollments", "Completion %", "XP Reward", "Actions"].map(
                  (col) => (
                    <th
                      key={col}
                      className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-widest text-muted-foreground"
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {COURSES.map((course) => (
                <tr
                  key={course.slug}
                  className="border-b border-border last:border-0 transition-colors hover:bg-elevated"
                >
                  <td className="px-5 py-3.5 font-mono text-sm text-foreground">{course.title}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded-full border"
                      style={{
                        color: DIFFICULTY_COLORS[course.difficulty],
                        borderColor: `${DIFFICULTY_COLORS[course.difficulty]}40`,
                        backgroundColor: `${DIFFICULTY_COLORS[course.difficulty]}10`,
                      }}
                    >
                      {course.difficulty}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-sm text-foreground">
                    {course.enrollments.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#14F195] rounded-full"
                          style={{ width: `${course.completion}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">{course.completion}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-sm text-[#14F195]">
                    {course.xp.toLocaleString()} XP
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button className="text-[10px] font-mono px-2.5 py-1 border border-border rounded text-muted-foreground hover:text-foreground hover:border-border-hover transition-colors">
                        Edit
                      </button>
                      <a
                        href={`/courses/${course.slug}`}
                        className="text-[10px] font-mono px-2.5 py-1 border border-[#14F195]/30 rounded text-[#14F195] hover:bg-[#14F195]/10 transition-colors"
                      >
                        View
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent signups table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <Users className="h-4 w-4 text-[#14F195]" />
          <h2 className="font-mono text-sm font-semibold text-foreground uppercase tracking-widest">
            Recent Signups
          </h2>
        </div>
        <div className="overflow-x-auto">
          {recentSignups.length === 0 ? (
            <p className="px-5 py-8 text-center font-mono text-sm text-muted-foreground">
              No signups yet.
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Wallet / Username", "Display Name", "Joined"].map((col) => (
                    <th
                      key={col}
                      className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-widest text-muted-foreground"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentSignups.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border last:border-0 hover:bg-elevated transition-colors"
                  >
                    <td className="px-5 py-3.5 font-mono text-sm text-foreground">
                      {user.username ? (
                        <span className="text-[#14F195]">@{user.username}</span>
                      ) : (
                        truncateWallet(user.wallet_address)
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-sm text-muted-foreground">
                      {user.display_name ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">
                      {formatDate(user.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Forum activity table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <MessageSquare className="h-4 w-4 text-[#14F195]" />
          <h2 className="font-mono text-sm font-semibold text-foreground uppercase tracking-widest">
            Recent Forum Activity
          </h2>
        </div>
        <div className="overflow-x-auto">
          {recentThreads.length === 0 ? (
            <p className="px-5 py-8 text-center font-mono text-sm text-muted-foreground">
              No threads yet.
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Title", "Category", "Created"].map((col) => (
                    <th
                      key={col}
                      className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-widest text-muted-foreground"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentThreads.map((thread) => (
                  <tr
                    key={thread.id}
                    className="border-b border-border last:border-0 hover:bg-elevated transition-colors"
                  >
                    <td className="px-5 py-3.5 font-mono text-sm text-foreground">
                      {truncateTitle(thread.title)}
                    </td>
                    <td className="px-5 py-3.5">
                      {thread.category_label ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#14F195]/30 text-[#14F195] bg-[#14F195]/10">
                          {thread.category_label}
                        </span>
                      ) : (
                        <span className="font-mono text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">
                      {formatDate(thread.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
