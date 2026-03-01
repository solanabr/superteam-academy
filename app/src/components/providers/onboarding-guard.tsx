"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "@/i18n/routing";
import { useEffect, useRef } from "react";

export function OnboardingGuard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const hasVisitedOnboarding = useRef(false);

  useEffect(() => {
    if (pathname.startsWith("/onboarding")) {
      hasVisitedOnboarding.current = true;
    }
  }, [pathname]);

  useEffect(() => {
    if (
      status === "authenticated" &&
      session?.onboarded === false &&
      !pathname.startsWith("/onboarding") &&
      !hasVisitedOnboarding.current
    ) {
      router.replace("/onboarding");
    }
  }, [status, session?.onboarded, pathname, router]);

  return null;
}
