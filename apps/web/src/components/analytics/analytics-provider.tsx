"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { initAnalytics, trackPageView, identifyUser } from "@/lib/analytics";
import { useAuth } from "@/lib/auth/auth-provider";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const initialized = useRef(false);
  // Consume AuthProvider's session state (this provider is nested inside it in
  // the locale layout) instead of running a second getSession() +
  // onAuthStateChange subscription against the same singleton browser client.
  const { user } = useAuth();

  // Initialize analytics once (ref-guarded, StrictMode-safe).
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    initAnalytics();
  }, []);

  // Identify whenever a signed-in user appears or their identity object
  // changes (AuthProvider re-emits on every auth state change, so a wallet
  // link that updates user_metadata re-identifies — same timing the old
  // in-house onAuthStateChange subscription had). Sign-out intentionally does
  // NOT reset here; resetUser() is called by the explicit sign-out flows
  // (user-menu, danger-tab), matching the previous behavior.
  useEffect(() => {
    if (user) {
      identifyUser(user.id, {
        email: user.email,
        walletAddress: user.user_metadata?.wallet_address,
      });
    }
  }, [user]);

  // Track page views on route changes
  useEffect(() => {
    if (pathname) {
      trackPageView(pathname);
    }
  }, [pathname]);

  return <>{children}</>;
}
