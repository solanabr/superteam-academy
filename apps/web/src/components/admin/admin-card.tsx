import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface AdminCardProps extends HTMLAttributes<HTMLElement> {
  /** Render as a landmark `section` (with an `aria-labelledby`) or a plain `div`. */
  as?: "div" | "section";
}

/**
 * The one admin surface chrome — `rounded-lg border border-border bg-card p-4
 * shadow-card`. Extracted so every top-level admin card (WS-A/B/C) reads from a
 * single source of truth instead of re-typing the class string, and so the
 * "flatten nested cards to dividers" rule has one place to enforce: a full
 * bordered card is an `AdminCard`; anything nested inside one should be a
 * divider, not another `AdminCard`.
 *
 * Layout classes (spacing, grid, width) merge over the chrome via `className`.
 */
export function AdminCard({
  as: Tag = "div",
  className,
  children,
  ...rest
}: AdminCardProps) {
  return (
    <Tag
      className={cn(
        "rounded-lg border border-border bg-card p-4 shadow-card",
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
