// #899: the re-engagement send pipeline. The CAP and the CLAIM are database
// invariants (see reengagement-pipeline-execution.test.ts); what is tested here
// is the pipeline's own contract — fail-closed, pass ORDER, the release policy,
// and that a claimed row is never left held without a send.
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const rpc = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc }),
}));

vi.mock("@/lib/content/queries", () => ({
  getAllCourseLessonCounts: async () => [{ _id: "course-a", totalLessons: 3 }],
  getCoursesByIds: async (ids: string[]) =>
    ids.includes("course-a")
      ? [
          {
            _id: "course-a",
            title: "Solana Basics",
            slug: "solana-basics",
            totalLessons: 3,
          },
        ]
      : [],
  getCourseLessonOrders: async (ids: string[]) =>
    ids.includes("course-a")
      ? [
          {
            _id: "course-a",
            slug: "solana-basics",
            lessons: [
              { _id: "a1", title: "One", slug: "one" },
              { _id: "a2", title: "Two", slug: "two" },
              { _id: "a3", title: "Three", slug: "three" },
            ],
          },
        ]
      : [],
}));

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

import {
  REENGAGEMENT_CAP_DAYS,
  INACTIVITY_THRESHOLD_DAYS,
} from "../reengagement";
import { sendReengagementEmails } from "../reengagement-send";

const params = { appUrl: "https://app.test", locale: "en" };

type Msg = {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers: Record<string, string>;
};

const nudgeRow = (id: string, email = `${id}@b.com`) => ({
  user_id: id,
  email,
  unsubscribe_token: `rtok-${id}`,
  locale: "pt-BR",
  streak_days: 9,
  days_inactive: 30,
  course_id: "course-a",
  completed_lesson_ids: ["a1", "a2"],
});

const genericRow = (id: string, email = `${id}@b.com`) => ({
  user_id: id,
  email,
  unsubscribe_token: `rtok-${id}`,
  locale: null,
  streak_days: 4,
  days_inactive: 21,
  course_id: null,
  completed_lesson_ids: [],
});

/** Route each `claim_due_reengagement` call to the rows for that kind. */
const claims = (byKind: Record<string, unknown[]>) => {
  rpc.mockImplementation(async (fn: string, args: Record<string, unknown>) => {
    if (fn === "claim_due_reengagement") {
      return { data: byKind[args.p_kind as string] ?? [], error: null };
    }
    if (fn === "release_reengagement_claims") {
      return { data: (args.p_user_ids as string[]).length, error: null };
    }
    throw new Error(`unexpected rpc ${fn}`);
  });
};

const releaseCalls = () =>
  rpc.mock.calls.filter((c) => c[0] === "release_reengagement_claims");

beforeEach(() => {
  rpc.mockReset();
  emailMocks.configured = true;
  emailMocks.sendBatch.mockReset();
  emailMocks.sendBatch.mockImplementation(async (messages: unknown[]) => ({
    ok: true,
    sent: (messages as unknown[]).length,
  }));
});

describe("sendReengagementEmails — fail-closed", () => {
  it("returns 'unconfigured' and CLAIMS NOTHING with no Resend key", async () => {
    emailMocks.configured = false;
    const r = await sendReengagementEmails(params);
    expect(r.status).toBe("unconfigured");
    // Critical: no claim, so an unconfigured deploy does not burn a whole
    // 14-day cap window on sends that never happen.
    expect(rpc).not.toHaveBeenCalled();
    expect(emailMocks.sendBatch).not.toHaveBeenCalled();
  });

  it("sends nothing when the claim RPC errors", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    const r = await sendReengagementEmails(params);
    expect(r.status).toBe("no_recipients");
    expect(emailMocks.sendBatch).not.toHaveBeenCalled();
  });
});

describe("sendReengagementEmails — claim contract", () => {
  it("runs the COURSE NUDGE pass first, then the generic one", async () => {
    claims({
      course_nudge: [nudgeRow("u1")],
      reengagement_7d: [genericRow("u2")],
    });
    await sendReengagementEmails(params);
    const kinds = rpc.mock.calls
      .filter((c) => c[0] === "claim_due_reengagement")
      .map((c) => c[1].p_kind);
    // Order is load-bearing: the course-nudge claim row is what trips the
    // generic pass's own cap, giving course_nudge precedence for free.
    expect(kinds).toEqual(["course_nudge", "reengagement_7d"]);
  });

  it("passes the R17 threshold and the owner's N=14 cap to SQL", async () => {
    claims({});
    await sendReengagementEmails(params);
    for (const call of rpc.mock.calls) {
      expect(call[1]).toMatchObject({
        p_inactive_days: INACTIVITY_THRESHOLD_DAYS,
        p_cap_days: REENGAGEMENT_CAP_DAYS,
      });
    }
  });

  it("only sends the course-totals map on the pass that needs it", async () => {
    claims({});
    await sendReengagementEmails(params);
    const [nudgeCall, genericCall] = rpc.mock.calls.map((c) => c[1]);
    expect(nudgeCall!.p_course_totals).toEqual({ "course-a": 3 });
    expect(genericCall!.p_course_totals).toEqual({});
  });
});

