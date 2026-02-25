import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton matching the HeaderStats compact bar in the header */
export function HeaderStatsSkeleton() {
  return (
    <div className="hidden items-center gap-2.5 rounded-lg border border-border/50 bg-muted/30 px-2.5 py-1.5 xl:flex">
      <Skeleton className="h-5 w-5 rounded-full" />
      <div className="h-4 w-px bg-border" />
      <Skeleton className="h-4 w-14" />
      <div className="h-4 w-px bg-border" />
      <Skeleton className="h-4 w-10" />
      <div className="h-4 w-px bg-border" />
      <Skeleton className="h-4 w-8" />
    </div>
  );
}

/** Skeleton for the activity calendar 30-day grid */
export function ActivityCalendarSkeleton() {
  return (
    <div className="grid grid-cols-7 gap-1">
      {Array.from({ length: 28 }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-4 rounded-sm" />
      ))}
    </div>
  );
}

/** Skeleton matching a dashboard achievement cell */
export function AchievementCellSkeleton() {
  return (
    <div className="glass flex flex-col items-center rounded-xl p-3 text-center">
      <Skeleton className="h-10 w-10 rounded-full" />
      <Skeleton className="mt-2 h-3.5 w-14" />
      <Skeleton className="mt-1 h-3 w-10" />
    </div>
  );
}

/** Skeleton for leaderboard podium + table during filter change */
export function LeaderboardContentSkeleton() {
  return (
    <div className="space-y-8">
      {/* Podium */}
      <div className="flex items-end justify-center gap-4 sm:gap-8">
        {/* 2nd place */}
        <div className="flex flex-col items-center space-y-2">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-28 w-24 rounded-t-lg" />
        </div>
        {/* 1st place */}
        <div className="flex flex-col items-center space-y-2">
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-36 w-24 rounded-t-lg" />
        </div>
        {/* 3rd place */}
        <div className="flex flex-col items-center space-y-2">
          <Skeleton className="h-14 w-14 rounded-full" />
          <Skeleton className="h-4 w-18" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-24 w-24 rounded-t-lg" />
        </div>
      </div>

      {/* Table */}
      <div className="glass overflow-hidden rounded-xl">
        <div className="border-b border-white/5 px-4 py-3 sm:px-6">
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <div className="divide-y divide-white/5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 sm:px-6">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-4 w-14" />
              <Skeleton className="hidden h-4 w-10 sm:block" />
              <Skeleton className="h-4 w-10" />
            </div>
          ))}
        </div>
      </div>

      {/* User summary */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3.5 w-40" />
          </div>
        </div>
      </div>
    </div>
  );
}
