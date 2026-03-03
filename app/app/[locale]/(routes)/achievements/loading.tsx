/**
 * Achievements loading skeleton — shown while the route JS bundle loads.
 * Mirrors the actual achievements page layout: banner + badges section + credentials.
 */

function Skeleton({ className = '' }: { className?: string }) {
    return (
        <div
            className={`rounded-2xl animate-pulse ${className}`}
            style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
        />
    );
}

export default function AchievementsLoading() {
    return (
        <div className="max-w-7xl mx-auto space-y-10">
            {/* Banner skeleton — matches actual banner dimensions */}
            <Skeleton className="w-full h-[200px] md:h-[280px] rounded-2xl" />

            {/* Badges section skeleton */}
            <div className="rounded-2xl border border-border/30 p-5 sm:p-6 space-y-5" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                <Skeleton className="h-6 w-24 rounded-lg" />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-[180px]" />
                    ))}
                </div>
            </div>

            {/* Credentials section skeleton */}
            <div className="rounded-2xl border border-border/30 p-5 sm:p-6 space-y-4" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                <Skeleton className="h-6 w-36 rounded-lg" />
                <Skeleton className="h-4 w-64 rounded-lg" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <Skeleton key={i} className="h-[100px]" />
                    ))}
                </div>
            </div>
        </div>
    );
}
