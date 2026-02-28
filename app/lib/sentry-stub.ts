/**
 * Sentry no-op stub — used when SENTRY_ORG is not configured.
 * This prevents the full ~120 KB @sentry/nextjs bundle from being included
 * in the initial JS payload, significantly improving TBT and LCP scores.
 *
 * When a real Sentry DSN is configured (by setting SENTRY_ORG in build env),
 * next.config.ts will use withSentryConfig and this stub is not needed.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export const init = (_options?: any): void => {};
export const captureRequestError = (_error: any, _request: any, _errorContext: any): void => {};
export const captureRouterTransitionStart = (_url: string): void => {};
export const captureException = (_error: any, _hint?: any): string => '';
export const captureMessage = (_message: string, _level?: any): string => '';
export const setUser = (_user: any): void => {};
export const addBreadcrumb = (_breadcrumb: any): void => {};
export const configureScope = (_callback: any): void => {};
export const withScope = (_callback: any): void => {};
export const startTransaction = (_context: any): any => ({ finish: () => {}, setStatus: () => {} });
export const getCurrentHub = (): any => ({ getScope: () => null });
export const flush = async (_timeout?: number): Promise<boolean> => true;
export const close = async (_timeout?: number): Promise<boolean> => true;

export default {
  init,
  captureRequestError,
  captureRouterTransitionStart,
  captureException,
  captureMessage,
  setUser,
  addBreadcrumb,
  configureScope,
  withScope,
  startTransaction,
  getCurrentHub,
  flush,
  close,
};
