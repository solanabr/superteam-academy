"use client";

import { useMemo, useRef, useCallback, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Lock, CheckCircle } from "@phosphor-icons/react";
import * as Tooltip from "@radix-ui/react-tooltip";
import type { StreakData } from "@superteam-lms/types";
import { LevelBadge } from "@/components/gamification/level-badge";
import type { AchievementDefinition } from "@/lib/gamification";
import { xpToNextLevel } from "@/lib/gamification/xp";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------
   HEATMAP BUILDER — 39 columns x 7 rows (~270 days)
   Builds from streakHistory, maps to l0-l4 + today
--------------------------------------------------------------- */
const ROWS = 7;
const COLS = 39;

interface HeatmapCell {
  date: string;
  level: 0 | 1 | 2 | 3 | 4;
  isToday: boolean;
  count: number;
  /** An inactive day a streak freeze saved (LX-B8) — rendered as a snowflake. */
  frozen: boolean;
}

interface HeatmapData {
  columns: HeatmapCell[][];
  monthLabels: { label: string; colIdx: number }[];
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const MONTH_FULL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function ordinal(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function formatCellTooltip(
  dateStr: string,
  count: number,
  frozen: boolean
): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  const month = MONTH_FULL[d.getMonth()]!;
  const day = ordinal(d.getDate());
  if (frozen) return `Streak frozen on ${month} ${day}`;
  if (count === 0) return `No activity on ${month} ${day}`;
  if (count === 1) return `1 lesson completed on ${month} ${day}`;
  return `${count} lessons completed on ${month} ${day}`;
}

function countToLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}

function buildHeatmapData(
  streakHistory: Record<string, number>,
  frozenDays: readonly string[] = []
): HeatmapData {
  const frozenSet = new Set(frozenDays);
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0]!;
  const todayDow = today.getDay();
  const totalCells = COLS * ROWS;
  const startOffset = totalCells - todayDow - 1;

  const columns: HeatmapCell[][] = [];
  const monthLabelMap = new Map<number, string>();

  for (let col = 0; col < COLS; col++) {
    const colCells: HeatmapCell[] = [];
    for (let row = 0; row < ROWS; row++) {
      const cellIdx = col * ROWS + row;
      const daysAgo = startOffset - cellIdx;

      if (daysAgo < 0) {
        colCells.push({
          date: "",
          level: 0,
          isToday: false,
          count: 0,
          frozen: false,
        });
        continue;
      }

      const d = new Date(today);
      d.setDate(d.getDate() - daysAgo);
      const dateStr = d.toISOString().split("T")[0]!;
      const isToday = dateStr === todayStr;
      const count = streakHistory[dateStr] ?? 0;
      const level = countToLevel(count);
      // Activity always wins: a day is only "frozen" if it has no real activity.
      const frozen = count === 0 && frozenSet.has(dateStr);

      colCells.push({ date: dateStr, level, isToday, count, frozen });

      if (row === 0 && !monthLabelMap.has(col)) {
        const month = d.getMonth();
        const label = MONTH_NAMES[month]!;
        const prevDate = new Date(d);
        prevDate.setDate(prevDate.getDate() - ROWS);
        if (col === 0 || prevDate.getMonth() !== month) {
          monthLabelMap.set(col, label);
        }
      }
    }
    columns.push(colCells);
  }

  // Filter out month labels that are too close together (< 4 columns apart)
  const sorted = Array.from(monthLabelMap.entries())
    .map(([colIdx, label]) => ({ label, colIdx }))
    .sort((a, b) => a.colIdx - b.colIdx);
  const monthLabels: { label: string; colIdx: number }[] = [];
  for (const entry of sorted) {
    const prev = monthLabels[monthLabels.length - 1];
    if (!prev || entry.colIdx - prev.colIdx >= 4) {
      monthLabels.push(entry);
    }
  }

  return { columns, monthLabels };
}

