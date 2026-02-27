"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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

type DurationFilter = "all" | "< 3h" | "3-6h" | "> 6h";

const DURATION_FILTERS: DurationFilter[] = ["< 3h", "3-6h", "> 6h"];

const DURATION_LABELS: Record<DurationFilter, string> = {
  all: "allDurations",
  "< 3h": "under3h",
  "3-6h": "between3and6h",
  "> 6h": "over6h",
};

function parseDurationHours(duration: string): number {
  const lower = duration.toLowerCase().trim();
  const hourMatch = lower.match(/([\d.]+)\s*h/);
  if (hourMatch) return parseFloat(hourMatch[1]);
  const minMatch = lower.match(/([\d.]+)\s*min/);
  if (minMatch) return parseFloat(minMatch[1]) / 60;
  const numMatch = lower.match(/([\d.]+)/);
  if (numMatch) return parseFloat(numMatch[1]);
  return 0;
}

function matchesDurationFilter(duration: string, filter: DurationFilter): boolean {
  if (filter === "all") return true;
  const hours = parseDurationHours(duration);
  if (filter === "< 3h") return hours < 3;
  if (filter === "3-6h") return hours >= 3 && hours <= 6;
  return hours > 6;
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
  const [selectedDuration, setSelectedDuration] = useState<DurationFilter>("all");
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
    const matchesDuration = matchesDurationFilter(course.duration, selectedDuration);
    return matchesSearch && matchesDifficulty && matchesTrack && matchesDuration;
  });

  const totalLessons = useMemo(
    () => courses.reduce((sum, c) => sum + c.lessonCount, 0),
    [courses],
  );

  const activeFilterCount =
    (selectedDifficulty !== "all" ? 1 : 0) +
    (selectedTrack !== "all" ? 1 : 0) +
    (selectedDuration !== "all" ? 1 : 0);

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      {/* -- Header -- */}
      <header className="cc-header">
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
        className="sa-fade-up sa-fade-d3 cc-search"
        style={{
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
        className="sa-fade-up sa-fade-d4 cc-filters"
        style={{
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

          <span
            style={{
              width: 1,
              height: 16,
              background: "var(--overlay-border)",
              margin: "0 8px",
            }}
          />

          <FilterPill
            active={selectedDuration === "all"}
            onClick={() => setSelectedDuration("all")}
          >
            {t("allDurations")}
          </FilterPill>
          {DURATION_FILTERS.map((d) => (
            <FilterPill
              key={d}
              active={selectedDuration === d}
              onClick={() =>
                setSelectedDuration(selectedDuration === d ? "all" : d)
              }
            >
              {t(DURATION_LABELS[d])}
            </FilterPill>
          ))}

          {activeFilterCount > 0 && (
            <button
              onClick={() => {
                setSelectedDifficulty("all");
                setSelectedTrack("all");
                setSelectedDuration("all");
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
                className="relative sa-fade-up cc-section"
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
                  className="cc-bg-num"
                  style={{
                    fontFamily: "var(--font-brand)",
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

                {course.imageUrl && (
                  <div
                    style={{
                      position: "absolute",
                      right: "clamp(16px, 4vw, 48px)",
                      top: "50%",
                      transform: "translateY(-50%)",
                      zIndex: 2,
                      opacity: isHovered ? 1 : 0.6,
                      transition: "opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  >
                    <Image
                      src={course.imageUrl}
                      alt=""
                      width={80}
                      height={80}
                      style={{
                        borderRadius: 8,
                        objectFit: "cover",
                      }}
                    />
                  </div>
                )}

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
                      color: DIFFICULTY_COLORS[course.difficulty],
                    }}
                  >
                    {course.difficulty.toUpperCase()}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "9px",
                      color: "var(--c-text-muted)",
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
                      color: "var(--c-text-muted)",
                    }}
                  >
                    {t("lessonsCount", { count: course.lessonCount })}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "9px",
                      color: "var(--c-text-muted)",
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
                      color: "var(--c-text-muted)",
                    }}
                  >
                    {t("solana")}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "9px",
                      color: "var(--c-text-muted)",
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
                      opacity: 0.6,
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
                    opacity: 0.6,
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
                  className="cc-enter-label"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    letterSpacing: "3px",
                    textTransform: "uppercase" as const,
                    color: color,
                    marginTop: 24,
                    position: "relative",
                    zIndex: 1,
                    opacity: isHovered ? 1 : undefined,
                    transform: isHovered ? "translateY(0)" : undefined,
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
            className="cc-empty"
            style={{
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-brand)",
                fontSize: "clamp(24px, 4vw, 48px)",
                fontWeight: 900,
                letterSpacing: "-2px",
                opacity: 0.6,
                lineHeight: 1.1,
              }}
            >
              {t("noResults")}
            </p>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                opacity: 0.6,
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
                setSelectedDuration("all");
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

            {/* Duration */}
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
                {t("durationLabel")}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <FilterPill
                  active={selectedDuration === "all"}
                  onClick={() => setSelectedDuration("all")}
                >
                  {t("all")}
                </FilterPill>
                {DURATION_FILTERS.map((d) => (
                  <FilterPill
                    key={d}
                    active={selectedDuration === d}
                    onClick={() => setSelectedDuration(d)}
                  >
                    {t(DURATION_LABELS[d])}
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
