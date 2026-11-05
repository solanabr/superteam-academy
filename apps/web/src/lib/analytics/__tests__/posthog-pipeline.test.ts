// @vitest-environment jsdom
// Runs the real posthog-js with our init options, so the assertions hold for the
// events the SDK builds itself and fail if an upgrade changes how it applies them.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

type Captured = {
  event: string;
  properties: Record<string, unknown>;
  $set?: Record<string, unknown>;
  $set_once?: Record<string, unknown>;
};

const SECRETS = ["fixture-oauth-code", "fixture-session-token", "fixture-hash"];

describe("PostHog pipeline", () => {
  const captured: Captured[] = [];
  let posthog: (typeof import("posthog-js"))["default"];
  let facade: typeof import("../posthog");
  const requests = vi.fn(
    async () => new Response("{}", { status: 200 }) as unknown as Response
  );

  beforeAll(async () => {
    vi.stubGlobal("fetch", requests);
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://ph.example.com");
    window.history.replaceState(
      null,
      "",
      `/en/courses?dynamicOauthCode=${SECRETS[0]}&sessionToken=${SECRETS[1]}&utm_source=newsletter#access_token=${SECRETS[2]}`
    );

    facade = await import("../posthog");
    await facade.initPostHog();
    posthog = (await import("posthog-js")).default;
    posthog.on("eventCaptured", (event) => {
      captured.push(event as unknown as Captured);
    });
  });

  afterAll(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("sends the page URL without tokens, keeping host, path and campaign", () => {
    facade.trackPostHogEvent("$pageview", {
      $current_url: window.location.href,
    });

    const pageview = captured.find((e) => e.event === "$pageview");
    expect(pageview?.properties.$current_url).toBe(
      `${window.location.origin}/en/courses?utm_source=newsletter`
    );
    expect(pageview?.properties.$host).toBe(window.location.host);
    expect(pageview?.properties.$pathname).toBe("/en/courses");
  });

  it("keeps tokens out of everything the SDK adds, person properties included", () => {
    facade.identifyPostHogUser("user-1");

    expect(captured.some((e) => e.event === "$identify")).toBe(true);
    const out = JSON.stringify(captured);
    for (const secret of SECRETS) expect(out).not.toContain(secret);
  });

  it("identifies with no person traits", () => {
    const identify = captured.find((e) => e.event === "$identify");

    expect(identify?.properties.distinct_id).toBe("user-1");
    expect(identify?.$set ?? {}).toEqual({});
  });

  it("doesn't start replay when the project turns it on", () => {
    // What a remote config with replay enabled leaves behind.
    posthog.persistence?.register({
      $session_recording_remote_config: { enabled: true, endpoint: "/s/" },
    });
    posthog.sessionRecording?.startIfEnabledOrStop();

    expect(document.querySelector('script[src*="recorder"]')).toBeNull();
    expect(posthog.sessionRecordingStarted()).toBe(false);
  });
});
