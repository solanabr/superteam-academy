"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Cleans up stale scroll locks left by Radix Dialog/Sheet
 * after client-side navigation.
 *
 * Radix's react-remove-scroll adds overflow:hidden on <body>
 * and data-scroll-locked on <html>. If a dialog is still open
 * (or mid-close-animation) when the route changes, the cleanup
 * may not run, leaving the new page unscrollable.
 */
export function RouteScrollRestore() {
  const pathname = usePathname();

  useEffect(() => {
    const html = document.documentElement;

    if (html.hasAttribute("data-scroll-locked")) {
      html.removeAttribute("data-scroll-locked");
      html.style.removeProperty("overflow");
      html.style.removeProperty("padding-right");
      html.style.removeProperty("margin-right");
    }

    const { style } = document.body;
    if (style.overflow === "hidden") {
      style.removeProperty("overflow");
      style.removeProperty("padding-right");
      style.removeProperty("margin-right");
    }
  }, [pathname]);

  return null;
}
