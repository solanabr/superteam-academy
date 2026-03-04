"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams } from "next/navigation";

function ContentLessonSkeleton() {
  return (
    <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col overflow-hidden px-3 py-3 sm:px-5 sm:py-4">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
        <div className="shrink-0 border-b border-border bg-muted/40 px-6 py-4 sm:px-8">
          <Skeleton className="h-3.5 w-48" />
          <Skeleton className="mt-2 h-8 w-3/4" />
        </div>

        <div className="min-h-0 flex-1 overflow-hidden px-6 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-[65ch] space-y-3">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-[92%]" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-[88%]" />
            <Skeleton className="h-5 w-[70%]" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-[95%]" />
            <Skeleton className="h-5 w-[76%]" />
          </div>
        </div>

        <div className="shrink-0 border-t border-border bg-muted/40 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-24 rounded-md" />
              <Skeleton className="h-8 w-28 rounded-md" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-20 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChallengeLessonSkeleton() {
  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex w-[38%] flex-col border-r border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="mt-2 h-5 w-3/4" />
        </div>
        <div className="flex-1 space-y-3 px-5 py-4">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-5/6" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-4/5" />
          <Skeleton className="h-3.5 w-2/3" />
          <div className="!mt-5 rounded-md border border-primary/20 bg-primary/5 p-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-1.5 h-3 w-48" />
          </div>
        </div>
        <div className="border-t border-border px-5 py-3">
          <Skeleton className="h-8 w-full rounded-md" />
          <div className="mt-2.5 flex justify-between">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col bg-[var(--editor-bg,#161e18)]">
        <div className="flex h-9 items-center justify-between border-b border-[var(--editor-border)] px-3">
          <div className="flex gap-3">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-6 w-20 rounded-sm" />
        </div>
        <div className="flex h-8 border-b border-[var(--editor-border)] px-2">
          <Skeleton className="my-1.5 h-4 w-16" />
        </div>
        <div className="flex-1 space-y-2 p-4">
          <Skeleton className="h-3 w-32 bg-muted/30" />
          <Skeleton className="h-3 w-48 bg-muted/30" />
          <Skeleton className="h-3 w-20 bg-muted/30" />
          <Skeleton className="h-3 w-56 bg-muted/30" />
          <Skeleton className="h-3 w-40 bg-muted/30" />
          <Skeleton className="h-3 w-36 bg-muted/30" />
          <Skeleton className="h-3 w-24 bg-muted/30" />
          <Skeleton className="h-3 w-52 bg-muted/30" />
        </div>
      </div>
    </div>
  );
}

export default function LessonLoading() {
  const searchParams = useSearchParams();
  const lessonType = searchParams.get("type");

  return (
    <main className="flex h-[calc(100dvh-64px)] w-full flex-col overflow-hidden">
      {/* Breadcrumb strip */}
      <div className="shrink-0 border-b border-border bg-muted/30 px-4 py-2 sm:px-6">
        <Skeleton className="h-3.5 w-80" />
      </div>

      {lessonType === "content" ? (
        <ContentLessonSkeleton />
      ) : (
        <ChallengeLessonSkeleton />
      )}
    </main>
  );
}
