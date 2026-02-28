import { Skeleton } from "@/components/ui/skeleton";

export default function CertificateLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Back link */}
      <Skeleton className="mb-8 h-5 w-36" />

      {/* Certificate card */}
      <div className="rounded-2xl border-2 border-border bg-card p-8 space-y-6">
        {/* Certificate header */}
        <div className="text-center space-y-3">
          <Skeleton className="mx-auto h-16 w-16 rounded-full" />
          <Skeleton className="mx-auto h-8 w-64" />
          <Skeleton className="mx-auto h-5 w-48" />
        </div>

        {/* Divider */}
        <Skeleton className="h-px w-full" />

        {/* Certificate details */}
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <Skeleton className="mx-auto h-7 w-72" />
            <Skeleton className="mx-auto h-4 w-40" />
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="text-center space-y-1">
                <Skeleton className="mx-auto h-3 w-16" />
                <Skeleton className="mx-auto h-5 w-24" />
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <Skeleton className="h-px w-full" />

        {/* On-chain details */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-40" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-48" />
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Skeleton className="h-10 w-36 rounded-lg" />
        <Skeleton className="h-10 w-36 rounded-lg" />
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>
    </div>
  );
}
