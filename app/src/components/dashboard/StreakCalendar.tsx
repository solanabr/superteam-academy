"use client";

type Props = {
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: string | null;
    isLoading?: boolean;
};

const MILESTONE_DAYS = [7, 30, 100];

function getMilestoneAtStreak(streak: number): number | null {
    return MILESTONE_DAYS.find((m) => streak >= m && streak < (MILESTONE_DAYS[MILESTONE_DAYS.indexOf(m) + 1] ?? Infinity)) ?? null;
}

export function StreakCalendar({ currentStreak, longestStreak, lastActivityDate, isLoading }: Props) {
    if (isLoading) {
        return (
            <section className="glass-panel rounded-xl p-6 border border-white/5 space-y-4 animate-pulse">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="size-5 rounded-full bg-white/10" />
                        <div className="h-4 w-32 bg-white/10 rounded" />
                    </div>
                    <div className="h-4 w-40 bg-white/10 rounded" />
                </div>

                <div className="flex gap-1 overflow-x-auto no-scrollbar pb-2">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="flex flex-col gap-1">
                            {Array.from({ length: 7 }).map((_, j) => (
                                <div key={j} className="w-3.5 h-3.5 rounded-sm bg-white/5" />
                            ))}
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                    <div className="flex gap-4">
                        <div className="h-3 w-20 bg-white/5 rounded" />
                        <div className="h-3 w-20 bg-white/5 rounded" />
                    </div>
                    <div className="h-3 w-32 bg-white/5 rounded" />
                </div>
            </section>
        );
    }
    // Build an 84-day (12 weeks) rolling window ending today
    const DAYS = 84;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Determine active day indices (from today backwards by currentStreak days)
    const activeDays = new Set<number>();
    if (currentStreak > 0 && lastActivityDate) {
        const lastActive = new Date(lastActivityDate);
        lastActive.setHours(0, 0, 0, 0);
        const lastActiveDaysAgo = Math.round((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
        // Streak is consecutive days ending at lastActive
        for (let i = lastActiveDaysAgo; i < lastActiveDaysAgo + currentStreak; i++) {
            activeDays.add(i);
        }
    }

    const grid: { daysAgo: number; label: string; isToday: boolean; isActive: boolean }[] = [];
    for (let i = DAYS - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        grid.push({
            daysAgo: i,
            label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            isToday: i === 0,
            isActive: activeDays.has(i),
        });
    }

    // Month labels for grid columns (rough)
    const weeks = Array.from({ length: 12 }, (_, wi) => grid.slice(wi * 7, wi * 7 + 7));
    const nextMilestone = MILESTONE_DAYS.find((m) => m > currentStreak);
    const currentMilestone = getMilestoneAtStreak(currentStreak);

    return (
        <section className="glass-panel rounded-xl p-6 border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined notranslate text-rust text-xl">local_fire_department</span>
                    <h3 className="text-sm font-display font-semibold text-white uppercase tracking-widest">
                        Streak Calendar
                    </h3>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono text-text-muted">
                    <span>
                        <span className="text-white font-bold">{currentStreak}</span> day streak
                    </span>
                    <span>
                        Best: <span className="text-solana font-bold">{longestStreak}</span>
                    </span>
                </div>
            </div>

            {/* Calendar grid */}
            <div className="overflow-x-auto no-scrollbar">
                <div className="flex gap-1 min-w-max">
                    {weeks.map((week, wi) => (
                        <div key={wi} className="flex flex-col gap-1">
                            {week.map((day) => (
                                <div
                                    key={day.daysAgo}
                                    title={day.label}
                                    className={`w-3.5 h-3.5 rounded-sm transition-all duration-300 ${day.isToday
                                        ? "ring-1 ring-solana/60 " + (day.isActive ? "bg-solana" : "bg-white/10")
                                        : day.isActive
                                            ? "bg-solana/70 hover:bg-solana cursor-default"
                                            : "bg-white/5 hover:bg-white/10 cursor-default"
                                        }`}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend + Milestone */}
            <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-3 text-[10px] font-mono text-text-muted">
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-sm bg-white/5 inline-block" /> No activity
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-sm bg-solana/70 inline-block" /> Active day
                    </span>
                </div>

                {/* Milestone badge or next milestone */}
                {currentMilestone ? (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-rust/10 border border-rust/20">
                        <span className="material-symbols-outlined notranslate text-rust text-[14px]">military_tech</span>
                        <span className="text-[10px] font-mono font-bold text-rust uppercase tracking-widest">
                            {currentMilestone}-Day Streak!
                        </span>
                    </div>
                ) : nextMilestone ? (
                    <span className="text-[10px] font-mono text-text-muted">
                        <span className="text-white">{nextMilestone - currentStreak}</span> days to {nextMilestone}-day milestone 🔥
                    </span>
                ) : null}
            </div>
        </section>
    );
}
