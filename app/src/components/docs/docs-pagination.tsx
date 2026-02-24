"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getPrevNext } from "./nav-config";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function DocsPagination() {
  const pathname = usePathname();
  const { prev, next } = getPrevNext(pathname);

  if (!prev && !next) return null;

  return (
    <nav className="grid grid-cols-2 gap-4 mt-12 pt-8">
      {prev ? (
        <Link
          href={prev.href}
          className="group flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-all hover:border-foreground/20 hover:shadow-sm"
        >
          <ChevronLeft className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
          <div className="min-w-0">
            <div className="text-xs font-medium text-muted-foreground mb-0.5">
              Previous
            </div>
            <div className="text-sm font-semibold text-foreground truncate">
              {prev.title}
            </div>
          </div>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          href={next.href}
          className="group flex items-center justify-end gap-3 rounded-lg border border-border bg-card p-4 transition-all hover:border-foreground/20 hover:shadow-sm text-right"
        >
          <div className="min-w-0">
            <div className="text-xs font-medium text-muted-foreground mb-0.5">
              Next
            </div>
            <div className="text-sm font-semibold text-foreground truncate">
              {next.title}
            </div>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}
