"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

if (typeof window !== "undefined" && POSTHOG_KEY) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: "identified_only",
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: true,
    enable_heatmaps: true,
    enable_recording_console_log: false,
  });
}

function PostHogPageviewInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!POSTHOG_KEY || !pathname) return;
    let url = window.origin + pathname;
    const search = searchParams?.toString();
    if (search) url += `?${search}`;
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}

export function PostHogPageview() {
  if (!POSTHOG_KEY) return null;
  return (
    <Suspense fallback={null}>
      <PostHogPageviewInner />
    </Suspense>
  );
}

export function PostHogProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!POSTHOG_KEY) return <>{children}</>;
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
