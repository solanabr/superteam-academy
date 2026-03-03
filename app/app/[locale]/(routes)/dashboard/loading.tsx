/**
 * Dashboard loading skeleton — shown by Next.js while the
 * route JS bundle loads and the page component mounts.
 */

function SkeletonBlock({ className = '' }: { className?: string }) {
    return (
        <div
            className={`rounded-3xl animate-pulse ${className}`}
            style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
        />
    );
}

export default function DashboardLoading() {
    return (
        <div className="max-w-[1400px] mx-auto min-w-0">
            {/* Welcome skeleton */}
            <div className="mb-6">
                <div className="h-7 w-64 rounded-lg animate-pulse mb-2" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
                <div className="h-4 w-44 rounded-lg animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />
            </div>

            {/* Two-column layout */}
            <div className="flex gap-6 min-w-0">
                {/* Left column */}
                <div className="flex-1 min-w-0 space-y-6">
                    {/* 4 stat card skeletons */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <SkeletonBlock key={i} className="h-[120px]" />
                        ))}
                    </div>

                    {/* Courses + Credentials skeletons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SkeletonBlock className="h-[240px]" />
                        <SkeletonBlock className="h-[240px]" />
                    </div>

                    {/* Community skeleton */}
                    <SkeletonBlock className="h-[220px]" />
                </div>

                {/* Right column */}
                <div className="hidden lg:block w-80 shrink-0 space-y-6">
                    <SkeletonBlock className="h-[320px]" />
                    <SkeletonBlock className="h-[220px]" />
                </div>
            </div>
        </div>
    );
}
