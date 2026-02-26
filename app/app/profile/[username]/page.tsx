"use client";

import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { useXPBalance } from "@/hooks/useXPBalance";
import { useCourses } from "@/hooks/useCourses";
import { mockCourses, mockAchievements } from "@/lib/mockData";
import { shortenAddress, formatXP } from "@/lib/utils";
import { ArrowUpRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { TRACK_NAMES } from "@/lib/constants";

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { publicKey } = useWallet();
  const { xp, level, progressPercent } = useXPBalance();
  const { isEnrolled } = useCourses();

  const isOwnProfile = publicKey?.toBase58() === username;
  const enrolledCourses = mockCourses.filter((c) => isEnrolled(c.id));

  const skills = [
    { name: "RUST", value: level * 10 },
    { name: "ANCHOR", value: level * 8 },
    { name: "FRONTEND", value: level * 12 },
    { name: "SECURITY", value: level * 5 },
    { name: "DEFI", value: level * 7 },
  ];

  return (
    <div className="min-h-screen bg-[#020202]">

      {/* Header */}
      <div className="border-b border-[#1a1a1a] px-6 py-12 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <span className="text-[10px] font-mono text-[#333] uppercase tracking-widest">// BUILDER_PROFILE</span>
          <div className="flex-1 h-px bg-[#1a1a1a]" />
          
            href={`https://explorer.solana.com/address/${username}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[10px] font-mono text-[#444] hover:text-[#9945ff] transition-colors uppercase tracking-widest"
          >
            VIEW_ON_EXPLORER
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-12 items-start">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-[#9945ff] flex items-center justify-center font-display font-black text-2xl text-white">
                {username.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="font-display font-black text-4xl uppercase tracking-tighter">
                  {shortenAddress(username, 6)}
                </h1>
                <div className="text-[10px] font-mono text-[#444] mt-1">
                  {isOwnProfile ? "THIS_IS_YOU" : "SOLANA_BUILDER"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 text-[10px] font-mono text-[#444] uppercase tracking-widest">
              <span className="text-[#9945ff]">{formatXP(xp)}_XP</span>
              <span className="text-[#333]">//</span>
              <span className="text-[#14f195]">LVL_{level}</span>
              <span className="text-[#333]">//</span>
              <span>{enrolledCourses.length}_COURSES</span>
            </div>
          </div>

          {isOwnProfile && (
            <Link href="/settings">
              <button className="px-5 py-2.5 border border-[#1a1a1a] text-[10px] font-mono text-[#444] hover:border-[#9945ff] hover:text-[#9945ff] transition-colors uppercase tracking-widest">
                EDIT_PROFILE
              </button>
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-[#1a1a1a]">

          {/* Skills */}
          <div className="bg-[#020202] p-8">
            <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest mb-6">
              // SKILL_RATINGS
            </div>
            <div className="space-y-4">
              {skills.map((skill) => (
                <div key={skill.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono text-[#444] uppercase tracking-widest">
                      {skill.name}
                    </span>
                    <span className="text-[10px] font-mono text-[#9945ff]">
                      {Math.min(skill.value, 100)}
                    </span>
                  </div>
                  <div className="h-px bg-[#1a1a1a]">
                    <motion.div
                      className="h-full bg-[#9945ff]"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(skill.value, 100)}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Courses */}
          <div className="bg-[#020202] p-8">
            <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest mb-6">
              // ENROLLED_COURSES
            </div>
            {enrolledCourses.length === 0 ? (
              <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest">
                NO_COURSES_YET
              </div>
            ) : (
              <div className="space-y-3">
                {enrolledCourses.map((course) => (
                  <Link key={course.id} href={`/courses/${course.id}`}>
                    <div className="flex items-center justify-between group py-2 border-b border-[#1a1a1a]">
                      <div>
                        <div className="text-xs font-mono text-[#f5f5f0] group-hover:text-[#9945ff] transition-colors uppercase">
                          {course.title}
                        </div>
                        <div className="text-[10px] font-mono text-[#333] mt-0.5">
                          +{course.xp}_XP
                        </div>
                      </div>
                      <ArrowUpRight className="w-3 h-3 text-[#333] group-hover:text-[#9945ff] transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Achievements */}
          <div className="bg-[#020202] p-8">
            <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest mb-6">
              // ACHIEVEMENTS
            </div>
            <div className="space-y-3">
              {mockAchievements.map((achievement) => (
                <div key={achievement.id} className="flex items-center gap-3 opacity-25">
                  <span className="text-lg">{achievement.icon}</span>
                  <div>
                    <div className="text-[10px] font-mono text-[#f5f5f0] uppercase tracking-wide">
                      {achievement.name}
                    </div>
                    <div className="text-[10px] font-mono text-[#333]">
                      +{achievement.xpReward}_XP // LOCKED
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* On-chain credentials */}
        <div className="mt-px bg-[#1a1a1a]">
          <div className="bg-[#020202] p-8">
            <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest mb-6">
              // ON_CHAIN_CREDENTIALS
            </div>
            <div className="text-center py-12 border border-dashed border-[#1a1a1a]">
              <div className="text-[10px] font-mono text-[#333] mb-2">NO_CREDENTIALS_YET</div>
              <div className="text-[10px] font-mono text-[#444] mb-6">
                Complete a learning track to earn your first soulbound NFT credential
              </div>
              <Link href="/courses">
                <button className="px-5 py-2.5 bg-[#9945ff] text-white font-mono text-[10px] uppercase tracking-widest hover:bg-[#8835ef] transition-colors">
                  START_LEARNING →
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}