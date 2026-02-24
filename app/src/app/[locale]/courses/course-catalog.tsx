"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import Link from "next/link";
import { X } from "lucide-react";
import {
  DIFFICULTY_LEVELS,
  TRACK_TYPES,
  TRACK_LABELS,
  DIFFICULTY_COLORS,
} from "@/lib/constants";
import type { Course, Difficulty, Track } from "@/lib/services/types";

interface CourseCatalogProps {
  courses: Course[];
}

const courseColors: Record<string, { color: string; bgColor: string }> = {
  rust: { color: "#F48252", bgColor: "#1A0E06" },
  anchor: { color: "#CA9FF5", bgColor: "#12081F" },
  frontend: { color: "#6693F7", bgColor: "#081220" },
  security: { color: "#EF4444", bgColor: "#1A0810" },
  defi: { color: "#55E9AB", bgColor: "#0B1A14" },
  mobile: { color: "#EC4899", bgColor: "#1A0820" },
};

function getTrackColor(track: string) {
  return courseColors[track] ?? { color: "#F6F5F2", bgColor: "#1A1918" };
}

function padIndex(i: number): string {
  return String(i + 1).padStart(2, "0");
}

export default function CourseCatalog({ courses }: CourseCatalogProps) {
  const t = useTranslations("courses");
  const params = useParams();
  const locale = params.locale as string;

  const [search, setSearch] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    Difficulty | "all"
  >("all");
  const [selectedTrack, setSelectedTrack] = useState<Track | "all">("all");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [hoveredCourse, setHoveredCourse] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const filtered = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(search.toLowerCase()) ||
      course.description.toLowerCase().includes(search.toLowerCase());
    const matchesDifficulty =
      selectedDifficulty === "all" || course.difficulty === selectedDifficulty;
    const matchesTrack =
      selectedTrack === "all" || course.track === selectedTrack;
    return matchesSearch && matchesDifficulty && matchesTrack;
  });

  const totalLessons = useMemo(
    () => courses.reduce((sum, c) => sum + c.lessonCount, 0),
    [courses],
  );

  const activeFilterCount =
    (selectedDifficulty !== "all" ? 1 : 0) + (selectedTrack !== "all" ? 1 : 0);

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      {/* -- Header -- */}
      <header
        style={{
          padding: mobile ? "100px 20px 24px" : "140px 40px 40px",
        }}
      >
        <h1
          className="sa-fade-up sa-fade-d1"
          style={{
            fontFamily: "var(--font-brand)",
            fontSize: "clamp(48px, 8vw, 120px)",
            fontWeight: 900,
            letterSpacing: "-3px",
            lineHeight: 0.9,
            color: "var(--foreground)",
            margin: 0,
            opacity: 0,
          }}
        >
          {t("curriculum")}
        </h1>
        <p
          className="sa-fade-up sa-fade-d2"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "4px",
            textTransform: "uppercase",
            color: "var(--c-text-muted)",
            marginTop: 20,
            opacity: 0,
          }}
        >
          {t("coursesAndLessons", { courseCount: courses.length, lessonCount: totalLessons })}
        </p>
      </header>

      {/* -- Search -- */}
      <div
        className="sa-fade-up sa-fade-d3"
        style={{
          padding: mobile ? "0 20px 12px" : "0 40px 12px",
          opacity: 0,
        }}
      >
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("search")}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            letterSpacing: "1px",
            background: "transparent",
            border: "none",
            borderBottom: "1px solid var(--overlay-border)",
            color: "var(--foreground)",
            padding: "12px 0",
            width: "100%",
            maxWidth: 480,
            outline: "none",
          }}
        />
      </div>

      {/* -- Filter Pills -- */}
      <div
        className="sa-fade-up sa-fade-d4"
        style={{
          padding: mobile ? "16px 20px 0" : "16px 40px 0",
          opacity: 0,
        }}
      >
        {/* Desktop: filter pills */}
        <div
          className="hidden md:flex"
          style={{ flexWrap: "wrap", gap: 8, alignItems: "center" }}
        >
          <FilterPill
            active={selectedDifficulty === "all"}
            onClick={() => setSelectedDifficulty("all")}
          >
            {t("allLevels")}
          </FilterPill>
          {DIFFICULTY_LEVELS.map((d) => (
            <FilterPill
              key={d}
              active={selectedDifficulty === d}
              onClick={() =>
                setSelectedDifficulty(selectedDifficulty === d ? "all" : d)
              }
              accentColor={DIFFICULTY_COLORS[d]}
            >
              {d.toUpperCase()}
            </FilterPill>
          ))}

          <span
            style={{
              width: 1,
              height: 16,
              background: "var(--overlay-border)",
              margin: "0 8px",
            }}
          />

          <FilterPill
            active={selectedTrack === "all"}
            onClick={() => setSelectedTrack("all")}
          >
            {t("allTracks")}
          </FilterPill>
          {TRACK_TYPES.map((track) => (
            <FilterPill
              key={track}
              active={selectedTrack === track}
              onClick={() =>
                setSelectedTrack(selectedTrack === track ? "all" : track)
              }
              accentColor={courseColors[track]?.color}
            >
              {TRACK_LABELS[track].toUpperCase()}
            </FilterPill>
          ))}

          {activeFilterCount > 0 && (
            <button
              onClick={() => {
                setSelectedDifficulty("all");
                setSelectedTrack("all");
              }}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                letterSpacing: "2px",
                textTransform: "uppercase" as const,
                color: "var(--overlay-text)",
                background: "none",
                border: "none",
                cursor: "pointer",
                marginLeft: 8,
                padding: "4px 0",
                transition: "color 0.3s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--foreground)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--overlay-text)")
              }
            >
              {t("clear")}
            </button>
          )}
        </div>

        {/* Mobile: filter trigger button */}
        <div className="md:hidden">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              letterSpacing: "2px",
              textTransform: "uppercase" as const,
              color: "var(--foreground)",
              background: "none",
              border: "1px solid var(--overlay-border)",
              cursor: "pointer",
              padding: "8px 16px",
            }}
          >
            {t("filters")}
            {activeFilterCount > 0 && (
              <span style={{ marginLeft: 6, color: "var(--xp)" }}>
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* -- Course Sections -- */}
      <div style={{ marginTop: 40 }}>
        {filtered.length > 0 ? (
          filtered.map((course, i) => {
            const { color, bgColor } = getTrackColor(course.track);
            const isHovered = hoveredCourse === course.id;

            return (
              <section
                key={course.id}
                className="relative sa-fade-up"
                style={{
                  padding: mobile ? "48px 20px" : "80px 40px",
                  minHeight: mobile ? "auto" : "50vh",
                  display: "flex",
                  flexDirection: "column" as const,
                  justifyContent: "center",
                  cursor: "pointer",
                  overflow: "hidden",
                  borderTop: "1px solid var(--overlay-divider)",
                  background: isHovered ? bgColor : "transparent",
                  transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                  animationDelay: `${0.1 + i * 0.08}s`,
                  opacity: 0,
                }}
                onMouseEnter={() => setHoveredCourse(course.id)}
                onMouseLeave={() => setHoveredCourse(null)}
              >
                {/* Big background number */}
                <span
                  aria-hidden="true"
                  style={{
                    fontFamily: "var(--font-brand)",
                    fontSize: mobile
                      ? "clamp(80px, 22vw, 140px)"
                      : "clamp(120px, 20vw, 280px)",
                    fontWeight: 900,
                    fontStyle: "italic",
                    lineHeight: 0.8,
                    position: "absolute",
                    top: "50%",
                    right: mobile ? "16px" : "40px",
                    transform: "translateY(-50%)",
                    opacity: isHovered ? 0.12 : 0.04,
                    pointerEvents: "none",
                    letterSpacing: "-8px",
                    color: color,
                    transition: "opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                    userSelect: "none",
                  }}
                >
                  {padIndex(i)}
                </span>

                {/* Tag row */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 16,
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "9px",
                      letterSpacing: "3px",
                      textTransform: "uppercase",
                      padding: "4px 0",
                      opacity: 0.5,
                      color: DIFFICULTY_COLORS[course.difficulty],
                    }}
                  >
                    {course.difficulty.toUpperCase()}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "9px",
                      opacity: 0.2,
                    }}
                  >
                    &middot;
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "9px",
                      letterSpacing: "3px",
                      textTransform: "uppercase",
                      padding: "4px 0",
                      opacity: 0.5,
                    }}
                  >
                    {t("lessonsCount", { count: course.lessonCount })}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "9px",
                      opacity: 0.2,
                    }}
                  >
                    &middot;
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "9px",
                      letterSpacing: "3px",
                      textTransform: "uppercase",
                      padding: "4px 0",
                      opacity: 0.5,
                    }}
                  >
                    {t("solana")}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "9px",
                      opacity: 0.2,
                    }}
                  >
                    &middot;
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "9px",
                      letterSpacing: "3px",
                      textTransform: "uppercase",
                      padding: "4px 0",
                      opacity: 0.5,
                      color,
                    }}
                  >
                    {TRACK_LABELS[course.track].toUpperCase()}
                  </span>
                </div>

                {/* Title row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 24,
                    marginTop: 16,
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-brand)",
                      fontSize: 14,
                      fontStyle: "italic",
                      opacity: 0.3,
                      flexShrink: 0,
                    }}
                  >
                    {padIndex(i)}
                  </span>
                  <Link
                    href={`/${locale}/courses/${course.slug}`}
                    style={{
                      fontFamily: "var(--font-brand)",
                      fontSize: "clamp(32px, 5vw, 64px)",
                      fontWeight: 900,
                      letterSpacing: "-2px",
                      lineHeight: 1.05,
                      color: isHovered ? color : "var(--foreground)",
                      textDecoration: "none",
                      transition: "color 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  >
                    {course.title}
                  </Link>
                </div>

                {/* Description */}
                <p
                  style={{
                    fontFamily: "var(--font-brand)",
                    fontSize: "clamp(18px, 2.2vw, 28px)",
                    fontWeight: 400,
                    lineHeight: 1.5,
                    maxWidth: 700,
                    opacity: isHovered ? 0.9 : 0.6,
                    marginTop: 20,
                    marginBottom: 0,
                    position: "relative",
                    zIndex: 1,
                    transition: "opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  {course.description}
                </p>

                {/* Subtitle */}
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 13,
                    fontStyle: "italic",
                    opacity: 0.4,
                    marginTop: 8,
                    marginBottom: 0,
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  {course.duration} &middot; {course.xpReward} XP &middot;{" "}
                  {t("by")} {course.creator}
                </p>

                {/* Enter label */}
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    letterSpacing: "3px",
                    textTransform: "uppercase" as const,
                    color: color,
                    marginTop: 24,
                    position: "relative",
                    zIndex: 1,
                    opacity: mobile ? 0.5 : isHovered ? 0.6 : 0,
                    transform: mobile
                      ? "translateY(0)"
                      : isHovered
                        ? "translateY(0)"
                        : "translateY(8px)",
                    transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                    display: "inline-block",
                  }}
                >
                  {t("enterCourse")} →
                </span>
              </section>
            );
          })
        ) : (
          /* Empty state */
          <div
            style={{
              padding: mobile ? "80px 20px" : "120px 40px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-brand)",
                fontSize: "clamp(24px, 4vw, 48px)",
                fontWeight: 900,
                letterSpacing: "-2px",
                opacity: 0.2,
                lineHeight: 1.1,
              }}
            >
              {t("noResults")}
            </p>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                opacity: 0.4,
                marginTop: 16,
              }}
            >
              {t("noResultsHint")}
            </p>
            <button
              onClick={() => {
                setSearch("");
                setSelectedDifficulty("all");
                setSelectedTrack("all");
              }}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: "3px",
                textTransform: "uppercase" as const,
                color: "var(--foreground)",
                background: "none",
                border: "1px solid var(--overlay-border)",
                cursor: "pointer",
                padding: "12px 32px",
                marginTop: 32,
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--overlay-divider)";
                e.currentTarget.style.borderColor = "var(--c-border-hovered)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
                e.currentTarget.style.borderColor = "var(--overlay-border)";
              }}
            >
              {t("clearFilters")}
            </button>
          </div>
        )}
      </div>

      {/* -- Mobile Filters Drawer -- */}
      {mobileFiltersOpen && (
        <div
          className="fixed inset-0 z-[60] lg:hidden"
          role="dialog"
          aria-label="Course filters"
        >
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={() => setMobileFiltersOpen(false)}
            aria-hidden="true"
          />
          <div
            className="absolute bottom-0 inset-x-0 animate-slide-in"
            style={{
              background: "var(--overlay-bg)",
              borderTop: "1px solid var(--overlay-divider)",
              padding: 32,
              maxHeight: "75vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 28,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  letterSpacing: "4px",
                  textTransform: "uppercase" as const,
                  color: "var(--foreground)",
                }}
              >
                {t("filters")}
              </span>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--c-text-2)",
                  cursor: "pointer",
                }}
                aria-label="Close filters"
              >
                <X size={18} />
              </button>
            </div>

            {/* Difficulty */}
            <div style={{ marginBottom: 24 }}>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 9,
                  letterSpacing: "3px",
                  textTransform: "uppercase" as const,
                  color: "var(--c-text-muted)",
                  marginBottom: 12,
                }}
              >
                {t("level")}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <FilterPill
                  active={selectedDifficulty === "all"}
                  onClick={() => setSelectedDifficulty("all")}
                >
                  {t("all")}
                </FilterPill>
                {DIFFICULTY_LEVELS.map((d) => (
                  <FilterPill
                    key={d}
                    active={selectedDifficulty === d}
                    onClick={() => setSelectedDifficulty(d)}
                    accentColor={DIFFICULTY_COLORS[d]}
                  >
                    {d.toUpperCase()}
                  </FilterPill>
                ))}
              </div>
            </div>

            {/* Track */}
            <div style={{ marginBottom: 24 }}>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 9,
                  letterSpacing: "3px",
                  textTransform: "uppercase" as const,
                  color: "var(--c-text-muted)",
                  marginBottom: 12,
                }}
              >
                {t("track")}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <FilterPill
                  active={selectedTrack === "all"}
                  onClick={() => setSelectedTrack("all")}
                >
                  {t("all")}
                </FilterPill>
                {TRACK_TYPES.map((track) => (
                  <FilterPill
                    key={track}
                    active={selectedTrack === track}
                    onClick={() => setSelectedTrack(track)}
                    accentColor={courseColors[track]?.color}
                  >
                    {TRACK_LABELS[track].toUpperCase()}
                  </FilterPill>
                ))}
              </div>
            </div>

            <button
              onClick={() => setMobileFiltersOpen(false)}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: "2px",
                textTransform: "uppercase" as const,
                width: "100%",
                padding: "14px 0",
                background: "var(--foreground)",
                color: "var(--background)",
                border: "none",
                cursor: "pointer",
                marginTop: 8,
              }}
            >
              {t("showResults", { count: filtered.length })}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* -- Inline FilterPill -- */
function FilterPill({
  active,
  onClick,
  accentColor,
  children,
}: {
  active: boolean;
  onClick: () => void;
  accentColor?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 9,
        letterSpacing: "2px",
        textTransform: "uppercase" as const,
        padding: "6px 14px",
        border: active
          ? "1px solid var(--overlay-border)"
          : "1px solid var(--overlay-divider)",
        background: active ? "var(--overlay-border)" : "transparent",
        color:
          active && accentColor
            ? accentColor
            : active
              ? "var(--foreground)"
              : "var(--c-text-dim)",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        lineHeight: 1,
      }}
    >
      {children}
    </button>
  );
}
