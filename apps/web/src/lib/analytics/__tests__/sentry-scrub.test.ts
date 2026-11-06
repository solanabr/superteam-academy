import { describe, it, expect } from "vitest";
import type { Breadcrumb, ErrorEvent, Event } from "@sentry/nextjs";
import {
  scrubSentryBreadcrumb,
  scrubSentryEvent,
  scrubSentrySpan,
  sentryScrubIntegration,
} from "../sentry-scrub";

// Assembled so a secret scanner doesn't read these fixtures as real credentials.
const KEY = ["AIza", "SyTELEMETRYTESTKEY0000000000000000000"].join("");
const RPC_KEY = "rpc-telemetry-test-key";
const COOKIE = "sb-access-token=telemetry-session-cookie";
const LEARNER_CODE = "const secretSolution = () => 42; // learner code";
const CHAT = "please explain my bug, tutor";

function errorEvent(overrides: Partial<ErrorEvent>): ErrorEvent {
  return { type: undefined, ...overrides } as ErrorEvent;
}

function serialized(value: unknown): string {
  return JSON.stringify(value);
}

describe("scrubSentryEvent: request data", () => {
  it("drops cookies, bodies, query strings and auth headers", () => {
    const event = scrubSentryEvent(
      errorEvent({
        request: {
          method: "POST",
          url: "https://www.st.academy/api/ai/partner?token=abc#frag",
          query_string: "token=abc",
          cookies: { "sb-access-token": "telemetry-session-cookie" },
          data: { code: LEARNER_CODE, message: CHAT },
          env: { REMOTE_ADDR: "203.0.113.7" },
          headers: {
            cookie: COOKIE,
            authorization: "Bearer telemetry-cron-secret",
            "x-goog-api-key": KEY,
            "x-forwarded-for": "203.0.113.7",
            referer: "https://www.st.academy/en?code=oauth-code",
            "user-agent": "vitest-agent",
            "x-vercel-id": "gru1::abc",
          },
        },
      })
    );

    expect(event?.request).toEqual({
      method: "POST",
      url: "https://www.st.academy/api/ai/partner",
      headers: { "user-agent": "vitest-agent", "x-vercel-id": "gru1::abc" },
    });
  });

  it("keeps the header allowlist case-insensitive for the browser's User-Agent", () => {
    const event = scrubSentryEvent(
      errorEvent({
        request: {
          url: "https://www.st.academy/en/courses?dynamicOauthCode=x",
          headers: {
            "User-Agent": "browser-agent",
            Referer: "https://accounts.google.com/?code=y",
          },
        },
      })
    );

    expect(event?.request?.headers).toEqual({ "User-Agent": "browser-agent" });
    expect(event?.request?.url).toBe("https://www.st.academy/en/courses");
  });

  it("strips the query from the Next.js request path but keeps the route", () => {
    const event = scrubSentryEvent(
      errorEvent({
        transaction: "/api/email/unsubscribe",
        contexts: {
          nextjs: {
            request_path: "/api/email/unsubscribe?token=unsub-token&kind=x",
            router_kind: "App Router",
            router_path: "/api/email/unsubscribe",
            route_type: "route",
          },
        },
      })
    );

    expect(event?.contexts?.nextjs).toEqual({
      request_path: "/api/email/unsubscribe",
      router_kind: "App Router",
      router_path: "/api/email/unsubscribe",
      route_type: "route",
    });
    expect(event?.transaction).toBe("/api/email/unsubscribe");
  });

  it("reduces the user to an id", () => {
    const event = scrubSentryEvent(
      errorEvent({
        user: {
          id: "user-1",
          email: "learner@example.com",
          ip_address: "203.0.113.7",
          username: "learner",
        },
      })
    );

    expect(event?.user).toEqual({ id: "user-1" });
  });
});

