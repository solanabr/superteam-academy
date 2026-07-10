"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CaretDown, CheckCircle, Article, Code } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface LessonItem {
  _id: string;
  title: string;
  slug: string;
  /** Derived from block content: a lesson with a graded `code` block. */
  isChallenge: boolean;
  completed?: boolean;
  locked?: boolean;
}

interface ModuleItem {
  /** Stable id — the inline module `key` (namespaced by the caller if needed). */
  id: string;
  title: string;
  lessons: LessonItem[];
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
  const t = useTranslations("courses");
  const tLesson = useTranslations("lesson");
  const [openModules, setOpenModules] = useState<Set<string>>(
    new Set(modules.length > 0 && modules[0] ? [modules[0].id] : [])
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
        const isOpen = openModules.has(mod.id);
        const completedInModule = mod.lessons.filter((l) =>
          completedLessons.includes(l._id)
        ).length;
        const allComplete =
          completedInModule === mod.lessons.length && mod.lessons.length > 0;

        return (
          <div
            key={mod.id}
            className={cn(
              "overflow-hidden rounded-xl border-[2.5px] border-border bg-card shadow-card transition-colors",
              allComplete && "border-success/30"
            )}
          >
            <button
              onClick={() => toggleModule(mod.id)}
              className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-subtle"
              aria-expanded={isOpen}
            >
              <div className="min-w-0 flex-1">
                <h4 className="truncate font-display font-black text-text">
                  {mod.title}
                </h4>
                <p className="mt-0.5 text-sm text-text-3">
                  {completedInModule}/{mod.lessons.length} {t("lessons")}
                </p>
              </div>
              <CaretDown
                size={18}
                weight="bold"
                className={cn(
                  "ml-2 shrink-0 text-text-3 transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </button>
            {isOpen && (
              <div className="border-t border-border">
                {mod.lessons.map((lesson, lessonIdx) => {
                  const isCompleted = completedLessons.includes(lesson._id);
                  const isChallenge = lesson.isChallenge;
                  return (
                    <a
                      key={lesson._id}
                      href={`/${locale}/courses/${courseSlug}/lessons/${lesson.slug}`}
                      className={cn(
                        "border-border/60 flex items-center gap-3 border-b px-4 py-3 text-sm transition-colors last:border-b-0 hover:bg-subtle",
                        isCompleted && "text-text-3"
                      )}
                    >
                      <span className="flex w-6 shrink-0 items-center justify-center">
                        {isCompleted ? (
                          <CheckCircle
                            size={18}
                            weight="fill"
                            className="text-success"
                          />
                        ) : isChallenge ? (
                          <Code
                            size={18}
                            weight="duotone"
                            className="text-accent"
                          />
                        ) : (
                          <Article
                            size={18}
                            weight="duotone"
                            className="text-text-3"
                          />
                        )}
                      </span>
                      <span className="flex min-w-0 flex-1 items-center gap-2">
                        <span className="text-text-3/60 font-mono text-xs tabular-nums">
                          {lessonIdx + 1}.
                        </span>
                        <span className="truncate">
                          {isChallenge && (
                            <span className="font-display font-bold text-accent-dark dark:text-accent">
                              {tLesson("challenge")}:{" "}
                            </span>
                          )}
                          {lesson.title}
                        </span>
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
