// This file configures the initialization of Sentry and PostHog on the client.
// The added config here will be used whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
// https://posthog.com/docs/libraries/next-js

import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";

// PostHog initialization
// IMPORTANT: Never combine this approach with other client-side PostHog initialization approaches,
// especially components like a PostHogProvider. instrumentation-client.ts is the correct solution
// for initializing client-side PostHog in Next.js 15.3+ apps.
posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
	api_host: "/ingest",
	ui_host: "https://us.posthog.com",
	// Include the defaults option as required by PostHog
	defaults: "2026-01-30",
	// Enables capturing unhandled exceptions via Error Tracking
	capture_exceptions: true,
	// Turn on debug in development mode
	debug: process.env.NODE_ENV === "development",
});

// Sentry initialization
// https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/
Sentry.init({
	dsn: "https://e941ca2b53c1872999d1cb32f6aaeb8e@o4510980159897600.ingest.us.sentry.io/4510980162584576",
	// Add optional integrations for additional features
	integrations: [Sentry.replayIntegration()],
	// Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
	tracesSampleRate: 1,
	// Enable logs to be sent to Sentry
	enableLogs: true,
	// Define how likely Replay events are sampled.
	// This sets the sample rate to be 10%. You may want this to be 100% while
	// in development and sample at a lower rate in production.
	replaysSessionSampleRate: 0.1,
	// Define how likely Replay events are sampled when an error occurs.
	replaysOnErrorSampleRate: 1.0,
	// Enable sending user PII (Personally Identifiable Information)
	// https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
	sendDefaultPii: true,
});

// Required to instrument client-side navigations for Sentry tracing
// https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/instrumentation-client/
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
