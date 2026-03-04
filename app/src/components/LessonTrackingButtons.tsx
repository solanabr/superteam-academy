"use client";

import Link from "next/link";
import { track } from "@/lib/analytics";

export function LessonTrackingButtons({
  slug,
  prev,
  next,
}: {
  slug: string;
  prev?: { slug: string; title: string } | null;
  next?: { slug: string; title: string } | null;
}) {
  return (
    <div className="mt-10 flex items-center justify-between border-t border-zinc-200 pt-6">
      {prev ? (
        <Link
          href={`/courses/${slug}/lessons/${prev.slug}`}
          onClick={() => track("lesson_start", { lesson: prev.slug })}
          className="rounded-xl border border-zinc-200 px-4 py-2 text-sm hover:border-zinc-300"
        >
          ← {prev.title}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={`/courses/${slug}/lessons/${next.slug}`}
          onClick={() => track("lesson_start", { lesson: next.slug })}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          {next.title} →
        </Link>
      ) : (
        <Link
          href={`/courses/${slug}`}
          onClick={() => track("lesson_complete", { lesson: slug })}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          Complete ✓
        </Link>
      )}
    </div>
  );
}
