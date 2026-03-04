import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const environment =
  process.env.NEXT_PUBLIC_APP_ENV ??
  process.env.VERCEL_ENV ??
  process.env.NODE_ENV ??
  "development";
const release =
  process.env.NEXT_PUBLIC_APP_RELEASE ??
  process.env.VERCEL_GIT_COMMIT_SHA ??
  undefined;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment,
  release,
  tracesSampleRate: 0.2,
  debug: false,
  initialScope: {
    tags: {
      app: "superteam-academy",
      runtime: "edge",
    },
  },
});
