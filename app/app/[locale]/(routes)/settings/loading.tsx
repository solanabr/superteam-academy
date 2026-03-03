/**
 * Settings loading skeleton — shown while the route JS bundle loads.
 * Mirrors the settings page: title + tab bar + content card.
 */

function Skeleton({ className = '' }: { className?: string }) {
    return (
        <div
            className={`animate-pulse ${className}`}
            style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
        />
    );
}

export default function SettingsLoading() {
    return (
        <div className="max-w-[700px] mx-auto space-y-5">
            {/* Title skeleton */}
            <div className="h-8 w-40 rounded-lg animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />

            {/* Tab bar skeleton */}
            <div className="flex gap-1 p-1 rounded-2xl" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="flex-1 h-10 rounded-xl" />
                ))}
            </div>

            {/* Content card skeleton */}
            <div className="rounded-2xl p-6 space-y-5" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {/* Avatar + name row */}
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-40 rounded-lg" />
                        <Skeleton className="h-4 w-28 rounded-lg" />
                    </div>
                </div>

                {/* Form fields skeleton */}
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="h-3 w-20 rounded" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                    </div>
                ))}

                {/* Save button skeleton */}
                <Skeleton className="h-11 w-32 rounded-xl mt-4" />
            </div>
        </div>
    );
}
