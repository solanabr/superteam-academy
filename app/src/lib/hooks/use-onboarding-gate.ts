"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";

/**
 * Client-side gate that redirects authenticated users who haven't completed
 * onboarding to `/onboarding`. Caches the check in sessionStorage.
 *
 * Returns `{ checking: true }` while the gate is being evaluated,
 * and `{ checking: false }` once resolved (either redirected or allowed).
 */
export function useOnboardingGate() {
  const { ready, authenticated } = usePrivy();
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Skip gate on the onboarding page itself and non-app routes
    if (pathname === "/onboarding" || pathname.startsWith("/onboarding/")) {
      setChecking(false);
      return;
    }

    // Wait for Privy to initialize
    if (!ready) return;

    // Not authenticated — no gate needed
    if (!authenticated) {
      setChecking(false);
      return;
    }

    // Check sessionStorage cache to avoid repeated API calls
    const cached = sessionStorage.getItem("sta-onboarding-checked");
    if (cached === "true") {
      setChecking(false);
      return;
    }

    let cancelled = false;

    async function checkOnboarding() {
      try {
        const res = await fetch("/api/onboarding");
        if (!res.ok) {
          // If we can't check, don't block the user
          setChecking(false);
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          if (data.onboardingCompleted) {
            sessionStorage.setItem("sta-onboarding-checked", "true");
            setChecking(false);
          } else {
            router.push("/onboarding");
          }
        }
      } catch {
        if (!cancelled) setChecking(false);
      }
    }

    checkOnboarding();

    return () => {
      cancelled = true;
    };
  }, [ready, authenticated, pathname, router]);

  return { checking };
}
