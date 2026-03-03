/**
 * Leaderboard loading skeleton — shown while the route JS bundle loads.
 * Mirrors the leaderboard page: header + top-3 podium + table rows.
 */

function Skeleton({ className = '' }: { className?: string }) {
    return (
        <div
            className={`rounded-2xl animate-pulse ${className}`}
            style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
        />
    );
}

export default function LeaderboardLoading() {
    return (
        <div className="max-w-[1400px] mx-auto min-w-0">
            {/* Header skeleton */}
            <div className="mb-8">
                <div className="h-9 w-48 rounded-lg animate-pulse mb-2" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
                <div className="h-4 w-72 rounded-lg animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />
            </div>

            {/* Podium skeleton — top 3 */}
            <div className="flex justify-center gap-6 mb-10">
                <Skeleton className="h-[140px] w-[160px] rounded-3xl" />
                <Skeleton className="h-[170px] w-[180px] rounded-3xl" />
                <Skeleton className="h-[140px] w-[160px] rounded-3xl" />
            </div>

            {/* Table rows skeleton */}
            <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-[56px]" />
                ))}
            </div>
        </div>
    );
}
