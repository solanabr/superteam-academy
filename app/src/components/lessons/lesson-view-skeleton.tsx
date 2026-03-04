"use client";

import type { ReactNode } from "react";

export function LessonViewSkeleton(): ReactNode {
  return (
    <div className="container mx-auto py-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="min-w-0">
          <div className="mb-4 h-4 w-40 bg-muted" />
          <div className="h-6 w-64 bg-muted" />
          <div className="mt-4 space-y-2">
            <div className="h-4 w-full bg-muted" />
            <div className="h-4 w-5/6 bg-muted" />
            <div className="h-4 w-2/3 bg-muted" />
          </div>
          <div className="mt-6 h-10 w-32 bg-muted" />
        </section>
        <section className="min-w-0">
          <div className="h-72 w-full border border-border bg-muted" />
        </section>
      </div>
    </div>
  );
}

