import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton matching the SkillChart radar chart section */
export function SkillChartSkeleton() {
  return (
    <section className="glass rounded-2xl p-6">
      <Skeleton className="mb-4 h-6 w-32" />
      <div className="flex h-72 w-full items-center justify-center">
        <Skeleton className="h-52 w-52 rounded-full" />
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-x-6 gap-y-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-20" />
        ))}
      </div>
    </section>
  );
}

/** Skeleton matching the AchievementGrid badge layout */
export function AchievementGridSkeleton() {
  return (
    <section className="glass rounded-2xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center rounded-xl border border-white/5 bg-muted/30 p-3 text-center"
          >
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="mt-2 h-3.5 w-16" />
            <Skeleton className="mt-1 h-3 w-12" />
          </div>
        ))}
      </div>
    </section>
  );
}

/** Skeleton matching the CredentialDisplay card list */
export function CredentialDisplaySkeleton() {
  return (
    <section className="glass rounded-2xl p-6">
      <Skeleton className="mb-4 h-6 w-40" />
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-white/5 bg-muted/20 p-4"
          >
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 flex-shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3.5 w-24" />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3.5 w-16" />
            </div>
            <Skeleton className="mt-3 h-6 w-32 rounded-full" />
          </div>
        ))}
      </div>
    </section>
  );
}

/** Skeleton matching the CourseHistory row list */
export function CourseHistorySkeleton() {
  return (
    <section className="glass rounded-2xl p-6">
      <Skeleton className="mb-4 h-6 w-44" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl border border-white/5 bg-muted/20 p-4"
          >
            <Skeleton className="h-10 w-10 flex-shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3.5 w-16" />
            </div>
            <Skeleton className="h-8 w-12 rounded-full" />
          </div>
        ))}
      </div>
    </section>
  );
}
