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
        Promise.resolve(
          new Response(JSON.stringify({ data: [{ id: "1" }, { id: "2" }] }), {
            status: 200,
          })
        )
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
    // The claim-release invariant (4xx ⇒ nothing accepted) only holds under
    // STRICT batch validation, which is an undocumented default upstream. Pin it
    // on the wire so a server-side default flip can't silently break it.
    expect(headers["x-batch-validation"]).toBe("strict");
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

// #869 review F3 — a failed batch must say whether anything could POSSIBLY have
// been accepted. Callers that undo bookkeeping on failure (the reminder
// pipeline releases per-day send claims) may only act on `rejected`; treating an
// ambiguous failure as rejected is what re-sends a delivered email.
describe("failure classification (delivery)", () => {
  beforeEach(() => {
    env.RESEND_API_KEY = "re_x";
  });

  const failFetch = (err: unknown) =>
    vi.fn().mockRejectedValue(err) as unknown as typeof fetch;
  const status = (code: number) =>
    vi.fn().mockResolvedValue({
      ok: false,
      status: code,
      text: async () => "err",
    }) as unknown as typeof fetch;

  it("marks a 4xx REJECTED — Resend refused the batch outright", async () => {
    const r = await sendEmailBatch([msg("a@b.com")], {
      fetchImpl: status(422),
    });
    expect(r).toMatchObject({ ok: false, status: 422, delivery: "rejected" });
  });

  it("marks a 5xx UNKNOWN — it may have been accepted first", async () => {
    const r = await sendEmailBatch([msg("a@b.com")], {
      fetchImpl: status(503),
    });
    expect(r).toMatchObject({ ok: false, status: 503, delivery: "unknown" });
  });

  it("marks connection-refused / DNS failures REJECTED (never transmitted)", async () => {
    for (const code of ["ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN"]) {
      const err = Object.assign(new TypeError("fetch failed"), {
        cause: { code },
      });
      const r = await sendEmailBatch([msg("a@b.com")], {
        fetchImpl: failFetch(err),
      });
      expect(r, code).toMatchObject({ ok: false, delivery: "rejected" });
    }
  });

  it("marks an abort/timeout or mid-flight reset UNKNOWN", async () => {
    for (const err of [
      Object.assign(new Error("The operation was aborted"), {
        name: "AbortError",
      }),
      Object.assign(new TypeError("fetch failed"), {
        cause: { code: "ECONNRESET" },
      }),
      new Error("socket hang up"),
    ]) {
      const r = await sendEmailBatch([msg("a@b.com")], {
        fetchImpl: failFetch(err),
      });
      expect(r).toMatchObject({ ok: false, delivery: "unknown" });
    }
  });

  it("marks the local over-size guard REJECTED (the request is never made)", async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    const tooMany = Array.from({ length: RESEND_MAX_BATCH + 1 }, (_, i) =>
      msg(`u${i}@b.com`)
    );
    const r = await sendEmailBatch(tooMany, { fetchImpl });
    expect(r).toMatchObject({ ok: false, delivery: "rejected" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

// `sent` must report what Resend says it ACCEPTED (`{ data: [{ id }, ...] }`),
// not what we asked it to send. Red at main: `sent` was hardcoded to
// messages.length, so a partial acceptance reported as a full send.
describe("sent count is derived from the response body", () => {
  beforeEach(() => {
    env.RESEND_API_KEY = "re_x";
  });

  const ok = (body: unknown) =>
    vi.fn(
      async () => new Response(JSON.stringify(body), { status: 200 })
    ) as unknown as typeof fetch;

  it("reports data.length, not the requested count", async () => {
    const r = await sendEmailBatch([msg("a@b.com"), msg("c@d.com")], {
      fetchImpl: ok({ data: [{ id: "1" }, { id: "2" }] }),
    });
    expect(r).toEqual({ ok: true, sent: 2 });
  });

  it("logs LOUDLY and reports the real count when the 2xx accepted fewer (tripwire)", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    // Impossible under strict validation — if it ever happens, the all-or-nothing
    // assumption behind claim release has stopped holding and must be visible.
    const r = await sendEmailBatch([msg("a@b.com"), msg("c@d.com")], {
      fetchImpl: ok({ data: [{ id: "1" }] }),
    });
    expect(r).toEqual({ ok: true, sent: 1 });
    expect(err).toHaveBeenCalledWith(
      expect.stringContaining("accepted 1 of 2")
    );
    err.mockRestore();
  });

  it("logs and falls back to the requested count when the 2xx body has no data array", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await sendEmailBatch([msg("a@b.com")], {
      fetchImpl: ok({}),
    });
    expect(r).toEqual({ ok: true, sent: 1 });
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });

  it("does not throw on a 2xx with a non-JSON body", async () => {
    const fetchImpl = vi.fn(
      async () => new Response("not json", { status: 200 })
    ) as unknown as typeof fetch;
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      sendEmailBatch([msg("a@b.com")], { fetchImpl })
    ).resolves.toEqual({ ok: true, sent: 1 });
    err.mockRestore();
  });
});

// A 409 is an IDEMPOTENCY conflict, and the two conflict types differ in
// whether anything could have been sent. Red at main: both fell into the
// generic 4xx branch as `rejected`, so a concurrent in-flight request released
// the per-day claims and a retry could deliver a SECOND copy.
describe("409 idempotency conflicts", () => {
  beforeEach(() => {
    env.RESEND_API_KEY = "re_x";
  });

  const conflict = (name: string) =>
    vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      text: async () =>
        JSON.stringify({ statusCode: 409, name, message: "conflict" }),
    }) as unknown as typeof fetch;

  it("concurrent_idempotent_requests → UNKNOWN (hold the claims, never release)", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await sendEmailBatch([msg("a@b.com")], {
      idempotencyKey: "k",
      fetchImpl: conflict("concurrent_idempotent_requests"),
    });
    // `delivery: "unknown"` is exactly the ambiguous outcome the callers already
    // handle for 5xx — they HOLD the claims rather than release them.
    expect(r).toMatchObject({
      ok: false,
      status: 409,
      delivery: "unknown",
    });
    expect(err).toHaveBeenCalledWith(
      expect.stringContaining("concurrent_idempotent_requests")
    );
    err.mockRestore();
  });

  it("invalid_idempotent_request → REJECTED, with its own distinct log", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await sendEmailBatch([msg("a@b.com")], {
      idempotencyKey: "k",
      fetchImpl: conflict("invalid_idempotent_request"),
    });
    expect(r).toMatchObject({
      ok: false,
      status: 409,
      delivery: "rejected",
    });
    // Names the permanent same-day stall + the 24h TTL that ends it.
    const line = err.mock.calls[0]![0] as string;
    expect(line).toContain("invalid_idempotent_request");
    expect(line).toContain("24h");
    err.mockRestore();
  });

  it("an unrecognised 409 body stays REJECTED (the conservative 4xx default)", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await sendEmailBatch([msg("a@b.com")], {
      fetchImpl: conflict("some_future_conflict"),
    });
    expect(r).toMatchObject({ ok: false, status: 409, delivery: "rejected" });
    expect(err).toHaveBeenCalledWith(
      expect.stringContaining("unrecognised type")
    );
    err.mockRestore();
  });

  it("a non-JSON 409 body does not throw", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      text: async () => "<html>gateway</html>",
    }) as unknown as typeof fetch;
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      sendEmailBatch([msg("a@b.com")], { fetchImpl })
    ).resolves.toMatchObject({ ok: false, status: 409, delivery: "rejected" });
    err.mockRestore();
  });
});
