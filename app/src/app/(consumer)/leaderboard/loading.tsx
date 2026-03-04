import { Skeleton } from "@/components/ui/skeleton"

export default function LeaderboardLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center">
        <Skeleton className="mx-auto h-14 w-14 rounded-2xl" />
        <Skeleton className="mx-auto mt-4 h-8 w-44" />
        <Skeleton className="mx-auto mt-2 h-4 w-72" />
        <Skeleton className="mx-auto mt-3 h-9 w-36 rounded-full" />
      </div>

      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />

        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-36 w-full rounded-xl" />
        </div>

        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-5 w-8" />
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="space-y-2 text-right">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-8" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

