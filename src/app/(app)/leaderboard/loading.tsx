import { Skeleton } from '@/components/ui/skeleton';

export default function LeaderboardLoading() {
  return (
    <div className="min-h-screen">
      <div className="border-b border-border/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 text-center">
          <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
          <Skeleton className="h-9 w-52 mx-auto mb-2" />
          <Skeleton className="h-4 w-80 mx-auto" />
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-10 w-full max-w-md mx-auto mb-6" />
        <div className="grid grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border/50 p-6 text-center">
              <Skeleton className="h-16 w-16 rounded-full mx-auto mb-3" />
              <Skeleton className="h-4 w-20 mx-auto mb-2" />
              <Skeleton className="h-6 w-16 mx-auto" />
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-border/50 divide-y divide-border/40">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
