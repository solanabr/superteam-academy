/**
 * Placeholder for the Monaco-backed lesson blocks, which all load via
 * `dynamic(..., { ssr: false })`. Without a `loading:` the block occupies zero
 * height until the chunk arrives, so the reading column jumps once per code
 * lesson (#933). Reserving roughly the mounted height keeps the shift off.
 *
 * Decorative: the surrounding block already announces itself, so this is
 * hidden from assistive tech rather than given a loading string.
 */
export function BlockSkeleton({ height }: { height: string }) {
  return (
    <div
      aria-hidden="true"
      style={{ height }}
      className="flex w-full flex-col gap-2 rounded-lg border border-border bg-[var(--surface)] p-4"
    >
      <div className="h-4 w-32 animate-pulse rounded [background:var(--border-default)]" />
      <div className="h-4 w-56 animate-pulse rounded [background:var(--border-default)]" />
      <div className="h-4 w-40 animate-pulse rounded [background:var(--border-default)]" />
      <div className="h-4 w-48 animate-pulse rounded [background:var(--border-default)]" />
    </div>
  );
}
