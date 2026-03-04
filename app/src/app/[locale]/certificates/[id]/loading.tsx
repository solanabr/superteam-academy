import { Skeleton } from "@/components/ui/skeleton";

export default function CertificateLoading() {
  return (
    <div role="status" aria-busy="true" className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-xl border border-border/50 p-8 space-y-6 text-center">
        {/* Certificate image placeholder */}
        <Skeleton className="mx-auto h-64 w-full max-w-md rounded-lg" />
        {/* Title */}
        <Skeleton className="mx-auto h-7 w-64" />
        {/* Details */}
        <div className="mx-auto max-w-sm space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4 mx-auto" />
        </div>
        {/* Actions */}
        <div className="flex justify-center gap-3 pt-4">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-36" />
        </div>
      </div>
    </div>
  );
}
