import { Skeleton } from "@/components/ui/skeleton";

export function CourseDetailSkeleton() {
  return (
    <div>
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6 lg:py-14">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-2/3" />
              <div className="flex items-center gap-3 mt-6">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="flex gap-6 mt-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-20" />
                ))}
              </div>
            </div>
            <div className="lg:row-start-1 lg:col-start-3">
              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <Skeleton className="h-8 w-16 mx-auto" />
                <Skeleton className="h-3 w-40 mx-auto" />
                <Skeleton className="h-10 w-full rounded-md" />
                <div className="space-y-3 pt-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-40" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Modules */}
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        <Skeleton className="h-7 w-40 mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