describe("scrubSentryEvent: keeps errors useful", () => {
  it("leaves stack frames, ids, tags and trace ids alone", () => {
    const frames = [
      {
        filename: "app:///_next/static/chunks/page.js",
        function: "render",
        lineno: 12,
        colno: 4,
        in_app: true,
      },
    ];
    const event = scrubSentryEvent(
      errorEvent({
        event_id: "abc123",
        tags: { surface: "platform", error_digest: "1234567" },
        contexts: { trace: { trace_id: "t1", span_id: "s1" } },
        exception: {
          values: [
            {
              type: "TypeError",
              value: "x is not a function",
              stacktrace: { frames },
            },
          ],
        },
      })
    );

    expect(event?.event_id).toBe("abc123");
    expect(event?.tags).toEqual({
      surface: "platform",
      error_digest: "1234567",
    });
    expect(event?.contexts?.trace).toMatchObject({
      trace_id: "t1",
      span_id: "s1",
    });
    expect(event?.exception?.values?.[0]).toEqual({
      type: "TypeError",
      value: "x is not a function",
      stacktrace: { frames },
    });
  });

  it("removes local variables from frames", () => {
    const event = scrubSentryEvent(
      errorEvent({
        exception: {
          values: [
            {
              type: "Error",
              value: "boom",
              stacktrace: {
                frames: [{ function: "f", vars: { code: LEARNER_CODE } }],
              },
            },
          ],
        },
      })
    );

    expect(serialized(event)).not.toContain("secretSolution");
    expect(
      event?.exception?.values?.[0]?.stacktrace?.frames?.[0]?.function
    ).toBe("f");
  });
});

describe("scrubSentryEvent: stack frames and identifiers", () => {
  const url = "https://www.st.academy/en?dynamicOauthCode=abc#access_token=def";
  const clean = "https://www.st.academy/en";

  it("strips the query from frame file names, keeping the frame", () => {
    const event = scrubSentryEvent(
      errorEvent({
        exception: {
          values: [
            {
              type: "Error",
              value: "boom",
              stacktrace: {
                frames: [
                  { filename: url, abs_path: url, function: "f", lineno: 3 },
                  { filename: "app:///_next/x.js?dpl=abc", function: "g" },
                ],
              },
            },
          ],
        },
      })
    );

    expect(event?.exception?.values?.[0]?.stacktrace?.frames).toEqual([
      { filename: clean, abs_path: clean, function: "f", lineno: 3 },
      { filename: "app:///_next/x.js", function: "g" },
    ]);
  });

  it("covers thread stacks and debug images too", () => {
    const event = scrubSentryEvent(
      errorEvent({
        threads: {
          values: [{ stacktrace: { frames: [{ filename: url }] } }],
        },
        debug_meta: {
          images: [{ type: "sourcemap", code_file: url, debug_id: "d1" }],
        },
      } as Partial<ErrorEvent>)
    );

    expect(serialized(event)).not.toContain("dynamicOauthCode");
    expect(serialized(event)).toContain('"debug_id":"d1"');
  });

  it("scrubs exception type, mechanism data and fingerprint", () => {
    const event = scrubSentryEvent(
      errorEvent({
        fingerprint: ["{{ default }}", url, `key=${KEY}`],
        exception: {
          values: [
            {
              type: `Failed ${url}`,
              value: "boom",
              mechanism: {
                type: "generic",
                handled: false,
                data: { target: url, authorization: "Bearer abc" },
              },
            },
          ],
        },
      })
    );
    const out = serialized(event);

    expect(out).not.toContain("dynamicOauthCode");
    expect(out).not.toContain(KEY);
    expect(out).not.toContain("Bearer abc");
    expect(event?.fingerprint?.[0]).toBe("{{ default }}");
    expect(event?.exception?.values?.[0]?.mechanism?.type).toBe("generic");
  });
});

