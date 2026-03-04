'use client';

/**
 * StreaksCalendar — a compact calendar visual for the Features section
 * showing fire 🔥 emojis on completed streak days.
 * Custom implementation for clean layout control.
 */

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/* February 2026 starts on Sunday (getDay() === 0).
   We shift to Mon-start: Sunday becomes index 6. */
const FEB_2026_DAYS = 28;
const FIRST_DAY_OFFSET = 6; // Sunday → position 6 in Mon-start grid

/* Streak: days 1–20 are active */
const STREAK_END = 20;
const TODAY = 27;

/* Build the grid: offset blanks + 28 day cells */
type Cell = { day: number; isStreak: boolean; isToday: boolean } | null;
const cells: Cell[] = [];
for (let i = 0; i < FIRST_DAY_OFFSET; i++) cells.push(null);
for (let d = 1; d <= FEB_2026_DAYS; d++) {
    cells.push({ day: d, isStreak: d <= STREAK_END, isToday: d === TODAY });
}
/* Pad to fill last row */
while (cells.length % 7 !== 0) cells.push(null);

export function StreaksCalendar() {
    return (
        <div className="w-full max-w-[280px] rounded-xl border border-black/15 bg-[#d4960a] dark:bg-[#3d2b0a]">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 pb-2 pt-3">
                <span className="text-lg leading-none" role="img" aria-label="fire">
                    🔥
                </span>
                <span className="font-array text-sm font-bold text-foreground">
                    20 day streak!
                </span>
                <span className="ml-auto font-supreme text-[10px] font-medium text-foreground">
                    Feb 2026
                </span>
            </div>

            {/* Divider */}
            <div className="mx-3 border-t border-black/15 dark:border-white/15" />

            {/* Calendar grid */}
            <div className="px-3 pb-3 pt-2">
                {/* Weekday headers */}
                <div className="mb-1.5 grid grid-cols-7 gap-1">
                    {WEEKDAYS.map((wd) => (
                        <span
                            key={wd}
                            className="text-center font-supreme text-[9px] font-semibold uppercase tracking-wider text-[#1b3320] dark:text-brand-cream/70"
                        >
                            {wd}
                        </span>
                    ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 gap-1">
                    {cells.map((cell, i) => (
                        <div
                            key={i}
                            className="flex aspect-square items-center justify-center rounded-md"
                        >
                            {cell === null ? null : cell.isStreak ? (
                                <span
                                    className="text-sm leading-none sm:text-base"
                                    role="img"
                                    aria-label={`Day ${cell.day} — streak`}
                                >
                                    🔥
                                </span>
                            ) : (
                                <span
                                    className={`font-supreme text-[11px] font-semibold ${cell.isToday
                                        ? 'flex h-6 w-6 items-center justify-center rounded-full bg-brand-green-emerald text-white'
                                        : 'text-[#1b3320] dark:text-brand-cream/60'
                                        }`}
                                >
                                    {cell.day}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
