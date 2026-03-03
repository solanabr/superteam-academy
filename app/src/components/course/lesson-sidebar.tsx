"use client";

import Link from "next/link";
import { X, BookOpen, Code, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { Course } from "@/types";

export interface LessonSidebarProps {
  course: Course;
  currentLessonId: string;
  onClose: () => void;
}

export function LessonSidebar({
  course,
  currentLessonId,
  onClose,
}: LessonSidebarProps) {
  const t = useTranslations("lesson");
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 left-0 z-50 w-72 border-r border-border bg-card shadow-xl lg:relative lg:z-auto lg:shadow-none">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">{t("courseModules")}</h3>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          className="overflow-y-auto p-2"
          style={{ maxHeight: "calc(100vh - 120px)" }}
        >
          {course.modules.map((mod, mi) => (
            <div key={mod.id} className="mb-2">
              <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("moduleLabel", { index: mi + 1, title: mod.title })}
              </div>
              <div className="space-y-0.5">
                {mod.lessons.map((l) => (
                  <Link
                    key={l.id}
                    href={`/courses/${course.slug}/lessons/${l.id}`}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors",
                      l.id === currentLessonId
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <div className="shrink-0">
                      {l.completed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-brazil-green" />
                      ) : l.id === currentLessonId ? (
                        <div className="h-3.5 w-3.5 rounded-full border-2 border-primary bg-primary/20" />
                      ) : l.type === "challenge" ? (
                        <Code className="h-3.5 w-3.5" />
                      ) : (
                        <BookOpen className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <span className="flex-1 truncate">{l.title}</span>
                    <span className="text-xs text-xp">{l.xpReward}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
