import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton matching the CourseCard layout: thumbnail, badges, title, description, stats, progress bar */
export function CourseCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card">
      {/* Thumbnail */}
      <Skeleton className="h-40 w-full rounded-t-2xl rounded-b-none" />

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <Skeleton className="h-5 w-3/4" />
        <div className="mt-2 space-y-1.5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-3.5 w-12" />
          </div>
          <Skeleton className="h-3.5 w-14" />
        </div>

        {/* Progress bar */}
        <Skeleton className="mt-3 h-1.5 w-full rounded-full" />

        <div className="mt-3 flex items-center justify-between">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3.5 w-20 opacity-0" />
        </div>
      </div>
    </div>
  );
}

export interface CourseGridSkeletonProps {
  /** Number of skeleton cards to display (default: 6) */
  count?: number;
}

/** Skeleton matching the CourseGrid 3-column layout */
export function CourseGridSkeleton({ count = 6 }: CourseGridSkeletonProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Skeleton matching a single enrolled course row on the dashboard */
export function EnrolledCourseSkeleton() {
  return (
    <div className="glass flex items-center gap-4 rounded-xl p-4">
      <Skeleton className="h-12 w-12 flex-shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-3.5 w-12" />
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-14" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
      <Skeleton className="h-5 w-5 flex-shrink-0" />
    </div>
  );
}

/** Skeleton for the module list accordion on course detail page */
export function ModuleListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-20" />
          </div>
          {i === 0 && (
            <div className="mt-3 space-y-2 border-t border-border pt-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3 py-1.5">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="ml-auto h-3.5 w-12" />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
