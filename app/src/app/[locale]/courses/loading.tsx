import { Loader2 } from "lucide-react";

export default function CoursesLoading() {
  return (
    <div className="min-h-[60vh] py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="h-8 w-48 rounded bg-[var(--c-bg-inset)] animate-pulse mb-8" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] p-6"
            >
              <div className="h-4 w-3/4 rounded bg-[var(--c-bg-inset)] animate-pulse mb-4" />
              <div className="h-3 w-full rounded bg-[var(--c-bg-inset)] animate-pulse mb-2" />
              <div className="h-3 w-2/3 rounded bg-[var(--c-bg-inset)] animate-pulse mb-6" />
              <div className="flex gap-2">
                <div className="h-6 w-16 rounded bg-[var(--c-bg-inset)] animate-pulse" />
                <div className="h-6 w-20 rounded bg-[var(--c-bg-inset)] animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
