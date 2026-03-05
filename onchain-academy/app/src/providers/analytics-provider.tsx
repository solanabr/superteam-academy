"use client";

import { useEffect, type PropsWithChildren } from "react";
import posthog from "posthog-js";
import * as Sentry from "@sentry/nextjs";

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com";

export function AnalyticsProvider({
  children,
}: PropsWithChildren): React.JSX.Element {
  useEffect(() => {
    const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

    if (posthogKey) {
      posthog.init(posthogKey, {
        api_host: posthogHost,
        capture_pageview: true,
        persistence: "localStorage+cookie",
      });
    }

    if (sentryDsn) {
      Sentry.init({
        dsn: sentryDsn,
        tracesSampleRate: 0.2,
      });
    }
  }, []);

  return <>{children}</>;
}
