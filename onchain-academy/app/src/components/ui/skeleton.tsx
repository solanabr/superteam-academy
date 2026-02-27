import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("skeleton-shimmer rounded-[1px]", className)}
      {...props}
    />
  );
}

export function CourseCardSkeleton() {
  return (
    <div className="rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)]/50 overflow-hidden">
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-[1px]" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <div className="flex justify-between pt-2 border-t border-[var(--c-border-subtle)]">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      <Skeleton className="h-8 w-48 mb-8" />
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-8">
          <div className="bg-[var(--c-bg-card)] border border-[var(--c-border-subtle)] rounded-[2px] p-6 space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-3 w-full rounded-[1px]" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="flex gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="min-w-[280px]">
                  <CourseCardSkeleton />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[var(--c-bg-card)] border border-[var(--c-border-subtle)] rounded-[2px] p-6">
            <Skeleton className="h-4 w-32 mb-4" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-[var(--c-bg-card)] border border-[var(--c-border-subtle)] rounded-[2px] p-5 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-[2px]" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </div>
          <div className="bg-[var(--c-bg-card)] border border-[var(--c-border-subtle)] rounded-[2px] p-5">
            <Skeleton className="h-4 w-28 mb-4" />
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <Skeleton className="h-12 w-12 rounded-[2px]" />
                  <Skeleton className="h-3 w-14" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
