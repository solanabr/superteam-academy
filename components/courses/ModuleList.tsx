"use client";

import Link from "next/link";
import { ChevronDown, PlayCircle, CheckCircle2, Lock } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import type { CmsCourse } from "@/lib/cms/types";

type ModuleListProps = {
  course: CmsCourse;
  completedLessons?: number;
};

export function ModuleList({ course, completedLessons = 0 }: ModuleListProps): JSX.Element {
  const { t } = useI18n();
  const [expandedIndex, setExpandedIndex] = useState(0);

  let lessonCounter = 0;

  return (
    <div className="space-y-3">
      {course.modules.map((module, moduleIndex) => {
        const moduleStartLesson = lessonCounter;
        const expanded = expandedIndex === moduleIndex;

        return (
          <div key={module._id} className="overflow-hidden rounded-lg border transition-colors hover:border-solana-purple/30">
            {/* Module header */}
            <button
              onClick={() => setExpandedIndex(expanded ? -1 : moduleIndex)}
              className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/30"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-solana-purple/10 text-sm font-bold text-solana-purple">
                {moduleIndex + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {t("common.module")} {moduleIndex + 1}
                </p>
                <p className="font-medium">{module.title}</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {module.lessons.length} {t("common.lessons").toLowerCase()}
              </span>
              <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>

            {/* Lessons list */}
            {expanded && (
              <div className="border-t bg-muted/10">
                {module.lessons.map((lesson) => {
                  lessonCounter++;
                  const globalIndex = lessonCounter;
                  const isCompleted = globalIndex <= completedLessons;
                  const isCurrent = globalIndex === completedLessons + 1;
                  const isLocked = globalIndex > completedLessons + 1;

                  return (
                    <Link
                      key={lesson._id}
                      href={isLocked ? "#" : `/courses/${course.slug}/lessons/${globalIndex}`}
                      className={`flex items-center gap-3 border-t border-border/50 px-4 py-3 text-sm transition-colors ${
                        isCurrent
                          ? "bg-solana-purple/5"
                          : isLocked
                            ? "cursor-not-allowed opacity-50"
                            : "hover:bg-muted/30"
                      }`}
                      onClick={isLocked ? (e) => e.preventDefault() : undefined}
                    >
                      {/* Status icon */}
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-solana-green" />
                      ) : isCurrent ? (
                        <PlayCircle className="h-4 w-4 shrink-0 text-solana-purple" />
                      ) : (
                        <Lock className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                      )}

                      {/* Lesson info */}
                      <span className={`flex-1 ${isCurrent ? "font-medium text-solana-purple" : ""}`}>
                        {lesson.title}
                      </span>

                      {/* Challenge indicator */}
                      {lesson.challengePrompt && (
                        <span className="shrink-0 rounded-full bg-solana-green/10 px-2 py-0.5 text-[10px] font-medium text-solana-green">
                          Challenge
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
            {/* Track counter for collapsed modules */}
            {!expanded && (() => { lessonCounter = moduleStartLesson + module.lessons.length; return null; })()}
          </div>
        );
      })}
    </div>
  );
}
