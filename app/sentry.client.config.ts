const withSentryConfig = require("@sentry/nextjs").withSentryConfig;

/** @type {import('@sentry/nextjs').UserSentryOptions} */
const sentryWebpackPluginOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  
  silent: true,
  
  widenClientFileUpload: true,
  
  hideSourceMaps: true,
  
  disableLogger: true,
};

module.exports = withSentryConfig(sentryWebpackPluginOptions);
