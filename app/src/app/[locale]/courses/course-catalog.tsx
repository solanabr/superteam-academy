"use client";

import { useState, useMemo } from "react";
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
      className="v9-page-dark min-h-screen"
      style={{ background: "var(--v9-near-black)", color: "var(--v9-white)" }}
    >
      {/* ── Header ── */}
      <header className="v9-catalog-header">
        <h1
          className="v9-fade-up v9-fade-d1"
          style={{
            fontFamily: "var(--v9-serif)",
            fontSize: "clamp(48px, 8vw, 120px)",
            fontWeight: 900,
            letterSpacing: "-3px",
            lineHeight: 0.9,
            color: "var(--v9-white)",
            margin: 0,
            opacity: 0,
          }}
        >
          Curriculum
        </h1>
        <p
          className="v9-overline v9-fade-up v9-fade-d2"
          style={{ marginTop: 20, opacity: 0 }}
        >
          {courses.length} COURSES &middot; {totalLessons} LESSONS &middot;
          BEGINNER &rarr; ADVANCED
        </p>
      </header>

      {/* ── Search ── */}
      <div
        className="v9-catalog-search-wrap v9-fade-up v9-fade-d3"
        style={{ opacity: 0 }}
      >
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("search")}
          style={{
            fontFamily: "var(--v9-mono)",
            fontSize: 13,
            letterSpacing: "1px",
            background: "transparent",
            border: "none",
            borderBottom: "1px solid var(--overlay-border)",
            color: "var(--v9-white)",
            padding: "12px 0",
            width: "100%",
            maxWidth: 480,
            outline: "none",
          }}
        />
      </div>

      {/* ── Filter Pills ── */}
      <div
        className="v9-catalog-filter-bar v9-fade-up v9-fade-d4"
        style={{ opacity: 0 }}
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
            ALL LEVELS
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
            ALL TRACKS
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
                fontFamily: "var(--v9-mono)",
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
                (e.currentTarget.style.color = "var(--v9-white)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--overlay-text)")
              }
            >
              CLEAR
            </button>
          )}
        </div>

        {/* Mobile: filter trigger button */}
        <div className="md:hidden">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            style={{
              fontFamily: "var(--v9-mono)",
              fontSize: 9,
              letterSpacing: "2px",
              textTransform: "uppercase" as const,
              color: "var(--v9-white)",
              background: "none",
              border: "1px solid var(--overlay-border)",
              cursor: "pointer",
              padding: "8px 16px",
            }}
          >
            FILTERS
            {activeFilterCount > 0 && (
              <span style={{ marginLeft: 6, color: "var(--v9-sol-green)" }}>
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Course Sections ── */}
      <div style={{ marginTop: 40 }}>
        {filtered.length > 0 ? (
          filtered.map((course, i) => {
            const { color, bgColor } = getTrackColor(course.track);
            const isHovered = hoveredCourse === course.id;

            return (
              <section
                key={course.id}
                className="relative v9-fade-up v9-catalog-section"
                style={{
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
                  className="v9-catalog-bg-num"
                  style={{
                    fontFamily: "var(--v9-serif)",
                    fontWeight: 900,
                    fontStyle: "italic",
                    lineHeight: 0.8,
                    position: "absolute",
                    top: "50%",
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
                    className="v9-course-tag"
                    style={{ color: DIFFICULTY_COLORS[course.difficulty] }}
                  >
                    {course.difficulty.toUpperCase()}
                  </span>
                  <span className="v9-course-tag-sep">&middot;</span>
                  <span className="v9-course-tag">
                    {course.lessonCount} LESSONS
                  </span>
                  <span className="v9-course-tag-sep">&middot;</span>
                  <span className="v9-course-tag">SOLANA</span>
                  <span className="v9-course-tag-sep">&middot;</span>
                  <span className="v9-course-tag" style={{ color }}>
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
                      fontFamily: "var(--v9-serif)",
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
                      fontFamily: "var(--v9-serif)",
                      fontSize: "clamp(32px, 5vw, 64px)",
                      fontWeight: 900,
                      letterSpacing: "-2px",
                      lineHeight: 1.05,
                      color: isHovered ? color : "var(--v9-white)",
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
                    fontFamily: "var(--v9-serif)",
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
                    fontFamily: "var(--v9-sans)",
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
                  className="v9-catalog-enter-label"
                  style={{
                    fontFamily: "var(--v9-mono)",
                    fontSize: 10,
                    letterSpacing: "3px",
                    textTransform: "uppercase" as const,
                    color: color,
                    marginTop: 24,
                    position: "relative",
                    zIndex: 1,
                    opacity: isHovered ? 0.6 : 0,
                    transform: isHovered ? "translateY(0)" : "translateY(8px)",
                    transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                    display: "inline-block",
                  }}
                >
                  ENTER COURSE &rarr;
                </span>
              </section>
            );
          })
        ) : (
          /* Empty state */
          <div className="v9-catalog-empty" style={{ textAlign: "center" }}>
            <p
              style={{
                fontFamily: "var(--v9-serif)",
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
                fontFamily: "var(--v9-sans)",
                fontSize: 14,
                opacity: 0.4,
                marginTop: 16,
              }}
            >
              Try adjusting your filters or search term to find courses.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setSelectedDifficulty("all");
                setSelectedTrack("all");
              }}
              style={{
                fontFamily: "var(--v9-mono)",
                fontSize: 10,
                letterSpacing: "3px",
                textTransform: "uppercase" as const,
                color: "var(--v9-white)",
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
              CLEAR FILTERS
            </button>
          </div>
        )}
      </div>

      {/* ── Mobile Filters Drawer ── */}
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
                  fontFamily: "var(--v9-mono)",
                  fontSize: 10,
                  letterSpacing: "4px",
                  textTransform: "uppercase" as const,
                  color: "var(--v9-white)",
                }}
              >
                FILTERS
              </span>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--v9-warm-grey)",
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
                  fontFamily: "var(--v9-mono)",
                  fontSize: 9,
                  letterSpacing: "3px",
                  textTransform: "uppercase" as const,
                  color: "var(--v9-mid-grey)",
                  marginBottom: 12,
                }}
              >
                LEVEL
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <FilterPill
                  active={selectedDifficulty === "all"}
                  onClick={() => setSelectedDifficulty("all")}
                >
                  ALL
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
                  fontFamily: "var(--v9-mono)",
                  fontSize: 9,
                  letterSpacing: "3px",
                  textTransform: "uppercase" as const,
                  color: "var(--v9-mid-grey)",
                  marginBottom: 12,
                }}
              >
                TRACK
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <FilterPill
                  active={selectedTrack === "all"}
                  onClick={() => setSelectedTrack("all")}
                >
                  ALL
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
                fontFamily: "var(--v9-mono)",
                fontSize: 10,
                letterSpacing: "2px",
                textTransform: "uppercase" as const,
                width: "100%",
                padding: "14px 0",
                background: "var(--v9-white)",
                color: "var(--v9-near-black)",
                border: "none",
                cursor: "pointer",
                marginTop: 8,
              }}
            >
              SHOW {filtered.length} RESULTS
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Inline FilterPill ── */
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
        fontFamily: "var(--v9-mono)",
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
              ? "var(--v9-white)"
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
