/**
 * Placeholders for the Monaco-backed lesson blocks, which all load via
 * `dynamic(..., { ssr: false })`. Without a `loading:` the block occupies zero
 * height until the chunk arrives, so the reading column jumps once per code
 * lesson (#933). Reserving roughly the mounted height keeps the shift off.
 *
 * Decorative: the surrounding block already announces itself, so these are
 * hidden from assistive tech rather than given a loading string.
 *
 * `animate-pulse` here already respects `prefers-reduced-motion`: the global
 * reduce blanket in globals.css zeroes every animation-duration.
 */

import type { CSSProperties } from "react";

/** A shimmering bar. Width via className (w-*) or style. */
function Bar({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={style}
      className={`animate-pulse rounded [background:var(--border-default)] ${className}`}
    />
  );
}

export function BlockSkeleton({ height }: { height: string }) {
  return (
    <div
      aria-hidden="true"
      style={{ height }}
      className="flex w-full flex-col gap-2 rounded-lg border border-border bg-[var(--surface)] p-4"
    >
      <Bar className="h-4 w-32" />
      <Bar className="h-4 w-56" />
      <Bar className="h-4 w-40" />
      <Bar className="h-4 w-48" />
    </div>
  );
}

/** Deterministic pseudo-code line widths (%) for the editor body. */
const EDITOR_LINE_WIDTHS = [55, 72, 40, 64, 30, 68, 48, 58, 36, 52];

/** Prose line widths (%) for the instructions rail. */
const PROSE_LINE_WIDTHS = [92, 100, 84, 96, 62, 100, 88, 45];

/**
 * Anatomy-matched skeleton for `ChallengeInterface` (#942 PR D). Mirrors the
 * real component's structure so nothing jumps when the chunk mounts:
 *
 * - the same root (`flex h-full flex-col lg:flex-row`) inside code-block's
 *   wrapper, with the same two lg cards (`rounded-[var(--r-lg)] border
 *   border-border bg-card`) separated by the same `w-2` resizer gutter;
 * - left card: jump-chip pills, prose lines, and the three disclosure rows
 *   (Topics / Hints / Discussion, the last with a count stub);
 * - right card: toolbar strip, line-number gutter + code lines, the `h-1.5`
 *   output resizer, and the 120px output strip (`ChallengeInterface`'s
 *   `panelHeight` default).
 *
 * Below lg the columns use `contents` + the same `order-*` scheme, so the
 * stacked mobile flow (text, editor, output, sections) also matches.
 */
export function ChallengeSkeleton() {
  return (
    <div
      aria-hidden="true"
      data-testid="challenge-skeleton"
      className="flex h-full min-h-[32rem] w-full flex-col overflow-hidden lg:min-h-0 lg:flex-row"
    >
      {/* LEFT: instructions rail card */}
      <div className="contents lg:flex lg:min-w-0 lg:flex-1 lg:flex-col lg:overflow-hidden lg:rounded-[var(--r-lg)] lg:border lg:border-border lg:bg-card">
        <div
          data-testid="challenge-skeleton-rail"
          className="order-1 space-y-5 p-4 sm:p-5 lg:order-none lg:shrink-0"
        >
          {/* Jump-chips row (Topics / Hints / Discussion (n)) */}
          <div className="flex flex-wrap items-center gap-2">
            <Bar className="h-[26px] w-20 !rounded-full" />
            <Bar className="h-[26px] w-16 !rounded-full" />
            <Bar className="h-[26px] w-28 !rounded-full" />
          </div>
          {/* Prose lines */}
          <div className="space-y-3">
            {PROSE_LINE_WIDTHS.map((width, i) => (
              <Bar key={i} className="h-4" style={{ width: `${width}%` }} />
            ))}
          </div>
        </div>
        {/* Disclosure rows (Topics / Hints / Discussion) */}
        <div className="order-5 px-3 pb-4 lg:order-none lg:mt-auto lg:shrink-0">
          {[24, 20, 28].map((labelWidth, i) => (
            <div
              key={i}
              className="flex items-center gap-2 border-t border-border py-3"
            >
              <Bar className="h-3.5 w-3.5 shrink-0" />
              <Bar className="h-4" style={{ width: `${labelWidth * 4}px` }} />
              {i === 2 && <Bar className="h-3 w-6" />}
            </div>
          ))}
        </div>
      </div>

      {/* Text/editor gutter — matches the lg split resizer's width. */}
      <div className="hidden w-2 shrink-0 lg:block" />

      {/* RIGHT: editor card */}
      <div className="contents lg:flex lg:min-w-0 lg:flex-1 lg:flex-col lg:overflow-hidden lg:rounded-[var(--r-lg)] lg:border lg:border-border lg:bg-card">
        <div className="order-2 flex min-h-0 flex-col overflow-hidden lg:order-none lg:flex-1">
          {/* Toolbar strip */}
          <div
            data-testid="challenge-skeleton-toolbar"
            className="flex shrink-0 items-center justify-between border-b border-border bg-card px-3 py-2.5"
          >
            <div className="flex items-center gap-2">
              <Bar className="h-8 w-20 !rounded-md" />
              <Bar className="h-8 w-24 !rounded-md" />
            </div>
            <div className="flex items-center gap-1">
              <Bar className="h-8 w-8 !rounded-md" />
              <Bar className="h-8 w-8 !rounded-md" />
            </div>
          </div>

          {/* Editor area: line-number gutter + code lines */}
          <div
            data-testid="challenge-skeleton-editor"
            className="flex min-h-[18rem] flex-1 gap-4 overflow-hidden p-3 lg:min-h-0"
          >
            <div className="flex w-6 shrink-0 flex-col items-end gap-3 pt-0.5">
              {EDITOR_LINE_WIDTHS.map((_, i) => (
                <Bar key={i} className="h-3 w-4" />
              ))}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-3 pt-0.5">
              {EDITOR_LINE_WIDTHS.map((width, i) => (
                <Bar
                  key={i}
                  className="h-3"
                  style={{
                    width: `${width}%`,
                    // The 3rd/7th lines read as indented block bodies.
                    marginLeft: i % 4 === 2 ? "1.5rem" : undefined,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Editor/output resizer strip (lg+ only, like the real one) */}
        <div className="hidden h-1.5 shrink-0 border-y border-border [background:var(--resizer-bg)] lg:block" />

        {/* Output strip — ChallengeInterface's default panelHeight (120px) */}
        <div
          data-testid="challenge-skeleton-output"
          className="order-3 shrink-0 space-y-3 border-t border-border p-3 lg:order-none lg:border-t-0"
          style={{ height: 120, minHeight: 88 }}
        >
          <div className="flex items-center gap-2">
            <Bar className="h-5 w-16 !rounded-md" />
            <Bar className="h-5 w-16 !rounded-md" />
          </div>
          <Bar className="h-3 w-2/5" />
          <Bar className="h-3 w-1/4" />
        </div>
      </div>
    </div>
  );
}
