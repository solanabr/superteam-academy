import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
  integrations: (defaults) => {
    // Remove the default Replay integration to avoid loading ~50KB eagerly.
    // It will be lazy-loaded only when an error occurs (replaysOnErrorSampleRate: 1.0).
    return defaults.filter((i) => i.name !== "Replay");
  },
  beforeSend(event) {
    // Lazy-load Replay on first error
    if (!Sentry.getClient()?.getIntegrationByName("Replay")) {
      Sentry.lazyLoadIntegration("replayIntegration").then((replay) => {
        Sentry.getClient()?.addIntegration(replay({ maskAllText: false, blockAllMedia: false }));
      });
    }
    return event;
  },
});
