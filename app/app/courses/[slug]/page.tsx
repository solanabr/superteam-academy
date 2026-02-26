"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, Clock, Users, Zap, Lock } from "lucide-react";
import { mockCourses } from "@/lib/mockData";
import { DIFFICULTY_LABELS } from "@/lib/constants";
import { useCourses } from "@/hooks/useCourses";
import { useWallet } from "@solana/wallet-adapter-react";
import { cn } from "@/lib/utils";

const mockLessons = [
  { id: 0, title: "Introduction & Setup", duration: "12 min", free: true },
  { id: 1, title: "Core Concepts", duration: "18 min", free: true },
  { id: 2, title: "Your First Program", duration: "25 min", free: false },
  { id: 3, title: "Account Model Deep Dive", duration: "20 min", free: false },
  { id: 4, title: "PDAs & Seeds", duration: "30 min", free: false },
  { id: 5, title: "CPIs & Composability", duration: "28 min", free: false },
  { id: 6, title: "Token Integration", duration: "22 min", free: false },
  { id: 7, title: "Error Handling", duration: "15 min", free: false },
  { id: 8, title: "Testing Your Program", duration: "35 min", free: false },
  { id: 9, title: "Deployment & Verification", duration: "20 min", free: false },
];

export default function CourseDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { publicKey } = useWallet();
  const { isEnrolled, enroll } = useCourses();

  const course = mockCourses.find((c) => c.id === slug);

  if (!course) {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center">
        <div className="text-center">
          <div className="text-[10px] font-mono text-[#333] mb-4">// ERROR_404</div>
          <h1 className="font-display font-black text-4xl uppercase text-[#ff3366] mb-4">COURSE_NOT_FOUND</h1>
          <Link href="/courses" className="text-xs font-mono text-[#9945ff] hover:underline">
            ← BACK_TO_COURSES
          </Link>
        </div>
      </div>
    );
  }

  const enrolled = isEnrolled(course.id);

  return (
    <div className="min-h-screen bg-[#020202]">
      <div className="border-b border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <Link href="/courses" className="inline-flex items-center gap-2 text-[10px] font-mono text-[#444] hover:text-[#9945ff] transition-colors uppercase tracking-widest mb-8">
            <ArrowLeft className="w-3 h-3" />
            BACK_TO_COURSES
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 items-start">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] font-mono text-[#9945ff] uppercase tracking-widest border border-[#9945ff]/30 px-2 py-1">
                  {course.track}
                </span>
                <span className={cn(
                  "text-[10px] font-mono uppercase tracking-widest",
                  course.difficulty === 1 ? "text-[#14f195]" :
                  course.difficulty === 2 ? "text-[#9945ff]" : "text-[#ff3366]"
                )}>
                  {DIFFICULTY_LABELS[course.difficulty]}
                </span>
              </div>

              <h1 className="font-display font-black text-5xl lg:text-6xl uppercase tracking-tighter leading-[0.9] mb-6">
                {course.title}
              </h1>

              <p className="text-sm font-mono text-[#555] leading-relaxed max-w-2xl mb-8">
                {course.description}
              </p>

              <div className="flex items-center gap-8 text-[10px] font-mono text-[#444] uppercase tracking-widest">
                <span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" />{course.duration}</span>
                <span className="flex items-center gap-2"><Users className="w-3.5 h-3.5" />{course.enrolled?.toLocaleString()} ENROLLED</span>
                <span className="flex items-center gap-2 text-[#14f195]"><Zap className="w-3.5 h-3.5" />+{course.xp.toLocaleString()} XP</span>
              </div>
            </div>

            <div className="border border-[#1a1a1a] bg-[#0a0a0a]">
              <div className="p-6 border-b border-[#1a1a1a]">
                <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest mb-2">COURSE_REWARD</div>
                <div className="text-4xl font-black font-display text-[#14f195] mb-1">+{course.xp.toLocaleString()} XP</div>
                <div className="text-[10px] font-mono text-[#444]">SOULBOUND TOKEN-2022 ON DEVNET</div>
              </div>

              <div className="p-6 space-y-3">
                {[
                  { label: "LESSONS", value: course.lessons.toString(), colored: false, purple: false },
                  { label: "DURATION", value: course.duration, colored: false, purple: false },
                  { label: "DIFFICULTY", value: DIFFICULTY_LABELS[course.difficulty], colored: true, purple: false },
                  { label: "CREDENTIAL", value: "NFT_ON_CHAIN", colored: false, purple: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-[#444] uppercase tracking-widest">{item.label}</span>
                    <span className={cn(
                      item.colored && course.difficulty === 1 ? "text-[#14f195]" :
                      item.colored && course.difficulty === 2 ? "text-[#9945ff]" :
                      item.colored ? "text-[#ff3366]" :
                      item.purple ? "text-[#9945ff]" :
                      "text-[#f5f5f0]"
                    )}>{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="p-6 border-t border-[#1a1a1a]">
                {!publicKey ? (
                  <div className="text-center py-2">
                    <div className="text-[10px] font-mono text-[#444] uppercase tracking-widest">CONNECT_WALLET_TO_ENROLL</div>
                  </div>
                ) : enrolled ? (
                  <Link href={`/courses/${course.id}/lessons/0`}>
                    <button className="w-full py-3 bg-[#14f195] text-black font-mono text-xs uppercase tracking-widest font-bold hover:bg-[#10d980] transition-colors flex items-center justify-center gap-2">
                      CONTINUE_LEARNING <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                ) : (
                  <button
                    onClick={() => enroll(course.id)}
                    className="w-full py-3 bg-[#9945ff] text-white font-mono text-xs uppercase tracking-widest font-bold hover:bg-[#8835ef] transition-colors flex items-center justify-center gap-2"
                  >
                    ENROLL_NOW <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center gap-4 mb-8">
          <span className="text-[10px] font-mono text-[#333] uppercase tracking-widest">// CURRICULUM</span>
          <div className="flex-1 h-px bg-[#1a1a1a]" />
          <span className="text-[10px] font-mono text-[#444]">{course.lessons}_LESSONS</span>
        </div>

        <div className="border border-[#1a1a1a] divide-y divide-[#1a1a1a]">
          {mockLessons.slice(0, course.lessons).map((lesson, i) => (
            <motion.div key={lesson.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
              <Link href={enrolled || lesson.free ? `/courses/${course.id}/lessons/${lesson.id}` : "#"}>
                <div className={cn(
                  "flex items-center gap-6 px-6 py-4 transition-colors group",
                  enrolled || lesson.free ? "hover:bg-[#0a0a0a] cursor-pointer" : "opacity-40 cursor-not-allowed"
                )}>
                  <span className="text-[10px] font-mono text-[#333] w-6 shrink-0">{i.toString().padStart(2, "0")}</span>
                  <div className="flex-1">
                    <span className="text-xs font-mono text-[#f5f5f0] group-hover:text-[#9945ff] transition-colors uppercase tracking-wide">
                      {lesson.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-mono text-[#333]">
                    {lesson.free && <span className="text-[#14f195] border border-[#14f195]/30 px-2 py-0.5 text-[9px]">FREE</span>}
                    <span>{lesson.duration}</span>
                    {enrolled || lesson.free ? (
                      <ArrowUpRight className="w-3 h-3 text-[#333] group-hover:text-[#9945ff] transition-colors" />
                    ) : (
                      <Lock className="w-3 h-3" />
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}