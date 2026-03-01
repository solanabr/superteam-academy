"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Clock, ArrowRight, Zap, Terminal } from "lucide-react";
import Link from "next/link";

interface Course {
  id: string;
  title: string;
  description: string;
  lessons: number;
  xp: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  track: string;
  duration: string;
}

interface CourseCardProps {
  course: Course;
  index: number;
}

export function CourseCard({ course, index }: CourseCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const difficultyConfig = {
    Beginner: {
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      gradient: "from-emerald-500/20 to-teal-500/20",
    },
    Intermediate: {
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      gradient: "from-amber-500/20 to-orange-500/20",
    },
    Advanced: {
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
      gradient: "from-rose-500/20 to-pink-500/20",
    },
  };

  const config = difficultyConfig[course.difficulty];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative"
    >
      {/* Glow Effect */}
      <div 
        className={`absolute -inset-[1px] rounded-2xl bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-100 transition-all duration-500 blur-md`}
      />
      
      <div 
        className={`relative h-full p-6 rounded-2xl border transition-all duration-300 bg-zinc-950 ${
          isHovered 
            ? "border-white/20" 
            : "border-white/10"
        }`}
      >
        {/* Top accent */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.gradient} rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity`} />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.color} border ${config.border}`}>
              {course.difficulty}
            </span>
            <span className="text-white/30">·</span>
            <span className="text-xs text-white/50">{course.track}</span>
          </div>
          <Terminal className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
        </div>

        {/* Content */}
        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-green-400 transition-all">
          {course.title}
        </h3>
        <p className="text-white/40 text-sm mb-6 leading-relaxed line-clamp-2">
          {course.description}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm mb-6">
          <div className="flex items-center gap-1.5 text-white/40">
            <Clock className="w-4 h-4" />
            <span>{course.duration}</span>
          </div>
          <div className="flex items-center gap-1.5 text-white/40">
            <BookOpen className="w-4 h-4" />
            <span>{course.lessons} lessons</span>
          </div>
        </div>

        {/* XP Badge */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-yellow-400 font-semibold text-sm">{course.xp} XP</span>
          </div>
          <span className="text-xs text-white/30">on completion</span>
        </div>

        {/* CTA */}
        <Link
          href={`/courses/${course.id}`}
          className={`flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-semibold transition-all ${
            course.difficulty === "Beginner"
              ? "bg-emerald-500 hover:bg-emerald-600 text-black"
              : course.difficulty === "Intermediate"
              ? "bg-amber-500 hover:bg-amber-600 text-black"
              : "bg-rose-500 hover:bg-rose-600 text-black"
          }`}
        >
          <span>Start Building</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </motion.div>
  );
}
