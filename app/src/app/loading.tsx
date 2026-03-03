export default function Loading() {
    return (
        <div className="min-h-screen pt-20 px-4 max-w-5xl mx-auto">
            <div className="animate-pulse space-y-8">
                <div className="h-10 bg-[hsl(var(--muted))] rounded-xl w-1/3"></div>
                <div className="h-4 bg-[hsl(var(--muted))] rounded w-1/2"></div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-10">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-64 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl"></div>
                    ))}
                </div>
            </div>
        </div>
    );
}
