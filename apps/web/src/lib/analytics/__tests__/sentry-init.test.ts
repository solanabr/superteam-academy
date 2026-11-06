// Pins what each runtime passes to Sentry.init. A dropped option here would
// silently reopen a capture channel, so the tests read the real config files.
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

type InitOptions = Record<string, unknown> & { integrations?: unknown[] };

const init = vi.fn<(options: InitOptions) => void>();
const httpIntegration = vi.fn((options: unknown) => ({
  name: "Http",
  options,
}));
const requestDataIntegration = vi.fn((options: unknown) => ({
  name: "RequestData",
  options,
}));

function mockSentry() {
  vi.doMock("@sentry/nextjs", () => ({
    init,
    httpIntegration,
    requestDataIntegration,
    getClient: () => ({}),
    captureRouterTransitionStart: vi.fn(),
  }));
}

async function optionsFrom(load: () => Promise<unknown>): Promise<InitOptions> {
  await load();
  expect(init).toHaveBeenCalledTimes(1);
  return init.mock.calls[0]![0];
}

const RUNTIMES: Array<[string, () => Promise<unknown>]> = [
  ["server", () => import("../../../../sentry.server.config")],
  ["edge", () => import("../../../../sentry.edge.config")],
  ["client", () => import("../../../instrumentation-client")],
];

describe("Sentry.init options", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "https://k@o1.ingest.sentry.io/1");
    mockSentry();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.doUnmock("@sentry/nextjs");
  });

  it.each(RUNTIMES)("%s init wires the shared scrubber", async (_n, load) => {
    const options = await optionsFrom(load);
    // After the load, so this is the module instance the config saw.
    const {
      scrubSentryBreadcrumb,
      scrubSentryEvent,
      scrubSentrySpan,
      sentryScrubIntegration,
    } = await import("../sentry-scrub");

    expect(options.sendDefaultPii).toBe(false);
    expect(options.beforeSend).toBe(scrubSentryEvent);
    expect(options.beforeSendTransaction).toBe(scrubSentryEvent);
    expect(options.beforeSendSpan).toBe(scrubSentrySpan);
    expect(options.beforeBreadcrumb).toBe(scrubSentryBreadcrumb);
    // beforeSend skips SDK-internal events; an event processor doesn't.
    expect(options.integrations).toContain(sentryScrubIntegration);
  });

  it("server init never captures request bodies or local variables", async () => {
    const options = await optionsFrom(RUNTIMES[0]![1]);

    expect(options.includeLocalVariables).toBe(false);
    expect(httpIntegration).toHaveBeenCalledWith(
      expect.objectContaining({
        // Next instruments incoming requests itself; the SDK's default Http
        // instance sets this, and ours replaces that instance.
        disableIncomingRequestSpans: true,
        maxIncomingRequestBodySize: "none",
      })
    );
    expect(options.integrations).toContainEqual(
      expect.objectContaining({ name: "Http" })
    );
  });

  it("server init turns off cookies, bodies and query strings in request data", async () => {
    const options = await optionsFrom(RUNTIMES[0]![1]);

    expect(requestDataIntegration).toHaveBeenCalledWith({
      include: {
        cookies: false,
        data: false,
        ip: false,
        query_string: false,
      },
    });
    expect(options.integrations).toContainEqual(
      expect.objectContaining({ name: "RequestData" })
    );
  });

  it("no runtime enables replay or local variable capture", async () => {
    for (const [, load] of RUNTIMES) {
      init.mockClear();
      vi.resetModules();
      mockSentry();
      const options = await optionsFrom(load);

      expect(options.replaysSessionSampleRate).toBeUndefined();
      expect(options.replaysOnErrorSampleRate).toBeUndefined();
      expect(options.includeLocalVariables ?? false).toBe(false);
    }
  });

  it.each(RUNTIMES)("%s init is a no-op without a DSN", async (_n, load) => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "");

    await load();

    expect(init).not.toHaveBeenCalled();
  });
});
