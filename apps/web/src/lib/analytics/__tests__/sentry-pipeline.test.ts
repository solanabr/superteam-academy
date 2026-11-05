// Runs the real server config and SDK against a local ingest: an outbound fetch
// with a key in its query string, an incoming request that fails mid-handler,
// and a captureRequestError with a session cookie. Asserts on the envelope bytes,
// so an SDK upgrade that opens a new channel fails here rather than in production.
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { gunzipSync } from "node:zlib";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Assembled so a secret scanner doesn't read these fixtures as real credentials.
const URL_KEY = ["AIza", "SyTELEMETRYPIPELINEKEY000000000000000"].join("");
const MESSAGE_KEY = ["AIza", "SyTELEMETRYPIPELINEMSG000000000000000"].join("");
const COOKIE_VALUE = "telemetry-pipeline-session-cookie";
const CRON_SECRET = "telemetry-pipeline-cron-secret";
const UNSUBSCRIBE = "telemetry-pipeline-unsubscribe-token";
const INCOMING_TOKEN = "telemetry-pipeline-incoming-token";
// Assembled, because the SDK attaches source lines to stack frames and a literal
// here would land in the envelope however the body is handled.
const LEARNER_BODY = ["learner", "code", "and", "chat"].join("-");

// An event processor throwing makes the SDK send an internal replacement event,
// which bypasses beforeSend.
const PROCESSOR_TRIGGER = "make the processor throw";
const INTERNAL_MARKER = "processor threw";
const INTERNAL_AUTH = "telemetry-pipeline-internal-auth";
const INTERNAL_IP = "203.0.113.77";
const INTERNAL_QUERY = "telemetry-pipeline-internal-query";

describe("Sentry server pipeline", () => {
  const sent: string[] = [];
  let server: Server;
  let base: string;
  let Sentry: typeof import("@sentry/nextjs");

  beforeAll(async () => {
    // One local server plays both the outbound API and Sentry's ingest, so the
    // real config runs with the real transport and nothing is mocked.
    server = createServer(async (req, res) => {
      const chunks: Buffer[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      // Awaited, as a route handler would, which keeps the request's Sentry scope.
      await new Promise((resolve) => req.on("end", resolve));
      if (req.url?.startsWith("/api/ai/partner")) {
        Sentry.captureException(new Error("handler failed"));
      }
      if (req.url?.startsWith("/api/internal")) {
        Sentry.captureException(new Error(PROCESSOR_TRIGGER));
      }
      if (req.url?.includes("/envelope/")) {
        const raw = Buffer.concat(chunks);
        sent.push(
          (req.headers["content-encoding"] === "gzip"
            ? gunzipSync(raw)
            : raw
          ).toString()
        );
      }
      res.end("{}");
    });
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve)
    );
    const { port } = server.address() as AddressInfo;
    base = `http://127.0.0.1:${port}`;

    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", `http://k@127.0.0.1:${port}/1`);
    // Development samples every trace, so a span is sure to reach the envelope.
    vi.stubEnv("NODE_ENV", "development");
    Sentry = await import("@sentry/nextjs");
    await import("../../../../sentry.server.config");
    Sentry.addEventProcessor((event) => {
      if (event.exception?.values?.[0]?.value === PROCESSOR_TRIGGER) {
        throw new Error(INTERNAL_MARKER);
      }
      return event;
    });
  }, 60_000);

  afterAll(async () => {
    await Sentry?.close?.();
    vi.unstubAllEnvs();
    await new Promise((resolve) => server.close(resolve));
  });

  it("carries no key, cookie, secret or token, and keeps the route", async () => {
    await Sentry.startSpan({ name: "POST /api/ai/partner" }, async () => {
      await fetch(`${base}/v1beta/models/m:generateContent?key=${URL_KEY}`, {
        method: "POST",
        body: LEARNER_BODY,
      });
    });

    await fetch(`${base}/api/ai/partner?token=${INCOMING_TOKEN}`, {
      method: "POST",
      headers: {
        cookie: `sb-access-token=${COOKIE_VALUE}`,
        authorization: `Bearer ${CRON_SECRET}`,
      },
      body: LEARNER_BODY,
    });

    Sentry.captureRequestError(
      new Error(`upstream rejected key=${MESSAGE_KEY}`),
      {
        path: `/api/email/unsubscribe?token=${UNSUBSCRIBE}`,
        method: "GET",
        headers: {
          cookie: `sb-access-token=${COOKIE_VALUE}`,
          authorization: `Bearer ${CRON_SECRET}`,
          "user-agent": "vitest-agent",
        },
      },
      {
        routerKind: "App Router",
        routePath: "/api/email/unsubscribe",
        routeType: "route",
      }
    );
    await Sentry.flush(2_000);

    const out = sent.join("\n");
    // The error, the transaction and the outbound span and breadcrumb must all
    // have flowed, or the absences below prove nothing.
    expect(out).toContain("/api/email/unsubscribe");
    expect(out).toContain("POST /api/ai/partner");
    expect(out).toContain('"op":"http.client"');
    expect(out).toContain('"category":"http"');
    expect(out).toContain("vitest-agent");
    expect(out).toContain("handler failed");

    expect.soft(out, "outbound key").not.toContain(URL_KEY);
    expect.soft(out, "key in message").not.toContain(MESSAGE_KEY);
    expect.soft(out, "session cookie").not.toContain(COOKIE_VALUE);
    expect.soft(out, "auth header").not.toContain(CRON_SECRET);
    expect.soft(out, "token in path").not.toContain(UNSUBSCRIBE);
    expect.soft(out, "incoming query").not.toContain(INCOMING_TOKEN);
    expect.soft(out, "request body").not.toContain(LEARNER_BODY);
  });

  it("scrubs the SDK's internal replacement event too", async () => {
    sent.length = 0;

    await fetch(`${base}/api/internal?token=${INTERNAL_QUERY}`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${INTERNAL_AUTH}`,
        "x-forwarded-for": INTERNAL_IP,
        "x-vercel-id": "gru1::internal",
      },
    });
    await Sentry.flush(2_000);

    const events = sent
      .flatMap((envelope) => envelope.split("\n"))
      .filter((line) => line.includes(INTERNAL_MARKER));
    expect(events.length).toBeGreaterThan(0);

    const internal = events.join("\n");
    expect(internal).toContain('"type":"internal"');
    expect(internal).toContain("gru1::internal");
    expect.soft(internal, "auth header").not.toContain(INTERNAL_AUTH);
    expect.soft(internal, "client address").not.toContain(INTERNAL_IP);
    expect.soft(internal, "query").not.toContain(INTERNAL_QUERY);
  });
});
