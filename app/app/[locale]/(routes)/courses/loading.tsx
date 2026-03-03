/**
 * Courses loading skeleton — shown while the route JS bundle loads.
 * Mirrors the courses page layout: header + filter bar + course card grid.
 */

function Skeleton({ className = '' }: { className?: string }) {
    return (
        <div
            className={`rounded-2xl animate-pulse ${className}`}
            style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
        />
    );
}

export default function CoursesLoading() {
    return (
        <div className="max-w-[1400px] mx-auto min-w-0">
            {/* Header skeleton */}
            <div className="mb-8">
                <div className="h-9 w-72 rounded-lg animate-pulse mb-2" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
                <div className="h-4 w-96 rounded-lg animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />
            </div>

            {/* Search bar skeleton */}
            <Skeleton className="h-12 w-full max-w-md mb-6" />

            {/* Filter bar skeleton */}
            <div className="flex gap-3 mb-8">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-24 rounded-xl" />
                ))}
            </div>

            {/* Course cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-[260px]" />
                ))}
            </div>
        </div>
    );
}
