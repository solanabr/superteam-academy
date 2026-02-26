"use client";

import { useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Trophy, Flame, Zap, Star, Crown, Medal, ArrowUp, ArrowDown, Minus, Users } from "lucide-react";
import { PageLayout } from "@/components/layout/page-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { learningProgressService } from "@/lib/services/learning-progress";
import { LeaderboardEntry, LeaderboardTimeframe } from "@/types";
import { formatXP, getLevelColor, getLevelName } from "@/lib/utils/xp";
import { cn } from "@/lib/utils/cn";

const timeframes: { value: LeaderboardTimeframe; label: string; emoji: string }[] = [
  { value: "weekly", label: "This Week", emoji: "📅" },
  { value: "monthly", label: "This Month", emoji: "🗓️" },
  { value: "alltime", label: "All Time", emoji: "🏆" },
];

function PodiumCard({ entry, rank, inView }: { entry: LeaderboardEntry; rank: number; inView: boolean }) {
  const podiumConfigs = [
    { color: "#FFD700", bg: "rgba(255,215,0,0.08)", border: "rgba(255,215,0,0.25)", icon: "👑", height: "h-20", label: "1st" },
    { color: "#C0C0C0", bg: "rgba(192,192,192,0.06)", border: "rgba(192,192,192,0.2)", icon: "🥈", height: "h-14", label: "2nd" },
    { color: "#CD7F32", bg: "rgba(205,127,50,0.06)", border: "rgba(205,127,50,0.2)", icon: "🥉", height: "h-10", label: "3rd" },
  ];
  const config = podiumConfigs[rank - 1];
  const levelColor = getLevelColor(entry.level);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: rank === 1 ? 0 : rank === 2 ? 0.1 : 0.2, duration: 0.5 }}
      className="flex flex-col items-center gap-3"
    >
      {/* Crown/medal emoji */}
      <span className="text-2xl">{config.icon}</span>

      {/* Avatar */}
      <div className="relative">
        <div
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-lg font-bold text-white border-2"
          style={{
            background: `linear-gradient(135deg, ${config.color}88, ${config.color}44)`,
            borderColor: config.color,
            boxShadow: `0 0 20px ${config.color}40`,
          }}
        >
          {entry.username.slice(0, 2).toUpperCase()}
        </div>
        {rank === 1 && (
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -inset-1 rounded-full border-2 border-yellow-400/30"
          />
        )}
      </div>

      {/* Info card */}
      <div
        className="bento-card w-full p-3 text-center"
        style={{ backgroundColor: config.bg, borderColor: config.border }}
      >
        <p className="text-sm font-bold truncate">{entry.username}</p>
        <div className="flex items-center justify-center gap-1 mt-1">
          <Zap className="h-3 w-3 text-[#14F195]" />
          <span className="text-xs font-bold gradient-text">{formatXP(entry.xp)}</span>
        </div>
        <p className="text-[10px] mt-0.5" style={{ color: levelColor }}>Level {entry.level}</p>
      </div>

      {/* Podium base */}
      <div
        className={cn("w-full rounded-t-lg flex items-center justify-center font-bold text-sm", config.height)}
        style={{ background: `linear-gradient(to top, ${config.color}20, ${config.color}08)`, borderTop: `2px solid ${config.color}40` }}
      >
        <span style={{ color: config.color }}>{config.label}</span>
      </div>
    </motion.div>
  );
}

