"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useXP } from "@/context/XPContext";
import { useAuth } from "@/context/AuthContext";
import { useCourses } from "@/hooks/useCourses";
import { mockCourses, mockAchievements } from "@/lib/mockData";
import { shortenAddress, formatXP } from "@/lib/utils";
import { ArrowUpRight, Zap, Trophy, BookOpen, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { SkillRadar } from "@/components/ui-custom/SkillRadar";

function StreakCalendar({ streak }: { streak: number }) {
  const today = new Date();
  const days: { date: Date; active: boolean; isToday: boolean }[] = [];

  for (let i = 83; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    let active = false;
    try {
      active = !!localStorage.getItem(`streak_${date.toDateString()}`);
    } catch {}
    const isToday = date.toDateString() === today.toDateString();
    days.push({ date, active, isToday });
  }

  const weeks: { date: Date; active: boolean; isToday: boolean }[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const monthLabels: { label: string; col: number }[] = [];
  weeks.forEach((week, i) => {
    const month = week[0]?.date.toLocaleString("default", { month: "short" });
    const prevMonth = i > 0 ? weeks[i - 1]?.[0]?.date.toLocaleString("default", { month: "short" }) : "";
    if (month !== prevMonth) {
      monthLabels.push({ label: month, col: i });
    }
  });

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="w-full">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-[#020202] border border-[#1a1a1a] p-4 text-center">
          <div className="font-display font-black text-3xl text-[#ff3366] mb-1">{streak}</div>
          <div className="text-[9px] font-mono text-[#444] uppercase tracking-widest">Current Streak</div>
        </div>
        <div className="bg-[#020202] border border-[#1a1a1a] p-4 text-center">
          <div className="font-display font-black text-3xl text-[#9945ff] mb-1">
            {days.filter(d => d.active).length}
          </div>
          <div className="text-[9px] font-mono text-[#444] uppercase tracking-widest">Total Active Days</div>
        </div>
        <div className="bg-[#020202] border border-[#1a1a1a] p-4 text-center">
          <div className="font-display font-black text-3xl text-[#14f195] mb-1">
            {Math.round((days.filter(d => d.active).length / 84) * 100)}%
          </div>
          <div className="text-[9px] font-mono text-[#444] uppercase tracking-widest">Consistency Rate</div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="overflow-x-auto pb-2">
        {/* Month labels */}
        <div className="flex mb-2" style={{ paddingLeft: "48px" }}>
          {weeks.map((_, i) => {
            const label = monthLabels.find(m => m.col === i);
            return (
              <div key={i} className="text-[9px] font-mono text-[#444] uppercase" style={{ width: "20px", marginRight: "4px" }}>
                {label?.label || ""}
              </div>
            );
          })}
        </div>

        <div className="flex gap-0">
          {/* Day labels */}
          <div className="flex flex-col mr-3" style={{ width: "40px" }}>
            {dayLabels.map((d, i) => (
              <div key={i} className="text-[9px] font-mono text-[#444] flex items-center" style={{ height: "20px", marginBottom: "4px" }}>
                {i % 2 === 0 ? d : ""}
              </div>
            ))}
          </div>

          {/* Weeks */}
          <div className="flex gap-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((day, di) => (
                  <div
                    key={di}
                    title={`${day.date.toDateString()}${day.active ? " — Active" : ""}`}
                    className={cn(
                      "rounded-sm transition-all cursor-pointer group relative",
                      "hover:ring-1 hover:ring-[#9945ff]/60",
                    )}
                    style={{ width: "16px", height: "16px" }}
                  >
                    <div className={cn(
                      "w-full h-full rounded-sm",
                      day.isToday
                        ? "bg-[#14f195] ring-1 ring-[#14f195]/60"
                        : day.active
                        ? "bg-[#9945ff]"
                        : day.date > today
                        ? "bg-transparent"
                        : "bg-[#1a1a1a]"
                    )} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mt-4 justify-end">
          <span className="text-[9px] font-mono text-[#444] uppercase">Less</span>
          <div className="flex gap-1">
            <div className="w-3.5 h-3.5 rounded-sm bg-[#1a1a1a]" />
            <div className="w-3.5 h-3.5 rounded-sm bg-[#9945ff]/30" />
            <div className="w-3.5 h-3.5 rounded-sm bg-[#9945ff]/60" />
            <div className="w-3.5 h-3.5 rounded-sm bg-[#9945ff]" />
          </div>
          <span className="text-[9px] font-mono text-[#444] uppercase">More</span>
          <div className="w-px h-3 bg-[#1a1a1a] mx-1" />
          <div className="w-3.5 h-3.5 rounded-sm bg-[#14f195]" />
          <span className="text-[9px] font-mono text-[#14f195] uppercase">Today</span>
        </div>
      </div>

      {/* Milestones */}
      <div className="grid grid-cols-3 gap-3 mt-6">
        {[
          { days: 7, label: "Week Warrior", icon: "⚡", desc: "7 day streak" },
          { days: 30, label: "Monthly Master", icon: "🔥", desc: "30 day streak" },
          { days: 100, label: "Consistency King", icon: "👑", desc: "100 day streak" },
        ].map((m) => (
          <div key={m.days} className={cn(
            "flex items-center gap-3 px-4 py-3 border transition-all",
            streak >= m.days
              ? "border-[#14f195]/40 bg-[#14f195]/5"
              : "border-[#1a1a1a] opacity-50"
          )}>
            <span className="text-xl">{m.icon}</span>
            <div>
              <div className={cn(
                "text-[10px] font-mono uppercase tracking-widest font-bold",
                streak >= m.days ? "text-[#14f195]" : "text-[#444]"
              )}>
                {m.label}
              </div>
              <div className="text-[9px] font-mono text-[#333]">{m.desc}</div>
            </div>
            {streak >= m.days && (
              <span className="ml-auto text-[#14f195] text-sm">✓</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { publicKey } = useWallet();
  const { xp, level, progressPercent } = useXP();
  const { user } = useAuth();
  const { isEnrolled } = useCourses();

  const enrolledCourses = mockCourses.filter((c) => isEnrolled(c.id));
  const recommendedCourses = mockCourses.filter((c) => !isEnrolled(c.id)).slice(0, 3);

  const streak = (() => {
    if (typeof window === "undefined") return 0;
    try {
      return Number(localStorage.getItem("streak") || 0);
    } catch { return 0; }
  })();

  if (!publicKey && !user) {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center">
        <div className="text-center">
          <div className="text-[10px] font-mono text-[#333] mb-6">// ACCESS_DENIED</div>
          <h2 className="font-display font-black text-5xl uppercase text-[#ff3366] mb-4">AUTH_REQUIRED</h2>
          <p className="text-sm font-mono text-[#444] mb-8">Connect your wallet or sign in to access your dashboard</p>
          <Link href="/">
            <button className="px-8 py-3 bg-[#9945ff] text-white font-mono text-xs uppercase tracking-widest hover:bg-[#8835ef] transition-colors">
              RETURN_HOME →
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const displayName = user?.email?.split('@')[0].toUpperCase() ||
    (publicKey ? shortenAddress(publicKey.toBase58()) : "BUILDER");

  const stats = [
    { label: "Total XP", value: formatXP(xp) + " XP", color: "text-[#9945ff]", icon: Zap, bg: "bg-[#9945ff]/5 border-[#9945ff]/20" },
    { label: "Current Level", value: "Level " + level, color: "text-[#14f195]", icon: Trophy, bg: "bg-[#14f195]/5 border-[#14f195]/20" },
    { label: "Courses Enrolled", value: enrolledCourses.length.toString(), color: "text-[#f5f5f0]", icon: BookOpen, bg: "bg-[#f5f5f0]/5 border-[#f5f5f0]/10" },
    { label: "Day Streak", value: streak + " Days 🔥", color: "text-[#ff3366]", icon: Flame, bg: "bg-[#ff3366]/5 border-[#ff3366]/20" },
  ];

  return (
    <div className="min-h-screen bg-[#020202]">

      {/* Header */}
      <div className="border-b border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-8 py-16">
          <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest mb-6">// DASHBOARD</div>
          <h1 className="font-display font-black text-7xl uppercase tracking-tighter mb-4">
            GM, <span className="text-[#9945ff]">{displayName}</span>
          </h1>
          <div className="flex items-center gap-4">
            {publicKey && (
              <span className="text-xs font-mono text-[#444] border border-[#1a1a1a] px-3 py-1">
                {shortenAddress(publicKey.toBase58())}
              </span>
            )}
            {user && (
              <span className="text-xs font-mono text-[#14f195]/60 border border-[#14f195]/20 px-3 py-1">
                {user.email}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-16 space-y-20">

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn("border p-6", stat.bg)}
            >
              <div className="flex items-center gap-2 mb-4">
                <stat.icon className="w-4 h-4 text-[#333]" />
                <span className="text-[10px] font-mono text-[#444] uppercase tracking-widest">{stat.label}</span>
              </div>
              <div className={cn("font-display font-black text-4xl", stat.color)}>
                {stat.value}
              </div>
            </motion.div>
          ))}
        </div>

        {/* XP Progress */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest mb-2">// XP Progress</div>
              <div className="font-display font-black text-2xl uppercase">
                Level {level} <span className="text-[#333]">→</span> Level {level + 1}
              </div>
            </div>
            <div className="text-right">
              <div className="font-display font-black text-3xl text-[#9945ff]">{Math.round(progressPercent)}%</div>
              <div className="text-[10px] font-mono text-[#444]">to next level</div>
            </div>
          </div>
          <div className="h-3 bg-[#1a1a1a] w-full rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#9945ff] to-[#14f195] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs font-mono text-[#444]">{formatXP(xp)} XP earned</span>
            <span className="text-xs font-mono text-[#444]">{formatXP((level + 1) * (level + 1) * 100)} XP needed</span>
          </div>
        </div>

        {/* Streak Calendar */}
        <div>
          <div className="flex items-center gap-4 mb-8">
            <div>
              <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest mb-2">// Streak Calendar</div>
              <div className="font-display font-black text-2xl uppercase">
                Learning <span className="text-[#ff3366]">Activity</span>
              </div>
            </div>
            <div className="flex-1 h-px bg-[#1a1a1a]" />
          </div>
          <div className="border border-[#1a1a1a] p-8 bg-[#0a0a0a]">
            <StreakCalendar streak={streak} />
          </div>
        </div>

        {/* Active Courses */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest mb-2">// Active Courses</div>
              <div className="font-display font-black text-2xl uppercase">Currently Learning</div>
            </div>
            <Link href="/courses" className="flex items-center gap-2 text-[10px] font-mono text-[#9945ff] hover:underline uppercase tracking-widest border border-[#9945ff]/30 px-4 py-2 hover:bg-[#9945ff]/10 transition-colors">
              BROWSE ALL →
            </Link>
          </div>

          {enrolledCourses.length === 0 ? (
            <div className="border border-dashed border-[#1a1a1a] p-16 text-center">
              <div className="text-4xl mb-4">📚</div>
              <div className="text-[10px] font-mono text-[#333] mb-2 uppercase tracking-widest">No active courses</div>
              <p className="text-xs font-mono text-[#444] mb-8">Start learning to track your progress here</p>
              <Link href="/courses">
                <button className="px-8 py-3 bg-[#9945ff] text-white font-mono text-xs uppercase tracking-widest hover:bg-[#8835ef] transition-colors">
                  START LEARNING →
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
                    <div className="flex items-center gap-6 px-8 py-5 hover:bg-[#0a0a0a] transition-colors group">
                      <div className="flex-1">
                        <div className="text-[10px] font-mono text-[#333] mb-1.5 uppercase">{course.track}</div>
                        <div className="text-sm font-mono text-[#f5f5f0] group-hover:text-[#9945ff] transition-colors uppercase font-bold">
                          {course.title}
                        </div>
                      </div>
                      <div className="flex items-center gap-8 text-[10px] font-mono text-[#444]">
                        <span className="text-[#14f195] font-bold">+{course.xp.toLocaleString()} XP</span>
                        <span>{course.duration}</span>
                        <ArrowUpRight className="w-4 h-4 group-hover:text-[#9945ff] transition-colors" />
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
          <div className="mb-8">
            <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest mb-2">// Achievements</div>
            <div className="font-display font-black text-2xl uppercase">Badges & Rewards</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {mockAchievements.map((a) => (
              <div key={a.id} className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 flex flex-col items-center text-center group hover:border-[#9945ff]/40 hover:bg-[#0d0d0d] transition-all cursor-pointer">
                <span className="text-4xl mb-4">{a.icon}</span>
                <div className="text-[10px] font-mono text-[#f5f5f0] uppercase tracking-widest mb-2 font-bold">{a.name}</div>
                <div className="text-[10px] font-mono text-[#9945ff] mb-3">+{a.xpReward} XP</div>
                <div className="text-[9px] font-mono text-[#333] border border-[#1a1a1a] px-3 py-1 group-hover:border-[#ff3366]/40 group-hover:text-[#ff3366] transition-colors uppercase tracking-widest">
                  Locked
                </div>
              </div>
            ))}
          </div>
        </div>
{/* Skill Radar */}
<SkillRadar
  solvedChallenges={0}
  completedCourses={enrolledCourses.length}
/>
        {/* Recommended */}
        <div>
          <div className="mb-8">
            <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest mb-2">// Recommended</div>
            <div className="font-display font-black text-2xl uppercase">Up Next For You</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendedCourses.map((course) => (
              <Link key={course.id} href={`/courses/${course.id}`}>
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] hover:border-[#9945ff]/40 transition-all group p-6 h-full hover:bg-[#0d0d0d]">
                  <div className="text-[10px] font-mono text-[#333] mb-3 uppercase">{course.track}</div>
                  <h3 className="font-display font-black text-xl uppercase tracking-tight mb-3 group-hover:text-[#9945ff] transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-xs font-mono text-[#444] line-clamp-2 mb-6 leading-relaxed">{course.description}</p>
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-[#333] uppercase">{course.lessons} Lessons</span>
                    <span className="text-[#14f195] font-bold">+{course.xp.toLocaleString()} XP</span>
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