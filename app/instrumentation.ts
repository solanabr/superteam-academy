import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.NODE_ENV || "development";

if (SENTRY_DSN) {
	Sentry.init({
		dsn: SENTRY_DSN,
		environment: SENTRY_ENVIRONMENT,
		tracesSampleRate: SENTRY_ENVIRONMENT === "production" ? 0.1 : 1.0,
		debug: SENTRY_ENVIRONMENT === "development",

		replaysOnErrorSampleRate: 1.0,
		replaysSessionSampleRate: SENTRY_ENVIRONMENT === "production" ? 0.1 : 1.0,

		enabled: SENTRY_ENVIRONMENT !== "development",
		beforeSend(event) {
			if (SENTRY_ENVIRONMENT === "development") {
				return null;
			}
			return event;
		},

		beforeBreadcrumb(breadcrumb) {
			if (breadcrumb.category === "console" && SENTRY_ENVIRONMENT === "production") {
				return null;
			}
			return breadcrumb;
		},
	});
}
