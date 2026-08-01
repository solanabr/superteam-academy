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

import { sendSessionPlanReminders } from "../reminders";

const params = { appUrl: "https://app.test", locale: "en" };

const due = (id: string, email: string, locale: string | null = "pt-BR") => ({
  user_id: id,
  email,
  unsubscribe_token: `tok-${id}`,
  locale,
  plan_time: "19:00",
});

type Msg = { to: string; subject: string; headers: Record<string, string> };

beforeEach(() => {
  rpc.mockReset();
  emailMocks.configured = true;
  emailMocks.sendBatch.mockReset();
  emailMocks.sendBatch.mockImplementation(async (messages: unknown[]) => ({
    ok: true,
    sent: (messages as unknown[]).length,
  }));
});

describe("sendSessionPlanReminders — fail-closed", () => {
  it("returns 'unconfigured' and CLAIMS NOTHING when the Resend key is unset", async () => {
    emailMocks.configured = false;
    const r = await sendSessionPlanReminders(params);
    expect(r.status).toBe("unconfigured");
    // Critical: no claim, so the day's idempotency slots aren't burned on a
    // send that never happens.
    expect(rpc).not.toHaveBeenCalled();
    expect(emailMocks.sendBatch).not.toHaveBeenCalled();
  });

  it("sends nothing when the claim RPC errors", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    const r = await sendSessionPlanReminders(params);
    expect(r.status).toBe("no_recipients");
    expect(emailMocks.sendBatch).not.toHaveBeenCalled();
  });
});

describe("sendSessionPlanReminders — consent gating", () => {
  it("recipients come ONLY from claim_due_session_reminders", async () => {
    rpc.mockResolvedValue({
      data: [due("u1", "a@b.com"), due("u2", "c@d.com")],
      error: null,
    });
    const r = await sendSessionPlanReminders(params);

    expect(rpc).toHaveBeenCalledWith("claim_due_session_reminders", {
      p_weekday: undefined,
    });
    expect(r).toMatchObject({ status: "sent", recipients: 2, sent: 2 });
    const messages = emailMocks.sendBatch.mock.calls[0]![0] as Msg[];
    expect(messages.map((m) => m.to)).toEqual(["a@b.com", "c@d.com"]);
  });

  it("no due learners ⇒ no send at all", async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    const r = await sendSessionPlanReminders(params);
    expect(r.status).toBe("no_recipients");
    expect(emailMocks.sendBatch).not.toHaveBeenCalled();
  });

  it("never sends to a malformed address the RPC let through", async () => {
    rpc.mockResolvedValue({
      data: [due("u1", "not-an-email"), due("u2", "ok@b.com")],
      error: null,
    });
    await sendSessionPlanReminders(params);
    const messages = emailMocks.sendBatch.mock.calls[0]![0] as Msg[];
    expect(messages.map((m) => m.to)).toEqual(["ok@b.com"]);
  });

  // The claim RPC already claimed the filtered-out learner. Leaving
  // that claim in place locks them out of today's reminder forever, silently.
  it("RELEASES the claim of an address it filtered out", async () => {
    rpc.mockImplementation(async (fn: string) =>
      fn === "claim_due_session_reminders"
        ? {
            data: [due("u1", "not-an-email"), due("u2", "ok@b.com")],
            error: null,
          }
        : { data: 1, error: null }
    );
    const r = await sendSessionPlanReminders(params);
    expect(rpc).toHaveBeenCalledWith("release_session_reminder_claims", {
      p_user_ids: ["u1"],
    });
    expect(r.released).toBe(1);
    // The valid recipient still went out.
    expect(r.sent).toBe(1);
  });

  it("releases claims even when EVERY claimed address is unusable", async () => {
    rpc.mockImplementation(async (fn: string) =>
      fn === "claim_due_session_reminders"
        ? { data: [due("u1", "bogus"), due("u2", "also-bogus")], error: null }
        : { data: 2, error: null }
    );
    const r = await sendSessionPlanReminders(params);
    expect(r.status).toBe("no_recipients");
    expect(rpc).toHaveBeenCalledWith("release_session_reminder_claims", {
      p_user_ids: ["u1", "u2"],
    });
    expect(r.released).toBe(2);
    expect(emailMocks.sendBatch).not.toHaveBeenCalled();
  });
});

