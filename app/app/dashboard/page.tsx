"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useXP } from "@/context/XPContext";
import { useCourses } from "@/hooks/useCourses";
import { mockCourses, mockAchievements } from "@/lib/mockData";
import { shortenAddress, formatXP } from "@/lib/utils";
import { ArrowUpRight, Zap, Trophy, BookOpen, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { publicKey } = useWallet();
  const { xp, level, progressPercent } = useXP();
  const { isEnrolled } = useCourses();

  const enrolledCourses = mockCourses.filter((c) => isEnrolled(c.id));
  const recommendedCourses = mockCourses.filter((c) => !isEnrolled(c.id)).slice(0, 3);

  // Streak from localStorage
  const streak = (() => {
    if (typeof window === "undefined") return 0;
    try {
      const s = localStorage.getItem("streak");
      return s ? Number(s) : 0;
    } catch { return 0; }
  })();

  if (!publicKey) {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center">
        <div className="text-center">
          <div className="text-[10px] font-mono text-[#333] mb-4">// ACCESS_DENIED</div>
          <h2 className="font-display font-black text-4xl uppercase text-[#ff3366] mb-4">WALLET_REQUIRED</h2>
          <p className="text-xs font-mono text-[#444] mb-8">Connect your wallet to access your dashboard</p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "TOTAL_XP", value: formatXP(xp) + "_XP", color: "text-[#9945ff]", icon: Zap },
    { label: "CURRENT_LEVEL", value: "LVL_" + level, color: "text-[#14f195]", icon: Trophy },
    { label: "COURSES_ENROLLED", value: enrolledCourses.length.toString(), color: "text-[#f5f5f0]", icon: BookOpen },
    { label: "DAY_STREAK", value: streak + "_DAYS", color: "text-[#ff3366]", icon: Flame },
  ];

  return (
    <div className="min-h-screen bg-[#020202]">

      {/* Header */}
      <div className="border-b border-[#1a1a1a] px-6 py-12 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-[10px] font-mono text-[#333] uppercase tracking-widest">// DASHBOARD</span>
          <div className="flex-1 h-px bg-[#1a1a1a]" />
        </div>
        <h1 className="font-display font-black text-5xl uppercase tracking-tighter">
          GM, <span className="text-[#9945ff]">BUILDER</span>
        </h1>
        <div className="text-[10px] font-mono text-[#444] mt-2">{shortenAddress(publicKey.toBase58())}</div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#1a1a1a]">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#020202] p-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <stat.icon className="w-3.5 h-3.5 text-[#333]" />
                <span className="text-[10px] font-mono text-[#333] uppercase tracking-widest">{stat.label}</span>
              </div>
              <div className={cn("font-display font-black text-3xl", stat.color)}>
                {stat.value}
              </div>
            </motion.div>
          ))}
        </div>

        {/* XP Progress bar */}
        <div>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-[10px] font-mono text-[#333] uppercase tracking-widest">// XP_PROGRESS</span>
            <div className="flex-1 h-px bg-[#1a1a1a]" />
            <span className="text-[10px] font-mono text-[#444]">LVL_{level} → LVL_{level + 1}</span>
          </div>
          <div className="h-2 bg-[#1a1a1a] w-full">
            <motion.div
              className="h-full bg-gradient-to-r from-[#9945ff] to-[#14f195]"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] font-mono text-[#444]">{formatXP(xp)} XP</span>
            <span className="text-[10px] font-mono text-[#444]">{Math.round(progressPercent)}% to next level</span>
          </div>
        </div>

        {/* Active courses */}
        <div>
          <div className="flex items-center gap-4 mb-6">
            <span className="text-[10px] font-mono text-[#333] uppercase tracking-widest">// ACTIVE_COURSES</span>
            <div className="flex-1 h-px bg-[#1a1a1a]" />
            <Link href="/courses" className="text-[10px] font-mono text-[#9945ff] hover:underline uppercase tracking-widest">
              BROWSE_ALL →
            </Link>
          </div>

          {enrolledCourses.length === 0 ? (
            <div className="border border-dashed border-[#1a1a1a] p-12 text-center">
              <div className="text-[10px] font-mono text-[#333] mb-4">NO_ACTIVE_COURSES</div>
              <Link href="/courses">
                <button className="px-5 py-2.5 bg-[#9945ff] text-white font-mono text-xs uppercase tracking-widest hover:bg-[#8835ef] transition-colors">
                  START_LEARNING →
                </button>
              </Link>
            </div>
          ) : (
            <div className="border border-[#1a1a1a] divide-y divide-[#1a1a1a]">
              {enrolledCourses.map((course, i) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={`/courses/${course.id}/lessons/0`}>
                    <div className="flex items-center gap-6 px-6 py-4 hover:bg-[#0a0a0a] transition-colors group">
                      <div className="flex-1">
                        <div className="text-[10px] font-mono text-[#333] mb-1">{course.track}</div>
                        <div className="text-sm font-mono text-[#f5f5f0] group-hover:text-[#9945ff] transition-colors uppercase">
                          {course.title}
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-[10px] font-mono text-[#444]">
                        <span className="text-[#14f195]">+{course.xp.toLocaleString()}_XP</span>
                        <span>{course.duration}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 group-hover:text-[#9945ff] transition-colors" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Achievements */}
        <div>
          <div className="flex items-center gap-4 mb-6">
            <span className="text-[10px] font-mono text-[#333] uppercase tracking-widest">// ACHIEVEMENTS</span>
            <div className="flex-1 h-px bg-[#1a1a1a]" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-px bg-[#1a1a1a]">
            {mockAchievements.map((a) => (
              <div key={a.id} className="bg-[#020202] p-4 flex flex-col items-center text-center opacity-30">
                <span className="text-2xl mb-2">{a.icon}</span>
                <div className="text-[9px] font-mono text-[#f5f5f0] uppercase tracking-widest mb-1">{a.name}</div>
                <div className="text-[9px] font-mono text-[#9945ff]">+{a.xpReward}_XP</div>
                <div className="text-[9px] font-mono text-[#333] mt-1">LOCKED</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended */}
        <div>
          <div className="flex items-center gap-4 mb-6">
            <span className="text-[10px] font-mono text-[#333] uppercase tracking-widest">// RECOMMENDED_COURSES</span>
            <div className="flex-1 h-px bg-[#1a1a1a]" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#1a1a1a]">
            {recommendedCourses.map((course) => (
              <Link key={course.id} href={`/courses/${course.id}`}>
                <div className="bg-[#020202] hover:bg-[#0a0a0a] transition-colors group p-6">
                  <div className="text-[10px] font-mono text-[#333] mb-2">{course.track}</div>
                  <h3 className="font-display font-black text-lg uppercase tracking-tight mb-2 group-hover:text-[#9945ff] transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-xs font-mono text-[#444] line-clamp-2 mb-4">{course.description}</p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#333]">
                    <span>{course.lessons}_LESSONS</span>
                    <span className="text-[#14f195]">+{course.xp.toLocaleString()}_XP</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}