"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { motion } from "framer-motion";
import { Trophy, Zap, Clock, Shield, TrendingUp } from "lucide-react";

export function LearnerProfile() {
  const { publicKey } = useWallet();

  const stats = {
    xp: 3840,
    level: 6,
    streak: 12,
    longestStreak: 28,
    coursesCompleted: 3,
    rank: 234,
  };

  const credentials = [
    { track: "Anchor Development", level: "Beginner", date: "2024-02-10" },
    { track: "Token-2022", level: "Intermediate", date: "2024-02-14" },
  ];

  const achievements = [
    { name: "First Steps", description: "Complete your first lesson", unlocked: true },
    { name: "Week Warrior", description: "Maintain a 7-day streak", unlocked: true },
    { name: "Course Crusher", description: "Complete your first course", unlocked: true },
    { name: "Token Master", description: "Earn 1000 XP in one day", unlocked: false },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Your Profile</h2>
          <p className="text-white/50 font-mono text-sm">
            {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-semibold">#{stats.rank}</div>
          <div className="text-sm text-white/50">Global rank</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-white/10">
          <div className="flex items-center gap-2 text-white/50 mb-2">
            <Zap className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Total XP</span>
          </div>
          <div className="text-2xl font-semibold">{stats.xp.toLocaleString()}</div>
        </div>
        <div className="p-4 rounded-lg border border-white/10">
          <div className="flex items-center gap-2 text-white/50 mb-2">
            <Trophy className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Level</span>
          </div>
          <div className="text-2xl font-semibold">{stats.level}</div>
        </div>
        <div className="p-4 rounded-lg border border-white/10">
          <div className="flex items-center gap-2 text-white/50 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Streak</span>
          </div>
          <div className="text-2xl font-semibold">{stats.streak}d</div>
        </div>
        <div className="p-4 rounded-lg border border-white/10">
          <div className="flex items-center gap-2 text-white/50 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Completed</span>
          </div>
          <div className="text-2xl font-semibold">{stats.coursesCompleted}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Credentials */}
        <div>
          <h3 className="text-sm font-medium uppercase tracking-wider text-white/50 mb-4">
            Credentials
          </h3>
          <div className="space-y-3">
            {credentials.map((cred, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-white/5 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white/60" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{cred.track}</div>
                    <div className="text-xs text-white/50">{cred.level}</div>
                  </div>
                </div>
                <div className="text-xs text-white/40">{cred.date}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div>
          <h3 className="text-sm font-medium uppercase tracking-wider text-white/50 mb-4">
            Achievements
          </h3>
          <div className="space-y-3">
            {achievements.map((achievement, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 p-4 rounded-lg border transition-colors ${achievement.unlocked
                    ? "border-white/10"
                    : "border-white/5 opacity-50"
                  }`}
              >
                <div className={`w-2 h-2 rounded-full ${achievement.unlocked ? "bg-white" : "bg-white/20"}`} />
                <div>
                  <div className="font-medium text-sm">{achievement.name}</div>
                  <div className="text-xs text-white/50">{achievement.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* XP Progress */}
      <div className="p-6 rounded-lg border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-medium mb-1">Level {stats.level}</div>
            <div className="text-sm text-white/50">{stats.xp} / 5000 XP to next level</div>
          </div>
          <div className="text-sm text-white/50">77%</div>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full w-[77%] bg-white rounded-full" />
        </div>
      </div>
    </div>
  );
}
