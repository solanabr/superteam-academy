"use client";

import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { useXP } from "@/context/XPContext";
import { useAuth } from "@/context/AuthContext";
import { useCourses } from "@/hooks/useCourses";
import { mockCourses, mockAchievements } from "@/lib/mockData";
import { shortenAddress, formatXP } from "@/lib/utils";
import { ArrowUpRight, ExternalLink, CheckCircle, Lock } from "lucide-react";
import { SkillRadar } from "@/components/ui-custom/SkillRadar";
import Link from "next/link";
import { cn } from "@/lib/utils";

function getUnlockedAchievements(xp: number, level: number, enrolledCount: number, streak: number) {
  return {
    "first-steps": enrolledCount > 0,
    "course-completer": enrolledCount >= 1,
    "week-warrior": streak >= 7,
    "rust-rookie": enrolledCount >= 2,
    "early-adopter": true,
    "perfect-score": level >= 5,
  };
}

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { publicKey } = useWallet();
  const { user } = useAuth();
  const { xp, level } = useXP();
  const { isEnrolled } = useCourses();

  const isOwnProfile = publicKey?.toBase58() === username || user?.email === username;
  const enrolledCourses = mockCourses.filter((c) => isEnrolled(c.id));

  const streak = (() => {
    if (typeof window === "undefined") return 0;
    try { return Number(localStorage.getItem("streak") || 0); }
    catch { return 0; }
  })();

  const unlocked = getUnlockedAchievements(xp, level, enrolledCourses.length, streak);
  const unlockedCount = Object.values(unlocked).filter(Boolean).length;
  const totalXPFromAchievements = mockAchievements
    .filter(a => unlocked[a.id as keyof typeof unlocked])
    .reduce((acc, a) => acc + a.xpReward, 0);

  const displayName = user?.email?.split('@')[0].toUpperCase() ||
    (publicKey ? shortenAddress(publicKey.toBase58(), 6) : username.slice(0, 8).toUpperCase());

  return (
    <div className="min-h-screen bg-[#020202]">

      {/* Header */}
      <div className="border-b border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">
          <div className="flex items-center gap-4 mb-6 md:mb-8">
            <span className="text-[10px] font-mono text-[#333] uppercase tracking-widest">// BUILDER_PROFILE</span>
            <div className="flex-1 h-px bg-[#1a1a1a]" />
            
          <a    href={`https://explorer.solana.com/address/${username}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[10px] font-mono text-[#444] hover:text-[#9945ff] transition-colors uppercase tracking-widest"
            >
              <span className="hidden sm:block">VIEW_ON_EXPLORER</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-4 md:gap-6">
              {/* Avatar */}
              <div className="w-14 h-14 md:w-20 md:h-20 bg-gradient-to-br from-[#9945ff] to-[#14f195] flex items-center justify-center font-display font-black text-2xl md:text-3xl text-white shrink-0">
                {displayName.slice(0, 2)}
              </div>
              <div>
                <h1 className="font-display font-black text-3xl md:text-5xl uppercase tracking-tighter mb-2">
                  {displayName}
                </h1>
                <div className="flex items-center gap-2 flex-wrap text-[9px] md:text-[10px] font-mono uppercase tracking-widest">
                  <span className="text-[#9945ff] border border-[#9945ff]/30 px-2 py-1">{formatXP(xp)} XP</span>
                  <span className="text-[#14f195] border border-[#14f195]/30 px-2 py-1">LVL {level}</span>
                  <span className="text-[#f5f5f0] border border-[#f5f5f0]/10 px-2 py-1">{enrolledCourses.length} COURSES</span>
                  <span className="text-[#ff3366] border border-[#ff3366]/30 px-2 py-1">🔥 {streak}D</span>
                </div>
              </div>
            </div>
            {isOwnProfile && (
              <Link href="/settings">
                <button className="px-4 md:px-5 py-2 md:py-2.5 border border-[#1a1a1a] text-[10px] font-mono text-[#444] hover:border-[#9945ff] hover:text-[#9945ff] transition-colors uppercase tracking-widest">
                  EDIT_PROFILE →
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16 space-y-12 md:space-y-16">

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[
            { label: "Total XP", value: formatXP(xp), color: "text-[#9945ff]", border: "border-[#9945ff]/20 bg-[#9945ff]/5" },
            { label: "Current Level", value: `Level ${level}`, color: "text-[#14f195]", border: "border-[#14f195]/20 bg-[#14f195]/5" },
            { label: "Achievements", value: `${unlockedCount}/${mockAchievements.length}`, color: "text-[#f5a623]", border: "border-[#f5a623]/20 bg-[#f5a623]/5" },
            { label: "Achievement XP", value: `+${totalXPFromAchievements}`, color: "text-[#ff3366]", border: "border-[#ff3366]/20 bg-[#ff3366]/5" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn("border p-4 md:p-6", stat.border)}
            >
              <div className="text-[9px] md:text-[10px] font-mono text-[#444] uppercase tracking-widest mb-2 md:mb-3">{stat.label}</div>
              <div className={cn("font-display font-black text-2xl md:text-4xl", stat.color)}>{stat.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Achievements */}
        <div>
          <div className="mb-6 md:mb-8">
            <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest mb-2">// Achievements</div>
            <div className="font-display font-black text-2xl md:text-3xl uppercase">
              Badges & <span className="text-[#9945ff]">Rewards</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {mockAchievements.map((achievement, i) => {
              const isUnlocked = (unlocked as Record<string, boolean>)[achievement.id] ?? false;
              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "border p-4 md:p-5 flex flex-col items-center text-center transition-all",
                    isUnlocked ? "border-[#9945ff]/40 bg-[#9945ff]/5 hover:bg-[#9945ff]/10" : "border-[#1a1a1a] bg-[#0a0a0a] opacity-40"
                  )}
                >
                  <span className="text-3xl md:text-4xl mb-2 md:mb-3">{achievement.icon}</span>
                  <div className={cn("text-[9px] md:text-[10px] font-mono uppercase tracking-widest mb-1 md:mb-2 font-bold",
                    isUnlocked ? "text-[#f5f5f0]" : "text-[#444]"
                  )}>
                    {achievement.name}
                  </div>
                  <div className="text-[8px] md:text-[9px] font-mono text-[#444] mb-2 md:mb-3 leading-relaxed hidden sm:block">
                    {achievement.description}
                  </div>
                  <div className={cn("text-[9px] md:text-[10px] font-mono font-bold mb-2",
                    isUnlocked ? "text-[#9945ff]" : "text-[#333]"
                  )}>
                    +{achievement.xpReward} XP
                  </div>
                  {isUnlocked ? (
                    <div className="flex items-center gap-1 text-[8px] md:text-[9px] font-mono text-[#14f195] border border-[#14f195]/30 px-1.5 md:px-2 py-0.5">
                      <CheckCircle className="w-2 md:w-2.5 h-2 md:h-2.5" /> UNLOCKED
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-[8px] md:text-[9px] font-mono text-[#333] border border-[#1a1a1a] px-1.5 md:px-2 py-0.5">
                      <Lock className="w-2 md:w-2.5 h-2 md:h-2.5" /> LOCKED
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Skill Radar */}
        <SkillRadar solvedChallenges={0} completedCourses={enrolledCourses.length} />

        {/* Enrolled Courses */}
        <div>
          <div className="mb-6 md:mb-8">
            <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest mb-2">// Courses</div>
            <div className="font-display font-black text-2xl md:text-3xl uppercase">
              Enrolled <span className="text-[#14f195]">Courses</span>
            </div>
          </div>
          {enrolledCourses.length === 0 ? (
            <div className="border border-dashed border-[#1a1a1a] p-10 md:p-16 text-center">
              <div className="text-[10px] font-mono text-[#333] mb-4 uppercase">No courses yet</div>
              <Link href="/courses">
                <button className="px-8 py-3 bg-[#9945ff] text-white font-mono text-xs uppercase tracking-widest hover:bg-[#8835ef] transition-colors">
                  BROWSE COURSES →
                </button>
              </Link>
            </div>
          ) : (
            <div className="border border-[#1a1a1a] divide-y divide-[#1a1a1a]">
              {enrolledCourses.map((course, i) => (
                <motion.div key={course.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link href={`/courses/${course.id}`}>
                    <div className="flex items-center gap-4 px-4 md:px-8 py-4 md:py-5 hover:bg-[#0a0a0a] transition-colors group">
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-mono text-[#333] mb-1 uppercase truncate">{course.track}</div>
                        <div className="text-xs md:text-sm font-mono text-[#f5f5f0] group-hover:text-[#9945ff] transition-colors uppercase font-bold truncate">
                          {course.title}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 md:gap-8 text-[10px] font-mono text-[#444] shrink-0">
                        <span className="text-[#14f195] font-bold">+{course.xp.toLocaleString()} XP</span>
                        <span className="hidden sm:block">{course.duration}</span>
                        <ArrowUpRight className="w-4 h-4 group-hover:text-[#9945ff] transition-colors" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* On-chain Credentials */}
        <div>
          <div className="mb-6 md:mb-8">
            <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest mb-2">// On-Chain Credentials</div>
            <div className="font-display font-black text-2xl md:text-3xl uppercase">
              Soulbound <span className="text-[#ff3366]">NFTs</span>
            </div>
          </div>
          <div className="border border-dashed border-[#1a1a1a] p-10 md:p-16 text-center">
            <div className="text-4xl mb-4">🏅</div>
            <div className="text-[10px] font-mono text-[#333] mb-2 uppercase tracking-widest">No credentials yet</div>
            <div className="text-xs font-mono text-[#444] mb-8 max-w-md mx-auto">
              Complete a learning track to earn your first soulbound NFT credential on Solana devnet
            </div>
            <Link href="/courses">
              <button className="px-8 py-3 bg-[#9945ff] text-white font-mono text-xs uppercase tracking-widest hover:bg-[#8835ef] transition-colors">
                START LEARNING →
              </button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}