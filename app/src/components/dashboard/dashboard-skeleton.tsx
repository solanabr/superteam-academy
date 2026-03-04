"use client";

import { CardSkeleton } from "@/components/dashboard/card-skeleton";

export function DashboardSkeleton(): JSX.Element {
  return (
    <div className="container mx-auto space-y-8 p-4 md:p-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <CardSkeleton lines={3} />
        <CardSkeleton lines={3} />
      </div>
      <div>
        <div className="mb-4 h-5 w-40 animate-pulse rounded-none bg-muted" />
        <div className="space-y-3">
          <CardSkeleton lines={1} className="p-3" />
          <CardSkeleton lines={1} className="p-3" />
          <CardSkeleton lines={1} className="p-3" />
        </div>
      </div>
    </div>
  );
}
