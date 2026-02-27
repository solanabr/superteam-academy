// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Enable replay in production only
  replaysOnErrorSampleRate: process.env.NODE_ENV === 'production' ? 1.0 : 0,
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here
      maskAllText: true,
      blockAllMedia: true,
    }),
    Sentry.browserTracingIntegration(),
  ],

  // Configure which URLs to trace
  tracePropagationTargets: [
    'localhost',
    /^https:\/\/.*\.vercel\.app\//,
    /^https:\/\/superteam-academy\./,
  ],

  // Filter out certain errors
  beforeSend(event, hint) {
    // Don't send events in development
    if (process.env.NODE_ENV !== 'production') {
      return null;
    }

    // Filter out specific errors if needed
    const error = hint.originalException;
    if (error instanceof Error) {
      // Don't report network errors from wallet connections
      if (error.message.includes('User rejected')) {
        return null;
      }
      if (error.message.includes('WalletNotConnectedError')) {
        return null;
      }
    }

    return event;
  },

  // Environment tag
  environment: process.env.NODE_ENV,
});
