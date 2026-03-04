"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    dataLayer?: unknown[];
    __ga4_initialized?: boolean;
  }
}

const ga4_measurement_id = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

function send_ga4_page_view(path: string): void {
  if (typeof window === "undefined") return;
  if (!window.dataLayer) {
    window.dataLayer = [];
  }
  window.dataLayer.push({
    event: "page_view",
    page_location: path,
  });
}

export function GA4Provider({ children }: { children: ReactNode }): ReactNode {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!ga4_measurement_id) return;
    if (window.__ga4_initialized) return;

    const script_tag = document.createElement("script");
    script_tag.async = true;
    script_tag.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4_measurement_id)}`;
    document.head.appendChild(script_tag);

    window.dataLayer = window.dataLayer || [];
    function gtag(...args: unknown[]): void {
      window.dataLayer?.push(args);
    }

    gtag("js", new Date());
    gtag("config", ga4_measurement_id);

    window.__ga4_initialized = true;
  }, []);

  return <>{children}</>;
}

export function GA4PageView(): null {
  const pathname = usePathname();
  const search_params = useSearchParams();

  useEffect(() => {
    if (!ga4_measurement_id) return;
    if (!pathname) return;
    const search = search_params?.toString();
    const full_path = search ? `${pathname}?${search}` : pathname;
    send_ga4_page_view(full_path);
  }, [pathname, search_params]);

  return null;
}

