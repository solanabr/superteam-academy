import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

// Mutable mock env so we can flip RESEND_API_KEY between tests.
const env = vi.hoisted(() => ({
  RESEND_API_KEY: undefined as string | undefined,
  EMAIL_FROM: undefined as string | undefined,
}));
vi.mock("@/lib/env.server", () => ({ serverEnv: env }));

import {
  sendEmailBatch,
  isEmailConfigured,
  emailFrom,
  DEFAULT_EMAIL_FROM,
  RESEND_MAX_BATCH,
  type EmailMessage,
} from "../resend";

const msg = (to: string): EmailMessage => ({
  to,
  subject: "s",
  html: "<p>h</p>",
  text: "t",
  headers: { "List-Unsubscribe": "<https://x/u>" },
});

beforeEach(() => {
  env.RESEND_API_KEY = undefined;
  env.EMAIL_FROM = undefined;
});

describe("fail-closed when unconfigured", () => {
  it("returns 'unconfigured' and sends NOTHING without a key", async () => {
    const fetchImpl = vi.fn();
    const r = await sendEmailBatch([msg("a@b.com")], { fetchImpl });
    expect(r).toEqual({ ok: false, reason: "unconfigured" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("isEmailConfigured reflects the key", () => {
    expect(isEmailConfigured()).toBe(false);
    env.RESEND_API_KEY = "re_x";
    expect(isEmailConfigured()).toBe(true);
  });

  it("emailFrom falls back to the default when unset", () => {
    expect(emailFrom()).toBe(DEFAULT_EMAIL_FROM);
    env.EMAIL_FROM = "News <news@st.academy>";
    expect(emailFrom()).toBe("News <news@st.academy>");
  });
});

describe("sendEmailBatch (configured)", () => {
  beforeEach(() => {
    env.RESEND_API_KEY = "re_test";
  });

  it("POSTs the batch with auth + idempotency, and reports sent count", async () => {
    const fetchImpl = vi.fn(
      (_url: string | URL | Request, _init?: RequestInit) =>
        Promise.resolve(new Response("{}", { status: 200 }))
    );
    const r = await sendEmailBatch([msg("a@b.com"), msg("c@d.com")], {
      idempotencyKey: "new-course:course-x:0",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(r).toEqual({ ok: true, sent: 2 });
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(String(url)).toContain("api.resend.com/emails/batch");
    const headers = init!.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer re_test");
    expect(headers["Idempotency-Key"]).toBe("new-course:course-x:0");
    const body = JSON.parse(init!.body as string) as Array<
      Record<string, unknown>
    >;
    expect(body).toHaveLength(2);
    expect(body[0]).toMatchObject({
      from: DEFAULT_EMAIL_FROM,
      to: ["a@b.com"],
      headers: { "List-Unsubscribe": "<https://x/u>" },
    });
  });

  it("no-ops (no fetch) on an empty batch", async () => {
    const fetchImpl = vi.fn();
    const r = await sendEmailBatch([], { fetchImpl });
    expect(r).toEqual({ ok: true, sent: 0 });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects a batch larger than the Resend limit", async () => {
    const many = Array.from({ length: RESEND_MAX_BATCH + 1 }, (_, i) =>
      msg(`u${i}@b.com`)
    );
    const r = await sendEmailBatch(many, { fetchImpl: vi.fn() });
    expect(r).toMatchObject({ ok: false, reason: "error" });
  });

  it("maps an HTTP failure to a typed error (no throw)", async () => {
    const fetchImpl = vi.fn(
      async () => new Response("invalid", { status: 422 })
    );
    const r = await sendEmailBatch([msg("a@b.com")], { fetchImpl });
    expect(r).toMatchObject({ ok: false, reason: "error", status: 422 });
  });

  it("maps a network throw to a typed error (no throw)", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("network down");
    });
    const r = await sendEmailBatch([msg("a@b.com")], { fetchImpl });
    expect(r).toMatchObject({
      ok: false,
      reason: "error",
      message: "network down",
    });
  });
});
