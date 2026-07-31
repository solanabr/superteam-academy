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
    sent: 3,
    passes: [
      { kind: "course_nudge", status: "sent", sent: 1 },
      { kind: "reengagement_7d", status: "sent", sent: 2 },
    ],
  } as Record<string, unknown>,
}));

vi.mock("@/lib/env.server", () => ({
  serverEnv: {
    get CRON_SECRET() {
      return h.cronSecret;
    },
  },
}));
vi.mock("@/lib/email/reengagement-send", () => ({
  sendReengagementEmails: (...args: unknown[]) => {
    h.sendSpy(...args);
    return Promise.resolve(h.sendResult);
  },
}));
vi.mock("@/lib/i18n/config", () => ({ defaultLocale: "en" }));

const get = async (headers: Record<string, string> = {}): Promise<Response> => {
  const { GET } = await import("../route");
  return GET(
    new Request("https://app.test/api/cron/reengagement", {
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

describe("GET /api/cron/reengagement — auth", () => {
  it("runs the send for Vercel Cron's Bearer token", async () => {
    const res = await authed();
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status: "sent", sent: 3 });
    expect(h.sendSpy).toHaveBeenCalledWith({
      appUrl: "https://app.test",
      locale: "en",
    });
  });

  it("rejects a caller with NO Authorization header", async () => {
    expect((await get()).status).toBe(401);
    expect(h.sendSpy).not.toHaveBeenCalled();
  });

  it("rejects a WRONG secret", async () => {
    expect((await get({ authorization: "Bearer not-the-secret" })).status).toBe(
      401
    );
    expect(h.sendSpy).not.toHaveBeenCalled();
  });

  it("rejects the right secret without the Bearer scheme", async () => {
    expect((await get({ authorization: h.cronSecret! })).status).toBe(401);
    expect(h.sendSpy).not.toHaveBeenCalled();
  });

  it("rejects a same-length near-miss (constant-time compare still fails)", async () => {
    const near = `Bearer ${h.cronSecret}`.replace(/.$/, "X");
    expect((await get({ authorization: near })).status).toBe(401);
    expect(h.sendSpy).not.toHaveBeenCalled();
  });

  it("FAILS CLOSED with no CRON_SECRET configured — 503, nothing sent", async () => {
    h.cronSecret = undefined;
    // Even a caller who guesses "Bearer undefined" gets nothing.
    expect((await get({ authorization: "Bearer undefined" })).status).toBe(503);
    expect(h.sendSpy).not.toHaveBeenCalled();
  });
});

describe("GET /api/cron/reengagement — configuration", () => {
  it("500s without NEXT_PUBLIC_APP_URL (email needs absolute links)", async () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    expect((await authed()).status).toBe(500);
    expect(h.sendSpy).not.toHaveBeenCalled();
  });

  it("reports an unconfigured Resend key back to the caller", async () => {
    const prev = h.sendResult;
    h.sendResult = { status: "unconfigured", sent: 0, passes: [] };
    const res = await authed();
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status: "unconfigured", sent: 0 });
    h.sendResult = prev;
  });
});

describe("vercel.json schedule", () => {
  it("registers exactly one daily cron for this route, after the reminders one", async () => {
    const { existsSync, readFileSync } = await import("node:fs");
    const { resolve, dirname } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    let dir = dirname(fileURLToPath(import.meta.url));
    while (!existsSync(resolve(dir, "vercel.json"))) {
      const parent = dirname(dir);
      if (parent === dir) throw new Error("vercel.json not found");
      dir = parent;
    }
    const cfg = JSON.parse(
      readFileSync(resolve(dir, "vercel.json"), "utf8")
    ) as {
      crons: { path: string; schedule: string }[];
    };
    const mine = cfg.crons.filter((c) => c.path === "/api/cron/reengagement");
    expect(mine).toHaveLength(1);
    // 13:00 UTC = 10:00 America/Sao_Paulo, two hours after the session-plan
    // reminder so a learner who gets both does not get them in one minute.
    expect(mine[0]!.schedule).toBe("0 13 * * *");
    const reminders = cfg.crons.find(
      (c) => c.path === "/api/cron/session-reminders"
    );
    expect(reminders?.schedule).toBe("0 11 * * *");
  });
});
