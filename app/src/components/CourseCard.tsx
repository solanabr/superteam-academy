"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Clock, ArrowRight, Zap, Terminal } from "lucide-react";
import Link from "next/link";
import { useI18n } from "./I18nProvider";

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
  const { t } = useI18n();
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

  // Helper to get translated course title/desc if they exist as keys
  const getTranslated = (id: string, field: "title" | "desc", fallback: string) => {
    const key = `courses.${id}.${field}`;
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative"
    >
      <div
        className={`absolute -inset-[1px] rounded-2xl bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-100 transition-all duration-500 blur-md`}
      />

      <div
        className={`relative h-full p-6 rounded-2xl border transition-all duration-300 bg-zinc-950 ${isHovered
            ? "border-white/20"
            : "border-white/10"
          }`}
      >
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.gradient} rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity`} />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.color} border ${config.border}`}>
              {t(`courses.${course.difficulty.toLowerCase()}`)}
            </span>
            <span className="text-white/30">·</span>
            <span className="text-xs text-white/50">{t(`courses.track.${course.track.toLowerCase()}`)}</span>
          </div>
          <Terminal className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
        </div>

        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-green-400 transition-all">
          {getTranslated(course.id, "title", course.title)}
        </h3>
        <p className="text-white/40 text-sm mb-6 leading-relaxed line-clamp-2">
          {getTranslated(course.id, "desc", course.description)}
        </p>

        <div className="flex items-center gap-4 text-sm mb-6">
          <div className="flex items-center gap-1.5 text-white/40">
            <Clock className="w-4 h-4" />
            <span>{course.duration}</span>
          </div>
          <div className="flex items-center gap-1.5 text-white/40">
            <BookOpen className="w-4 h-4" />
            <span>{course.lessons} {t("courses.lessons")}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-yellow-400 font-semibold text-sm">{course.xp} {t("courses.xp")}</span>
          </div>
          <span className="text-xs text-white/30">{t("courses.onCompletion")}</span>
        </div>

        <Link
          href={`/courses/${course.id}`}
          className={`flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-semibold transition-all ${course.difficulty === "Beginner"
              ? "bg-emerald-500 hover:bg-emerald-600 text-black"
              : course.difficulty === "Intermediate"
                ? "bg-amber-500 hover:bg-amber-600 text-black"
                : "bg-rose-500 hover:bg-rose-600 text-black"
            }`}
        >
          <span>{t("courses.enroll")}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </motion.div>
  );
}
