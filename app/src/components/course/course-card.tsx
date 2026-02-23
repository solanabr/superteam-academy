"use client";

import { useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from "framer-motion";
import {
  Code2,
  Shield,
  Layout,
  TrendingUp,
  Smartphone,
  Clock,
  BookOpen,
  Anchor,
} from "lucide-react";
import type { Course } from "@/lib/services/types";
import { Badge } from "@/components/ui/badge";
import { TRACK_LABELS } from "@/lib/constants";

const trackIcons: Record<string, React.ElementType> = {
  rust: Code2,
  anchor: Anchor,
  frontend: Layout,
  security: Shield,
  defi: TrendingUp,
  mobile: Smartphone,
};

const trackGlowColors: Record<string, string> = {
  rust: "rgba(244, 130, 82, 0.4)",
  anchor: "rgba(202, 159, 245, 0.4)",
  frontend: "rgba(102, 147, 247, 0.4)",
  security: "rgba(239, 68, 68, 0.4)",
  defi: "rgba(85, 233, 171, 0.4)",
  mobile: "rgba(236, 72, 153, 0.4)",
};

interface CourseCardProps {
  course: Course;
  locale: string;
  progress?: number;
}

export function CourseCard({ course, locale, progress }: CourseCardProps) {
  const tCommon = useTranslations("common");
  const TrackIcon = trackIcons[course.track] ?? Code2;
  const ref = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothX = useSpring(mouseX, { stiffness: 300, damping: 50 });
  const smoothY = useSpring(mouseY, { stiffness: 300, damping: 50 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }

  const spotlightBg = useMotionTemplate`radial-gradient(280px circle at ${smoothX}px ${smoothY}px, rgba(0, 255, 163, 0.06), transparent 70%)`;
  const borderGlow = useMotionTemplate`radial-gradient(200px circle at ${smoothX}px ${smoothY}px, rgba(0, 255, 163, 0.3), transparent 70%)`;

  const glowColor = trackGlowColors[course.track] ?? "rgba(0, 255, 163, 0.4)";

  return (
    <Link href={`/${locale}/courses/${course.slug}`}>
      <div
        ref={ref}
        onMouseMove={handleMouseMove}
        className="group relative flex flex-col h-full overflow-hidden rounded-[2px] transition-all duration-300 ease-out hover:-translate-y-1.5 focus-within:ring-2 focus-within:ring-[#00FFA3] focus-within:ring-offset-2 focus-within:ring-offset-[#000000]"
        style={{ perspective: "800px" }}
      >
        {/* Animated border glow layer */}
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-[2px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: borderGlow }}
        />

        {/* Static border */}
        <div className="absolute inset-0 rounded-[2px] border border-[var(--c-border-subtle)] transition-colors duration-300 group-hover:border-[rgba(0,255,163,0.3)]" />

        {/* Card inner */}
        <article
          className="relative flex flex-col h-full bg-[var(--c-bg-card)]/80 rounded-[2px] transition-all duration-300 group-hover:bg-[var(--c-bg-card)]"
          style={{
            boxShadow: `0 0 0px transparent`,
          }}
        >
          {/* Mouse-following spotlight */}
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-[2px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: spotlightBg }}
          />

          {/* Hover glow shadow */}
          <div
            className="pointer-events-none absolute inset-0 rounded-[2px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              boxShadow: `0 8px 32px -8px ${glowColor}, 0 0 16px -4px ${glowColor}`,
            }}
          />

          {/* Content */}
          <div className="relative p-5 flex-1 flex flex-col">
            {/* Top row: Track + Difficulty */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrackIcon className="h-3.5 w-3.5 text-[var(--c-text-2)] transition-colors duration-300 group-hover:text-[#00FFA3]" />
                <span className="text-[11px] font-mono font-medium uppercase tracking-widest text-[var(--c-text-2)]">
                  {TRACK_LABELS[course.track]}
                </span>
              </div>
              <Badge
                variant={
                  course.difficulty as "beginner" | "intermediate" | "advanced"
                }
              >
                {tCommon(
                  course.difficulty as "beginner" | "intermediate" | "advanced",
                )}
              </Badge>
            </div>

            {/* Title */}
            <h3 className="text-base font-semibold text-[var(--c-text)] line-clamp-2 group-hover:text-[#00FFA3] transition-colors duration-300 leading-snug">
              {course.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-[var(--c-text-2)] line-clamp-2 mt-2 flex-1">
              {course.description}
            </p>

            {/* Progress bar (if enrolled) */}
            {progress !== undefined && progress > 0 && (
              <div className="mt-3 h-1 w-full overflow-hidden rounded-[1px] bg-[var(--c-border-subtle)]">
                <div
                  className="h-full rounded-[1px] bg-gradient-to-r from-[#00FFA3] to-[#03E1FF] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            )}

            {/* Footer metadata */}
            <footer className="flex items-center justify-between border-t border-[var(--c-border-subtle)] mt-4 pt-3">
              <div className="flex items-center gap-3 text-xs text-[var(--c-text-2)]">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  {course.lessonCount}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {course.duration}
                </span>
              </div>
              <span className="font-mono text-xs font-semibold text-[#00FFA3] transition-all duration-300 group-hover:drop-shadow-[0_0_6px_rgba(0,255,163,0.5)]">
                +{course.xpReward} XP
              </span>
            </footer>
          </div>
        </article>
      </div>
    </Link>
  );
}
