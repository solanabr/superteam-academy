/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the route import so the `server-only` graph loads under vitest. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const h = vi.hoisted(() => ({
  cronSecret: "s3cret-value" as string | undefined,
  sendSpy: vi.fn(),
  sendResult: {
    status: "sent",
    recipients: 2,
    sent: 2,
    failedBatches: 0,
    released: 0,
  },
}));

vi.mock("@/lib/env.server", () => ({
  serverEnv: {
    get CRON_SECRET() {
      return h.cronSecret;
    },
  },
}));
vi.mock("@/lib/email/reminders", () => ({
  sendSessionPlanReminders: (...args: unknown[]) => {
    h.sendSpy(...args);
    return Promise.resolve(h.sendResult);
  },
}));
vi.mock("@/lib/i18n/config", () => ({ defaultLocale: "en" }));

const get = async (headers: Record<string, string> = {}): Promise<Response> => {
  const { GET } = await import("../route");
  return GET(
    new Request("https://app.test/api/cron/session-reminders", {
      headers,
    }) as unknown as NextRequest
  );
};

const authed = () => get({ authorization: `Bearer ${h.cronSecret}` });

beforeEach(() => {
  h.cronSecret = "s3cret-value";
  h.sendSpy.mockReset();
  process.env.NEXT_PUBLIC_APP_URL = "https://app.test";
});

describe("GET /api/cron/session-reminders — auth", () => {
  it("runs the send for Vercel Cron's Bearer token", async () => {
    const res = await authed();
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status: "sent", sent: 2 });
    expect(h.sendSpy).toHaveBeenCalledWith({
      appUrl: "https://app.test",
      locale: "en",
    });
  });

  it("rejects a caller with NO Authorization header", async () => {
    const res = await get();
    expect(res.status).toBe(401);
    expect(h.sendSpy).not.toHaveBeenCalled();
  });

  it("rejects a WRONG secret", async () => {
    const res = await get({ authorization: "Bearer not-the-secret" });
    expect(res.status).toBe(401);
    expect(h.sendSpy).not.toHaveBeenCalled();
  });

  it("rejects the right secret without the Bearer scheme", async () => {
    const res = await get({ authorization: h.cronSecret! });
    expect(res.status).toBe(401);
    expect(h.sendSpy).not.toHaveBeenCalled();
  });

  it("rejects a same-length near-miss (constant-time compare still fails)", async () => {
    const near = `Bearer ${h.cronSecret}`.replace(/.$/, "X");
    const res = await get({ authorization: near });
    expect(res.status).toBe(401);
    expect(h.sendSpy).not.toHaveBeenCalled();
  });

  it("FAILS CLOSED with no CRON_SECRET configured — 503, nothing sent", async () => {
    h.cronSecret = undefined;
    // Even a caller who guesses "Bearer undefined" gets nothing.
    const res = await get({ authorization: "Bearer undefined" });
    expect(res.status).toBe(503);
    expect(h.sendSpy).not.toHaveBeenCalled();
  });
});

describe("GET /api/cron/session-reminders — configuration", () => {
  it("500s without NEXT_PUBLIC_APP_URL (email needs absolute links)", async () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    const res = await authed();
    expect(res.status).toBe(500);
    expect(h.sendSpy).not.toHaveBeenCalled();
  });

  it("reports an unconfigured Resend key back to the caller", async () => {
    h.sendResult = {
      status: "unconfigured",
      recipients: 0,
      sent: 0,
      failedBatches: 0,
      released: 0,
    };
    const res = await authed();
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status: "unconfigured", sent: 0 });
    h.sendResult = {
      status: "sent",
      recipients: 2,
      sent: 2,
      failedBatches: 0,
      released: 0,
    };
  });
});
