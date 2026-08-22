"use client";

import { cn } from "@/lib/utils";

/**
 * The segmented control — one selected-state treatment for every "pick one of
 * these" row in the app.
 *
 * Before this, three surfaces had invented three different selected looks: the
 * community sort and type filters used a flat `--primary` fill with white
 * text, the catalog's difficulty row used a dim tinted pill with a lifted
 * shadow, and the plan card's day keys used something else again. They now all
 * resolve to `.pressed-key`, which takes its fill and label from the primary
 * Button's own tokens — so a selected segment, a selected day and a primary
 * button can never disagree about what "on" looks like.
 *
 * Silhouette is a real difference rather than a cosmetic one, so it stays a
 * prop: `track` groups segments inside one bordered rail (community), `pills`
 * leaves them free-standing and round (catalog).
 *
 * Options are addressed by INDEX, not by value, because the "All" option is
 * legitimately `null`/`undefined` on both consumers and would otherwise need a
 * sentinel.
 */
export interface SegmentedOption<T> {
  value: T;
  label: string;
}

export function SegmentedControl<T>({
  options,
  value,
  onChange,
  ariaLabel,
  variant = "track",
  className,
}: {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Names the group for assistive tech — these are buttons, not a listbox. */
  ariaLabel: string;
  variant?: "track" | "pills";
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(variant === "track" ? "seg-track" : "seg-pills", className)}
    >
      {options.map((option, i) => {
        const selected = option.value === value;
        return (
          <button
            key={i}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn("seg", selected && "pressed-key")}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
