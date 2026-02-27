import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { BookOpen, Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { DIFFICULTY_COLORS, TRACKS } from "@/types";
import type { SanityCourse, CourseProgress } from "@/types";

interface CourseCardProps {
  course: SanityCourse;
  progress?: CourseProgress;
}

export function CourseCard({ course, progress }: CourseCardProps) {
  const track = TRACKS[course.trackId];
  const difficultyColor = DIFFICULTY_COLORS[course.difficulty] ?? "#666666";
  const isEnrolled = progress?.enrolled;
  const percent = progress?.percentComplete ?? 0;

  return (
    <Link href={{ pathname: "/courses/[slug]", params: { slug: course.slug } }}>
      <article className="group relative bg-[#111111] border border-[#1F1F1F] rounded hover:border-[#2E2E2E] transition-all duration-200 overflow-hidden h-full flex flex-col">
        {/* Thumbnail */}
        <div className="relative h-40 bg-[#0D0D0D] overflow-hidden flex-shrink-0">
          {course.thumbnail ? (
            <Image
              src={course.thumbnail}
              alt={course.title}
              fill
              className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background: `radial-gradient(circle at 30% 50%, ${difficultyColor}15 0%, transparent 70%)`,
              }}
            >
              <span className="text-4xl opacity-30">{track?.icon ?? "◎"}</span>
            </div>
          )}

          {/* Difficulty badge */}
          <div className="absolute top-2 left-2">
            <span
              className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-sm"
              style={{
                color: difficultyColor,
                backgroundColor: `${difficultyColor}20`,
                border: `1px solid ${difficultyColor}40`,
              }}
            >
              {course.difficulty}
            </span>
          </div>

          {/* Track badge */}
          {track && (
            <div className="absolute top-2 right-2">
              <span className="text-[10px] font-mono text-[#666666] bg-[#0A0A0A]/80 px-2 py-0.5 rounded-sm border border-[#1F1F1F]">
                {track.icon} {track.name}
              </span>
            </div>
          )}

          {/* Progress bar overlay */}
          {isEnrolled && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1F1F1F]">
              <div
                className="h-full bg-[#14F195] transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-mono text-sm font-semibold text-[#EDEDED] line-clamp-2 leading-snug mb-1.5 group-hover:text-white transition-colors">
            {course.title}
          </h3>
          <p className="text-xs text-[#666666] line-clamp-2 leading-relaxed flex-1 mb-3">
            {course.description}
          </p>

          {/* Bottom stats */}
          <div className="flex items-center gap-3 text-[10px] font-mono text-[#666666]">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {course.modules.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0)} lessons
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {course.durationHours}h
            </span>
            <span className={cn("flex items-center gap-1 ml-auto", "text-[#14F195]")}>
              <Zap className="h-3 w-3" />
              {course.xpReward.toLocaleString()} XP
            </span>
          </div>

          {/* Enrolled status */}
          {isEnrolled && (
            <div className="mt-2 pt-2 border-t border-[#1F1F1F]">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-[#666666]">Progress</span>
                <span className={percent === 100 ? "text-[#14F195]" : "text-[#EDEDED]"}>
                  {percent === 100 ? "Complete ✓" : `${percent}%`}
                </span>
              </div>
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