describe("scrubSentryEvent: malformed input", () => {
  it.each([
    ["message", { message: { nested: KEY } }],
    ["message number", { message: 12 }],
    ["request url", { request: { url: 42, headers: "nope" } }],
    ["null headers", { request: { url: "/a?b", headers: null } }],
    ["exception value", { exception: { values: [{ value: { a: KEY } }] } }],
    ["exception values", { exception: { values: "nope" } }],
    ["frames", { exception: { values: [{ stacktrace: { frames: 3 } }] } }],
    [
      "frame file",
      {
        exception: { values: [{ stacktrace: { frames: [{ filename: 7 }] } }] },
      },
    ],
    ["breadcrumbs", { breadcrumbs: "nope" }],
    ["breadcrumb message", { breadcrumbs: [{ message: { a: KEY } }] }],
    [
      "span description",
      { spans: [{ description: { a: KEY }, data: { url: 1 } }] },
    ],
    ["spans", { spans: 5 }],
    ["fingerprint", { fingerprint: "nope" }],
  ])("doesn't throw on a non-string %s", (_name, overrides) => {
    let out: unknown;

    expect(() => {
      out = scrubSentryEvent(
        errorEvent(overrides as unknown as Partial<ErrorEvent>)
      );
    }).not.toThrow();
    expect(serialized(out)).not.toContain(KEY);
  });

  it("returns a bare event rather than throwing if scrubbing fails", () => {
    const event = errorEvent({ event_id: "abc123", level: "error" });
    Object.defineProperty(event, "extra", {
      enumerable: true,
      get() {
        throw new Error("hostile getter");
      },
    });

    let out: ErrorEvent | null | undefined;
    expect(() => {
      out = scrubSentryEvent(event);
    }).not.toThrow();
    expect(out?.event_id).toBe("abc123");
    expect(Object.keys(out ?? {})).not.toContain("extra");
  });

  it("doesn't throw from a breadcrumb or a span with a hostile getter", () => {
    const hostile = {};
    Object.defineProperty(hostile, "message", {
      enumerable: true,
      get() {
        throw new Error("hostile getter");
      },
    });

    expect(() => scrubSentryBreadcrumb(hostile)).not.toThrow();
    expect(() => scrubSentrySpan(hostile as never)).not.toThrow();
  });
});

describe("sentryScrubIntegration", () => {
  it("scrubs as an event processor, so it also covers SDK-internal events", () => {
    const event = sentryScrubIntegration.processEvent(
      errorEvent({
        request: {
          url: "https://www.st.academy/en?token=abc",
          headers: {
            authorization: "Bearer abc",
            "x-forwarded-for": "1.2.3.4",
          },
        },
      })
    );

    expect(serialized(event)).not.toContain("token=abc");
    expect(serialized(event)).not.toContain("Bearer abc");
    expect(serialized(event)).not.toContain("1.2.3.4");
  });
});

describe("scrubSentryEvent: free text", () => {
  it("removes keyed URLs and credentials from error messages", () => {
    const event = scrubSentryEvent(
      errorEvent({
        message: `request to https://generativelanguage.googleapis.com/v1beta/models/m:generateContent?key=${KEY} failed`,
        exception: {
          values: [
            {
              type: "Error",
              value: `fetch failed for https://mainnet.helius-rpc.com/?api-key=${RPC_KEY}; Authorization: Bearer telemetry-cron-secret`,
            },
            {
              type: "Error",
              value: `postgres://admin:telemetry-db-pass@db.example.com:5432/app down, key=${KEY}`,
            },
          ],
        },
      })
    );
    const out = serialized(event);

    expect(out).not.toContain(KEY);
    expect(out).not.toContain(RPC_KEY);
    expect(out).not.toContain("telemetry-cron-secret");
    expect(out).not.toContain("telemetry-db-pass");
    expect(out).toContain("generativelanguage.googleapis.com");
    expect(out).toContain("mainnet.helius-rpc.com");
    expect(out).toContain("db.example.com");
  });

  it("removes bare Google keys and JWTs that aren't in a URL", () => {
    const jwt = [
      "eyJhbGciOiJIUzI1NiJ9",
      "eyJzdWIiOiIxIn0",
      "c2lnbmF0dXJl",
    ].join(".");
    const event = scrubSentryEvent(
      errorEvent({ message: `bad credential ${KEY} and ${jwt}` })
    );

    expect(event?.message).not.toContain(KEY);
    expect(event?.message).not.toContain(jwt);
  });

  it("doesn't mangle the usual JS syntax error wording", () => {
    const event = scrubSentryEvent(
      errorEvent({
        message: "Unexpected token '<', \"<!DOCTYPE \" is not valid JSON",
      })
    );

    expect(event?.message).toBe(
      "Unexpected token '<', \"<!DOCTYPE \" is not valid JSON"
    );
  });

  it("caps very long strings so a pasted payload can't ride along", () => {
    const event = scrubSentryEvent(
      errorEvent({ message: `prefix ${"x".repeat(5_000)}` })
    );

    expect(event?.message?.length).toBeLessThan(1_100);
    expect(event?.message?.startsWith("prefix ")).toBe(true);
  });
});

