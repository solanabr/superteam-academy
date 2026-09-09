/**
 * Taking the learner to the card that is waiting for them.
 *
 * After a successful build the next thing to do is in the other column, and
 * nothing said so. Scrolling is a courtesy, not an animation: reduced motion
 * jumps instead, and the target takes focus so a keyboard or screen-reader user
 * lands there too.
 */

export const DEPLOY_EDITOR_ANCHOR_ID = "deploy-flow-editor";
export const DEPLOY_PANEL_ANCHOR_ID = "deploy-flow-panel";

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Scroll an element into view and give it focus. Safe to call with null. */
export function revealElement(el: HTMLElement | null): void {
  if (!el) return;
  el.scrollIntoView({
    behavior: prefersReducedMotion() ? "auto" : "smooth",
    block: "start",
  });
  el.focus?.({ preventScroll: true });
}
