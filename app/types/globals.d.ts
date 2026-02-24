/** Global type augmentations for third-party scripts injected at runtime. */

interface GtagFunction {
  (command: "config", targetId: string, params?: Record<string, unknown>): void;
  (command: "event", action: string, params?: Record<string, unknown>): void;
  (command: "js", date: Date): void;
  (command: string, ...args: unknown[]): void;
}

interface PostHogInstance {
  capture(event: string, properties?: Record<string, unknown>): void;
  init(apiKey: string, options?: Record<string, unknown>): void;
  __loaded?: boolean;
}

declare global {
  interface Window {
    gtag?: GtagFunction;
    posthog?: PostHogInstance;
    dataLayer?: unknown[];
  }
}

export {};
