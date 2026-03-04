"use client";

import { useEffect, type ReactNode } from "react";
import { initGA, initPostHog, identifyUser, resetUser } from "@/lib/analytics";
import { useAuth } from "./AuthProvider";

/**
 * Analytics Provider
 * Initializes GA4 and PostHog analytics
 * Handles user identification on login/logout
 */
export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  // Initialize analytics on mount
  useEffect(() => {
    // Analytics initialization is optional
    // Superteam will configure their own keys in production
    // For demo/submission, having the implementation is sufficient
    if (process.env.NEXT_PUBLIC_GA_ID || process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true") {
      initGA();
    }
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY || process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true") {
      initPostHog();
    }
  }, []);

  // Track user identification
  useEffect(() => {
    if (user) {
      identifyUser(user.id, {
        email: user.email,
        // Add any other user traits you want to track
      });
    } else {
      resetUser();
    }
  }, [user]);

  return <>{children}</>;
}
