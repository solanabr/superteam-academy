/**
 * CourseFiltersSkeleton — Skeleton matching the new horizontal filter bar layout.
 */
'use client';

export function CourseFiltersSkeleton() {
    return (
        <div className="mb-6" aria-busy="true" aria-label="Loading filters">
            {/* Bar skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl bg-card border border-border shadow-md ring-1 ring-black/[0.04] dark:ring-white/[0.04] px-3 py-2.5 sm:px-4 sm:py-2">
                {/* Left: level dropdown + chips */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="h-7 w-28 rounded-lg bg-muted/40 animate-pulse shrink-0" />
                    <div className="w-px h-5 bg-border/50 shrink-0 hidden sm:block" />
                    <div className="flex gap-1.5 flex-wrap">
                        {[40, 90, 60, 50, 70, 50, 55, 80, 85, 80].map((w, i) => (
                            <div
                                key={`tc-${i}`}
                                className="h-[22px] sm:h-[26px] rounded-full bg-muted/40 animate-pulse"
                                style={{ width: w }}
                            />
                        ))}
                    </div>
                </div>

                {/* Right: status + sort */}
                <div className="flex items-center gap-2 shrink-0">
                    <div className="h-7 w-20 rounded-lg bg-muted/40 animate-pulse" />
                    <div className="h-7 w-16 rounded-lg bg-muted/40 animate-pulse" />
                </div>
            </div>

            {/* Count skeleton */}
            <div className="h-3.5 w-24 rounded bg-muted/40 animate-pulse mt-2 ml-1" />
        </div>
    );
}
