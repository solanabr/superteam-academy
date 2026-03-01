"use client";

import { useMemo, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Lock,
  CheckCircle,
  BookOpen,
  Code,
  Lightning,
  Trophy,
  Scroll,
  CircleDashed,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import * as Tooltip from "@radix-ui/react-tooltip";
import type { StreakData, DailyQuest } from "@superteam-lms/types";
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

function formatCellTooltip(dateStr: string, count: number): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  const month = MONTH_FULL[d.getMonth()]!;
  const day = ordinal(d.getDate());
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

function buildHeatmapData(streakHistory: Record<string, number>): HeatmapData {
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
        colCells.push({ date: "", level: 0, isToday: false, count: 0 });
        continue;
      }

      const d = new Date(today);
      d.setDate(d.getDate() - daysAgo);
      const dateStr = d.toISOString().split("T")[0]!;
      const isToday = dateStr === todayStr;
      const count = streakHistory[dateStr] ?? 0;
      const level = countToLevel(count);

      colCells.push({ date: dateStr, level, isToday, count });

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
}: {
  glyph: string;
  name: string;
  hint: string;
  state: "earned" | "sol" | "locked";
}) {
  const isLocked = state === "locked";

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <div className="dm">
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
   QUEST ICON MAP — maps Sanity icon strings to Phosphor components
--------------------------------------------------------------- */
const QUEST_ICONS: Record<string, Icon> = {
  BookOpen,
  Code,
  Lightning,
  Trophy,
  Scroll,
};

function getQuestIcon(iconName: string): Icon {
  return QUEST_ICONS[iconName] ?? CircleDashed;
}

function getHoursUntilReset(resetTime: string): number {
  if (!resetTime) return 0;
  const diff = new Date(resetTime).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60)));
}

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
  quests: DailyQuest[];
  questsResetTime: string;
  className?: string;
}

export function DashboardIdentityPanel({
  xp,
  level,
  streak,
  achievementsCount,
  unlockedAchievementIds,
  catalog,
  quests,
  questsResetTime,
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
  const achDrag = useRef({ isDown: false, startX: 0, scrollLeft: 0 });

  const onAchDown = useCallback((e: React.PointerEvent) => {
    const el = achRef.current;
    if (!el) return;
    achDrag.current = {
      isDown: true,
      startX: e.clientX,
      scrollLeft: el.scrollLeft,
    };
    el.setPointerCapture(e.pointerId);
    el.style.cursor = "grabbing";
  }, []);
  const onAchMove = useCallback((e: React.PointerEvent) => {
    if (!achDrag.current.isDown) return;
    const el = achRef.current;
    if (!el) return;
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

  // Daily quests — vertical drag-to-scroll
  const questsRef = useRef<HTMLDivElement>(null);
  const questsDrag = useRef({ isDown: false, startY: 0, scrollTop: 0 });

  const onQuestsDown = useCallback((e: React.PointerEvent) => {
    const el = questsRef.current;
    if (!el) return;
    questsDrag.current = {
      isDown: true,
      startY: e.clientY,
      scrollTop: el.scrollTop,
    };
    el.setPointerCapture(e.pointerId);
    el.style.cursor = "grabbing";
  }, []);
  const onQuestsMove = useCallback((e: React.PointerEvent) => {
    if (!questsDrag.current.isDown) return;
    const el = questsRef.current;
    if (!el) return;
    el.scrollTop =
      questsDrag.current.scrollTop - (e.clientY - questsDrag.current.startY);
  }, []);
  const onQuestsUp = useCallback((e: React.PointerEvent) => {
    questsDrag.current.isDown = false;
    const el = questsRef.current;
    if (!el) return;
    el.releasePointerCapture(e.pointerId);
    el.style.cursor = "";
  }, []);

  const heatmap = useMemo(
    () => buildHeatmapData(streak.streakHistory),
    [streak.streakHistory]
  );

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
                return (
                  <AchievementToken
                    key={ach.id}
                    glyph={ach.glyph}
                    name={ach.name}
                    hint={ach.description}
                    state={earned ? (isSol ? "sol" : "earned") : "locked"}
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

          {/* Grid header: streak label + stats */}
          <div className="dash-grid-header">
            <span className="dash-grid-title">{t("streak")}</span>
            <div className="dash-grid-stats">
              <div className="dgs">
                <div className="dgs-val" style={{ color: "var(--primary)" }}>
                  {streak.currentStreak}d
                </div>
                <div className="dgs-key">{tDash("current")}</div>
              </div>
              <div className="dgs">
                <div className="dgs-val" style={{ color: "var(--xp)" }}>
                  {streak.longestStreak}d
                </div>
                <div className="dgs-key">{tDash("bestStreak")}</div>
              </div>
            </div>
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
                    aria-label={t("streak")}
                  >
                    {/* Grid cells — iterate column-major */}
                    {heatmap.columns.flatMap((col, colIdx) =>
                      col.map((cell, rowIdx) =>
                        cell.date ? (
                          <Tooltip.Root key={`${colIdx}-${rowIdx}`}>
                            <Tooltip.Trigger asChild>
                              <div
                                className={cn(
                                  "cday",
                                  cell.level === 1 && "l1",
                                  cell.level === 2 && "l2",
                                  cell.level === 3 && "l3",
                                  cell.level === 4 && "l4",
                                  cell.isToday && "today"
                                )}
                              />
                            </Tooltip.Trigger>
                            <Tooltip.Portal>
                              <Tooltip.Content
                                className="heatmap-tooltip"
                                sideOffset={6}
                                side="top"
                              >
                                {formatCellTooltip(cell.date, cell.count)}
                                <Tooltip.Arrow className="fill-[var(--card)]" />
                              </Tooltip.Content>
                            </Tooltip.Portal>
                          </Tooltip.Root>
                        ) : (
                          <div
                            key={`${colIdx}-${rowIdx}`}
                            className="cday empty"
                          />
                        )
                      )
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

        {/* ---- RIGHT: Daily Quests ---- */}
        <div className="dash-quests">
          <div className="dash-quests-head">
            <span className="dash-quests-title">{tDash("dailyQuests")}</span>
            <span className="dash-quests-reset">
              {tDash("resetsIn", {
                hours: getHoursUntilReset(questsResetTime),
              })}
            </span>
          </div>

          <div
            ref={questsRef}
            className="dash-quests-list"
            onPointerDown={onQuestsDown}
            onPointerMove={onQuestsMove}
            onPointerUp={onQuestsUp}
            onPointerCancel={onQuestsUp}
          >
            {quests.map((quest) => {
              const IconComp = getQuestIcon(quest.icon);
              return (
                <div
                  key={quest.id}
                  className={cn("dq", quest.completed && "done")}
                >
                  <div className="dq-icon">
                    <IconComp size={16} weight="duotone" />
                  </div>
                  <div className="dq-info">
                    <span className="dq-name">{quest.name}</span>
                    <span className="dq-desc">{quest.description}</span>
                  </div>
                  <div className="dq-reward">
                    <Lightning size={12} weight="fill" />+{quest.xpReward}
                  </div>
                  {quest.completed ? (
                    <div className="dq-check">
                      <CheckCircle size={18} weight="fill" />
                    </div>
                  ) : (
                    <span className="dq-progress-lbl">
                      {quest.currentValue}/{quest.targetValue}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
