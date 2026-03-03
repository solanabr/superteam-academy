/**
 * CommunitySkeleton — shimmer loading placeholder for the community thread list.
 * Matches thread card shapes to avoid layout shift.
 */

function SkeletonBlock({ className = '' }: { className?: string }) {
    return (
        <div
            className={`rounded-2xl animate-pulse ${className}`}
            style={{ backgroundColor: 'var(--muted)' }}
        />
    );
}

export function CommunitySkeleton() {
    return (
        <div className="space-y-4">
            {/* Category filter skeleton */}
            <div className="flex gap-2 mb-6">
                {Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonBlock key={i} className="h-10 w-24" />
                ))}
            </div>

            {/* Thread card skeletons */}
            {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonBlock key={i} className="h-[96px]" />
            ))}
        </div>
    );
}
