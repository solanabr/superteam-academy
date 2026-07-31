import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const rpc = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc }),
}));

// Keep the real RESEND_MAX_BATCH etc.; stub only the configured flag + sender.
const emailMocks = vi.hoisted(() => ({
  configured: true,
  sendBatch: vi.fn(),
}));
vi.mock("../resend", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../resend")>();
  return {
    ...actual,
    isEmailConfigured: () => emailMocks.configured,
    sendEmailBatch: (...args: unknown[]) => emailMocks.sendBatch(...args),
  };
});

import { sendNewCourseAnnouncement } from "../campaign";

const recipient = (email: string, token: string) => ({
  user_id: `u-${token}`,
  email,
  unsubscribe_token: token,
});

const params = {
  courseId: "course-x",
  courseTitle: "New Course",
  courseUrl: "https://app.test/en/courses/x",
  appUrl: "https://app.test",
};

beforeEach(() => {
  rpc.mockReset();
  emailMocks.configured = true;
  emailMocks.sendBatch.mockReset();
  emailMocks.sendBatch.mockImplementation(async (messages: unknown[]) => ({
    ok: true,
    sent: messages.length,
  }));
});

describe("sendNewCourseAnnouncement — fail-closed", () => {
  it("returns 'unconfigured' and reads NOTHING when the key is unset", async () => {
    emailMocks.configured = false;
    const r = await sendNewCourseAnnouncement(params);
    expect(r.status).toBe("unconfigured");
    expect(rpc).not.toHaveBeenCalled(); // no recipient read at all
    expect(emailMocks.sendBatch).not.toHaveBeenCalled();
  });
});

describe("sendNewCourseAnnouncement — consent gating", () => {
  it("recipients come ONLY from list_marketing_recipients (the consent gate)", async () => {
    rpc.mockResolvedValue({
      data: [recipient("a@b.com", "tok-a"), recipient("c@d.com", "tok-c")],
      error: null,
    });
    const r = await sendNewCourseAnnouncement(params);

    expect(rpc).toHaveBeenCalledWith("list_marketing_recipients");
    expect(r).toMatchObject({ status: "sent", recipients: 2, sent: 2 });
    const messages = emailMocks.sendBatch.mock.calls[0]![0] as Array<{
      to: string;
      headers: Record<string, string>;
    }>;
    expect(messages.map((m) => m.to)).toEqual(["a@b.com", "c@d.com"]);
  });

  it("sets a per-recipient one-click List-Unsubscribe header + token link", async () => {
    rpc.mockResolvedValue({
      data: [recipient("a@b.com", "tok-a")],
      error: null,
    });
    await sendNewCourseAnnouncement(params);
    const [messages, opts] = emailMocks.sendBatch.mock.calls[0]! as [
      Array<{ headers: Record<string, string>; html: string }>,
      { idempotencyKey: string },
    ];
    // #896: the link states its kind, and the token it carries is the
    // marketing-scoped one — it cannot revoke reminder consent.
    expect(messages[0]!.headers["List-Unsubscribe"]).toBe(
      "<https://app.test/api/email/unsubscribe?token=tok-a&kind=marketing>"
    );
    expect(messages[0]!.headers["List-Unsubscribe-Post"]).toBe(
      "List-Unsubscribe=One-Click"
    );
    expect(messages[0]!.html).toContain(
      "https://app.test/api/email/unsubscribe?token=tok-a&amp;kind=marketing"
    );
    // Idempotency key is derived from the chunk's member ids (#779), namespaced
    // by course — a stable 16-hex digest, not the array index.
    expect(opts.idempotencyKey).toMatch(/^new-course:course-x:[0-9a-f]{16}$/);
  });

  it("drops a malformed email defensively (belt over the RPC's gate)", async () => {
    rpc.mockResolvedValue({
      data: [recipient("good@b.com", "t1"), recipient("not-an-email", "t2")],
      error: null,
    });
    const r = await sendNewCourseAnnouncement(params);
    expect(r.recipients).toBe(1);
    const messages = emailMocks.sendBatch.mock.calls[0]![0] as Array<{
      to: string;
    }>;
    expect(messages.map((m) => m.to)).toEqual(["good@b.com"]);
  });

  it("chunks past 100 into separate batches with distinct idempotency keys", async () => {
    const data = Array.from({ length: 150 }, (_, i) =>
      recipient(`u${i}@b.com`, `t${i}`)
    );
    rpc.mockResolvedValue({ data, error: null });
    const r = await sendNewCourseAnnouncement(params);
    expect(r).toMatchObject({ status: "sent", recipients: 150, sent: 150 });
    expect(emailMocks.sendBatch).toHaveBeenCalledTimes(2);
    const key0 = emailMocks.sendBatch.mock.calls[0]![1].idempotencyKey;
    const key1 = emailMocks.sendBatch.mock.calls[1]![1].idempotencyKey;
    expect(key0).toMatch(/^new-course:course-x:[0-9a-f]{16}$/);
    expect(key1).toMatch(/^new-course:course-x:[0-9a-f]{16}$/);
    // Different membership ⇒ different keys (no cross-chunk cache collision).
    expect(key0).not.toBe(key1);
  });

  it("keys idempotency on chunk MEMBERSHIP — stable across runs, changes when it shifts", async () => {
    const set = [
      recipient("a@b.com", "ta"),
      recipient("b@b.com", "tb"),
      recipient("c@b.com", "tc"),
    ];
    rpc.mockResolvedValue({ data: set, error: null });
    await sendNewCourseAnnouncement(params);
    const firstKey = emailMocks.sendBatch.mock.calls[0]![1].idempotencyKey;

    // Re-run with the IDENTICAL set → identical key (cached ⇒ never double-sent).
    emailMocks.sendBatch.mockClear();
    await sendNewCourseAnnouncement(params);
    expect(emailMocks.sendBatch.mock.calls[0]![1].idempotencyKey).toBe(
      firstKey
    );

    // A mid-campaign unsubscribe shifts the set → the chunk's key CHANGES, so a
    // retry re-sends it (the shifted-in recipient is never silently skipped).
    emailMocks.sendBatch.mockClear();
    rpc.mockResolvedValue({
      data: [set[0]!, set[2]!], // "b" unsubscribed
      error: null,
    });
    await sendNewCourseAnnouncement(params);
    expect(emailMocks.sendBatch.mock.calls[0]![1].idempotencyKey).not.toBe(
      firstKey
    );
  });

  it("counts a failed batch without aborting the rest", async () => {
    rpc.mockResolvedValue({
      data: Array.from({ length: 120 }, (_, i) =>
        recipient(`u${i}@b.com`, `t${i}`)
      ),
      error: null,
    });
    emailMocks.sendBatch
      .mockResolvedValueOnce({ ok: false, reason: "error", message: "boom" })
      .mockResolvedValueOnce({ ok: true, sent: 20 });
    const r = await sendNewCourseAnnouncement(params);
    expect(r).toMatchObject({ status: "sent", failedBatches: 1, sent: 20 });
  });

  it("no_recipients when nobody has opted in", async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    const r = await sendNewCourseAnnouncement(params);
    expect(r.status).toBe("no_recipients");
    expect(emailMocks.sendBatch).not.toHaveBeenCalled();
  });

  it("no_recipients (never throws) on an RPC error", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "down" } });
    const r = await sendNewCourseAnnouncement(params);
    expect(r.status).toBe("no_recipients");
  });
});
