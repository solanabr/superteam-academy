"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/register-sw";

/**
 * Invisible client component that registers the service worker on mount.
 * Renders nothing to the DOM.
 */
export function PWARegister() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return null;
}
