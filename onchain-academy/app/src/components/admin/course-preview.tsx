"use client";

import {
  BookOpen,
  Clock,
  Zap,
  CheckCircle2,
  FileText,
  Code,
  Video,
  HelpCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TRACK_LABELS, TRACK_COLORS } from "@/lib/constants";
import type { TrackType, DifficultyLevel } from "@/lib/constants";

interface LessonPreview {
  _id: string;
  title: string;
  slug: string;
  type: string;
  xpReward: number;
  estimatedMinutes: number;
  order: number;
}

interface ModulePreview {
  _id: string;
  title: string;
  description: string;
  order: number;
  lessons: LessonPreview[];
}

interface CoursePreviewProps {
  course: {
    title: string;
    description: string;
    longDescription: string;
    track: TrackType;
    difficulty: DifficultyLevel;
    xpReward: number;
    estimatedHours: number;
    learningOutcomes: string[];
    modules: ModulePreview[];
  };
}

const LESSON_TYPE_ICONS: Record<string, typeof FileText> = {
  reading: FileText,
  challenge: Code,
  video: Video,
  quiz: HelpCircle,
};

export function CoursePreview({ course }: CoursePreviewProps) {
  const totalLessons = course.modules.reduce(
    (sum, m) => sum + (m.lessons?.length ?? 0),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Preview Banner */}
      <div className="rounded-[2px] border border-amber-500/20 bg-amber-500/5 px-4 py-2">
        <p className="text-xs text-amber-400">
          Preview mode -- this is how learners will see your course
        </p>
      </div>

      {/* Course Header */}
      <div className="rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] p-6">
        <div className="flex items-center gap-3 mb-4">
          <span
            className="text-xs font-mono uppercase tracking-wider"
            style={{ color: TRACK_COLORS[course.track] }}
          >
            {TRACK_LABELS[course.track]}
          </span>
          <Badge variant={course.difficulty}>{course.difficulty}</Badge>
        </div>

        <h1 className="text-2xl font-bold text-[var(--c-text)] mb-3">
          {course.title || "Untitled Course"}
        </h1>

        <p className="text-sm text-[var(--c-text-2)] mb-6 leading-relaxed">
          {course.description || "No description provided."}
        </p>

        <div className="flex items-center gap-6 text-sm text-[var(--c-text-2)]">
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4" />
            <span>
              {totalLessons} lesson{totalLessons !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{course.estimatedHours}h</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-[#00FFA3]" />
            <span className="font-mono text-[#00FFA3]">
              {course.xpReward} XP
            </span>
          </div>
        </div>
      </div>

      {/* Long Description */}
      {course.longDescription && (
        <div className="rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] p-6">
          <h2 className="text-sm font-semibold text-[var(--c-text)] mb-3">
            About this Course
          </h2>
          <p className="text-sm text-[var(--c-text-2)] leading-relaxed whitespace-pre-wrap">
            {course.longDescription}
          </p>
        </div>
      )}

      {/* Learning Outcomes */}
      {course.learningOutcomes.length > 0 && (
        <div className="rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] p-6">
          <h2 className="text-sm font-semibold text-[var(--c-text)] mb-3">
            What You Will Learn
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {course.learningOutcomes.map((outcome, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#00FFA3] mt-0.5 shrink-0" />
                <span className="text-sm text-[var(--c-text-2)]">
                  {outcome}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Curriculum */}
      <div className="rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] p-6">
        <h2 className="text-sm font-semibold text-[var(--c-text)] mb-4">
          Curriculum
        </h2>

        {course.modules.length === 0 ? (
          <p className="text-sm text-[var(--c-text-2)] text-center py-6">
            No modules added yet.
          </p>
        ) : (
          <div className="space-y-4">
            {[...course.modules]
              .sort((a, b) => a.order - b.order)
              .map((mod, modIdx) => (
                <div
                  key={mod._id}
                  className="rounded-[2px] border border-[var(--c-border-subtle)] overflow-hidden"
                >
                  <div className="flex items-center gap-3 px-4 py-3 bg-[var(--c-bg-elevated)]/50">
                    <span className="text-xs font-mono text-[#00FFA3]">
                      {String(modIdx + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="text-sm font-medium text-[var(--c-text)]">
                        {mod.title}
                      </h3>
                      {mod.description && (
                        <p className="text-[10px] text-[var(--c-text-2)] mt-0.5">
                          {mod.description}
                        </p>
                      )}
                    </div>
                    <span className="ml-auto text-[10px] text-[var(--c-text-dim)]">
                      {mod.lessons?.length ?? 0} lesson
                      {(mod.lessons?.length ?? 0) !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="divide-y divide-[var(--c-border-subtle)]">
                    {(mod.lessons ?? [])
                      .sort((a, b) => a.order - b.order)
                      .map((lesson) => {
                        const Icon =
                          LESSON_TYPE_ICONS[lesson.type] ?? FileText;
                        return (
                          <div
                            key={lesson._id}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--c-bg-elevated)]/20 transition-colors"
                          >
                            <Icon className="h-3.5 w-3.5 text-[var(--c-text-2)]" />
                            <span className="text-sm text-[var(--c-text)] flex-1">
                              {lesson.title}
                            </span>
                            <span className="text-[10px] text-[var(--c-text-dim)]">
                              {lesson.estimatedMinutes}m
                            </span>
                            <span className="text-[10px] font-mono text-[#00FFA3]">
                              {lesson.xpReward} XP
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
