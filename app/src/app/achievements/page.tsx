"use client";

import { useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { MeshGradient } from "@/components/MeshGradient";
import { GridPattern } from "@/components/GridPattern";
import { 
  Trophy, Medal, Star, Flame, Zap, Target, 
  BookOpen, Code, Shield, Crown, Award, Lock
} from "lucide-react";
import { Badge } from "@/components/ui";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: "progress" | "streak" | "skill" | "community" | "special";
  earned: boolean;
  earnedAt?: string;
  xpReward: number;
}

const ACHIEVEMENTS: Achievement[] = [
  // Progress
  { id: "first-steps", name: "First Steps", description: "Complete your first lesson", icon: BookOpen, category: "progress", earned: false, xpReward: 50 },
  { id: "course-completer", name: "Course Completer", description: "Complete your first course", icon: Trophy, category: "progress", earned: false, xpReward: 200 },
  { id: "five-courses", name: "Knowledge Seeker", description: "Complete 5 courses", icon: Star, category: "progress", earned: false, xpReward: 500 },
  
  // Streaks
  { id: "week-warrior", name: "Week Warrior", description: "Maintain a 7-day streak", icon: Flame, category: "streak", earned: false, xpReward: 100 },
  { id: "monthly-master", name: "Monthly Master", description: "Maintain a 30-day streak", icon: Crown, category: "streak", earned: false, xpReward: 300 },
  { id: "consistency-king", name: "Consistency King", description: "Maintain a 100-day streak", icon: Award, category: "streak", earned: false, xpReward: 1000 },
  
  // Skills
  { id: "rust-rookie", name: "Rust Rookie", description: "Complete all Rust lessons", icon: Code, category: "skill", earned: false, xpReward: 150 },
  { id: "anchor-expert", name: "Anchor Expert", description: "Complete the Anchor course", icon: Shield, category: "skill", earned: false, xpReward: 250 },
  { id: "full-stack", name: "Full Stack Solana", description: "Complete courses in 3 different tracks", icon: Zap, category: "skill", earned: false, xpReward: 400 },
  
  // Community
  { id: "first-comment", name: "First Comment", description: "Leave your first comment", icon: MessageCircle, category: "community", earned: false, xpReward: 25 },
  { id: "helper", name: "Helper", description: "Help another developer", icon: Users, category: "community", earned: false, xpReward: 75 },
  
  // Special
  { id: "early-adopter", name: "Early Adopter", description: "Join during beta", icon: Rocket, category: "special", earned: false, xpReward: 200 },
  { id: "bug-hunter", name: "Bug Hunter", description: "Report a bug", icon: Bug, category: "special", earned: false, xpReward: 150 },
  { id: "perfect-score", name: "Perfect Score", description: "Pass all tests on first try", icon: Target, category: "special", earned: false, xpReward: 200 },
];

function MessageCircle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function Users({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function Rocket({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

function Bug({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect width="8" height="14" x="8" y="6" rx="4" />
      <path d="m19 7-3 2" />
      <path d="m5 7 3 2" />
      <path d="m19 19-3-2" />
      <path d="m5 19 3-2" />
      <path d="M20 13h-4" />
      <path d="M4 13h4" />
      <path d="m10 4 1 2" />
    </svg>
  );
}

const CATEGORY_CONFIG = {
  progress: { label: "Progress", color: "text-blue-400", bg: "bg-blue-500/20" },
  streak: { label: "Streaks", color: "text-orange-400", bg: "bg-orange-500/20" },
  skill: { label: "Skills", color: "text-purple-400", bg: "bg-purple-500/20" },
  community: { label: "Community", color: "text-green-400", bg: "bg-green-500/20" },
  special: { label: "Special", color: "text-yellow-400", bg: "bg-yellow-500/20" },
};

export default function AchievementsPage() {
  const { connected } = useWallet();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredAchievements = selectedCategory === "all" 
    ? ACHIEVEMENTS 
    : ACHIEVEMENTS.filter(a => a.category === selectedCategory);

  const earnedCount = ACHIEVEMENTS.filter(a => a.earned).length;
  const totalXP = ACHIEVEMENTS.filter(a => a.earned).reduce((acc, a) => acc + a.xpReward, 0);

  if (!connected) {
    return (
      <div className="min-h-screen bg-black text-white relative">
        <MeshGradient />
        <GridPattern />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-white/20" />
            <h1 className="text-2xl font-semibold mb-2">Achievements</h1>
            <p className="text-white/60">Connect your wallet to view achievements</p>
            <Link href="/" className="inline-block mt-6 px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90">
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      <MeshGradient />
      <GridPattern />

      <main className="pt-20 pb-12 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Achievements</h1>
            <p className="text-white/60">Earn badges and XP by completing challenges</p>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="text-white/60 text-sm">Earned</span>
              </div>
              <div className="text-3xl font-bold">{earnedCount} / {ACHIEVEMENTS.length}</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-5 h-5 text-purple-400" />
                <span className="text-white/60 text-sm">XP Earned</span>
              </div>
              <div className="text-3xl font-bold">+{totalXP}</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-5 h-5 text-green-400" />
                <span className="text-white/60 text-sm">Progress</span>
              </div>
              <div className="text-3xl font-bold">{Math.round((earnedCount / ACHIEVEMENTS.length) * 100)}%</div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === "all" 
                  ? "bg-white text-black" 
                  : "bg-white/5 text-white/60 hover:text-white"
              }`}
            >
              All
            </button>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === key 
                    ? config.bg + " " + config.color
                    : "bg-white/5 text-white/60 hover:text-white"
                }`}
              >
                {config.label}
              </button>
            ))}
          </div>

          {/* Achievements Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`relative bg-white/5 border rounded-xl p-6 transition-all ${
                  achievement.earned 
                    ? "border-white/20 hover:border-white/40" 
                    : "border-white/5 opacity-60"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    achievement.earned 
                      ? "bg-gradient-to-br from-yellow-400/20 to-orange-400/20" 
                      : "bg-white/5"
                  }`}>
                    <achievement.icon className={`w-6 h-6 ${
                      achievement.earned ? "text-yellow-400" : "text-white/30"
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-medium ${achievement.earned ? "text-white" : "text-white/50"}`}>
                        {achievement.name}
                      </h3>
                      {!achievement.earned && <Lock className="w-3 h-3 text-white/30" />}
                    </div>
                    <p className="text-sm text-white/50 mb-2">{achievement.description}</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        CATEGORY_CONFIG[achievement.category].bg + " " + CATEGORY_CONFIG[achievement.category].color
                      }`}>
                        {CATEGORY_CONFIG[achievement.category].label}
                      </span>
                      <span className="text-xs text-yellow-400">+{achievement.xpReward} XP</span>
                    </div>
                  </div>
                </div>
                {achievement.earned && (
                  <div className="absolute top-2 right-2">
                    <Medal className="w-5 h-5 text-yellow-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
