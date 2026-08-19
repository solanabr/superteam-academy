"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { initAnalytics, trackPageView, identifyUser } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/client";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const initialized = useRef(false);

  // Initialize analytics once. Ref-guarded on its own so the guard cannot
  // take the auth subscription down with it (see next effect).
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    initAnalytics();

    // Identify user if already authenticated
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const user = session.user;
        identifyUser(user.id, {
          email: user.email,
          walletAddress: user.user_metadata?.wallet_address,
        });
      }
    });
  }, []);

  // Auth subscription: subscribe on EVERY mount, clean up on unmount. When
  // this shared an effect with the ref-guarded init, a StrictMode/remount
  // cycle ran the cleanup (unsubscribe) but the guard skipped the re-run —
  // leaving no listener for the rest of the session.
  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        identifyUser(session.user.id, {
          email: session.user.email,
          walletAddress: session.user.user_metadata?.wallet_address,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Track page views on route changes
  useEffect(() => {
    if (pathname) {
      trackPageView(pathname);
    }
  }, [pathname]);

  return <>{children}</>;
}
