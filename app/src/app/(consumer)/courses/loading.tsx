import { Skeleton } from "@/components/ui/skeleton"

export default function CoursesLoading() {
  return (
    <div className="max-w-6xl mx-auto my-10 space-y-8">
      <div>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-2 h-4 w-40" />
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <Skeleton className="h-10 flex-1 min-w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, idx) => (
          <Skeleton key={idx} className="h-8 w-24 rounded-full" />
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="rounded-xl border border-border bg-card overflow-hidden">
            <Skeleton className="h-36 w-full rounded-none" />
            <div className="p-5">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-4/5" />
              <div className="mt-4 flex gap-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="mt-5 h-9 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

