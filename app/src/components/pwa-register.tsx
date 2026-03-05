"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    // Only register SW in production — caching breaks HMR in dev
    if (process.env.NODE_ENV !== "production") return;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // SW registration failed — not critical
      });
    }
  }, []);

  return null;
}
