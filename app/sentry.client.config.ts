import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://0ff3b4464de5a3c597428637e0418342@o4510970052018176.ingest.us.sentry.io/4510970076397568",
  tracesSampleRate: 1.0,
  debug: false,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  integrations: [],
});