describe("sendSessionPlanReminders — idempotency", () => {
  it("a second run the same day sends nothing (the claim returns no rows)", async () => {
    rpc.mockResolvedValueOnce({ data: [due("u1", "a@b.com")], error: null });
    const first = await sendSessionPlanReminders(params);
    expect(first.sent).toBe(1);

    // The RPC claimed u1 already; the re-run gets an empty set.
    rpc.mockResolvedValueOnce({ data: [], error: null });
    emailMocks.sendBatch.mockClear();
    const second = await sendSessionPlanReminders(params);
    expect(second.status).toBe("no_recipients");
    expect(emailMocks.sendBatch).not.toHaveBeenCalled();
  });

  it("keys each batch on the day + its members so a retry can't double-send", async () => {
    rpc.mockResolvedValue({
      data: [due("u1", "a@b.com"), due("u2", "c@d.com")],
      error: null,
    });
    await sendSessionPlanReminders(params);
    const opts = emailMocks.sendBatch.mock.calls[0]![1] as {
      idempotencyKey: string;
    };
    expect(opts.idempotencyKey).toMatch(
      /^session-plan:\d{4}-\d{2}-\d{2}:[0-9a-f]{16}$/
    );

    // A different membership ⇒ a different key (so it is not silently cached).
    emailMocks.sendBatch.mockClear();
    rpc.mockResolvedValue({ data: [due("u1", "a@b.com")], error: null });
    await sendSessionPlanReminders(params);
    const opts2 = emailMocks.sendBatch.mock.calls[0]![1] as {
      idempotencyKey: string;
    };
    expect(opts2.idempotencyKey).not.toBe(opts.idempotencyKey);
  });

  // Releasing an AMBIGUOUS failure is how a delivered email gets
  // sent twice — Resend may have accepted the batch before the wire broke, and
  // a same-day manual retry re-sends it under a fresh idempotency key.
  const failWith = (result: Record<string, unknown>) => {
    rpc.mockImplementation(async (fn: string) =>
      fn === "claim_due_session_reminders"
        ? { data: [due("u1", "a@b.com")], error: null }
        : { data: 1, error: null }
    );
    emailMocks.sendBatch.mockResolvedValue(result);
  };

  it("releases a batch REJECTED before transmission (4xx) — retryable", async () => {
    failWith({
      ok: false,
      reason: "error",
      status: 422,
      message: "validation_error",
      delivery: "rejected",
    });
    const r = await sendSessionPlanReminders(params);
    expect(r).toMatchObject({ failedBatches: 1, sent: 0, released: 1 });
    expect(rpc).toHaveBeenCalledWith("release_session_reminder_claims", {
      p_user_ids: ["u1"],
    });
  });

  it("HOLDS the claims of a 5xx batch (it may already have been delivered)", async () => {
    failWith({
      ok: false,
      reason: "error",
      status: 502,
      message: "bad gateway",
      delivery: "unknown",
    });
    const r = await sendSessionPlanReminders(params);
    expect(r).toMatchObject({ failedBatches: 1, sent: 0, released: 0 });
    expect(rpc).not.toHaveBeenCalledWith(
      "release_session_reminder_claims",
      expect.anything()
    );
  });

  it("HOLDS the claims of a timed-out / dropped batch", async () => {
    failWith({
      ok: false,
      reason: "error",
      message: "The operation was aborted",
      delivery: "unknown",
    });
    const r = await sendSessionPlanReminders(params);
    expect(r.released).toBe(0);
    expect(rpc).not.toHaveBeenCalledWith(
      "release_session_reminder_claims",
      expect.anything()
    );
  });

  it("does NOT release the claims of a batch that sent fine", async () => {
    rpc.mockResolvedValue({ data: [due("u1", "a@b.com")], error: null });
    await sendSessionPlanReminders(params);
    expect(rpc).not.toHaveBeenCalledWith(
      "release_session_reminder_claims",
      expect.anything()
    );
  });
});

describe("sendSessionPlanReminders — unsubscribe + localization", () => {
  it("every message carries a one-click header scoped to REMINDERS only", async () => {
    rpc.mockResolvedValue({ data: [due("u1", "a@b.com")], error: null });
    await sendSessionPlanReminders(params);
    const [msg] = emailMocks.sendBatch.mock.calls[0]![0] as Msg[];
    const url =
      "https://app.test/api/email/unsubscribe?token=tok-u1&kind=reminders";
    expect(msg!.headers["List-Unsubscribe"]).toBe(`<${url}>`);
    expect(msg!.headers["List-Unsubscribe-Post"]).toBe(
      "List-Unsubscribe=One-Click"
    );
    // kind=reminders is what keeps marketing consent alive.
    expect(msg!.headers["List-Unsubscribe"]).toContain("kind=reminders");
  });

  it("uses the recipient's recorded locale, falling back to the app default", async () => {
    rpc.mockResolvedValue({
      data: [due("u1", "a@b.com", "pt-BR"), due("u2", "c@d.com", null)],
      error: null,
    });
    await sendSessionPlanReminders(params);
    const messages = emailMocks.sendBatch.mock.calls[0]![0] as Msg[];
    expect(messages[0]!.subject).toContain("próxima lição");
    expect(messages[1]!.subject).toContain("Your next lesson");
  });

  it("passes a manual weekday override straight to the claim RPC", async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    await sendSessionPlanReminders({ ...params, weekday: "thu" });
    expect(rpc).toHaveBeenCalledWith("claim_due_session_reminders", {
      p_weekday: "thu",
    });
  });
});
