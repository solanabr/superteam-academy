import type { ReactNode } from "react";

/**
 * Root template that applies a subtle fade-in animation on route navigation.
 * Uses pure CSS animation to avoid CLS from JS-based layout shifts.
 * Respects prefers-reduced-motion via globals.css rule.
 */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="animate-page-enter">{children}</div>;
}
