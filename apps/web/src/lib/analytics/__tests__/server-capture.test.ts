/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({ logEvent: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/logging", () => ({ logEvent: h.logEvent }));

import {
  buildCapturePayload,
  captureServerEvent,
  serverCaptureConfig,
  type ServerCaptureConfig,
} from "../server-capture";

const config: ServerCaptureConfig = {
  apiKey: "phc_test",
  host: "https://us.i.posthog.com",
  appHost: "www.st.academy",
};

beforeEach(() => {
  h.logEvent.mockReset();
});

describe("server-side PostHog capture", () => {
  it("is off under tests, so suites never post real events", () => {
    expect(serverCaptureConfig()).toBeNull();
  });

  it("posts to the capture endpoint with the app host and no person for platform events", async () => {
    const fetchImpl = vi.fn(
      async (_url: URL | RequestInfo, _init?: RequestInit) =>
        new Response(null, { status: 200 })
    );

    await captureServerEvent(
      "sponsor_balance_snapshot",
      "platform",
      { payer_role: "sponsor", balance_lamports: 1, cluster: "devnet" },
      config,
      fetchImpl as unknown as typeof fetch
    );

    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(String(url)).toBe("https://us.i.posthog.com/i/v0/e/");
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    expect(body).toMatchObject({
      api_key: "phc_test",
      event: "sponsor_balance_snapshot",
      distinct_id: "platform",
      properties: {
        payer_role: "sponsor",
        $host: "www.st.academy",
        $process_person_profile: false,
      },
    });
  });

  it("keeps the learner's person profile for user-attributed events", () => {
    const payload = buildCapturePayload(config, "sponsor_declined", "user-1", {
      reason: "in_flight",
    });
    expect(payload.distinct_id).toBe("user-1");
    expect(payload.properties).not.toHaveProperty("$process_person_profile");
  });

  it("never throws: a network failure or a rejected event is only logged", async () => {
    const down = vi.fn(async () => {
      throw new Error("ECONNRESET");
    });
    await expect(
      captureServerEvent(
        "e",
        "platform",
        {},
        config,
        down as unknown as typeof fetch
      )
    ).resolves.toBeUndefined();

    const rejected = vi.fn(async () => new Response(null, { status: 400 }));
    await captureServerEvent(
      "e",
      "platform",
      {},
      config,
      rejected as unknown as typeof fetch
    );

    expect(h.logEvent).toHaveBeenCalledTimes(2);
    expect(h.logEvent.mock.calls[0]?.[0]).toMatchObject({
      event: "ANALYTICS_SERVER_001",
    });
  });

  it("does nothing without a configuration", async () => {
    const fetchImpl = vi.fn();
    await captureServerEvent(
      "e",
      "platform",
      {},
      null,
      fetchImpl as unknown as typeof fetch
    );
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
