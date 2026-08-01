"use client";

import { useId, useState, type ReactNode } from "react";
import { CaretRight } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface LessonSectionProps {
  /** Visible row label (e.g. "Hint 1", "Topics", "Discussion"). */
  title: string;
  /** Optional trailing count, LeetCode's "Discussion (12)" affordance. */
  count?: string | null;
  /** Uncontrolled initial state. Ignored when `open` is supplied. */
  defaultOpen?: boolean;
  /** Controlled state — pair with `onOpenChange`. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * Keep the panel in the DOM while collapsed (hidden). Used by Discussion so
   * its thread count is known before the learner opens the row; `hidden`
   * keeps the collapsed content out of the a11y tree and the tab order.
   */
  keepMounted?: boolean;
  id?: string;
  className?: string;
  children: ReactNode;
}

/**
 * A LeetCode-style disclosure row for the lesson pane (#942 phase 1). Native
 * button + aria-expanded/aria-controls rather than <details> so the row can be
 * driven programmatically (the toolbar's jump-to-discussion) and styled
 * identically across browsers.
 */
export function LessonSection({
  title,
  count,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  keepMounted = false,
  id,
  className,
  children,
}: LessonSectionProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;
  const panelId = `${useId()}-panel`;

  const toggle = () => {
    const next = !isOpen;
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  return (
    <div id={id} className={cn("border-t border-border", className)}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="flex w-full items-center gap-2 py-3 text-left font-display text-sm font-bold text-text transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
      >
        <CaretRight
          size={14}
          weight="bold"
          aria-hidden="true"
          className={cn("shrink-0 transition-transform", isOpen && "rotate-90")}
        />
        <span className="min-w-0 truncate">{title}</span>
        {count ? (
          <span className="font-mono text-xs font-normal tabular-nums text-text-3">
            ({count})
          </span>
        ) : null}
      </button>
      {(isOpen || keepMounted) && (
        <div id={panelId} hidden={!isOpen} className="pb-4">
          {children}
        </div>
      )}
    </div>
  );
}
