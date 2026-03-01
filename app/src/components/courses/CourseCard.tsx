"use client";

import Link from "next/link";
import { Course, DIFFICULTY_LABELS, DIFFICULTY_COLORS, TRACK_NAMES } from "@/types/academy";

interface CourseCardProps {
  course: Course;
  enrollment?: { completedLessons: number; isCompleted: boolean } | null;
}

export function CourseCard({ course, enrollment }: CourseCardProps) {
  const progress = enrollment
    ? Math.round((enrollment.completedLessons / course.lessonCount) * 100)
    : 0;

  return (
    <Link href={`/courses/${course.courseId}`}>
      <div className="glass-card group cursor-pointer transition-all duration-300 hover:scale-[1.02] overflow-hidden">
        {/* Track color bar */}
        <div className="h-1 bg-gradient-to-r from-[#9945FF] to-[#14F195]" />
        
        <div className="p-6">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-4">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${DIFFICULTY_COLORS[course.difficulty]}`}>
              {DIFFICULTY_LABELS[course.difficulty]}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 text-white/50 border border-white/10">
              {TRACK_NAMES[course.trackId] || `Track ${course.trackId}`}
            </span>
          </div>

          {/* Title & Description */}
          <h3 className="text-lg font-semibold text-white group-hover:text-[#14F195] transition-colors mb-2">
            {course.courseId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </h3>
          
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-white/40 mb-4">
            <span>{course.lessonCount} lessons</span>
            <span>·</span>
            <span className="text-[#14F195]">{course.totalXp.toLocaleString()} XP</span>
            <span>·</span>
            <span>{course.totalCompletions} completions</span>
          </div>

          {/* Progress bar */}
          {enrollment && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-white/50">
                  {enrollment.isCompleted ? "✅ Completed" : `${enrollment.completedLessons}/${course.lessonCount} lessons`}
                </span>
                <span className="text-[#14F195] font-medium">{progress}%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#9945FF] to-[#14F195] rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Prerequisite */}
          {course.prerequisite && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-400/70">
              <span>⚠️</span>
              <span>Requires: {course.prerequisite}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
