import { cn } from "@/lib/utils";

/** The app's standard ring spinner (.sol-spinner in globals.css) — the same
 * element rendered inline across leaderboard, dashboard, settings, etc.
 * Decorative: pair it with a sr-only label in the caller. */
export function Spinner({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("sol-spinner", className)} />;
}
