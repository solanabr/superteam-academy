import { getTranslations } from "next-intl/server";
import { getLeaderboard } from "@/services/leaderboard";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import type { Metadata } from "next";
import type { LeaderboardTimeframe } from "@/types";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "leaderboard" });
  return { title: t("title"), description: t("subtitle") };
}

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ timeframe?: string }>;
}

export default async function LeaderboardPage({ searchParams }: Props) {
  const t = await getTranslations("leaderboard");
  const { timeframe = "all-time" } = await searchParams;

  const validTimeframes: LeaderboardTimeframe[] = ["weekly", "monthly", "all-time"];
  const activeTimeframe = validTimeframes.includes(timeframe as LeaderboardTimeframe)
    ? (timeframe as LeaderboardTimeframe)
    : "all-time";

  const entries = await getLeaderboard(activeTimeframe).catch(() => []);

  const tabs: Array<{ value: LeaderboardTimeframe; label: string }> = [
    { value: "weekly", label: t("timeframes.weekly") },
    { value: "monthly", label: t("timeframes.monthly") },
    { value: "all-time", label: t("timeframes.allTime") },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="font-mono text-3xl font-bold text-[#EDEDED] mb-1">
          {t("title")}
        </h1>
        <p className="text-sm text-[#666666]">{t("subtitle")}</p>
      </div>

      {/* Timeframe tabs */}
      <div className="flex gap-1 mb-6 bg-[#111111] border border-[#1F1F1F] rounded p-1 w-fit">
        {tabs.map(({ value, label }) => (
          <Link
            key={value}
            href={{ pathname: "/leaderboard", query: { timeframe: value } }}
            className={[
              "px-4 py-1.5 rounded text-xs font-mono transition-colors",
              activeTimeframe === value
                ? "bg-[#1A1A1A] text-[#EDEDED]"
                : "text-[#666666] hover:text-[#EDEDED]",
            ].join(" ")}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Top 3 podium */}
      {entries.length >= 3 && (
        <div className="flex items-end justify-center gap-4 mb-8">
          {/* 2nd */}
          <PodiumCard entry={entries[1]} height="h-20" medal="🥈" />
          {/* 1st */}
          <PodiumCard entry={entries[0]} height="h-28" medal="🥇" highlighted />
          {/* 3rd */}
          <PodiumCard entry={entries[2]} height="h-16" medal="🥉" />
        </div>
      )}

      {/* Table */}
      <LeaderboardTable entries={entries} />
    </div>
  );
}

function PodiumCard({
  entry,
  height,
  medal,
  highlighted,
}: {
  entry: { walletAddress: string; username?: string; xpBalance: number; level: number };
  height: string;
  medal: string;
  highlighted?: boolean;
}) {
  const name = entry.username ?? `${entry.walletAddress.slice(0, 4)}...${entry.walletAddress.slice(-4)}`;

  return (
    <div
      className={[
        "flex-1 max-w-[140px] flex flex-col items-center gap-1.5",
        highlighted ? "scale-105" : "",
      ].join(" ")}
    >
      <span className="text-xl">{medal}</span>
      <div className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#1F1F1F] flex items-center justify-center font-mono text-sm">
        {name[0].toUpperCase()}
      </div>
      <span className="text-[10px] font-mono text-[#EDEDED] truncate w-full text-center">
        {name.length > 12 ? `${name.slice(0, 12)}...` : name}
      </span>
      <span className="text-[10px] font-mono text-[#14F195]">
        {entry.xpBalance.toLocaleString()} XP
      </span>
      <div
        className={[
          height,
          "w-full rounded-t",
          highlighted
            ? "bg-[#14F195]/20 border border-[#14F195]/30"
            : "bg-[#1A1A1A] border border-[#1F1F1F]",
        ].join(" ")}
      />
    </div>
  );
}
