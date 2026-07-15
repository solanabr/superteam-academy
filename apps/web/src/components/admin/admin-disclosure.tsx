"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AdminDisclosureProps {
  /**
   * The always-visible trigger content (a heading, a label, or a self-contained
   * pill). Rendered inside the toggle button, so it must be phrasing content —
   * no nested interactive or block elements.
   */
  summary: ReactNode;
  /** Revealed content — only mounted while open. */
  children: ReactNode;
  /** Collapsed by default; opt into open with `defaultOpen`. */
  defaultOpen?: boolean;
  /** Extra classes on the trigger button (e.g. a danger-pill treatment). */
  triggerClassName?: string;
  /** Extra classes on the revealed region wrapper. */
  contentClassName?: string;
  /** Hide the leading chevron when the summary carries its own affordance. */
  hideChevron?: boolean;
  /**
   * Wrap the trigger in a heading tag so the document outline is preserved
   * (the ARIA accordion pattern: `<h3><button aria-expanded>…</button></h3>`).
   */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
}

/**
 * Controlled disclosure with a real `aria-expanded` + `aria-controls` toggle.
 * Keyboard-operable (it is a `<button>`) and collapsed by default. The shared
 * admin primitive for "tuck this behind a click": the legend, the publish-PR
 * fallback, and the immutable-mismatch card all reveal through this.
 */
export function AdminDisclosure({
  summary,
  children,
  defaultOpen = false,
  triggerClassName,
  contentClassName,
  hideChevron = false,
  headingLevel,
}: AdminDisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  const regionId = useId();

  const trigger = (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={regionId}
      onClick={() => setOpen((v) => !v)}
      className={cn(
        "flex items-center gap-2 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        triggerClassName
      )}
    >
      {!hideChevron && (
        <span aria-hidden className="text-xs text-text-3">
          {open ? "▼" : "▶"}
        </span>
      )}
      {summary}
    </button>
  );

  const Heading = headingLevel
    ? (`h${headingLevel}` as "h2" | "h3" | "h4" | "h5" | "h6")
    : null;

  return (
    <div>
      {Heading ? <Heading className="m-0">{trigger}</Heading> : trigger}
      {open && (
        <div id={regionId} className={contentClassName}>
          {children}
        </div>
      )}
    </div>
  );
}
