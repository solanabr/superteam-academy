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
   * Keep the panel's CHILDREN mounted while collapsed. Used by Discussion
   * only while its composer holds a draft — collapsing must not destroy it
   * (#952; the old unconditional keep fired an uncached threads fetch on
   * every lesson first paint). The panel element itself is always in the DOM
   * either way (see below).
   */
  keepMounted?: boolean;
  /**
   * Id for the disclosure PANEL. Supply it when something outside this
   * component references the panel (the lesson jump chips' `aria-controls`),
   * so the chip and the row agree on one id; otherwise it is minted locally.
   */
  panelId?: string;
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
  panelId: panelIdProp,
  id,
  className,
  children,
}: LessonSectionProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;
  const generatedPanelId = `${useId()}-panel`;
  const panelId = panelIdProp ?? generatedPanelId;

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
      {/* The panel element is ALWAYS rendered so the header button's (and the
          jump chip's) `aria-controls` never points at a missing id; `hidden`
          keeps a collapsed panel out of the a11y tree and the tab order.
          `keepMounted` still controls whether the CHILDREN are mounted —
          sections should not fetch or render until asked for; Discussion
          pins its children only while a composer draft is live (#952). */}
      <div id={panelId} hidden={!isOpen} className="pb-4">
        {(isOpen || keepMounted) && children}
      </div>
    </div>
  );
}
