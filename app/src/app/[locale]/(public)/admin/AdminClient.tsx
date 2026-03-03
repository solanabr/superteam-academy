"use client";

import { useTranslations } from "next-intl";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Link } from "@/i18n/navigation";
import {
  Users,
  BookOpen,
  TrendingUp,
  ExternalLink,
  MessageSquare,
  MessagesSquare,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import type {
  AdminStats,
  RecentSignup,
  RecentThread,
  CourseAdminStat,
} from "@/lib/admin";

const SANITY_PROJECT_ID =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "k9esrahg";
const SANITY_STUDIO_URL = `https://${SANITY_PROJECT_ID}.sanity.studio`;

const ADMIN_WALLETS = (
  process.env.NEXT_PUBLIC_ADMIN_WALLETS ??
  "8RER7VKxDjHgruqJPgQhKo54cUTTsdX5iLoiKRTjsB1f"
)
  .split(",")
  .map((w) => w.trim());

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "var(--accent)",
  intermediate: "#F1C40F",
  advanced: "#E74C3C",
};

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

interface Props {
  stats: AdminStats;
  recentSignups: RecentSignup[];
  recentThreads: RecentThread[];
  courseStats: CourseAdminStat[];
}

export function AdminClient({
  stats,
  recentSignups,
  recentThreads,
  courseStats,
}: Props) {
  const t = useTranslations("admin");
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();

  if (!publicKey) {
    return (
      <div className="max-w-md mx-auto px-4 py-32 flex flex-col items-center text-center gap-6">
        <div className="w-12 h-12 rounded-full bg-elevated flex items-center justify-center">
          <Wallet className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="font-mono text-xl font-bold text-foreground mb-2">
            {t("accessTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("accessDesc")}</p>
        </div>
        <button
          onClick={() => setVisible(true)}
          className="px-6 py-2.5 bg-accent text-black font-mono font-semibold text-sm rounded-full hover:bg-accent-dim transition-colors"
        >
          {t("connectBtn")}
        </button>
      </div>
    );
  }

  if (!ADMIN_WALLETS.includes(publicKey.toBase58())) {
    return (
      <div className="max-w-md mx-auto px-4 py-32 flex flex-col items-center text-center gap-6">
        <div className="w-12 h-12 rounded-full bg-[#FF4444]/10 border border-[#FF4444]/30 flex items-center justify-center">
          <ShieldAlert className="h-5 w-5 text-[#FF4444]" />
        </div>
        <div>
          <h1 className="font-mono text-xl font-bold text-foreground mb-2">
            {t("deniedTitle")}
          </h1>
          <p className="text-sm text-muted-foreground mb-2">
            {t("deniedDesc")}
          </p>
          <p className="text-[10px] font-mono text-subtle">
            {publicKey.toBase58().slice(0, 8)}...
            {publicKey.toBase58().slice(-8)}
          </p>
        </div>
      </div>
    );
  }

  const maxEnrollments = Math.max(...courseStats.map((c) => c.enrollments), 1);

  const STATS = [
    {
      label: t("totalUsers"),
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
    },
    {
      label: t("activeCourses"),
      value: courseStats.length.toString(),
      icon: BookOpen,
    },
    {
      label: t("forumThreads"),
      value: stats.totalThreads.toLocaleString(),
      icon: MessageSquare,
    },
    {
      label: t("forumReplies"),
      value: stats.totalReplies.toLocaleString(),
      icon: MessagesSquare,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-mono text-3xl font-bold text-foreground mb-1">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                {label}
              </p>
              <Icon className="h-4 w-4 text-accent" />
            </div>
            <p className="font-mono text-2xl font-bold text-foreground">
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Enrollments bar chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="h-4 w-4 text-accent" />
          <h2 className="font-mono text-sm font-semibold text-foreground uppercase tracking-widest">
            {t("enrollmentsByCourse")}
          </h2>
        </div>
        <div className="space-y-3">
          {courseStats.map((course) => (
            <div key={course.slug} className="flex items-center gap-3">
              <span className="font-mono text-xs text-muted-foreground w-44 shrink-0 truncate">
                {course.title}
              </span>
              <div className="flex-1 bg-background rounded-sm h-5 overflow-hidden">
                <div
                  className="h-full bg-accent/70 rounded-sm flex items-center justify-end pr-2 transition-all"
                  style={{
                    width: `${(course.enrollments / maxEnrollments) * 100}%`,
                  }}
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
            <BookOpen className="h-4 w-4 text-accent" />
            <h2 className="font-mono text-sm font-semibold text-foreground uppercase tracking-widest">
              {t("courses")}
            </h2>
          </div>
          <Link
            href="/courses"
            className="text-xs font-mono text-muted-foreground hover:text-accent transition-colors flex items-center gap-1"
          >
            {t("viewAll")} <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {[
                  t("colTitle"),
                  t("colDifficulty"),
                  t("colEnrollments"),
                  t("colCompletion"),
                  t("colXpReward"),
                  t("colActions"),
                ].map((col) => (
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
              {courseStats.map((course) => (
                <tr
                  key={course.slug}
                  className="border-b border-border last:border-0 transition-colors hover:bg-elevated"
                >
                  <td className="px-5 py-3.5 font-mono text-sm text-foreground">
                    {course.title}
                  </td>
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
                          className="h-full bg-accent rounded-full"
                          style={{ width: `${course.completion}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">
                        {course.completion}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-sm text-accent">
                    {course.xpReward.toLocaleString()} XP
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <a
                        href={`${SANITY_STUDIO_URL}/structure/course`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-mono px-2.5 py-1 border border-border rounded text-muted-foreground hover:text-foreground hover:border-border-hover transition-colors"
                      >
                        {t("edit")}
                      </a>
                      <a
                        href={`/courses/${course.slug}`}
                        className="text-[10px] font-mono px-2.5 py-1 border border-accent/30 rounded text-accent hover:bg-accent/10 transition-colors"
                      >
                        {t("view")}
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
          <Users className="h-4 w-4 text-accent" />
          <h2 className="font-mono text-sm font-semibold text-foreground uppercase tracking-widest">
            {t("recentSignups")}
          </h2>
        </div>
        <div className="overflow-x-auto">
          {recentSignups.length === 0 ? (
            <p className="px-5 py-8 text-center font-mono text-sm text-muted-foreground">
              {t("noSignups")}
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {[
                    t("colWalletUsername"),
                    t("colDisplayName"),
                    t("colJoined"),
                  ].map((col) => (
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
                        <span className="text-accent">@{user.username}</span>
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
          <MessageSquare className="h-4 w-4 text-accent" />
          <h2 className="font-mono text-sm font-semibold text-foreground uppercase tracking-widest">
            {t("recentForumActivity")}
          </h2>
        </div>
        <div className="overflow-x-auto">
          {recentThreads.length === 0 ? (
            <p className="px-5 py-8 text-center font-mono text-sm text-muted-foreground">
              {t("noForumThreads")}
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {[t("colTitle"), t("colCategory"), t("colCreated")].map(
                    (col) => (
                      <th
                        key={col}
                        className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-widest text-muted-foreground"
                      >
                        {col}
                      </th>
                    ),
                  )}
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
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-accent/30 text-accent bg-accent/10">
                          {thread.category_label}
                        </span>
                      ) : (
                        <span className="font-mono text-xs text-muted-foreground">
                          —
                        </span>
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
