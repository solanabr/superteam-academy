"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import {
  Zap,
  BookOpen,
  ArrowRight,
  Trophy,
  Flame,
  Star,
  TrendingUp,
  Clock,
  CheckCircle2,
  Target,
  Activity,
} from "lucide-react";
import { PageLayout } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { XPDisplay } from "@/components/gamification/xp-display";
import { StreakCalendar } from "@/components/gamification/streak-calendar";
import { AchievementBadge } from "@/components/gamification/achievement-badge";
import { learningProgressService } from "@/lib/services/learning-progress";
import { MOCK_COURSES, MOCK_ACHIEVEMENTS, generateMockStreak } from "@/lib/mock-data";
import { calculateXPBalance, formatXP } from "@/lib/utils/xp";
import { XPBalance, Streak, Achievement } from "@/types";

function useCounter(end: number, duration = 1000, active = true) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active || end === 0) return;
    let start: number | null = null;
    const raf = (t: number) => {
      if (!start) start = t;
      const p = Math.min((t - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(ease * end));
      if (p < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [end, duration, active]);
  return val;
}

const activityFeed = [
  { text: "Completed 'Proof of History' lesson", xp: 75, time: "2h ago", icon: "📖", type: "lesson" },
  { text: "Solved 'PDA Derivation' challenge", xp: 100, time: "1d ago", icon: "🏆", type: "challenge" },
  { text: "Enrolled in Anchor Framework course", xp: 0, time: "2d ago", icon: "⚡", type: "enroll" },
  { text: "Unlocked 'First Steps' achievement", xp: 50, time: "3d ago", icon: "🎯", type: "achievement" },
  { text: "Started 'Token-2022' lesson", xp: 0, time: "4d ago", icon: "📚", type: "lesson" },
];

export default function DashboardPage() {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const [xpBalance, setXpBalance] = useState<XPBalance>(calculateXPBalance(0));
  const [streak, setStreak] = useState<Streak>(generateMockStreak());
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true });

  const xpCount = useCounter(xpBalance.amount, 1200, statsInView);
  const streakCount = useCounter(streak.currentStreak, 800, statsInView);

  useEffect(() => {
    const walletAddr = publicKey?.toBase58() ?? "demo";
    learningProgressService.getXpBalance(walletAddr).then(setXpBalance);
    learningProgressService.getAchievements(walletAddr).then(setAchievements);
    learningProgressService.getStreakData(walletAddr).then(setStreak);
  }, [publicKey]);

  const activeCourses = MOCK_COURSES.slice(0, 2);
  const unlockedAchievements = achievements.filter((a) => a.isUnlocked);

  const statCards = [
    { label: "Total XP", value: xpCount, suffix: " XP", icon: Zap, color: "#9945FF", format: (v: number) => formatXP(v) },
    { label: "Current Level", value: xpBalance.level, suffix: "", icon: Star, color: "#14F195", format: (v: number) => String(v) },
    { label: "Day Streak", value: streakCount, suffix: " days", icon: Flame, color: "#FF6B35", format: (v: number) => String(v) },
    { label: "Achievements", value: unlockedAchievements.length, suffix: `/${achievements.length}`, icon: Trophy, color: "#00C2FF", format: (v: number) => String(v) },
  ];

  return (
    <PageLayout>
      <div className="min-h-screen pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 pt-6"
          >
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-[#9945FF]" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dashboard</span>
            </div>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">
                  Welcome back,{" "}
                  <span className="gradient-text">
                    {connected && publicKey ? `${publicKey.toBase58().slice(0, 8)}...` : "Builder"}
                  </span>
                  {" "}👋
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                  You&apos;re on a <strong className="text-orange-400">{streak.currentStreak}-day</strong> streak. Keep it up!
                </p>
              </div>
              {!connected && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setVisible(true)}
                  className="border-[#9945FF]/30 text-[#9945FF] hover:bg-[#9945FF]/10 hidden sm:flex"
                >
                  <Zap className="h-3.5 w-3.5" />
                  Connect Wallet
                </Button>
              )}
            </div>

            {!connected && (
              <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#9945FF]/8 border border-[#9945FF]/25 text-sm">
                <span className="text-[#9945FF] text-xs">⚡ Connect wallet to sync on-chain XP & credentials</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 text-[10px] text-[#9945FF] hover:bg-[#9945FF]/15 px-2 py-0"
                  onClick={() => setVisible(true)}
                >
                  Connect
                </Button>
              </div>
            )}
          </motion.div>

          {/* Stat cards row */}
          <div ref={statsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {statCards.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bento-card p-4 group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${stat.color}18` }}
                  >
                    <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
                  </div>
                  <TrendingUp className="h-3 w-3 text-muted-foreground/40" />
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-2xl font-bold tabular-nums">{stat.format(stat.value)}</span>
                  <span className="text-xs text-muted-foreground mb-0.5">{stat.suffix}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Weekly goal bar */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bento-card p-4 mb-6"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-[#9945FF]" />
                <span className="text-sm font-medium">Weekly Goal</span>
                <Badge className="text-[10px] h-4 px-1.5 bg-[#9945FF]/15 text-[#9945FF] border-[#9945FF]/25">
                  On Track
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                <span className="text-foreground font-semibold">350</span> / 500 XP
              </span>
            </div>
            <Progress value={70} variant="xp" className="h-2" />
            <p className="text-xs text-muted-foreground mt-1.5">150 XP to hit your weekly target 🎯</p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-5">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-5">

              {/* Active courses */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-sm flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-[#9945FF]" />
                    Active Courses
                  </h2>
                  <Link href="/courses" className="text-xs text-[#9945FF] hover:text-[#9945FF]/80 flex items-center gap-1 transition-colors">
                    All Courses <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {activeCourses.map((course) => (
                    <div key={course.id} className="bento-card p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                          style={{ backgroundColor: `${course.track.color}18` }}
                        >
                          {course.track.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-medium text-sm leading-tight">{course.title}</h3>
                            <span
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0"
                              style={{
                                color: course.difficulty === "beginner" ? "#14F195" : "#9945FF",
                                backgroundColor: course.difficulty === "beginner" ? "rgba(20,241,149,0.1)" : "rgba(153,69,255,0.1)",
                                borderColor: course.difficulty === "beginner" ? "rgba(20,241,149,0.3)" : "rgba(153,69,255,0.3)",
                              }}
                            >
                              {course.difficulty}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{course.instructor.name}</p>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-muted-foreground">
                              {Math.floor(course.lessonCount * 0.3)}/{course.lessonCount} lessons
                            </span>
                            <span className="text-[#9945FF] font-semibold">30%</span>
                          </div>
                          <Progress value={30} variant="xp" className="h-1.5 mb-2" />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              ~{Math.floor(course.duration * 0.7 / 60)}h remaining
                            </div>
                            <Button asChild variant="glass" size="sm" className="h-6 text-xs px-3">
                              <Link href={`/courses/${course.slug}`}>
                                Continue <ArrowRight className="h-2.5 w-2.5" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Activity feed */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
                <h2 className="font-semibold text-sm flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-[#14F195]" />
                  Recent Activity
                </h2>
                <div className="bento-card overflow-hidden">
                  {activityFeed.map((activity, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.45 + i * 0.07 }}
                      className={`flex items-center gap-3 px-4 py-3 ${i < activityFeed.length - 1 ? "border-b border-white/[0.06]" : ""}`}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base bg-white/[0.04] shrink-0">
                        {activity.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground/90 truncate">{activity.text}</p>
                        <p className="text-[10px] text-muted-foreground">{activity.time}</p>
                      </div>
                      {activity.xp > 0 ? (
                        <div className="xp-pill text-[10px] shrink-0">
                          <Zap className="h-2.5 w-2.5" />
                          +{activity.xp}
                        </div>
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right column */}
            <div className="space-y-5">
              <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                <XPDisplay xpBalance={xpBalance} />
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                <StreakCalendar streak={streak} />
              </motion.div>

              {/* Achievements */}
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bento-card p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm flex items-center gap-1.5">
                    <Trophy className="h-3.5 w-3.5 text-yellow-400" />
                    Achievements
                  </h3>
                  <Link href="/profile" className="text-xs text-[#9945FF] hover:text-[#9945FF]/80 transition-colors">
                    View all
                  </Link>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {achievements.slice(0, 8).map((achievement) => (
                    <AchievementBadge key={achievement.id} achievement={achievement} size="md" />
                  ))}
                </div>
              </motion.div>

              {/* Recommended */}
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="bento-card p-4"
              >
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-[#14F195]" />
                  Recommended Next
                </h3>
                {MOCK_COURSES.slice(2, 4).map((course) => (
                  <Link key={course.id} href={`/courses/${course.slug}`}>
                    <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/[0.05] transition-colors mb-1 group">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
                        style={{ backgroundColor: `${course.track.color}18` }}
                      >
                        {course.track.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate group-hover:text-foreground transition-colors">{course.title}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Zap className="h-2.5 w-2.5 text-[#14F195]" />
                          <span className="text-[10px] text-[#14F195]">{formatXP(course.xpReward)} XP</span>
                        </div>
                      </div>
                      <ArrowRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-[#9945FF] transition-colors shrink-0" />
                    </div>
                  </Link>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
