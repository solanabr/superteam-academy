"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Module } from "@/lib/services/types";
import { useEnrollment, isLessonComplete } from "@/lib/hooks/use-enrollment";

const TYPE_ICONS: Record<string, string> = {
  reading: "\u25EB",
  video: "\u25B6",
  challenge: "\u27E8/\u27E9",
  quiz: "\u25EF",
};

interface ModuleAccordionProps {
  modules: Module[];
  locale: string;
  slug: string;
  courseId: string;
}

export function ModuleAccordion({
  modules,
  locale,
  slug,
  courseId,
}: ModuleAccordionProps) {
  const [expandedModule, setExpandedModule] = useState(0);
  const { enrollment, exists } = useEnrollment(courseId);

  const moduleOffsets = useMemo(() => {
    const offsets: number[] = [];
    let offset = 0;
    for (const mod of modules) {
      offsets.push(offset);
      offset += mod.lessons.length;
    }
    return offsets;
  }, [modules]);

  return (
    <>
      {modules.map((mod, mi) => {
        const isOpen = expandedModule === mi;
        const modLessons = mod.lessons;
        const modXP = modLessons.reduce((s, l) => s + l.xpReward, 0);
        const baseIndex = moduleOffsets[mi];

        let modCompleted = 0;
        if (exists && enrollment) {
          for (let i = 0; i < modLessons.length; i++) {
            if (isLessonComplete(enrollment.lessonFlags, baseIndex + i)) {
              modCompleted++;
            }
          }
        }

        return (
          <div className="sa-module" key={mod.id}>
            <div
              className="sa-module-header"
              onClick={() => setExpandedModule(isOpen ? -1 : mi)}
            >
              <div className="sa-module-num">
                {String(mi + 1).padStart(2, "0")}
              </div>
              <div style={{ flex: 1 }}>
                <div className="sa-module-title">{mod.title}</div>
                <div className="sa-module-meta">
                  {modLessons.length} Lessons &middot; {modXP} XP
                  {exists && enrollment && (
                    <span
                      style={{
                        marginLeft: "8px",
                        color:
                          modCompleted === modLessons.length
                            ? "var(--xp)"
                            : "var(--c-text-muted)",
                      }}
                    >
                      &middot; {modCompleted}/{modLessons.length}
                    </span>
                  )}
                </div>
              </div>
              <div className={`sa-module-toggle ${isOpen ? "open" : ""}`}>
                +
              </div>
            </div>
            <div className={`sa-module-lessons ${isOpen ? "open" : ""}`}>
              {modLessons.map((lesson, li) => {
                const done =
                  exists &&
                  enrollment &&
                  isLessonComplete(enrollment.lessonFlags, baseIndex + li);

                return (
                  <Link
                    key={lesson.id}
                    href={`/${locale}/courses/${slug}/lessons/${lesson.id}`}
                    className="sa-lesson-row"
                  >
                    <div className="sa-lesson-type-icon">
                      {done ? (
                        <span style={{ color: "var(--xp)", fontWeight: 700 }}>
                          ✓
                        </span>
                      ) : (
                        (TYPE_ICONS[lesson.type] ?? "\u25EB")
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="sa-lesson-title-text">{lesson.title}</div>
                      <div className="sa-lesson-sub">
                        {lesson.type} &middot; {lesson.duration}
                      </div>
                    </div>
                    <div className="sa-lesson-xp">+{lesson.xpReward} XP</div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}
