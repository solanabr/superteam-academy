"use client";

import { useAnalytics } from "@/hooks/useAnalytics";

export function AnalyticsTracker() {
  useAnalytics();
  return null;
}
