import { Skeleton } from "@/components/ui/skeleton";

export function LessonSkeleton() {
  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-4">
        <Skeleton className="h-5 w-48" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-1.5 w-24" />
          <Skeleton className="h-5 w-8" />
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-72 shrink-0 flex-col border-r border-border bg-card p-4">
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, mi) => (
              <div key={mi} className="space-y-2">
                <Skeleton className="h-3 w-28" />
                {Array.from({ length: 4 }).map((_, li) => (
                  <Skeleton key={li} className="h-8 w-full rounded-lg" />
                ))}
              </div>
            ))}
          </div>
        </aside>
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}
