/**
 * Profile loading skeleton — shown while the route JS bundle loads.
 * Mirrors the profile page: avatar/header + stats + activity sections.
 */

function Skeleton({ className = '' }: { className?: string }) {
    return (
        <div
            className={`rounded-2xl animate-pulse ${className}`}
            style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
        />
    );
}

export default function ProfileLoading() {
    return (
        <div className="max-w-[1400px] mx-auto min-w-0">
            {/* Profile header skeleton */}
            <div className="flex items-center gap-5 mb-8">
                {/* Avatar */}
                <div
                    className="w-20 h-20 rounded-full animate-pulse shrink-0"
                    style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                />
                <div className="flex-1">
                    <div className="h-7 w-48 rounded-lg animate-pulse mb-2" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
                    <div className="h-4 w-32 rounded-lg animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />
                </div>
            </div>

            {/* Stats row skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-[90px] rounded-3xl" />
                ))}
            </div>

            {/* Content sections skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-[300px]" />
                <Skeleton className="h-[300px]" />
            </div>
        </div>
    );
}
