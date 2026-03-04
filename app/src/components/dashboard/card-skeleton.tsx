"use client";

import { cn } from "@/lib/utils";

type CardSkeletonProps = {
  className?: string;
  lines?: number;
};

export function CardSkeleton({
  className,
  lines = 2,
}: CardSkeletonProps): JSX.Element {
  return (
    <div
      className={cn(
        "rounded-none border-2 border-border bg-card p-5 shadow-none",
        className,
      )}
    >
      <div className="h-4 w-24 animate-pulse rounded-none bg-muted" />
      <div className="mt-3 h-8 w-20 animate-pulse rounded-none bg-muted" />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="mt-2 h-2 w-full animate-pulse rounded-none bg-muted last:max-w-[80%]"
        />
      ))}
    </div>
  );
}
