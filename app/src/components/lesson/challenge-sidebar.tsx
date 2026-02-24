import Link from "next/link";
import type { Module } from "@/lib/services/types";

const CHALLENGE_TYPE_ICONS: Record<string, string> = {
  reading: "\u25EB",
  video: "\u25B6",
  challenge: "\u27E8/\u27E9",
  quiz: "\u25CE",
};

export function V9ChallengeSidebar({
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
        gridRow: "2 / 4",
        background: "#F6F5F2",
        borderRight: "1px solid rgba(26,25,24,0.07)",
        overflowY: "auto",
        padding: "16px 0",
      }}
    >
      {modules.map((mod) => (
        <div key={mod.id} style={{ marginBottom: 2 }}>
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 8.5,
              letterSpacing: "0.18em",
              textTransform: "uppercase" as const,
              color: "#B5B2AE",
              padding: "14px 16px 6px",
            }}
          >
            {mod.title}
          </div>
          {mod.lessons.map((l) => {
            const active = l.id === activeId;
            return (
              <Link
                key={l.id}
                href={`/${locale}/courses/${slug}/lessons/${l.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 16px",
                  fontSize: 12.5,
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  color: active ? "#1A1918" : "#8A8784",
                  fontWeight: active ? 600 : 400,
                  borderLeft: active
                    ? "2px solid #FF5C28"
                    : "2px solid transparent",
                  background: active ? "rgba(255,92,40,0.03)" : "transparent",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  textDecoration: "none",
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: active ? "#FF5C28" : "rgba(26,25,24,0.12)",
                  }}
                />
                <span
                  style={{
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap" as const,
                  }}
                >
                  {l.title}
                </span>
                <span
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 7.5,
                    color: "#B5B2AE",
                    flexShrink: 0,
                  }}
                >
                  {CHALLENGE_TYPE_ICONS[l.type] ?? "\u25EB"}
                </span>
              </Link>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
