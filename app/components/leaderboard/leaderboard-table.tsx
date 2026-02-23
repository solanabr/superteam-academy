"use client";

import { useLeaderboard } from "@/hooks/use-leaderboard";
import { useWallet } from "@solana/wallet-adapter-react";
import { truncateWallet, formatXp } from "@/lib/format";
import { getLevel } from "@/lib/level";
import { RankBadge } from "./rank-badge";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useCourses } from "@/hooks/use-courses";

type TimeFilter = "all" | "monthly" | "weekly";

export function LeaderboardTable() {
  const { data: entries, isLoading } = useLeaderboard();
  const { data: courses } = useCourses();
  const { publicKey } = useWallet();
  const t = useTranslations("leaderboard");
  const myWallet = publicKey?.toBase58();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [courseFilter, setCourseFilter] = useState<string | null>(null);

  if (isLoading) return <TableSkeleton rows={10} />;

  if (!entries?.length) {
    return <p className="py-12 text-center text-sm text-content-muted">{t("noData")}</p>;
  }

  const filters: { value: TimeFilter; label: string }[] = [
    { value: "all", label: t("allTime") },
    { value: "monthly", label: t("monthly") },
    { value: "weekly", label: t("weekly") },
  ];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setTimeFilter(f.value)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              timeFilter === f.value
                ? "border-solana-purple bg-solana-purple/10 text-solana-purple"
                : "border-edge text-content-secondary hover:text-content"
            }`}
          >
            {f.label}
          </button>
        ))}
        {courses && courses.length > 0 && (
          <>
            <span className="mx-1 h-4 w-px bg-edge" />
            <button
              onClick={() => setCourseFilter(null)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                courseFilter === null
                  ? "border-solana-cyan bg-solana-cyan/10 text-solana-cyan"
                  : "border-edge text-content-secondary hover:text-content"
              }`}
            >
              {t("allCourses")}
            </button>
            {courses.map((c) => (
              <button
                key={c.courseId}
                onClick={() => setCourseFilter(c.courseId)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  courseFilter === c.courseId
                    ? "border-solana-cyan bg-solana-cyan/10 text-solana-cyan"
                    : "border-edge text-content-secondary hover:text-content"
                }`}
              >
                {c.courseId}
              </button>
            ))}
          </>
        )}
      </div>
    <div className="overflow-x-auto rounded-xl border border-edge">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-edge text-left text-xs text-content-muted">
            <th className="sticky left-0 bg-surface px-4 py-3">{t("rank")}</th>
            <th className="px-4 py-3">{t("wallet")}</th>
            <th className="px-4 py-3 text-right">{t("xp")}</th>
            <th className="px-4 py-3 text-right">{t("level")}</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const isMe = entry.wallet === myWallet;
            return (
              <tr
                key={entry.wallet}
                className={`border-b border-edge-soft transition-colors ${
                  isMe ? "bg-solana-purple/10" : "hover:bg-card-hover"
                }`}
              >
                <td className="sticky left-0 bg-inherit px-4 py-3">
                  <RankBadge rank={entry.rank} />
                </td>
                <td className="px-4 py-3 font-mono text-content-secondary">
                  {truncateWallet(entry.wallet)}
                  {isMe && (
                    <span className="ml-2 rounded-full bg-solana-purple/20 px-2 py-0.5 text-xs text-solana-purple">
                      {t("you")}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-medium text-content">
                  {formatXp(entry.xp)}
                </td>
                <td className="px-4 py-3 text-right text-content-secondary">
                  {getLevel(entry.xp)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    </>
  );
}
