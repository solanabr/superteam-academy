"use client";

import { useState } from "react";
import Link from "next/link";
import type { Module } from "@/lib/services/types";

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
}

export function ModuleAccordion({
  modules,
  locale,
  slug,
}: ModuleAccordionProps) {
  const [expandedModule, setExpandedModule] = useState(0);

  return (
    <>
      {modules.map((mod, mi) => {
        const isOpen = expandedModule === mi;
        const modLessons = mod.lessons;
        const modXP = modLessons.reduce((s, l) => s + l.xpReward, 0);

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
                </div>
              </div>
              <div className={`sa-module-toggle ${isOpen ? "open" : ""}`}>
                +
              </div>
            </div>
            <div className={`sa-module-lessons ${isOpen ? "open" : ""}`}>
              {modLessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  href={`/${locale}/courses/${slug}/lessons/${lesson.id}`}
                  className="sa-lesson-row"
                >
                  <div className="sa-lesson-type-icon">
                    {TYPE_ICONS[lesson.type] ?? "\u25EB"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="sa-lesson-title-text">{lesson.title}</div>
                    <div className="sa-lesson-sub">
                      {lesson.type} &middot; {lesson.duration}
                    </div>
                  </div>
                  <div className="sa-lesson-xp">+{lesson.xpReward} XP</div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}
