"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState, useCallback } from "react";
import { MeshGradient } from "@/components/MeshGradient";
import { GridPattern } from "@/components/GridPattern";
import {
  Trophy, Zap, Flame, BookOpen,
  Target, Calendar, ArrowRight, Lock, Star
} from "lucide-react";
import Link from "next/link";
import { getXPBalance, calculateLevel, getXPToNextLevel, getProgressToNextLevel } from "@/lib/blockchain";
import { useLearningService, useEnrollmentService } from "@/contexts/ServicesContext";

const ENROLLED_COURSES = [
  {
    id: "anchor-fundamentals",
    title: "Anchor Fundamentals",
    progress: 65,
    nextLesson: "PDA Challenge",
    xpEarned: 450,
  },
];

export default function DashboardPage() {
  const { connected, publicKey } = useWallet();
  const learningService = useLearningService();
  const enrollmentService = useEnrollmentService();

  const [stats, setStats] = useState({
    xp: 0,
    level: 1,
    rank: 42,
    streak: 7,
    achievements: 3,
  });

  const [loading, setLoading] = useState(true);

  const loadUserData = useCallback(async () => {
    if (!publicKey) return;

    try {
      setLoading(true);

      // Fetch real XP from blockchain
      const xp = await getXPBalance(publicKey);
      const level = calculateLevel(xp);

      // Get user stats from service
      const userStats = await learningService.getUserStats(publicKey.toString());

      setStats({
        xp,
        level,
        rank: userStats.rank,
        streak: userStats.streak,
        achievements: userStats.achievements,
      });
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  }, [publicKey, learningService]);

  useEffect(() => {
    if (connected && publicKey) {
      loadUserData();
    }
  }, [connected, publicKey, loadUserData]);

  if (!connected) {
    return (
      <div className="min-h-screen bg-black text-white relative">
        <MeshGradient />
        <GridPattern />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-semibold mb-4">Connect Wallet</h1>
            <p className="text-white/60 mb-8">Connect your wallet to view your dashboard</p>
            <Link href="/" className="px-6 py-3 bg-white text-black rounded-md font-medium hover:bg-white/90 transition-colors">
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const nextLevelXP = getXPToNextLevel(stats.level);
  const progressToNextLevel = getProgressToNextLevel(stats.xp);
  const xpNeeded = nextLevelXP - stats.xp;

  return (
    <div className="min-h-screen bg-black text-white relative">
      <MeshGradient />
      <GridPattern />

      <main className="pt-14 relative z-10">
        <div className="max-w-6xl mx-auto px-6 py-12">
          {/* Welcome */}
          <div className="mb-12">
            <h1 className="text-3xl font-semibold mb-2">Dashboard</h1>
            <p className="text-white/60">Track your progress and achievements</p>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-4 mb-12">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-white/60 text-sm">Total XP</span>
              </div>
              <div className="text-3xl font-semibold">{stats.xp.toLocaleString()}</div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="w-5 h-5 text-purple-400" />
                <span className="text-white/60 text-sm">Level</span>
              </div>
              <div className="text-3xl font-semibold">{stats.level}</div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Flame className="w-5 h-5 text-orange-400" />
                <span className="text-white/60 text-sm">Streak</span>
              </div>
              <div className="text-3xl font-semibold">{stats.streak} days</div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-5 h-5 text-green-400" />
                <span className="text-white/60 text-sm">Rank</span>
              </div>
              <div className="text-3xl font-semibold">#{stats.rank}</div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Continue Learning */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold mb-6">Continue Learning</h2>

              {ENROLLED_COURSES.length > 0 ? (
                <div className="space-y-4">
                  {ENROLLED_COURSES.map((course) => (
                    <div
                      key={course.id}
                      className="bg-white/5 border border-white/10 rounded-xl p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-medium mb-1">{course.title}</h3>
                          <p className="text-white/40 text-sm">Next: {course.nextLesson}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-semibold text-yellow-400">{course.xpEarned} XP</div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-white/60">Progress</span>
                          <span>{course.progress}%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-400 rounded-full"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>

                      <Link
                        href={`/courses/${course.id}`}
                        className="inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white"
                      >
                        Continue
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
                  <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/60 mb-4">You haven't enrolled in any courses yet</p>
                  <Link
                    href="/courses"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black rounded-md text-sm font-medium"
                  >
                    Browse Courses
                  </Link>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div>
              {/* Level Progress */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                <h3 className="font-medium mb-4">Level Progress</h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-yellow-400/20 flex items-center justify-center">
                    <span className="text-2xl font-bold text-yellow-400">{stats.level}</span>
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-yellow-400 rounded-full"
                        style={{ width: `${progressToNextLevel}%` }}
                      />
                    </div>
                    <div className="text-xs text-white/40">
                      {xpNeeded} XP to level {stats.level + 1}
                    </div>
                  </div>
                </div>
              </div>

              {/* Streak */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Streak</h3>
                  <Flame className="w-5 h-5 text-orange-400" />
                </div>
                <div className="flex gap-2">
                  {[...Array(7)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-8 h-8 rounded-md flex items-center justify-center text-xs ${i < stats.streak ? "bg-orange-400/20 text-orange-400" : "bg-white/5"
                        }`}
                    >
                      {["M", "T", "W", "T", "F", "S", "S"][i]}
                    </div>
                  ))}
                </div>
                <p className="text-white/40 text-sm mt-4">7 day milestone at 7 days!</p>
              </div>

              {/* Achievements */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="font-medium mb-4">Achievements</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-400/20 flex items-center justify-center">
                      <Star className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">First Steps</div>
                      <div className="text-xs text-white/40">Complete your first lesson</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
