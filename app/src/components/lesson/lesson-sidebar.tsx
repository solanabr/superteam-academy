import Link from "next/link";
import type { Module } from "@/lib/services/types";

export function V9LessonSidebar({
  modules,
  activeId,
  locale,
  slug,
}: {
  modules: Module[];
  activeId: string;
  locale: string;
  slug: string;
}) {
  return (
    <aside className="v9-reader-sidebar">
      {modules.map((mod) => (
        <div key={mod.id}>
          <div className="v9-sidebar-module-label">{mod.title}</div>
          {mod.lessons.map((lesson) => {
            const isActive = lesson.id === activeId;
            return (
              <Link
                key={lesson.id}
                href={`/${locale}/courses/${slug}/lessons/${lesson.id}`}
                className={`v9-sidebar-lesson ${isActive ? "active" : ""}`}
              >
                <span
                  className={`v9-sidebar-dot ${isActive ? "active" : ""}`}
                />
                <span style={{ flex: 1 }}>{lesson.title}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
