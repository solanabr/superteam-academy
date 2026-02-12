import { Skeleton } from '@/components/ui/skeleton';

export default function TeachDashboardLoading() {
  return (
    <div className="container py-10">
      <Skeleton className="mb-8 h-10 w-56" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-6">
            <Skeleton className="mb-2 h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="mt-8">
        <Skeleton className="mb-4 h-6 w-32" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="mb-4 rounded-xl border p-6">
            <Skeleton className="mb-2 h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        ))}
      </div>
    </div>
  );
}
