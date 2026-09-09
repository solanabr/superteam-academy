/**
 * Taking the learner to the card that is waiting for them.
 *
 * After a successful build the next thing to do is in the other column, and
 * nothing said so. Scrolling is a courtesy, not an animation: reduced motion
 * jumps instead, and the target takes focus so a keyboard or screen-reader user
 * lands there too.
 */

import type { DeployStepKey } from "./steps";

export const DEPLOY_EDITOR_ANCHOR_ID = "deploy-flow-editor";
export const DEPLOY_PANEL_ANCHOR_ID = "deploy-flow-panel";

export const DEPLOY_STEP_ANCHORS: Record<DeployStepKey, string> = {
  build: DEPLOY_EDITOR_ANCHOR_ID,
  fund: DEPLOY_PANEL_ANCHOR_ID,
  deploy: DEPLOY_PANEL_ANCHOR_ID,
  submit: DEPLOY_PANEL_ANCHOR_ID,
};

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

export function revealDeployStep(step: DeployStepKey): void {
  if (typeof document === "undefined") return;
  revealElement(document.getElementById(DEPLOY_STEP_ANCHORS[step]));
}
