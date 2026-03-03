/**
 * Challenges loading skeleton — shown while the route JS bundle loads.
 * Mirrors the actual challenges page layout: banner + stats + filters + cards.
 */

function Skeleton({ className = '' }: { className?: string }) {
    return (
        <div
            className={`rounded-2xl animate-pulse ${className}`}
            style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
        />
    );
}

export default function ChallengesLoading() {
    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Banner skeleton — matches actual banner dimensions */}
            <Skeleton className="w-full h-[200px] md:h-[280px] rounded-2xl" />

            {/* Stats row skeleton */}
            <div className="flex items-center gap-6">
                <Skeleton className="h-5 w-32 rounded-lg" />
                <div className="w-px h-4 bg-border" />
                <Skeleton className="h-5 w-24 rounded-lg" />
            </div>

            {/* Filter pills skeleton */}
            <div className="flex gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-28 rounded-full" />
                ))}
            </div>

            {/* Challenge cards grid skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-[160px]" />
                ))}
            </div>
        </div>
    );
}
