/* eslint-disable import/order -- vi.mock('server-only') and the env stub must
   be hoisted above the guard import so the `server-only` graph loads. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

const h = vi.hoisted(() => ({ cronSecret: "s3cret-value" as string | undefined }));

vi.mock("@/lib/env.server", () => ({
  serverEnv: {
    get CRON_SECRET() {
      return h.cronSecret;
    },
  },
}));

import { runCronJob, CRON_CODES } from "../guard";

const headers = (init: Record<string, string> = {}) => new Headers(init);
const authed = () => headers({ authorization: `Bearer ${h.cronSecret}` });

let errorSpy: ReturnType<typeof vi.spyOn>;
let warnSpy: ReturnType<typeof vi.spyOn>;

/** Every `[CRON_00n]` code emitted across console.error + console.warn. */
const loggedCodes = (): string[] =>
  [...errorSpy.mock.calls, ...warnSpy.mock.calls].map(
    (call) => String(call[0]) // logEvent emits `[CODE]` as the first arg
  );

beforeEach(() => {
  h.cronSecret = "s3cret-value";
  process.env.NEXT_PUBLIC_APP_URL = "https://app.test";
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("runCronJob — guard", () => {
  it("runs the job for Vercel Cron's Bearer token and returns the counts", async () => {
    const run = vi.fn().mockResolvedValue({ status: "sent", sent: 2 });
    const res = await runCronJob("session-reminders", authed(), run);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      job: "session-reminders",
      status: "sent",
      sent: 2,
    });
    expect(run).toHaveBeenCalledWith("https://app.test");
    expect(loggedCodes()).toEqual([]);
  });

  it("rejects a caller with NO Authorization header", async () => {
    const run = vi.fn();
    const res = await runCronJob("session-reminders", headers(), run);

    expect(res.status).toBe(401);
    expect(run).not.toHaveBeenCalled();
  });

  it("rejects a WRONG secret", async () => {
    const run = vi.fn();
    const res = await runCronJob(
      "session-reminders",
      headers({ authorization: "Bearer not-the-secret" }),
      run
    );

    expect(res.status).toBe(401);
    expect(run).not.toHaveBeenCalled();
  });

  it("rejects the right secret without the Bearer scheme", async () => {
    const run = vi.fn();
    const res = await runCronJob(
      "session-reminders",
      headers({ authorization: h.cronSecret! }),
      run
    );

    expect(res.status).toBe(401);
    expect(run).not.toHaveBeenCalled();
  });

  it("rejects a same-length near-miss (constant-time compare still fails)", async () => {
    const run = vi.fn();
    const near = `Bearer ${h.cronSecret}`.replace(/.$/, "X");
    const res = await runCronJob(
      "session-reminders",
      headers({ authorization: near }),
      run
    );

    expect(res.status).toBe(401);
    expect(run).not.toHaveBeenCalled();
  });

  it("FAILS CLOSED with no CRON_SECRET configured — 503, job never runs", async () => {
    h.cronSecret = undefined;
    const run = vi.fn();
    // Even a caller who guesses "Bearer undefined" gets nothing.
    const res = await runCronJob(
      "session-reminders",
      headers({ authorization: "Bearer undefined" }),
      run
    );

    expect(res.status).toBe(503);
    expect(run).not.toHaveBeenCalled();
  });
});

describe("runCronJob — every non-2xx logs a stable code", () => {
  it("logs CRON_001 with the job name when CRON_SECRET is unset", async () => {
    h.cronSecret = undefined;
    const res = await runCronJob("session-reminders", headers(), vi.fn());

    expect(await res.json()).toMatchObject({ code: CRON_CODES.UNCONFIGURED });
    expect(loggedCodes()).toContain(`[${CRON_CODES.UNCONFIGURED}]`);
    expect(errorSpy).toHaveBeenCalledWith(
      `[${CRON_CODES.UNCONFIGURED}]`,
      expect.objectContaining({ job: "session-reminders" })
    );
  });

  it("logs CRON_002 on an unauthorized caller", async () => {
    const res = await runCronJob(
      "reengagement",
      headers({ authorization: "Bearer nope" }),
      vi.fn()
    );

    expect(await res.json()).toMatchObject({ code: CRON_CODES.UNAUTHORIZED });
    expect(warnSpy).toHaveBeenCalledWith(
      `[${CRON_CODES.UNAUTHORIZED}]`,
      expect.objectContaining({ job: "reengagement", hasHeader: true })
    );
  });

  it("logs CRON_003 when NEXT_PUBLIC_APP_URL is unset", async () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    const run = vi.fn();
    const res = await runCronJob("session-reminders", authed(), run);

    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ code: CRON_CODES.NO_APP_URL });
    expect(loggedCodes()).toContain(`[${CRON_CODES.NO_APP_URL}]`);
    expect(run).not.toHaveBeenCalled();
  });

  it("logs CRON_004 and 500s when the job throws", async () => {
    const run = vi.fn().mockRejectedValue(new Error("resend exploded"));
    const res = await runCronJob("reengagement", authed(), run);

    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ code: CRON_CODES.RUN_FAILED });
    expect(errorSpy).toHaveBeenCalledWith(
      `[${CRON_CODES.RUN_FAILED}]`,
      expect.objectContaining({ job: "reengagement", message: "resend exploded" })
    );
  });

  it("uses a distinct code per failure mode", async () => {
    expect(new Set(Object.values(CRON_CODES)).size).toBe(
      Object.values(CRON_CODES).length
    );
  });
});