/* ---------------------------------------------------------------
   ACHIEVEMENT TOKEN (V9 octagonal .dm-oct)
--------------------------------------------------------------- */
function AchievementToken({
  glyph,
  name,
  hint,
  state,
  isOpen,
  onTap,
  onOpenChange,
  wasDrag,
}: {
  glyph: string;
  name: string;
  hint: string;
  state: "earned" | "sol" | "locked";
  isOpen?: boolean;
  onTap?: () => void;
  onOpenChange?: (open: boolean) => void;
  wasDrag?: () => boolean;
}) {
  const isLocked = state === "locked";

  return (
    <Tooltip.Root open={isOpen} onOpenChange={onOpenChange}>
      <Tooltip.Trigger asChild>
        <div
          className="dm"
          onClick={(e) => {
            if (wasDrag?.()) return;
            e.stopPropagation();
            onTap?.();
          }}
        >
          <div
            className={cn("dm-oct", state)}
            aria-label={`${name} achievement — ${state}`}
          >
            <div className="dm-face" />
            <span className="dm-glyph">{glyph}</span>
          </div>
          <span className="dm-name">{name}</span>
        </div>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          className="heatmap-tooltip"
          sideOffset={8}
          side="top"
          collisionPadding={12}
        >
          <span className="ach-tip">
            {isLocked ? (
              <Lock size={13} weight="bold" className="ach-tip-lock" />
            ) : (
              <CheckCircle size={13} weight="fill" className="ach-tip-check" />
            )}
            {hint}
          </span>
          <Tooltip.Arrow className="fill-[var(--card)]" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

/* ---------------------------------------------------------------
   DAY LABELS — Mon, Wed, Fri beside the heatmap
--------------------------------------------------------------- */
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

/* ---------------------------------------------------------------
   DASHBOARD IDENTITY PANEL (V9 .dash-panel)
   Uses CSS classes from globals.css — no inline styles.
--------------------------------------------------------------- */
export interface DashboardIdentityPanelProps {
  xp: number;
  level: number;
  streak: StreakData;
  achievementsCount: number;
  unlockedAchievementIds: string[];
  /** Sanity achievement catalog — single source of truth for total count + token list */
  catalog: AchievementDefinition[];
  className?: string;
}

export function DashboardIdentityPanel({
  xp,
  level,
  streak,
  achievementsCount,
  unlockedAchievementIds,
  catalog,
  className,
}: DashboardIdentityPanelProps) {
  const t = useTranslations("gamification");
  const tDash = useTranslations("dashboard");

  const { xpInCurrentLevel, xpRequiredForNext, progressPercent } =
    xpToNextLevel(xp);

  const unlockedSet = useMemo(
    () => new Set(unlockedAchievementIds),
    [unlockedAchievementIds]
  );

  // Sort achievements: earned first, then locked
  const sortedAchievements = useMemo(
    () =>
      [...catalog].sort((a, b) => {
        const aEarned = unlockedSet.has(a.id) ? 0 : 1;
        const bEarned = unlockedSet.has(b.id) ? 0 : 1;
        return aEarned - bEarned;
      }),
    [catalog, unlockedSet]
  );

  // Achievement slider — horizontal drag-to-scroll
  const achRef = useRef<HTMLDivElement>(null);
  const achDrag = useRef({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
    wasDrag: false,
  });

  const onAchDown = useCallback((e: React.PointerEvent) => {
    const el = achRef.current;
    if (!el) return;
    achDrag.current = {
      isDown: true,
      startX: e.clientX,
      scrollLeft: el.scrollLeft,
      wasDrag: false,
    };
    el.setPointerCapture(e.pointerId);
    el.style.cursor = "grabbing";
  }, []);
  const onAchMove = useCallback((e: React.PointerEvent) => {
    if (!achDrag.current.isDown) return;
    const el = achRef.current;
    if (!el) return;
    if (Math.abs(e.clientX - achDrag.current.startX) > 5) {
      achDrag.current.wasDrag = true;
    }
    el.scrollLeft =
      achDrag.current.scrollLeft - (e.clientX - achDrag.current.startX);
  }, []);
  const onAchUp = useCallback((e: React.PointerEvent) => {
    achDrag.current.isDown = false;
    const el = achRef.current;
    if (!el) return;
    el.releasePointerCapture(e.pointerId);
    el.style.cursor = "";
  }, []);

  const heatmap = useMemo(
    () => buildHeatmapData(streak.streakHistory, streak.frozenDays),
    [streak.streakHistory, streak.frozenDays]
  );

  // Tap-to-show tooltip state (mobile touch support)
  const [openTip, setOpenTip] = useState<string | null>(null);
  useEffect(() => {
    if (!openTip) return;
    const timer = setTimeout(() => setOpenTip(null), 3000);
    return () => clearTimeout(timer);
  }, [openTip]);

  return (
    <div className={cn("dash-panel", className)}>
      {/* ::before gradient accent line is handled by CSS */}

      {/* Ambient glow blobs — ::before (green) and ::after (amber) */}
      <div className="dash-panel-amb" aria-hidden="true" />

      {/* ---- TWO-COLUMN TOP ---- */}
      <div className="dash-top">
        {/* ---- LEFT: Level badge + XP ---- */}
        <div className="dash-identity">
          <LevelBadge level={level} size="xl" />

          <div>
            <div className="dash-xp-num" aria-label={`${xp} XP`}>
              {xp.toLocaleString()}
            </div>
            <div className="dash-xp-unit">{t("experiencePoints")}</div>
            <div className="dash-xp-to">
              {t.rich("xpRemaining", {
                xp: (xpRequiredForNext - xpInCurrentLevel).toLocaleString(),
                xpLabel: t("xp"),
                levelLabel: t("level"),
                level: level + 1,
                em: (chunks) => <em>{chunks}</em>,
              })}
            </div>
            <div className="dash-xp-track">
              <div
                className="dash-xp-fill"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* ---- RIGHT: Achievement tokens slider ---- */}
        <div className="dash-ach">
          <div className="dash-ach-head">
            <span className="dash-ach-title">{t("yourAchievements")}</span>
            <span className="dash-ach-count">
              {t("ofUnlocked", {
                count: achievementsCount,
                total: catalog.length,
              })}
            </span>
          </div>
          <Tooltip.Provider delayDuration={0} skipDelayDuration={150}>
            <div
              ref={achRef}
              className="dash-ach-row"
              onPointerDown={onAchDown}
              onPointerMove={onAchMove}
              onPointerUp={onAchUp}
              onPointerCancel={onAchUp}
            >
              {sortedAchievements.map((ach) => {
                const earned = unlockedSet.has(ach.id);
                const isSol = earned && ach.solTier;
                const tipId = `ach-${ach.id}`;
                return (
                  <AchievementToken
                    key={ach.id}
                    glyph={ach.glyph}
                    name={ach.name}
                    hint={ach.description}
                    state={earned ? (isSol ? "sol" : "earned") : "locked"}
                    isOpen={openTip === tipId}
                    onTap={() =>
                      setOpenTip((prev) => (prev === tipId ? null : tipId))
                    }
                    onOpenChange={(open) => setOpenTip(open ? tipId : null)}
                    wasDrag={() => achDrag.current.wasDrag}
                  />
                );
              })}
            </div>
          </Tooltip.Provider>
        </div>
      </div>

      {/* ---- BOTTOM: Heatmap + Daily Quests ---- */}
      <div className="dash-bottom">
        {/* ---- LEFT: Activity Grid (heatmap) ---- */}
        <div className="dash-grid">
          {/* ::before left-edge green glow is handled by CSS */}

          {/* Grid header — LX-B13 (#583): streak counters are demoted out of
              the dashboard hero at launch (a raw streak counter punishes a
              missed day before forgiveness exists). The calendar stays as a
              neutral activity view; day-streak stats live in profile stats.
              Restore counters here when streak freezes land (LX-B8). */}
          <div className="dash-grid-header">
            <span className="dash-grid-title">{t("activity")}</span>
          </div>

          {/* Heatmap scroll area */}
          <Tooltip.Provider delayDuration={0} skipDelayDuration={150}>
            <div className="contrib-scroll">
              <div className="contrib-wrap">
                {/* Day labels column */}
                <div className="contrib-day-labels">
                  {DAY_LABELS.map((label, idx) => (
                    <div key={idx} className="contrib-day-label">
                      {label}
                    </div>
                  ))}
                </div>

                {/* Grid columns with month labels */}
                <div className="contrib-cols">
                  {/* Month label row */}
                  <div className="contrib-month-row">
                    {heatmap.columns.map((_, colIdx) => {
                      const monthLabel = heatmap.monthLabels.find(
                        (m) => m.colIdx === colIdx
                      );
                      return (
                        <div
                          key={colIdx}
                          className="contrib-month-lbl"
                          style={{ width: 11 }}
                        >
                          {monthLabel?.label ?? ""}
                        </div>
                      );
                    })}
                  </div>

                  {/* Contribution grid */}
                  <div
                    className="contrib-grid"
                    role="img"
                    aria-label={t("activity")}
                  >
                    {/* Grid cells — iterate column-major */}
                    {heatmap.columns.flatMap((col, colIdx) =>
                      col.map((cell, rowIdx) => {
                        const cellTipId = `hm-${colIdx}-${rowIdx}`;
                        return cell.date ? (
                          <Tooltip.Root
                            key={`${colIdx}-${rowIdx}`}
                            open={openTip === cellTipId}
                            onOpenChange={(open) =>
                              setOpenTip(open ? cellTipId : null)
                            }
                          >
                            <Tooltip.Trigger asChild>
                              <div
                                className={cn(
                                  "cday",
                                  cell.level === 1 && "l1",
                                  cell.level === 2 && "l2",
                                  cell.level === 3 && "l3",
                                  cell.level === 4 && "l4",
                                  cell.frozen && "frozen",
                                  cell.isToday && "today"
                                )}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenTip((prev) =>
                                    prev === cellTipId ? null : cellTipId
                                  );
                                }}
                              />
                            </Tooltip.Trigger>
                            <Tooltip.Portal>
                              <Tooltip.Content
                                className="heatmap-tooltip"
                                sideOffset={6}
                                side="top"
                              >
                                {formatCellTooltip(
                                  cell.date,
                                  cell.count,
                                  cell.frozen
                                )}
                                <Tooltip.Arrow className="fill-[var(--card)]" />
                              </Tooltip.Content>
                            </Tooltip.Portal>
                          </Tooltip.Root>
                        ) : (
                          <div
                            key={`${colIdx}-${rowIdx}`}
                            className="cday empty"
                          />
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Tooltip.Provider>

          {/* Legend */}
          <div className="contrib-legend">
            <span>{tDash("less")}</span>
            {(["--sg-0", "--sg-1", "--sg-2", "--sg-3", "--sg-4"] as const).map(
              (v) => (
                <div
                  key={v}
                  className="legend-sq"
                  style={{ background: `var(${v})` }}
                />
              )
            )}
            <span>{tDash("more")}</span>
            <span
              style={{
                marginLeft: 12,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <div
                className="legend-sq cday today"
                style={{ background: "var(--sg-today)" }}
              />
              <span>{tDash("todayLabel")}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
