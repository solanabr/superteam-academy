"use client";

import type { Module } from "@/types";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface ModuleListProps {
  slug: string;
  modules: Module[];
}

export function ModuleList({ slug, modules }: ModuleListProps) {
  return (
    <div className="space-y-3">
      {modules.map((module, moduleIndex) => (
        <section key={module.id} className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground">
            {moduleIndex + 1}. {module.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{module.description}</p>
          <ul className="mt-3 space-y-2">
            {module.lessons.map((lesson) => (
              <li key={lesson.id}>
                <Link
                  href={`/courses/${slug}/lessons/${lesson.id}`}
                  className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground/90 transition hover:border-[#ffd23f]/35"
                >
                  <span>{lesson.title}</span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
