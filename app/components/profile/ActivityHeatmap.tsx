'use client';

/**
 * ActivityHeatmap — GitHub-style contribution heatmap.
 * Shows daily activity for a full year (Jan–Dec) with year filter buttons.
 * Integrates all activities: XP, courses, lessons, badges, credentials (cNFTs).
 */

import { useMemo, useState } from 'react';
import type { StreakDay } from '@/context/types/streak';

/** Extra activity events (badges, credentials, etc.) */
export interface ActivityEvent {
    date: string; // YYYY-MM-DD
    type: 'badge' | 'credential' | 'course' | 'lesson' | 'xp';
    value: number; // activity weight
}

interface ActivityHeatmapProps {
    activity: StreakDay[];
    extraEvents?: ActivityEvent[];
    isLoading?: boolean;
    /** Available years to filter — derived from data if not provided */
    availableYears?: number[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Mon', '', 'Wed', '', 'Fri', '', ''];

/** Format date as YYYY-MM-DD in local time (avoids UTC shift from toISOString) */
function localDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

/** Map activity intensity to color */
function getColor(count: number): string {
    if (count === 0) return 'bg-black/5 dark:bg-white/5';
    if (count <= 2) return 'bg-brand-green-emerald/30';
    if (count <= 5) return 'bg-brand-green-emerald/55';
    if (count <= 10) return 'bg-brand-green-emerald/80';
    return 'bg-brand-green-emerald';
}

export function ActivityHeatmap({ activity, extraEvents = [], isLoading, availableYears }: ActivityHeatmapProps) {
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);

    // Derive available years from data + current year
    const years = useMemo(() => {
        if (availableYears && availableYears.length > 0) {
            return [...new Set([...availableYears, currentYear])].sort((a, b) => b - a);
        }
        const yearSet = new Set<number>([currentYear]);
        activity.forEach((d) => {
            const y = parseInt(d.date.split('-')[0], 10);
            if (!isNaN(y)) yearSet.add(y);
        });
        extraEvents.forEach((e) => {
            const y = parseInt(e.date.split('-')[0], 10);
            if (!isNaN(y)) yearSet.add(y);
        });
        return Array.from(yearSet).sort((a, b) => b - a);
    }, [activity, extraEvents, availableYears, currentYear]);

    // Build a map of date -> total activity count for the selected year
    const activityMap = useMemo(() => {
        const map = new Map<string, number>();

        // Streak activity (XP, lessons, courses)
        activity.forEach((day) => {
            if (!day.date.startsWith(String(selectedYear))) return;
            const existing = map.get(day.date) || 0;
            // Any activity day counts as at least 1, plus extra for lessons/courses
            const score = 1 + day.lessonsCompleted + day.coursesCompleted * 3;
            map.set(day.date, existing + score);
        });

        // Extra events (badges, credentials, etc.)
        extraEvents.forEach((ev) => {
            if (!ev.date.startsWith(String(selectedYear))) return;
            const existing = map.get(ev.date) || 0;
            map.set(ev.date, existing + ev.value);
        });

        return map;
    }, [activity, extraEvents, selectedYear]);

    // Generate the grid: full year (Jan 1 to Dec 31)
    const { weeks, monthLabels, activeDays, totalActivities } = useMemo(() => {
        const today = new Date();
        const isCurrentYear = selectedYear === currentYear;
        const w: { date: string; count: number }[][] = [];
        let totalActive = 0;
        let totalAct = 0;

        // Start from Jan 1 of selected year, aligned to Sunday
        const yearStart = new Date(selectedYear, 0, 1);
        const yearEnd = new Date(selectedYear, 11, 31);
        const start = new Date(yearStart);
        start.setDate(start.getDate() - start.getDay()); // Align to Sunday

        // Calculate weeks from start to Dec 31
        const endDate = isCurrentYear && today < yearEnd ? today : yearEnd;
        const diffMs = yearEnd.getTime() - start.getTime();
        const totalWeeks = Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;

        const ml: { label: string; col: number }[] = [];
        let lastMonth = -1;

        for (let week = 0; week < totalWeeks; week++) {
            const days: { date: string; count: number }[] = [];
            for (let day = 0; day < 7; day++) {
                const d = new Date(start);
                d.setDate(d.getDate() + week * 7 + day);

                // Track month labels FIRST (before any continue) — for all year days
                if (day === 0 && d.getFullYear() === selectedYear && d.getMonth() !== lastMonth) {
                    ml.push({ label: MONTHS[d.getMonth()], col: week });
                    lastMonth = d.getMonth();
                }

                // Days after Dec 31
                if (d > yearEnd) {
                    days.push({ date: '', count: -1 });
                    continue;
                }

                // Days before Jan 1 (from Sunday alignment)
                if (d < yearStart) {
                    days.push({ date: '', count: -1 });
                    continue;
                }

                // Future days in current year — show as empty (not hidden)
                if (isCurrentYear && d > today) {
                    const dateStr = localDateStr(d);
                    days.push({ date: dateStr, count: 0 });
                    continue;
                }

                const dateStr = localDateStr(d);
                const count = activityMap.get(dateStr) || 0;
                days.push({ date: dateStr, count });

                if (count > 0) {
                    totalActive++;
                    totalAct += count;
                }
            }
            w.push(days);
        }

        return { weeks: w, monthLabels: ml, activeDays: totalActive, totalActivities: totalAct };
    }, [activityMap, selectedYear, currentYear]);

    if (isLoading) {
        return (
            <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--profile-center-bg)', border: '1px solid var(--profile-center-border)', boxShadow: 'var(--profile-center-shadow)' }}>
                <div className="h-32 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--profile-center-muted-bg)' }} />
            </div>
        );
    }

