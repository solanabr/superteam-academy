"use client";

import {
  useCallback,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react";

/**
 * Grab-and-drag horizontal scrolling for an overflowing row (owner ask 05-08 —
 * the achievement strip scrolled only by wheel or scrollbar).
 *
 * `wasDrag()` exists because the row's children are clickable: a pointer-up
 * that ended a drag must NOT also fire the child's click. Children call it
 * first and bail when it returns true; the flag clears on the next press.
 */
export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const origin = useRef<{ x: number; scrollLeft: number } | null>(null);
  const moved = useRef(false);

  const onPointerDown = useCallback((e: ReactPointerEvent<T>) => {
    const el = ref.current;
    // Ignore secondary buttons so a right-click never starts a drag.
    if (!el || e.button !== 0) return;
    origin.current = { x: e.clientX, scrollLeft: el.scrollLeft };
    moved.current = false;
  }, []);

  const onPointerMove = useCallback((e: ReactPointerEvent<T>) => {
    const el = ref.current;
    if (!el || !origin.current) return;
    const dx = e.clientX - origin.current.x;
    // A few px of slop so a slightly shaky tap still reads as a click.
    if (!moved.current && Math.abs(dx) < 4) return;
    if (!moved.current) {
      moved.current = true;
      // Claim the pointer only once it is really a drag, so a plain click on a
      // token still reaches the token.
      el.setPointerCapture(e.pointerId);
    }
    el.scrollLeft = origin.current.scrollLeft - dx;
  }, []);

  const endDrag = useCallback((e: ReactPointerEvent<T>) => {
    const el = ref.current;
    if (el?.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }
    origin.current = null;
  }, []);

  /** True when the gesture that just ended was a drag, not a click. */
  const wasDrag = useCallback(() => moved.current, []);

  return {
    ref,
    wasDrag,
    dragHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
  };
}
