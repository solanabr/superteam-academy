"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronRight, Check, Code, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Module } from "@/types";

export interface ModuleListProps {
  modules: Module[];
  courseSlug: string;
  completedLessons: number[];
}

export function ModuleList({
  modules,
  courseSlug,
  completedLessons,
}: ModuleListProps) {
  const tc = useTranslations("common");

  if (modules.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        {tc("comingSoon")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {modules.map((module, mi) => (
        <ModuleAccordion
          key={module.id}
          module={module}
          moduleIndex={mi}
          courseSlug={courseSlug}
          completedLessons={completedLessons}
          lessonOffset={modules
            .slice(0, mi)
            .reduce((sum, m) => sum + m.lessons.length, 0)}
        />
      ))}
    </div>
  );
}

interface ModuleAccordionProps {
  module: Module;
  moduleIndex: number;
  courseSlug: string;
  completedLessons: number[];
  lessonOffset: number;
}

function ModuleAccordion({
  module,
  moduleIndex,
  courseSlug,
  completedLessons,
  lessonOffset,
}: ModuleAccordionProps) {
  return (
    <details
      className="group rounded-xl border border-border bg-card"
      open={moduleIndex === 0}
    >
      <summary className="flex cursor-pointer items-center justify-between px-5 py-4 [&::-webkit-details-marker]:hidden">
        <div className="flex items-center gap-3">
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
          <div>
            <h3 className="text-sm font-semibold">
              Module {moduleIndex + 1}: {module.title}
            </h3>
            <p className="text-xs text-muted-foreground">
              {module.lessons.length} lessons
            </p>
          </div>
        </div>
      </summary>

      <div className="border-t border-border">
        {module.lessons.map((lesson, li) => {
          const lessonGlobalIndex = lessonOffset + li;
          const isCompleted = completedLessons.includes(lessonGlobalIndex);
          return (
            <Link
              key={lesson.id}
              href={`/courses/${courseSlug}/lessons/${lesson.id}`}
              className={cn(
                "flex items-center gap-3 px-5 py-3 text-sm transition-colors hover:bg-muted/50",
                li !== module.lessons.length - 1 && "border-b border-border",
              )}
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-xs text-muted-foreground">
                {isCompleted ? (
                  <Check className="h-3.5 w-3.5 text-brazil-green" />
                ) : lesson.type === "challenge" ? (
                  <Code className="h-3 w-3" />
                ) : (
                  <Play className="h-3 w-3" />
                )}
              </div>
              <div className="flex-1">
                <span
                  className={cn(
                    isCompleted && "text-muted-foreground line-through",
                  )}
                >
                  {lesson.title}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{lesson.duration}</span>
                <span className="text-xp">{lesson.xpReward} XP</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
          );
        })}
      </div>
    </details>
  );
}