    return (
        <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--profile-center-bg)', border: '1px solid var(--profile-center-border)', boxShadow: 'var(--profile-center-shadow)' }}>
            {/* Header with year filter */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold font-display" style={{ color: 'var(--profile-center-text)' }}>
                    Activity in {selectedYear}
                </h3>
                <div className="flex items-center gap-1">
                    {years.map((y) => (
                        <button
                            key={y}
                            onClick={() => setSelectedYear(y)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold font-supreme transition-all ${y === selectedYear
                                ? 'bg-brand-green-emerald text-white'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                            style={y !== selectedYear ? { backgroundColor: 'var(--profile-center-muted-bg)' } : undefined}
                        >
                            {y}
                        </button>
                    ))}
                </div>
            </div>

            {/* Heatmap grid */}
            <div className="overflow-x-auto hide-scrollbar">
                <div className="min-w-[720px]">
                    {/* Month labels */}
                    <div className="flex ml-8 mb-1">
                        {monthLabels.map((m, i) => (
                            <span
                                key={`${m.label}-${i}`}
                                className="text-[10px] font-supreme absolute"
                                style={{ left: `${m.col * 14 + 32}px`, position: 'relative', width: 0, color: 'var(--profile-center-sub)' }}
                            >
                                {m.label}
                            </span>
                        ))}
                    </div>

                    <div className="flex gap-0.5">
                        {/* Day labels */}
                        <div className="flex flex-col gap-0.5 mr-1.5 shrink-0">
                            {DAYS.map((d, i) => (
                                <div key={i} className="h-[11px] flex items-center">
                                    <span className="text-[10px] font-supreme w-6 text-right" style={{ color: 'var(--profile-center-sub)' }}>
                                        {d}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Weeks */}
                        {weeks.map((week, wi) => (
                            <div key={wi} className="flex flex-col gap-0.5">
                                {week.map((day, di) => (
                                    <div
                                        key={di}
                                        className={`w-[11px] h-[11px] rounded-[2px] transition-all cursor-pointer hover:brightness-125 hover:scale-150 ${day.count < 0
                                            ? 'opacity-0 pointer-events-none'
                                            : getColor(day.count)
                                            }`}
                                        title={day.date ? `${day.date}: ${day.count} activities` : ''}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 text-[10px] font-supreme" style={{ color: 'var(--profile-center-sub)' }}>
                <div className="flex items-center gap-4">
                    <span>Active Days: {activeDays}</span>
                    <span>Total Activities: {totalActivities}</span>
                </div>
                <div className="flex items-center gap-1">
                    <span>Less</span>
                    <div className="w-[11px] h-[11px] rounded-[2px] bg-black/5 dark:bg-white/5" />
                    <div className="w-[11px] h-[11px] rounded-[2px] bg-brand-green-emerald/20" />
                    <div className="w-[11px] h-[11px] rounded-[2px] bg-brand-green-emerald/40" />
                    <div className="w-[11px] h-[11px] rounded-[2px] bg-brand-green-emerald/70" />
                    <div className="w-[11px] h-[11px] rounded-[2px] bg-brand-green-emerald" />
                    <span>More</span>
                </div>
            </div>
        </div>
    );
}
