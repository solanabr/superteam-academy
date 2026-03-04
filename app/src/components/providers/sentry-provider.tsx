"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

declare global {
  interface Window {
    __sentry_initialized?: boolean;
  }
}

const sentry_dsn = process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN ?? "";
const sentry_env = process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV ?? "development";

export function SentryProvider({ children }: { children: ReactNode }): ReactNode {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!sentry_dsn) return;
    if (window.__sentry_initialized) return;

    Sentry.init({
      dsn: sentry_dsn,
      environment: sentry_env,
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.0,
      replaysOnErrorSampleRate: 0.0,
    });

    window.__sentry_initialized = true;
  }, []);

  return <>{children}</>;
}

