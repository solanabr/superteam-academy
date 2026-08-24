import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The learner-status chip — "10/15 LESSONS", "COMPLETED", and their siblings
 * wherever a course's state is stamped on a surface.
 *
 * ONE component rather than two matching stylesheets: the catalog card's
 * banner and the learning-path timeline row had grown their own translucent
 * pills (`.course-card-status`, `.path-step-badge`) and drifted apart twice.
 * They are the same statement about the same course, so they are now the same
 * object — a `.chip` sized for a label: solid fill, literal ink outline, hard
 * lift, bold caps.
 *
 * The ink is the literal dark one on BOTH grounds, like the glyph chips and
 * the avatar rings: the card variant is drawn on arbitrary cover art, so there
 * is no themed ground for a flipping line to agree with.
 */
export type StatusChipTone = "neutral" | "earned";

export function StatusChip({
  tone = "neutral",
  size = "md",
  className,
  children,
  "aria-label": ariaLabel,
}: {
  /**
   * `earned` is a positive, finished state (COMPLETED) and takes the primary
   * pair — the same green as a pressed segment and a primary button, so it is
   * the light theme's dark green and the dark theme's mint. `neutral` is
   * informational (a lesson count) and stays the cream plate.
   */
  tone?: StatusChipTone;
  /** `sm` is the timeline row; `md` is the card banner. */
  size?: "sm" | "md";
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
}) {
  return (
    <span
      className={cn("status-chip", className)}
      data-tone={tone}
      data-size={size}
      aria-label={ariaLabel}
    >
      {children}
    </span>
  );
}
