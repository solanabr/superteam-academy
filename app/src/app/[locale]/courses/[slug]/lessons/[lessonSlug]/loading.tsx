import { Skeleton } from "@/components/ui/skeleton";

export default function LessonLoading() {
  return (
    <div role="status" aria-busy="true" className="flex min-h-[calc(100vh-4rem)]">
      <div className="hidden w-72 shrink-0 border-r border-border/40 lg:block">
        <div className="space-y-2 p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </div>
      <div className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}
