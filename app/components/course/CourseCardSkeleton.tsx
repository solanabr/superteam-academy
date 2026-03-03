/**
 * CourseCardSkeleton — Loading skeleton matching the glass-effect card layout.
 * Rounded inner area placeholder + text skeletons below.
 */
'use client';

export function CourseCardSkeleton() {
    return (
        <div
            className="rounded-[2rem] overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-md ring-1 ring-black/[0.04] dark:ring-white/[0.04] animate-pulse"
            style={{ backgroundColor: 'rgba(200,200,200,0.1)' }}
            aria-hidden="true"
        >
            <div className="p-3.5 sm:p-4 flex flex-col gap-4 sm:gap-5">
                {/* Color area skeleton */}
                <div className="w-full rounded-[1.75rem] sm:rounded-[2rem] bg-muted/30 py-8 sm:py-10 flex flex-col items-center gap-3">
                    <div className="flex items-center justify-between w-full px-5">
                        <div className="h-3 w-20 rounded bg-muted/40" />
                        <div className="h-4 w-10 rounded-full bg-muted/40" />
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-muted/40" />
                </div>

                {/* Title + badges skeleton */}
                <div className="flex flex-col items-center gap-2.5">
                    <div className="h-5 w-3/4 rounded-lg bg-muted/40" />
                    <div className="flex gap-1.5">
                        <div className="h-5 w-20 rounded-full bg-muted/40" />
                        <div className="h-5 w-20 rounded-full bg-muted/40" />
                        <div className="h-5 w-16 rounded-full bg-muted/40" />
                    </div>
                    <div className="h-3.5 w-20 rounded bg-muted/40 mt-1" />
                </div>
            </div>
        </div>
    );
}

export function CourseListSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"
            role="status"
            aria-label="Loading courses"
        >
            {Array.from({ length: count }).map((_, i) => (
                <CourseCardSkeleton key={`course-skeleton-${i}`} />
            ))}
        </div>
    );
}
