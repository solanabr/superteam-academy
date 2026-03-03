import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Profile header */}
      <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="flex-1 space-y-2 text-center sm:text-left">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
          <div className="flex justify-center gap-3 sm:justify-start">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Skill chart */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-3">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="mx-auto h-64 w-64 rounded-full" />
          </div>

          {/* Achievement grid */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-3">
            <Skeleton className="h-6 w-36" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
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
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Credentials */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <Skeleton className="h-6 w-32" />
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-border p-3 space-y-2"
              >
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>

          {/* Course history */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <Skeleton className="h-6 w-36" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
