import { Skeleton } from "@/components/ui/skeleton";

export function LeaderboardSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:px-6 lg:py-12 space-y-6">
      <Skeleton className="h-10 w-48 mb-2" />
      <Skeleton className="h-5 w-72" />
      {/* Table header */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center gap-4 px-5 py-3 border-b border-border">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16 ml-auto" />
          <Skeleton className="h-4 w-16" />
        </div>
        {/* Rows */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-5 py-3 border-b border-border last:border-0"
          >
            <Skeleton className="h-5 w-8" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-16 ml-auto" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
