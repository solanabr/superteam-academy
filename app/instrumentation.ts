import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.NEXT_PUBLIC_APP_ENV || "development";

if (SENTRY_DSN) {
	Sentry.init({
		dsn: SENTRY_DSN,
		environment: SENTRY_ENVIRONMENT,
		tracesSampleRate: SENTRY_ENVIRONMENT === "production" ? 0.1 : 1.0,
		debug: SENTRY_ENVIRONMENT === "development",

		replaysOnErrorSampleRate: 1.0,
		replaysSessionSampleRate: SENTRY_ENVIRONMENT === "production" ? 0.1 : 1.0,

		// Performance monitoring
		enabled: SENTRY_ENVIRONMENT !== "development",
		beforeSend(event) {
			// Filter out development errors
			if (SENTRY_ENVIRONMENT === "development") {
				return null;
			}
			return event;
		},

		// Capture console logs in production
		beforeBreadcrumb(breadcrumb) {
			if (breadcrumb.category === "console" && SENTRY_ENVIRONMENT === "production") {
				return null;
			}
			return breadcrumb;
		},
	});
}
