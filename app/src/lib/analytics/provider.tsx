"use client";

import { ReactNode, useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "./events";

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    trackEvent("page_view", { path: pathname });
  }, [pathname]);

  return <>{children}</>;
}
