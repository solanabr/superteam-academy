"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { MeshGradient } from "@/components/MeshGradient";
import { Trophy, Medal, Star, Shield, Zap, Lock, ExternalLink, Share2, Award } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/components/I18nProvider";
import Link from "next/link";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  rarity: "common" | "rare" | "epic" | "legendary";
  unlockedAt?: string;
  isSoulbound?: boolean;
  mintAddress?: string;
  progress?: number;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-step",
    title: "achievements.firstStep.title",
    description: "achievements.firstStep.desc",
    icon: Star,
    rarity: "common",
    unlockedAt: "2024-03-01T12:00:00Z",
    progress: 100,
  },
  {
    id: "anchor-master",
    title: "achievements.anchorMaster.title",
    description: "achievements.anchorMaster.desc",
    icon: Shield,
    rarity: "rare",
    isSoulbound: true,
    mintAddress: "H7x...9v2",
    unlockedAt: "2024-03-15T15:30:00Z",
    progress: 100,
  },
  {
    id: "streak-7",
    title: "achievements.streak7.title",
    description: "achievements.streak7.desc",
    icon: Zap,
    rarity: "epic",
    progress: 60,
  },
  {
    id: "top-leaderboard",
    title: "achievements.topLeaderboard.title",
    description: "achievements.topLeaderboard.desc",
    icon: Trophy,
    rarity: "legendary",
    progress: 10,
  },
];

export default function AchievementsPage() {
  const { t } = useI18n();
  const { connected } = useWallet();

  const getRarityColor = (rarity: Achievement["rarity"]) => {
    switch (rarity) {
      case "common": return "text-zinc-400 bg-zinc-400/10 border-zinc-400/20";
      case "rare": return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      case "epic": return "text-purple-400 bg-purple-400/10 border-purple-400/20";
      case "legendary": return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 z-0">
        <MeshGradient />
      </div>

      <main className="relative z-10 pt-24 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h1 className="text-4xl font-bold mb-4">{t("nav.achievements")}</h1>
              <p className="text-white/60 max-w-2xl">
                {t("achievements.subtitle")}
              </p>
            </div>
            {connected && (
              <div className="flex gap-4 bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="text-center px-4">
                  <div className="text-sm text-white/40 mb-1">{t("achievements.total")}</div>
                  <div className="text-2xl font-bold">12</div>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="text-center px-4">
                  <div className="text-sm text-white/40 mb-1">{t("achievements.soulbound")}</div>
                  <div className="text-2xl font-bold text-blue-400">3</div>
                </div>
              </div>
            )}
          </div>

          {!connected ? (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center max-w-md mx-auto">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="w-10 h-10 text-white/20" />
              </div>
              <h2 className="text-2xl font-bold mb-4">{t("achievements.connectWallet")}</h2>
              <p className="text-white/60 mb-8">
                {t("achievements.connectWalletDesc")}
              </p>
              <button className="w-full py-4 bg-white text-black rounded-xl font-bold hover:bg-white/90 transition-colors">
                {t("nav.connectWallet")}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ACHIEVEMENTS.map((achievement, idx) => {
                const Icon = achievement.icon;
                const isUnlocked = achievement.unlockedAt;

                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`group relative bg-zinc-900/50 border rounded-3xl p-6 transition-all hover:bg-zinc-900/80 ${isUnlocked ? "border-white/10" : "border-white/5 opacity-60"}`}
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isUnlocked ? "bg-white/10" : "bg-white/5"}`}>
                        <Icon className={`w-8 h-8 ${isUnlocked ? "text-white" : "text-white/20"}`} />
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getRarityColor(achievement.rarity)}`}>
                        {t(`achievements.rarity.${achievement.rarity}`)}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                      {t(achievement.title)}
                      {achievement.isSoulbound && (
                        <div className="group/sb relative">
                          <Shield className="w-4 h-4 text-blue-400" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-blue-500 text-white text-[10px] rounded opacity-0 group-hover/sb:opacity-100 transition-opacity whitespace-nowrap">
                            {t("achievements.soulboundToken")}
                          </div>
                        </div>
                      )}
                    </h3>
                    <p className="text-white/50 text-sm mb-6 line-clamp-2">
                      {t(achievement.description)}
                    </p>

                    {isUnlocked ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs text-white/40">
                          <span>{t("achievements.unlocked")}</span>
                          <span>{new Date(achievement.unlockedAt!).toLocaleDateString()}</span>
                        </div>
                        <div className="flex gap-2">
                          {achievement.isSoulbound && (
                            <Link
                              href={`https://solscan.io/token/${achievement.mintAddress}`}
                              target="_blank"
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-500/10 text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-500/20 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              View NFT
                            </Link>
                          )}
                          <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/5 text-white/60 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors">
                            <Share2 className="w-3.5 h-3.5" />
                            {t("achievements.share")}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-white/40">{t("achievements.progress")}</span>
                          <span className="text-white/60 font-medium">{achievement.progress}%</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${achievement.progress}%` }}
                            className="h-full bg-white/20"
                          />
                        </div>
                      </div>
                    )}

                    {!isUnlocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl">
                        <div className="bg-zinc-900 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2">
                          <Lock className="w-4 h-4 text-white/40" />
                          <span className="text-sm font-medium">{t("achievements.locked")}</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