describe("scrubSentryEvent: extras and contexts", () => {
  it("drops learner text and credentials by key, at any depth", () => {
    const event = scrubSentryEvent(
      errorEvent({
        extra: {
          model: "gemini",
          status: 502,
          body: { contents: [{ parts: [{ text: CHAT }] }] },
          nested: {
            prompt: CHAT,
            messages: [CHAT],
            code: LEARNER_CODE,
            apiKey: KEY,
            authorization: "Bearer telemetry-cron-secret",
            cookies: COOKIE,
          },
        },
      })
    );
    const out = serialized(event);

    expect(out).not.toContain(CHAT);
    expect(out).not.toContain("secretSolution");
    expect(out).not.toContain(KEY);
    expect(out).not.toContain("telemetry-cron-secret");
    expect(out).not.toContain("telemetry-session-cookie");
    expect(event?.extra?.model).toBe("gemini");
    expect(event?.extra?.status).toBe(502);
  });

  it("keeps a short error code under the `code` key", () => {
    const event = scrubSentryEvent(
      errorEvent({ extra: { code: "ECONNRESET" } })
    );

    expect(event?.extra?.code).toBe("ECONNRESET");
  });

  it("survives cycles and deep nesting", () => {
    const cyclic: Record<string, unknown> = { name: "a" };
    cyclic.self = cyclic;
    let deep: Record<string, unknown> = { leaf: true };
    for (let i = 0; i < 30; i++) deep = { deep };

    expect(() =>
      scrubSentryEvent(errorEvent({ extra: { cyclic, deep } }))
    ).not.toThrow();
  });
});

describe("scrubSentryEvent: transactions and spans", () => {
  function transaction(): Event {
    return {
      type: "transaction",
      transaction: "POST /api/ai/partner",
      contexts: {
        trace: {
          trace_id: "t1",
          span_id: "s1",
          data: {
            "http.route": "/api/ai/partner",
            "http.target": "/api/ai/partner?token=abc",
            "http.url": "https://www.st.academy/api/ai/partner?token=abc",
            "url.query": "?token=abc",
            "http.request.header.cookie.sb_access_token": "[Filtered]",
            "http.request.header.x_cron_token": "telemetry-cron-secret",
          },
        },
      },
      spans: [
        {
          span_id: "s2",
          trace_id: "t1",
          start_timestamp: 0,
          op: "http.client",
          description: `POST https://generativelanguage.googleapis.com/v1beta/models/m:generateContent?key=${KEY}`,
          data: {
            "http.request.method": "POST",
            "url.full": `https://generativelanguage.googleapis.com/v1beta/models/m:generateContent?key=${KEY}`,
            "url.path": "/v1beta/models/m:generateContent",
            "url.query": `?key=${KEY}`,
            "url.scheme": "https",
            "server.address": "generativelanguage.googleapis.com",
            "http.response.status_code": 200,
          },
        },
        {
          span_id: "s3",
          trace_id: "t1",
          start_timestamp: 0,
          op: "http.client",
          description: `POST https://mainnet.helius-rpc.com/?api-key=${RPC_KEY}`,
          data: {
            url: `https://mainnet.helius-rpc.com/?api-key=${RPC_KEY}`,
            "http.url": `https://mainnet.helius-rpc.com/?api-key=${RPC_KEY}`,
            "http.query": `?api-key=${RPC_KEY}`,
            "http.fragment": "#frag",
          },
        },
      ],
    } as Event;
  }

  it("removes URLs' secrets from every span and the root trace context", () => {
    const out = serialized(scrubSentryEvent(transaction()));

    expect(out).not.toContain(KEY);
    expect(out).not.toContain(RPC_KEY);
    expect(out).not.toContain("telemetry-cron-secret");
    expect(out).not.toContain("?token=abc");
    expect(out).not.toContain("sb_access_token");
  });

  it("reduces an outbound URL to its origin", () => {
    const event = scrubSentryEvent(transaction());
    const span = event?.spans?.[0];

    expect(span?.data?.["url.full"]).toBe(
      "https://generativelanguage.googleapis.com"
    );
    expect(span?.description).toBe(
      "POST https://generativelanguage.googleapis.com"
    );
    expect(span?.data?.["url.path"]).toBeUndefined();
    expect(span?.data?.["http.response.status_code"]).toBe(200);
    expect(span?.data?.["server.address"]).toBe(
      "generativelanguage.googleapis.com"
    );
  });

  it("keeps the route on the root span", () => {
    const event = scrubSentryEvent(transaction());

    expect(event?.transaction).toBe("POST /api/ai/partner");
    expect(event?.contexts?.trace?.data?.["http.route"]).toBe(
      "/api/ai/partner"
    );
  });

  it("scrubs a standalone span the same way", () => {
    const span = scrubSentrySpan({
      span_id: "s9",
      trace_id: "t1",
      start_timestamp: 0,
      description: "GET /en/courses?sessionToken=abc",
      data: {
        url: "/en/courses?sessionToken=abc",
        "http.query": "?sessionToken=abc",
      },
    });

    expect(span.description).toBe("GET /en/courses");
    expect(span.data).toEqual({ url: "/en/courses" });
  });
});

