import { Skeleton } from "@/components/ui/skeleton";

export default function OnboardingLoading() {
  return (
    <div className="min-h-[80vh]">
      {/* Header skeleton */}
      <div className="border-b border-border bg-card/50">
        <div className="mx-auto max-w-3xl px-4 py-6 text-center sm:px-6">
          <Skeleton className="mx-auto h-9 w-64" />
          <Skeleton className="mx-auto mt-2 h-5 w-80" />
        </div>
      </div>

      {/* Quiz skeleton */}
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Progress bar */}
        <div className="mb-10">
          <div className="mb-3 flex items-center justify-between">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-6 w-6 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>

        {/* Question */}
        <div className="mx-auto max-w-2xl text-center">
          <Skeleton className="mx-auto h-8 w-72" />
          <Skeleton className="mx-auto mt-2 h-5 w-56" />
        </div>

        {/* Options grid */}
        <div className="mx-auto mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