export default function LeaderboardPage() {
  const { publicKey } = useWallet();
  const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>("alltime");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    setLoading(true);
    learningProgressService.getLeaderboard(timeframe).then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, [timeframe]);

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <PageLayout>
      <div className="min-h-screen pt-20 pb-16 px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="relative overflow-hidden pt-10 pb-8 mb-4">
          <div className="absolute inset-0 bg-grid opacity-[0.12]" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-yellow-500/25 to-transparent" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-yellow-500/5 blur-[80px] pointer-events-none" />

          <div className="max-w-4xl mx-auto relative z-10 text-center">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-yellow-500/25 bg-yellow-500/8 text-xs font-semibold text-yellow-400 mb-4">
                <Trophy className="w-3.5 h-3.5" />
                Live Rankings
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3">
                <span
                  style={{
                    background: "linear-gradient(135deg, #FFD700, #FF6B35, #9945FF)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Leaderboard
                </span>
              </h1>
              <p className="text-muted-foreground text-base max-w-md mx-auto">
                Top Solana builders ranked by on-chain XP. Rankings update in real-time from the blockchain.
              </p>
            </motion.div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto" ref={ref}>
          {/* Timeframe switcher */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-center gap-2 mb-10"
          >
            {timeframes.map((tf) => (
              <button
                key={tf.value}
                onClick={() => setTimeframe(tf.value)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border",
                  timeframe === tf.value
                    ? "bg-yellow-500/15 border-yellow-500/40 text-yellow-400 shadow-sm"
                    : "bg-white/[0.03] border-white/8 text-muted-foreground hover:border-white/15 hover:text-foreground"
                )}
              >
                <span>{tf.emoji}</span>
                {tf.label}
              </button>
            ))}
          </motion.div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 bento-card animate-pulse" style={{ animationDelay: `${i * 0.05}s` }} />
              ))}
            </div>
          ) : (
            <>
              {/* Podium — 2nd, 1st, 3rd layout */}
              <div className="grid grid-cols-3 gap-3 mb-10 items-end max-w-2xl mx-auto">
                <div className="mt-8">
                  {top3[1] && <PodiumCard entry={top3[1]} rank={2} inView={isInView} />}
                </div>
                <div>
                  {top3[0] && <PodiumCard entry={top3[0]} rank={1} inView={isInView} />}
                </div>
                <div className="mt-14">
                  {top3[2] && <PodiumCard entry={top3[2]} rank={3} inView={isInView} />}
                </div>
              </div>

              {/* Rankings table */}
              <div className="bento-card overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-12 gap-2 px-4 py-2.5 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.12em] border-b border-white/[0.07]">
                  <div className="col-span-1 text-center">#</div>
                  <div className="col-span-5">Builder</div>
                  <div className="col-span-2 text-right">XP</div>
                  <div className="col-span-1 text-center">Lvl</div>
                  <div className="col-span-2 text-center hidden sm:block">Streak</div>
                  <div className="col-span-1 text-right hidden sm:block">Done</div>
                </div>

                {rest.map((entry, i) => {
                  const isCurrentUser =
                    publicKey &&
                    entry.walletAddress.includes(publicKey.toBase58().slice(0, 4));
                  const levelColor = getLevelColor(entry.level);

                  return (
                    <motion.div
                      key={entry.userId}
                      initial={{ opacity: 0, x: -8 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: 0.3 + i * 0.04 }}
                      className={cn(
                        "grid grid-cols-12 gap-2 px-4 py-3 items-center transition-colors border-b border-white/[0.05] last:border-0",
                        isCurrentUser
                          ? "bg-[#9945FF]/[0.08] border-l-2 border-l-[#9945FF]"
                          : "hover:bg-white/[0.03]"
                      )}
                    >
                      {/* Rank */}
                      <div className="col-span-1 text-center">
                        <span className="text-sm font-bold text-muted-foreground/60">
                          {entry.rank}
                        </span>
                      </div>

                      {/* Builder */}
                      <div className="col-span-5 flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${levelColor}99, ${levelColor}44)`,
                          }}
                        >
                          {entry.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">
                            {entry.username}
                            {isCurrentUser && (
                              <span className="ml-1 text-[#9945FF]">(you)</span>
                            )}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono truncate">
                            {entry.walletAddress.slice(0, 8)}…
                          </p>
                        </div>
                      </div>

                      {/* XP */}
                      <div className="col-span-2 text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <Zap className="h-2.5 w-2.5 text-[#14F195]" />
                          <span className="text-xs font-bold">{formatXP(entry.xp)}</span>
                        </div>
                      </div>

                      {/* Level */}
                      <div className="col-span-1 text-center">
                        <span
                          className="text-xs font-bold"
                          style={{ color: levelColor }}
                        >
                          {entry.level}
                        </span>
                      </div>

                      {/* Streak */}
                      <div className="col-span-2 text-center hidden sm:flex items-center justify-center gap-1">
                        <Flame className="h-2.5 w-2.5 text-orange-400" />
                        <span className="text-xs">{entry.streak}</span>
                      </div>

                      {/* Courses */}
                      <div className="col-span-1 text-right hidden sm:block">
                        <span className="text-xs text-muted-foreground">{entry.coursesCompleted}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Footer stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.8 }}
                className="flex items-center justify-center gap-6 mt-6 text-xs text-muted-foreground"
              >
                <span className="flex items-center gap-1.5">
                  <Users className="h-3 w-3" />
                  {entries.length} builders ranked
                </span>
                <span className="flex items-center gap-1.5">
                  <Zap className="h-3 w-3 text-[#14F195]" />
                  {formatXP(entries.reduce((sum, e) => sum + e.xp, 0))} total XP
                </span>
                <span className="flex items-center gap-1.5">
                  <Flame className="h-3 w-3 text-orange-400" />
                  Longest streak: {Math.max(...entries.map((e) => e.streak))}d
                </span>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
