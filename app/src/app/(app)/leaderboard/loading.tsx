import { Skeleton } from "@/components/ui/skeleton";

export default function LeaderboardLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-8 text-center space-y-2">
        <Skeleton className="mx-auto h-10 w-48" />
        <Skeleton className="mx-auto h-5 w-64" />
      </div>

      {/* Time filter tabs */}
      <div className="mb-8 flex justify-center gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-lg" />
        ))}
      </div>

      {/* Podium */}
      <div className="mb-10 flex items-end justify-center gap-4">
        {/* 2nd place */}
        <div className="flex flex-col items-center space-y-2">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-24 w-24 rounded-t-lg" />
        </div>
        {/* 1st place */}
        <div className="flex flex-col items-center space-y-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-32 w-28 rounded-t-lg" />
        </div>
        {/* 3rd place */}
        <div className="flex flex-col items-center space-y-2">
          <Skeleton className="h-14 w-14 rounded-full" />
          <Skeleton className="h-4 w-18" />
          <Skeleton className="h-16 w-24 rounded-t-lg" />
        </div>
      </div>

      {/* Rankings list */}
      <div className="space-y-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-lg border border-border bg-card p-4"
          >
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="text-right space-y-1">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
