// @vitest-environment jsdom
// Runs the real posthog-js with our init options against a browser that already
// holds old state, and asserts on the bytes handed to fetch and on what's stored.
// /flags bypasses before_send, so event-level assertions alone can't cover it.
import { gunzipSync } from "node:zlib";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const TOKEN = "phc_pipeline";
const STORAGE_KEY = `ph_${TOKEN}_posthog`;
const SECRETS = [
  "fixture-oauth-code",
  "fixture-session-token",
  "fixture-hash",
  "fixture-stored-code",
  "learner@example.com",
  "fixture-wallet",
];

interface SentRequest {
  url: string;
  body: string;
}

async function decodeBody(body: unknown): Promise<string> {
  if (body instanceof Blob) {
    // jsdom's Blob has no arrayBuffer(). The SDK gzips when the runtime can.
    const bytes = await new Promise<Buffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(Buffer.from(reader.result as ArrayBuffer));
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(body);
    });
    return (
      bytes[0] === 0x1f && bytes[1] === 0x8b ? gunzipSync(bytes) : bytes
    ).toString();
  }
  if (typeof body !== "string") return String(body ?? "");
  if (!body.startsWith("data=")) return body;
  return atob(decodeURIComponent(body.slice("data=".length)));
}

describe("PostHog pipeline", () => {
  const requests: SentRequest[] = [];
  let posthog: (typeof import("posthog-js"))["default"];
  let facade: typeof import("../posthog");

  const sentTo = (path: string) =>
    requests.filter((request) => new URL(request.url).pathname.includes(path));

  beforeAll(async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        requests.push({
          url: String(url),
          body: await decodeBody(init?.body),
        });
        return new Response("{}", { status: 200 });
      })
    );
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", TOKEN);
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://ph.example.com");

    // A returning browser: state written by an earlier version of the app.
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        distinct_id: "anon-1",
        $device_id: "device-1",
        $stored_person_properties: {
          email: SECRETS[4],
          walletAddress: SECRETS[5],
        },
        $initial_person_info: {
          u: `${window.location.origin}/en?dynamicOauthCode=${SECRETS[3]}`,
          r: "$direct",
        },
      })
    );
    window.history.replaceState(
      null,
      "",
      `/en/courses?dynamicOauthCode=${SECRETS[0]}&sessionToken=${SECRETS[1]}&utm_source=newsletter#access_token=${SECRETS[2]}`
    );

    facade = await import("../posthog");
    await facade.initPostHog();
    posthog = (await import("posthog-js")).default;

    facade.trackPostHogEvent("$pageview", {
      $current_url: window.location.href,
    });
    facade.identifyPostHogUser("user-1");
    posthog.reloadFeatureFlags();
    // $identify goes at once; other events wait for the batch queue's timer.
    await vi.waitFor(
      () =>
        expect(
          sentTo("/e/")
            .map((r) => r.body)
            .join()
        ).toContain('"$pageview"'),
      { timeout: 8_000, interval: 100 }
    );
  }, 15_000);

  afterAll(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("makes no /flags or remote config request", () => {
    expect(sentTo("/flags")).toEqual([]);
    expect(sentTo("/config")).toEqual([]);
  });

  it("sends no secret, email or wallet in any request", () => {
    const bytes = requests.map((r) => `${r.url}\n${r.body}`).join("\n");

    // Readable bytes, or the absences below would prove nothing.
    expect(bytes).toContain('"$identify"');
    for (const secret of SECRETS) expect(bytes).not.toContain(secret);
  });

  it("keeps host, path and campaign on the page URL it sends", () => {
    const bytes = sentTo("/e/")
      .map((r) => r.body)
      .join("\n");

    expect(bytes).toContain(
      `${window.location.origin}/en/courses?utm_source=newsletter`
    );
    expect(bytes).toContain('"$pathname":"/en/courses"');
  });

  it("identifies with no person traits", () => {
    const bytes = sentTo("/e/")
      .map((r) => r.body)
      .join("\n");

    expect(bytes).toContain('"$identify"');
    expect(bytes).toContain('"distinct_id":"user-1"');
    expect(bytes).not.toContain('"email"');
  });

  it("leaves no secret, email or wallet in stored state", () => {
    const stored = [
      JSON.stringify(window.localStorage),
      window.localStorage.getItem(STORAGE_KEY),
      JSON.stringify(window.sessionStorage),
      window.sessionStorage.getItem(STORAGE_KEY),
      document.cookie,
      decodeURIComponent(document.cookie),
    ].join("\n");

    expect(stored).toContain("user-1");
    for (const secret of SECRETS) expect(stored).not.toContain(secret);
    expect(stored).not.toContain("walletAddress");
  });

  it("doesn't start replay when the project turns it on", () => {
    // What a remote config with replay enabled would leave behind.
    posthog.persistence?.register({
      $session_recording_remote_config: { enabled: true, endpoint: "/s/" },
    });
    posthog.sessionRecording?.startIfEnabledOrStop();

    expect(document.querySelector('script[src*="recorder"]')).toBeNull();
    expect(posthog.sessionRecordingStarted()).toBe(false);
  });
});
