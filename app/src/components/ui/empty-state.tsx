"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  /** SVG illustration component to render above the text. */
  illustration?: ReactNode;
  /** Primary heading text. */
  title: string;
  /** Secondary descriptive text (supports ReactNode for inline links). */
  description?: ReactNode;
  /** Optional action link. */
  action?: {
    label: string;
    href: string;
  };
  /** Additional CSS classes for the container. */
  className?: string;
  /** Compact variant reduces padding. */
  compact?: boolean;
}

export function EmptyState({
  illustration,
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-6" : "py-12",
        className
      )}
    >
      {illustration && (
        <div className={cn("text-muted-foreground", compact ? "h-20 w-20" : "h-28 w-28")}>
          {illustration}
        </div>
      )}
      <h3
        className={cn(
          "font-medium text-muted-foreground",
          illustration ? "mt-4" : "",
          compact ? "text-sm" : "text-base"
        )}
      >
        {title}
      </h3>
      {description && (
        <p className={cn("mt-1 text-muted-foreground/70", compact ? "text-xs" : "text-sm")}>
          {description}
        </p>
      )}
      {action && (
        <Link
          href={action.href}
          className="mt-4 inline-flex items-center rounded-lg bg-st-green/10 px-4 py-2 text-sm font-medium text-st-green transition-colors hover:bg-st-green/20"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
