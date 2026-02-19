"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface LessonItem {
  _id: string;
  title: string;
  slug: string;
  type: "content" | "challenge";
  order: number;
  completed?: boolean;
  locked?: boolean;
}

interface ModuleItem {
  _id: string;
  title: string;
  description: string;
  lessons: LessonItem[];
  order: number;
}

interface CurriculumAccordionProps {
  modules: ModuleItem[];
  courseSlug: string;
  locale: string;
  completedLessons?: string[];
}

export function CurriculumAccordion({
  modules,
  courseSlug,
  locale,
  completedLessons = [],
}: CurriculumAccordionProps) {
  const [openModules, setOpenModules] = useState<Set<string>>(
    new Set(modules.length > 0 && modules[0] ? [modules[0]._id] : [])
  );

  function toggleModule(id: string) {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {modules.map((mod) => {
        const isOpen = openModules.has(mod._id);
        const completedInModule = mod.lessons.filter((l) =>
          completedLessons.includes(l._id)
        ).length;

        return (
          <div
            key={mod._id}
            className="overflow-hidden rounded-lg border-[2.5px] border-border"
          >
            <button
              onClick={() => toggleModule(mod._id)}
              className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-subtle"
              aria-expanded={isOpen}
            >
              <div className="min-w-0 flex-1">
                <h4 className="truncate font-display font-semibold text-text">
                  {mod.title}
                </h4>
                <p className="mt-0.5 text-sm text-text-3">
                  {completedInModule}/{mod.lessons.length} lessons
                </p>
              </div>
              <span
                className={cn(
                  "ml-2 shrink-0 text-lg text-text-3 transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
                style={{ display: "inline-block" }}
              >
                ▾
              </span>
            </button>
            {isOpen && (
              <div className="border-t border-border">
                {mod.lessons.map((lesson, lessonIdx) => {
                  const isCompleted = completedLessons.includes(lesson._id);
                  return (
                    <a
                      key={lesson._id}
                      href={`/${locale}/courses/${courseSlug}/lessons/${lesson.slug}`}
                      className={cn(
                        "flex items-center gap-3 border-b border-border px-4 py-3 text-sm transition-colors last:border-b-0 hover:bg-subtle",
                        isCompleted && "text-text-3"
                      )}
                    >
                      <span className="w-5 shrink-0 text-sm tabular-nums text-text-3">
                        {isCompleted ? (
                          <span className="font-bold text-success">✓</span>
                        ) : (
                          <span>{lessonIdx + 1}.</span>
                        )}
                      </span>
                      <span className="flex-1 truncate">
                        {lesson.type === "challenge" && (
                          <span className="font-display font-bold text-accent-dark dark:text-accent">
                            Challenge:{" "}
                          </span>
                        )}
                        {lesson.title}
                      </span>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
