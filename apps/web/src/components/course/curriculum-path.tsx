"use client";

import { useTranslations } from "next-intl";
import { CheckCircle, Play, Code, Article } from "@phosphor-icons/react";
import { ProgressBar } from "./progress-bar";
import { cn } from "@/lib/utils";

interface PathLesson {
  _id: string;
  title: string;
  slug: string;
  /** Derived from block content: a lesson with a graded `code` block. */
  isChallenge: boolean;
}

interface PathModule {
  /** Stable id — the inline module `key` (namespaced by the caller if needed). */
  id: string;
  title: string;
  lessons: PathLesson[];
}

interface CurriculumPathProps {
  modules: PathModule[];
  courseSlug: string;
  locale: string;
  completedLessons: string[];
  /**
   * `_id` of the single "next" node, derived by the caller with
   * `findNextIncompleteLesson` (the same rule the dashboard Continue card
   * uses — LX-B2). `null` means the course is fully complete: no active node.
   */
  activeLessonId: string | null;
}

/**
 * Linear-path presentation of the curriculum (LX-B14): modules as a
 * sequential progress map with exactly one visually-active "next" node.
 *
 * Presentation only — every lesson is a plain link regardless of state.
 * Nothing here is locked, disabled, or gated (UIU-10/11: forced linearity
 * has no learning-outcome evidence; the escape hatch is the design).
 */
export function CurriculumPath({
  modules,
  courseSlug,
  locale,
  completedLessons,
  activeLessonId,
}: CurriculumPathProps) {
  const t = useTranslations("courses");
  const tLesson = useTranslations("lesson");
  const completedSet = new Set(completedLessons);

  return (
    <ol className="space-y-4">
      {modules.map((mod, moduleIdx) => {
        const completedInModule = mod.lessons.filter((l) =>
          completedSet.has(l._id)
        ).length;
        const allComplete =
          completedInModule === mod.lessons.length && mod.lessons.length > 0;

        return (
          <li
            key={mod.id}
            className={cn(
              "overflow-hidden rounded-xl border-[2.5px] border-border bg-card shadow-card",
              allComplete && "border-success/30"
            )}
          >
            {/* Module header + per-module progress */}
            <div className="border-b border-border p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-text-3">
                    {t("moduleLabel", { number: moduleIdx + 1 })}
                  </p>
                  <h4 className="mt-0.5 truncate font-display font-black text-text">
                    {mod.title}
                  </h4>
                </div>
                <span className="shrink-0 font-display text-[13px] font-bold tabular-nums text-text-3">
                  {completedInModule}/{mod.lessons.length} {t("lessons")}
                </span>
              </div>
              <ProgressBar
                value={completedInModule}
                max={Math.max(mod.lessons.length, 1)}
                variant={allComplete ? "success" : "primary"}
                className="mt-3"
              />
            </div>

            {/* Lesson nodes on the path */}
            <ol className="p-2">
              {mod.lessons.map((lesson, lessonIdx) => {
                const isCompleted = completedSet.has(lesson._id);
                const isActive = lesson._id === activeLessonId;

                return (
                  <li key={lesson._id} className="relative">
                    {/* Connector rail between node markers (decorative) */}
                    {lessonIdx > 0 && (
                      <span
                        aria-hidden="true"
                        className="absolute left-[23px] top-0 h-1/2 w-0.5 bg-border"
                      />
                    )}
                    {lessonIdx < mod.lessons.length - 1 && (
                      <span
                        aria-hidden="true"
                        className="absolute bottom-0 left-[23px] h-1/2 w-0.5 bg-border"
                      />
                    )}

                    {/* Every state renders the same plain link — nothing is
                        locked or disabled; the map is presentation only. */}
                    <a
                      href={`/${locale}/courses/${courseSlug}/lessons/${lesson.slug}`}
                      aria-current={isActive ? "step" : undefined}
                      className={cn(
                        "relative flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors hover:bg-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary",
                        isActive &&
                          "bg-primary-bg ring-2 ring-inset ring-primary",
                        isCompleted && "text-text-3"
                      )}
                    >
                      <span className="flex w-6 shrink-0 items-center justify-center">
                        {isCompleted ? (
                          <CheckCircle
                            size={20}
                            weight="fill"
                            className="text-success"
                          />
                        ) : isActive ? (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Play size={11} weight="fill" />
                          </span>
                        ) : lesson.isChallenge ? (
                          <Code
                            size={20}
                            weight="duotone"
                            className="text-accent"
                          />
                        ) : (
                          <Article
                            size={20}
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
                          {lesson.isChallenge && (
                            <span className="font-display font-bold text-accent-dark dark:text-accent">
                              {tLesson("challenge")}:{" "}
                            </span>
                          )}
                          {lesson.title}
                        </span>
                        {isCompleted && (
                          <span className="sr-only">{t("completed")}</span>
                        )}
                      </span>

                      {isActive && (
                        <span className="shrink-0 rounded-full bg-primary px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                          {t("upNext")}
                        </span>
                      )}
                    </a>
                  </li>
                );
              })}
            </ol>
          </li>
        );
      })}
    </ol>
  );
}
