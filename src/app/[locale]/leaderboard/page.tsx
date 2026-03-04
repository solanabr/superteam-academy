"use client";

import { useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Trophy, Medal, Zap, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import type { LeaderboardEntry, LeaderboardPeriod } from "@/types";
import { SpotlightCard } from "@/components/ui/spotlight-card";

const RANK_MEDAL: Record<
  number,
  { icon: typeof Trophy; color: string; bg: string }
> = {
  1: { icon: Trophy, color: "#FFD700", bg: "rgba(255,215,0,0.12)" },
  2: { icon: Medal, color: "#C0C0C0", bg: "rgba(192,192,192,0.10)" },
  3: { icon: Medal, color: "#CD7F32", bg: "rgba(205,127,50,0.10)" },
};

function EmptyLeaderboard({ message }: { message: string }) {
  return (
    <SpotlightCard className="rounded-xl" spotlightColor="rgba(153, 69, 255, 0.18)">
      <div
        className="rounded-xl p-6 text-sm"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          color: "var(--text-secondary)",
        }}
      >
        {message}
      </div>
    </SpotlightCard>
  );
}

export default function LeaderboardPage() {
  const t = useTranslations("Leaderboard");
  const { publicKey } = useWallet();
  const [period, setPeriod] = useState<LeaderboardPeriod>("all-time");
  const { data, isLoading } = useLeaderboard(period);

  const tabs: Array<{ key: LeaderboardPeriod; label: string }> = [
    { key: "all-time", label: t("tabs.allTime") },
    { key: "monthly", label: t("tabs.monthly") },
    { key: "weekly", label: t("tabs.weekly") },
  ];

  const wallet = publicKey?.toBase58() ?? null;

  const entries = useMemo(() => {
    const base = data?.entries ?? [];
    return base.map((entry): LeaderboardEntry => ({
      ...entry,
      isCurrentUser: wallet ? entry.wallet === wallet : false,
    }));
  }, [data?.entries, wallet]);

  const top3 = entries.slice(0, 3);
  const myEntry = entries.find((entry) => entry.isCurrentUser) ?? null;

  const podium = [top3[1], top3[0], top3[2]].filter(Boolean) as LeaderboardEntry[];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,215,0,0.1)" }}
          >
            <Trophy size={18} style={{ color: "#FFD700" }} />
          </div>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {t("title")}
          </h1>
        </div>
        <p className="text-base" style={{ color: "var(--text-secondary)" }}>
          {t("subtitle")}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setPeriod(tab.key)}
              className="min-h-[36px] px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
              style={{
                background:
                  period === tab.key
                    ? "rgba(153,69,255,0.15)"
                    : "var(--bg-surface)",
                border:
                  period === tab.key
                    ? "1px solid rgba(153,69,255,0.4)"
                    : "1px solid var(--border-default)",
                color:
                  period === tab.key
                    ? "var(--text-purple)"
                    : "var(--text-secondary)",
              }}
              aria-pressed={period === tab.key}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{
            color: data?.fallbackToAllTime ? "#fbbf24" : "var(--solana-green)",
            background: data?.fallbackToAllTime
              ? "rgba(251,191,36,0.1)"
              : "rgba(25,251,155,0.10)",
            border: data?.fallbackToAllTime
              ? "1px solid rgba(251,191,36,0.2)"
              : "1px solid rgba(25,251,155,0.25)",
          }}
        >
          {data?.fallbackToAllTime
            ? t("status.timeframeFallback")
            : t("status.liveOnChain")}
        </span>
      </div>

      {data?.notice && (
        <div
          className="mb-4 rounded-lg px-3 py-2 text-xs"
          style={{
            color: "#fbbf24",
            background: "rgba(251,191,36,0.08)",
            border: "1px solid rgba(251,191,36,0.2)",
          }}
        >
          {data.notice}
        </div>
      )}

      {myEntry && (
        <SpotlightCard className="rounded-xl mb-6" spotlightColor="rgba(153, 69, 255, 0.22)">
          <div
            className="rounded-xl p-4 flex items-center justify-between"
            style={{
              background:
                "linear-gradient(135deg, rgba(153,69,255,0.12) 0%, rgba(25,251,155,0.05) 100%)",
              border: "1px solid rgba(153,69,255,0.25)",
            }}
          >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
              style={{
                background: "rgba(153,69,255,0.2)",
                color: "var(--text-purple)",
              }}
            >
              {myEntry.rank}
            </div>
            <div>
              <p
                className="text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {t("youRow", { wallet: myEntry.walletShort })}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {t("level", { level: myEntry.level })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap
              size={14}
              style={{ color: "var(--text-purple)" }}
              aria-hidden="true"
            />
            <span
              className="font-semibold text-sm"
              style={{ color: "var(--text-primary)" }}
            >
              {myEntry.xp.toLocaleString("en-US")} XP
            </span>
          </div>
          </div>
        </SpotlightCard>
      )}

      {isLoading ? (
        <SpotlightCard className="rounded-xl" spotlightColor="rgba(153, 69, 255, 0.18)">
          <div
            className="rounded-xl p-6 text-sm"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-secondary)",
            }}
          >
            {t("loading")}
          </div>
        </SpotlightCard>
      ) : entries.length === 0 ? (
        <EmptyLeaderboard message={t("empty")} />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {podium.map((leader, i) => {
              const rank = leader.rank;
              const medal = RANK_MEDAL[rank] ?? RANK_MEDAL[3];
              const heights = ["h-24", "h-32", "h-20"];
              const MedalIcon = medal.icon;

              return (
                <div key={leader.wallet} className="flex flex-col items-center gap-2">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: medal.bg,
                      border: `1px solid ${medal.color}30`,
                    }}
                  >
                    <MedalIcon
                      size={22}
                      style={{ color: medal.color }}
                      aria-hidden="true"
                    />
                  </div>
                  <div
                    className={`w-full ${heights[i] ?? "h-20"} rounded-t-xl flex flex-col items-center justify-end pb-4 px-2`}
                    style={{
                      background: `linear-gradient(180deg, ${medal.color}12 0%, ${medal.color}06 100%)`,
                      border: `1px solid ${medal.color}25`,
                      borderBottom: "none",
                    }}
                  >
                    <p
                      className="text-sm font-bold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      #{leader.rank}
                    </p>
                    <p
                      className="text-xs truncate w-full text-center"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {leader.walletShort}
                    </p>
                    <p
                      className="text-xs font-semibold mt-0.5"
                      style={{ color: "var(--text-purple)" }}
                    >
                      {leader.xp.toLocaleString("en-US")} XP
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <SpotlightCard className="rounded-xl" spotlightColor="rgba(153, 69, 255, 0.18)">
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
              }}
            >
            <table className="w-full border-collapse">
              <thead>
                <tr
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{
                    borderBottom: "1px solid var(--border-subtle)",
                    color: "var(--text-muted)",
                  }}
                >
                  <th className="px-4 py-2.5 text-left w-14">{t("table.rank")}</th>
                  <th className="px-4 py-2.5 text-left">{t("table.wallet")}</th>
                  <th className="px-4 py-2.5 text-right w-24">{t("table.level")}</th>
                  <th className="px-4 py-2.5 text-right w-36">{t("table.xp")}</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((leader, i) => {
                  const medal = RANK_MEDAL[leader.rank];
                  const MedalIcon = medal?.icon;
                  return (
                    <tr
                      key={leader.wallet}
                      style={{
                        borderBottom: "1px solid var(--border-subtle)",
                        background: leader.isCurrentUser
                          ? "rgba(153,69,255,0.08)"
                          : i === 0
                            ? "rgba(255,215,0,0.04)"
                            : "transparent",
                      }}
                    >
                      <td className="px-4 py-3">
                        {MedalIcon ? (
                          <MedalIcon
                            size={16}
                            style={{ color: medal.color }}
                            aria-hidden="true"
                          />
                        ) : (
                          <span
                            className="text-sm font-medium"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {leader.rank}
                          </span>
                        )}
                      </td>
                      <td
                        className="px-4 py-3 text-sm truncate"
                        style={{ color: "var(--text-primary)" }}
                        title={leader.wallet}
                      >
                        {leader.walletShort}
                        {leader.isCurrentUser ? ` ${t("youSuffix")}` : ""}
                      </td>
                      <td
                        className="px-4 py-3 text-right text-sm"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {leader.level}
                      </td>
                      <td
                        className="px-4 py-3 text-right text-sm font-semibold"
                        style={{ color: "var(--text-purple)" }}
                      >
                        {leader.xp.toLocaleString("en-US")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div
              className="px-4 py-3 flex items-center gap-2"
              style={{ color: "var(--text-muted)" }}
            >
              <TrendingUp size={14} aria-hidden="true" />
              <span className="text-xs">{t("dataSource")}</span>
            </div>
            </div>
          </SpotlightCard>
        </>
      )}
    </div>
  );
}
