import { Skeleton } from "@/components/ui/skeleton";

export default function MainPageLoading() {
  return (
    <div role="status" aria-busy="true" className="flex flex-col">
      {/* Hero skeleton */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <div className="mx-auto max-w-3xl space-y-6">
            <Skeleton className="mx-auto h-12 w-3/4 sm:h-16" />
            <Skeleton className="mx-auto h-6 w-2/3" />
            <Skeleton className="mx-auto h-11 w-40" />
          </div>
        </div>
      </section>

      {/* Features skeleton */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <Skeleton className="mx-auto mb-12 h-8 w-64" />
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border/50 p-6 space-y-4">
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
