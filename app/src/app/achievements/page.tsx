"use client";

import { useWallet } from "@solana/wallet-adapter-react";

const MOCK_ACHIEVEMENTS = [
  { id: "first-enrollment", name: "First Steps", description: "Enroll in your first course", xpReward: 50, emoji: "🎓", earned: false, supply: "127/∞" },
  { id: "anchor-complete", name: "Anchor Master", description: "Complete the Anchor 101 course", xpReward: 500, emoji: "⚓", earned: false, supply: "47/∞" },
  { id: "three-courses", name: "Knowledge Seeker", description: "Complete 3 courses", xpReward: 1000, emoji: "📚", earned: false, supply: "23/∞" },
  { id: "all-tracks", name: "Renaissance Dev", description: "Complete a course in every track", xpReward: 2500, emoji: "🌟", earned: false, supply: "5/∞" },
  { id: "perfect-score", name: "Perfectionist", description: "Complete all lessons in a course without any retries", xpReward: 300, emoji: "💎", earned: false, supply: "12/∞" },
  { id: "speed-run", name: "Speed Runner", description: "Complete a course within 24 hours", xpReward: 200, emoji: "⚡", earned: false, supply: "8/∞" },
  { id: "streak-7", name: "Week Warrior", description: "Maintain a 7-day learning streak", xpReward: 150, emoji: "🔥", earned: false, supply: "34/∞" },
  { id: "streak-30", name: "Monthly Monster", description: "Maintain a 30-day learning streak", xpReward: 750, emoji: "🏋️", earned: false, supply: "3/∞" },
  { id: "top-10", name: "Leaderboard Elite", description: "Reach the top 10 on the leaderboard", xpReward: 500, emoji: "🏆", earned: false, supply: "10/10" },
  { id: "hackathon-winner", name: "Hackathon Winner", description: "Win a Superteam hackathon", xpReward: 5000, emoji: "🏅", earned: false, supply: "0/100" },
  { id: "bug-bounty", name: "Bug Hunter", description: "Submit a valid bug report", xpReward: 1000, emoji: "🐛", earned: false, supply: "2/∞" },
  { id: "community-helper", name: "Community Hero", description: "Help 10 learners in the community", xpReward: 300, emoji: "🤝", earned: false, supply: "15/∞" },
];

export default function AchievementsPage() {
  const { connected } = useWallet();

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-1/3 w-72 h-72 bg-[#9945FF]/8 rounded-full blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Achievements</h1>
          <p className="text-white/50 max-w-xl">
            Unlock achievements as you learn. Each achievement is a unique Metaplex Core NFT with an XP reward.
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-[#14F195]">0</div>
            <div className="text-xs text-white/40">Earned</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-white/60">{MOCK_ACHIEVEMENTS.length}</div>
            <div className="text-xs text-white/40">Total</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-[#14F195]">0</div>
            <div className="text-xs text-white/40">XP from Achievements</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-white/60">
              {MOCK_ACHIEVEMENTS.reduce((sum, a) => sum + a.xpReward, 0).toLocaleString()}
            </div>
            <div className="text-xs text-white/40">Total Available XP</div>
          </div>
        </div>

        {/* Achievement Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_ACHIEVEMENTS.map((achievement) => (
            <div
              key={achievement.id}
              className={`glass-card p-6 transition-all duration-300 ${
                achievement.earned
                  ? "border-[#14F195]/20 glow-green"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                  achievement.earned
                    ? "bg-[#14F195]/10"
                    : "bg-white/5 grayscale"
                }`}>
                  {achievement.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white mb-1">{achievement.name}</h3>
                  <p className="text-xs text-white/40 leading-relaxed">{achievement.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs font-medium text-[#14F195]">+{achievement.xpReward} XP</span>
                    <span className="text-xs text-white/20">·</span>
                    <span className="text-xs text-white/30">{achievement.supply}</span>
                  </div>
                </div>
              </div>
              {achievement.earned && (
                <div className="mt-3 pt-3 border-t border-white/5 text-center">
                  <span className="text-xs text-[#14F195] font-medium">✅ Earned</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="mt-8 glass-card p-6">
          <h3 className="text-sm font-semibold text-white/70 mb-2">How achievements work</h3>
          <p className="text-sm text-white/40 leading-relaxed">
            Achievements are awarded by registered minters (see SPEC.md). Each achievement creates an
            AchievementReceipt PDA to prevent double-awarding, mints a unique Metaplex Core NFT to
            your wallet, and awards the XP reward. Achievement claiming requires a backend minter role
            and is stubbed in this demo.
          </p>
        </div>
      </div>
    </div>
  );
}
