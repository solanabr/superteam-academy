/**
 * Does the visitor ask for reduced motion?
 *
 * globals.css already zeroes CSS-driven animation and sets
 * `scroll-behavior: auto !important` under the same media query, but that only
 * governs CSS-initiated and default scrolls: per CSSOM-View, an explicit
 * `behavior: "smooth"` in a JS `scrollTo`/`scrollIntoView` ScrollOptions wins
 * over the computed `scroll-behavior`. So any JS scroll — and any JS-driven
 * animation — has to consult this itself.
 *
 * SSR-safe and safe under test environments without `matchMedia`: both read as
 * "no preference expressed".
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function")
    return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** `ScrollOptions.behavior` honoring the reduced-motion preference. */
export function scrollBehavior(): ScrollBehavior {
  return prefersReducedMotion() ? "auto" : "smooth";
}
