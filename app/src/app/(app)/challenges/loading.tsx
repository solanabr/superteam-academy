import { Skeleton } from "@/components/ui/skeleton";

export default function ChallengesLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>

      {/* Info banner skeleton */}
      <div className="mb-6">
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>

      {/* Overview card skeleton */}
      <div className="glass mb-10 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="mt-2 h-10 w-40 rounded-lg" />
      </div>

      {/* Past challenges */}
      <Skeleton className="mb-4 h-7 w-40" />
      <div className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass rounded-xl p-4 space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-3.5 w-16" />
            </div>
            <Skeleton className="h-5 w-3/4" />
            <div className="flex gap-1.5">
              <Skeleton className="h-4 w-14 rounded-full" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Speed leaderboard skeleton */}
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-7 w-44" />
      </div>
      <div className="glass rounded-xl overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 border-b border-border/50 px-4 py-3 last:border-b-0"
          >
            <Skeleton className="h-5 w-6" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="ml-auto h-5 w-14" />
            <Skeleton className="h-5 w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}
