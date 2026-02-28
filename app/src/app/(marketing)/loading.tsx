import { Skeleton } from "@/components/ui/skeleton";

export default function MarketingLoading() {
  return (
    <div className="flex flex-col">
      {/* Hero section skeleton */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background to-card py-20 sm:py-28 lg:py-36">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <Skeleton className="mx-auto h-7 w-40 rounded-full" />
          <Skeleton className="mx-auto mt-6 h-12 w-[36rem] max-w-full" />
          <Skeleton className="mx-auto mt-3 h-12 w-[28rem] max-w-full" />
          <Skeleton className="mx-auto mt-6 h-6 w-[32rem] max-w-full" />
          <div className="mt-10 flex items-center justify-center gap-4">
            <Skeleton className="h-12 w-44 rounded-xl" />
            <Skeleton className="h-12 w-40 rounded-xl" />
          </div>
        </div>
      </section>

      {/* Stats row skeleton */}
      <section className="border-y border-border bg-card/50 py-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-8 px-4 sm:gap-16">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </section>

      {/* Learning paths skeleton */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Skeleton className="mx-auto h-9 w-64" />
          <Skeleton className="mx-auto mt-3 h-5 w-96 max-w-full" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>

      {/* Featured courses skeleton */}
      <section className="bg-card/30 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Skeleton className="mx-auto h-9 w-56" />
          <Skeleton className="mx-auto mt-3 h-5 w-80 max-w-full" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-border bg-card"
              >
                <Skeleton className="h-44 w-full rounded-none" />
                <div className="space-y-3 p-5">
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid skeleton */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Skeleton className="mx-auto h-9 w-72" />
          <Skeleton className="mx-auto mt-3 h-5 w-64" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <Skeleton className="h-12 w-12 rounded-xl" />
                <Skeleton className="mt-4 h-6 w-40" />
                <Skeleton className="mt-2 h-4 w-full" />
                <Skeleton className="mt-1 h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