describe("scrubSentryBreadcrumb", () => {
  it("drops console breadcrumbs, whose arguments can hold anything", () => {
    expect(
      scrubSentryBreadcrumb({
        category: "console",
        level: "error",
        message: `Gemini partner API error: ${CHAT}`,
      })
    ).toBeNull();
  });

  it("keeps only the leading [errorId] of a console breadcrumb", () => {
    const crumb = scrubSentryBreadcrumb({
      category: "console",
      level: "error",
      timestamp: 12,
      message: `[LESSON_REFLECT_FAILED] Gemini reply HTTP 500 ${CHAT}`,
      data: { arguments: [CHAT], logger: "console" },
    });

    expect(crumb).toEqual({
      category: "console",
      level: "error",
      timestamp: 12,
      message: "[LESSON_REFLECT_FAILED]",
    });
  });

  it("reduces an outbound HTTP breadcrumb to origin, method and status", () => {
    const crumb: Breadcrumb = {
      category: "http",
      type: "http",
      data: {
        url: "https://mainnet.helius-rpc.com/",
        "http.method": "POST",
        "http.query": `?api-key=${RPC_KEY}`,
        "http.fragment": "#frag",
        status_code: 200,
      },
    };

    expect(scrubSentryBreadcrumb(crumb)?.data).toEqual({
      url: "https://mainnet.helius-rpc.com",
      "http.method": "POST",
      status_code: 200,
    });
  });

  it("keeps a same-origin path on fetch breadcrumbs, without the query", () => {
    const crumb = scrubSentryBreadcrumb({
      category: "fetch",
      type: "http",
      data: {
        url: "/api/lessons/complete?x=1",
        method: "POST",
        status_code: 500,
      },
    });

    expect(crumb?.data).toEqual({
      url: "/api/lessons/complete",
      method: "POST",
      status_code: 500,
    });
  });

  it("strips tokens from navigation breadcrumbs", () => {
    const crumb = scrubSentryBreadcrumb({
      category: "navigation",
      data: {
        from: "/en?dynamicOauthCode=abc&dynamicOauthState=def",
        to: "/en/dashboard#access_token=abc",
      },
    });

    expect(crumb?.data).toEqual({ from: "/en", to: "/en/dashboard" });
  });

  it("keeps UI breadcrumbs", () => {
    const crumb = { category: "ui.click", message: "div.lesson > button.run" };

    expect(scrubSentryBreadcrumb({ ...crumb })).toEqual(crumb);
  });

  it("also scrubs breadcrumbs already on an event", () => {
    const event = scrubSentryEvent(
      errorEvent({
        breadcrumbs: [
          { category: "console", message: CHAT },
          {
            category: "fetch",
            data: { url: `https://mainnet.helius-rpc.com/?api-key=${RPC_KEY}` },
          },
        ],
      })
    );

    expect(event?.breadcrumbs).toEqual([
      { category: "fetch", data: { url: "https://mainnet.helius-rpc.com" } },
    ]);
  });
});
