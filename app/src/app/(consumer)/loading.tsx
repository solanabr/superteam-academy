import { Skeleton } from "@/components/ui/skeleton"

export default function ConsumerLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-4 h-10 w-full max-w-2xl" />
          <Skeleton className="mt-3 h-10 w-4/5 max-w-xl" />
          <div className="mt-6 flex flex-wrap gap-3">
            <Skeleton className="h-11 w-36" />
            <Skeleton className="h-11 w-36" />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-9 w-52" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="rounded-xl border border-border bg-card p-5">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="mt-4 h-5 w-32" />
                <Skeleton className="mt-2 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-3/4" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
