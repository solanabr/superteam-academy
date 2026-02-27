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
    <aside
      style={{
        width: "clamp(220px, 18vw, 280px)",
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        overflowY: "auto",
        padding: "100px 0 100px clamp(20px, 4vw, 40px)",
        borderRight: "1px solid var(--c-border-subtle)",
        background: "var(--background)",
        zIndex: 10,
      }}
    >
      {modules.map((mod) => (
        <div key={mod.id}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "9px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--c-text-muted)",
              marginBottom: "12px",
              marginTop: "28px",
              paddingRight: "20px",
            }}
          >
            {mod.title}
          </div>
          {mod.lessons.map((lesson) => {
            const isActive = lesson.id === activeId;
            return (
              <Link
                key={lesson.id}
                href={`/${locale}/courses/${slug}/lessons/${lesson.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 20px 10px 0",
                  fontFamily: "var(--font-sans)",
                  fontSize: "13px",
                  color: isActive ? "var(--foreground)" : "var(--c-text-muted)",
                  fontWeight: isActive ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  position: "relative",
                  textDecoration: "none",
                  borderLeft: isActive
                    ? "2px solid var(--nd-highlight-orange)"
                    : "2px solid transparent",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: isActive
                      ? "var(--nd-highlight-orange)"
                      : "rgba(255,255,255,0.15)",
                    flexShrink: 0,
                  }}
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