describe("sendReengagementEmails — rendering", () => {
  it("renders the course nudge at the next INCOMPLETE lesson", async () => {
    claims({ course_nudge: [nudgeRow("u1")] });
    await sendReengagementEmails(params);
    const [msg] = emailMocks.sendBatch.mock.calls[0]![0] as Msg[];
    // a1/a2 done ⇒ the deep link points at a3, not at the course root.
    expect(msg!.html).toContain(
      "https://app.test/pt-BR/courses/solana-basics/lessons/three"
    );
  });

  it("carries the REMINDER-scoped unsubscribe in the body AND the RFC 8058 headers", async () => {
    claims({ course_nudge: [nudgeRow("u1")] });
    await sendReengagementEmails(params);
    const [msg] = emailMocks.sendBatch.mock.calls[0]![0] as Msg[];
    const url =
      "https://app.test/api/email/unsubscribe?token=rtok-u1&kind=reminders";
    expect(msg!.headers["List-Unsubscribe"]).toBe(`<${url}>`);
    expect(msg!.headers["List-Unsubscribe-Post"]).toBe(
      "List-Unsubscribe=One-Click"
    );
    // The HTML body carries the same target, HTML-escaped by the shared shell.
    expect(msg!.html).toContain(url.replace("&", "&amp;"));
    expect(msg!.text).toContain(url);
  });

  it("keys each chunk's idempotency by KIND + day + members", async () => {
    claims({
      course_nudge: [nudgeRow("u1")],
      reengagement_7d: [genericRow("u2")],
    });
    await sendReengagementEmails(params);
    const keys = emailMocks.sendBatch.mock.calls.map(
      (c) => (c[1] as { idempotencyKey: string }).idempotencyKey
    );
    expect(keys[0]).toMatch(/^course_nudge:\d{4}-\d{2}-\d{2}:[0-9a-f]{16}$/);
    expect(keys[1]).toMatch(/^reengagement_7d:\d{4}-\d{2}-\d{2}:[0-9a-f]{16}$/);
    // The two passes can never collide on one key.
    expect(keys[0]).not.toBe(keys[1]);
  });
});

describe("sendReengagementEmails — a claim is never held without a send", () => {
  it("releases a claimed row whose address fails the check", async () => {
    claims({ course_nudge: [nudgeRow("u1", "not-an-email")] });
    const r = await sendReengagementEmails(params);
    expect(emailMocks.sendBatch).not.toHaveBeenCalled();
    expect(releaseCalls()[0]![1]).toEqual({
      p_kind: "course_nudge",
      p_user_ids: ["u1"],
    });
    expect(r.passes[0]!.skipped).toBe(1);
  });

  it("releases a claimed row whose course is no longer in the bundle", async () => {
    claims({
      course_nudge: [{ ...nudgeRow("u1"), course_id: "course-gone" }],
    });
    await sendReengagementEmails(params);
    expect(emailMocks.sendBatch).not.toHaveBeenCalled();
    expect(releaseCalls()[0]![1]).toMatchObject({ p_user_ids: ["u1"] });
  });

  it("releases rather than mis-rendering when the course is actually finished", async () => {
    claims({
      course_nudge: [
        { ...nudgeRow("u1"), completed_lesson_ids: ["a1", "a2", "a3"] },
      ],
    });
    await sendReengagementEmails(params);
    expect(emailMocks.sendBatch).not.toHaveBeenCalled();
    expect(releaseCalls()[0]![1]).toMatchObject({ p_user_ids: ["u1"] });
  });

  it("ignores stray course context on the generic pass (attribution stays honest)", async () => {
    // A row claimed under the generic kind that nonetheless carried a
    // nearly-done course would render a course nudge while logging
    // `reengagement_7d`. The SQL cannot produce this, and the pipeline does not
    // trust it either: the generic pass never builds `nearlyDone`, so the
    // rendered email always matches the kind it is claimed and logged under.
    claims({
      reengagement_7d: [{ ...genericRow("u2"), course_id: "course-a" }],
    });
    const r = await sendReengagementEmails(params);
    // The generic pass carries no course context, so the row renders the
    // generic email and the kind matches — the course_id is simply ignored.
    expect(r.passes[1]!.sent).toBe(1);
    const [msg] = emailMocks.sendBatch.mock.calls[0]![0] as Msg[];
    expect(msg!.html).toContain("https://app.test/en/dashboard");
    expect(msg!.html).not.toContain("solana-basics");
  });

  it("declines (and releases) a row below the inactivity threshold", async () => {
    claims({ reengagement_7d: [{ ...genericRow("u2"), days_inactive: 1 }] });
    await sendReengagementEmails(params);
    expect(emailMocks.sendBatch).not.toHaveBeenCalled();
    expect(releaseCalls()[0]![1]).toEqual({
      p_kind: "reengagement_7d",
      p_user_ids: ["u2"],
    });
  });
});

describe("sendReengagementEmails — release policy on a failed batch", () => {
  it("RELEASES a batch that was provably rejected before transmission", async () => {
    claims({ course_nudge: [nudgeRow("u1")] });
    emailMocks.sendBatch.mockResolvedValue({
      ok: false,
      reason: "error",
      message: "invalid from",
      delivery: "rejected",
    });
    const r = await sendReengagementEmails(params);
    expect(r.passes[0]!.failedBatches).toBe(1);
    expect(releaseCalls()[0]![1]).toEqual({
      p_kind: "course_nudge",
      p_user_ids: ["u1"],
    });
  });

  it("HOLDS the claims of an AMBIGUOUS failure (a duplicate is worse than a miss)", async () => {
    claims({ course_nudge: [nudgeRow("u1")] });
    emailMocks.sendBatch.mockResolvedValue({
      ok: false,
      reason: "error",
      message: "gateway timeout",
      delivery: "unknown",
    });
    const r = await sendReengagementEmails(params);
    expect(r.passes[0]!.failedBatches).toBe(1);
    // Resend may have accepted and delivered before the wire broke.
    expect(releaseCalls()).toHaveLength(0);
    expect(r.passes[0]!.released).toBe(0);
  });
});
