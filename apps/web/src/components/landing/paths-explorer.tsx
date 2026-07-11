"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Medal, Lightning } from "@phosphor-icons/react";
import type { LearningPath } from "@superteam-lms/types";

/* ────────────────────────────────────────────────────────────────────
   Track-select console. Left: the tracks. Right: the selected track's
   REAL courses plotted as a journey that draws itself — nodes pop in
   order, labels fade under them, the medal lands at the end. The panel
   re-mounts on every selection (key), so the animation replays each
   switch. Auto-cycles through tracks until the visitor takes over.
   ──────────────────────────────────────────────────────────────────── */

const AUTO_CYCLE_MS = 5000;
const MAX_STOPS = 5;

export function PathsExplorer({
  paths,
  locale,
}: {
  paths: LearningPath[];
  locale: string;
}) {
  const t = useTranslations("landing");
  const tCourses = useTranslations("courses");
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(false);
  const reducedRef = useRef(false);

  useEffect(() => {
    reducedRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (!reducedRef.current) setAuto(true);
  }, []);

  useEffect(() => {
    if (!auto || paths.length < 2) return;
    const id = setInterval(
      () => setActive((a) => (a + 1) % paths.length),
      AUTO_CYCLE_MS
    );
    return () => clearInterval(id);
  }, [auto, paths.length]);

  const select = (i: number) => {
    setActive(i);
    setAuto(false); // the visitor took the controls
  };

  const path = paths[active];
  if (!path) return null;

  const courses = path.courses ?? [];
  // The GROQ filter form loses the path's array order — trackLevel is the
  // real intra-track sequence (fundamentals before the capstone).
  const ordered = [...courses]
    .sort(
      (a, b) =>
        (a.trackLevel ?? 99) - (b.trackLevel ?? 99) ||
        a.title.localeCompare(b.title)
    )
    .slice(0, MAX_STOPS);
  const totalXp = courses.reduce((sum, c) => sum + (c.xpReward ?? 0), 0);
  const difficulty = path.difficulty ?? ordered[0]?.difficulty;

  // Journey nodes: a big labeled stop per course, small unlabeled ticks for
  // its modules in between — so even a two-course track reads as a real trip.
  const journey: Array<{
    key: string;
    big: boolean;
    label?: string;
    lessons?: number;
  }> = [];
  for (const course of ordered) {
    const lessonCount =
      course.modules?.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0) ??
      0;
    journey.push({
      key: course._id,
      big: true,
      label: course.title,
      lessons: lessonCount,
    });
    const ticks = Math.min(Math.max((course.modules?.length ?? 1) - 1, 1), 4);
    for (let i = 0; i < ticks; i++) {
      journey.push({ key: `${course._id}-m${i}`, big: false });
    }
  }

  return (
    <div className="card-chunky grid overflow-hidden p-0 md:grid-cols-[280px_1fr]">
      {/* ── Track tabs ── */}
      <div
        className="flex overflow-x-auto border-b-[2.5px] border-border md:flex-col md:overflow-visible md:border-b-0 md:border-r-[2.5px]"
        role="tablist"
        aria-label={t("pathsTitle")}
      >
        {paths.map((p, i) => {
          const isActive = i === active;
          const count = p.courses?.length ?? 0;
          return (
            <button
              key={p._id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => select(i)}
              className={`relative flex shrink-0 items-center gap-3 px-4 py-3 text-left transition-colors md:py-4 ${
                isActive ? "bg-subtle" : "hover:bg-subtle/60"
              } focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary`}
            >
              {/* active marker: yellow bar (left on desktop, bottom on mobile) */}
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[3px] bg-xp md:bottom-auto md:right-auto md:h-auto md:w-[3px] md:[inset-block:0]"
                  aria-hidden="true"
                />
              )}
              <span
                className={`font-mono text-xs font-bold ${isActive ? "text-primary" : "text-text-3"}`}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className={`flex-1 whitespace-nowrap font-display text-sm font-black md:whitespace-normal ${
                  isActive ? "text-text" : "text-text-2"
                }`}
              >
                {p.title}
              </span>
              <span className="hidden rounded-md border-[2px] border-border bg-card px-2 py-0.5 font-mono text-[10px] font-bold text-text-2 md:inline">
                {t("pathCourses", { count })}
              </span>
              {/* auto-cycle progress on the active tab */}
              {isActive && auto && (
                <span
                  className="lpx-progress bg-xp/50 absolute bottom-0 left-0 h-[2px]"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Track preview: re-mounts per selection so the journey replays ── */}
      <div
        key={path._id}
        role="tabpanel"
        className="relative min-h-[300px] overflow-hidden p-6 sm:p-8"
      >
        {/* Ghost number */}
        <span
          className="pointer-events-none absolute -bottom-8 right-4 font-mono text-[150px] font-black leading-none opacity-[0.04]"
          aria-hidden="true"
        >
          {String(active + 1).padStart(2, "0")}
        </span>

        <div className="lpx-fade relative">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {difficulty && (
              <span className="rounded-md border-[2px] border-border bg-subtle px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-text-2">
                {tCourses(difficulty)}
              </span>
            )}
            {totalXp > 0 && (
              <span className="flex items-center gap-1 rounded-md border-[2px] border-[var(--accent-border)] px-2 py-0.5 font-mono text-[10px] font-bold text-xp">
                <Lightning size={11} weight="fill" />
                {totalXp.toLocaleString()} XP
              </span>
            )}
          </div>

          <p className="max-w-xl text-sm leading-relaxed text-text-2 sm:text-base">
            {path.description}
          </p>
        </div>

        {/* The journey: courses as labeled stops, their modules as ticks */}
        <div className="relative mr-10 mt-10 pb-16" aria-hidden="true">
          <div className="absolute inset-x-0 top-[6px] h-[3px] rounded-full bg-border" />
          <div className="lpx-draw absolute left-0 top-[6px] h-[3px] rounded-full [background:linear-gradient(90deg,var(--primary),var(--xp))]" />
          <div
            className={`relative flex items-start ${journey.length > 1 ? "justify-between" : "justify-start"}`}
          >
            {journey.map((node, i) => {
              const isFirst = i === 0;
              const isLast = i === journey.length - 1;
              return (
                <div
                  key={node.key}
                  className="lpx-node relative"
                  style={{ animationDelay: `${0.12 + i * 0.09}s` }}
                >
                  {node.big ? (
                    <span className="block h-[15px] w-[15px] rounded-full border-[3px] border-primary bg-card" />
                  ) : (
                    <span className="mt-[3.5px] block h-[8px] w-[8px] rounded-full border-[2px] border-border bg-subtle" />
                  )}
                  {node.big && node.label && (
                    <span
                      className={`lpx-label absolute top-6 w-28 font-mono text-[10px] font-bold leading-tight text-text-3 ${
                        isFirst
                          ? "left-0 text-left"
                          : isLast
                            ? "right-0 text-right"
                            : "left-1/2 -translate-x-1/2 text-center"
                      }`}
                      style={{ animationDelay: `${0.28 + i * 0.09}s` }}
                    >
                      {node.label}
                      {typeof node.lessons === "number" && node.lessons > 0 && (
                        <span className="mt-0.5 block font-medium opacity-70">
                          {t("pathLessons", { count: node.lessons })}
                        </span>
                      )}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <Medal
            size={22}
            weight="fill"
            className="lpx-medal absolute -right-10 -top-1"
          />
        </div>

        <Link
          href={`/${locale}/courses`}
          className="lpx-fade inline-flex items-center gap-2 font-mono text-sm font-bold text-primary transition-colors hover:text-primary-hover"
          style={{ animationDelay: "0.5s" }}
        >
          {t("pathStart")} {"→"}
        </Link>
      </div>
    </div>
  );
}
