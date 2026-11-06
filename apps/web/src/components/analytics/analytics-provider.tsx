"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  initAnalytics,
  trackPageView,
  identifyUser,
  resetUser,
} from "@/lib/analytics";
import { useAuth } from "@/lib/auth/auth-provider";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const initialized = useRef(false);
  // Consume AuthProvider's session state (this provider is nested inside it in
  // the locale layout) instead of running a second getSession() +
  // onAuthStateChange subscription against the same singleton browser client.
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const identifiedAs = useRef<string | null>(null);

  // Initialize analytics once (ref-guarded, StrictMode-safe).
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    initAnalytics();
  }, []);

  // Identity follows the user id alone. A signed-in user going away resets too,
  // since AuthProvider also sees a sign-out from another tab, which the explicit
  // sign-out flows (user-menu, danger-tab) can't cover. Resetting twice is harmless.
  useEffect(() => {
    if (userId) {
      identifyUser(userId);
    } else if (identifiedAs.current) {
      resetUser();
    }
    identifiedAs.current = userId;
  }, [userId]);

  // Track page views on route changes
  useEffect(() => {
    if (pathname) {
      trackPageView(pathname);
    }
  }, [pathname]);

  return <>{children}</>;
}
