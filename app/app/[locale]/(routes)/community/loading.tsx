/**
 * Community loading skeleton — shown while the route JS bundle loads.
 * Mirrors the actual community page layout: banner + filters + thread list.
 */

function Skeleton({ className = '' }: { className?: string }) {
    return (
        <div
            className={`rounded-2xl animate-pulse ${className}`}
            style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
        />
    );
}

export default function CommunityLoading() {
    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Banner skeleton — matches actual banner dimensions */}
            <Skeleton className="w-full h-[200px] md:h-[280px] rounded-2xl" />

            {/* Filter row + New Thread button skeleton */}
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-9 w-24 rounded-full" />
                    ))}
                </div>
                <Skeleton className="h-9 w-32 rounded-full" />
            </div>

            {/* Thread cards skeleton */}
            <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-[88px]" />
                ))}
            </div>
        </div>
    );
}
