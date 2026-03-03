import { Skeleton } from "@/components/ui/skeleton";

export default function PublicProfileLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Back link */}
      <Skeleton className="mb-6 h-5 w-28" />

      {/* Profile header */}
      <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="flex-1 space-y-2 text-center sm:text-left">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
          <div className="flex justify-center gap-3 sm:justify-start">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-4 text-center space-y-2"
          >
            <Skeleton className="mx-auto h-8 w-16" />
            <Skeleton className="mx-auto h-4 w-20" />
          </div>
        ))}
      </div>

      {/* Achievements section */}
      <div className="mb-8 rounded-xl border border-border bg-card p-6 space-y-3">
        <Skeleton className="h-6 w-36" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-border p-3 space-y-2"
            >
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* Completed courses */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-3">
        <Skeleton className="h-6 w-44" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg border border-border p-3"
          >
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
