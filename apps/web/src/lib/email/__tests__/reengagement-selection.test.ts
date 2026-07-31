import { describe, it, expect } from "vitest";
import {
  selectReengagementEmail,
  reengagementUnsubscribeUrl,
  reengagementHeaders,
  REENGAGEMENT_LEDGER_KINDS,
  INACTIVITY_THRESHOLD_DAYS,
  COURSE_NUDGE_MAX_REMAINING,
  type ReengagementCandidate,
} from "../reengagement";

// #870 selection logic. The send pipeline is a follow-up (it needs a migration);
// these tests pin the behaviour the pipeline will depend on.

const candidate = (
  over: Partial<ReengagementCandidate> = {}
): ReengagementCandidate => ({
  reminderOptIn: true,
  daysInactive: 9,
  locale: "pt-BR",
  streakDays: 12,
  nearlyDone: null,
  appUrl: "https://app.test",
  unsubscribeToken: "0f9d0a1e-0000-4000-8000-000000000000",
  ...over,
});

const nearlyDone = {
  courseTitle: "Solana 101",
  courseSlug: "solana-101",
  lessonTitle: "Deploy your first program",
  lessonSlug: "deploy",
  lessonsRemaining: 1,
};

describe("selectReengagementEmail — consent gate (fails closed)", () => {
  it("returns null without REMINDER consent, however lapsed the learner is", () => {
    expect(
      selectReengagementEmail(
        candidate({ reminderOptIn: false, daysInactive: 365 })
      )
    ).toBeNull();
  });

  it("gates on the reminder consent, not marketing — kind=reminders unsubscribe", () => {
    // These are study nudges about the learner's own progress, so the
    // purpose-bound consent is the reminder one (#869), and unsubscribing must
    // clear ONLY that consent — product news survives.
    const selection = selectReengagementEmail(candidate());
    expect(selection?.unsubscribeUrl).toContain("kind=reminders");
    expect(selection?.unsubscribeUrl).not.toContain("kind=marketing");
    expect(selection?.email.text).toContain(selection?.unsubscribeUrl);
  });

  it("emits RFC 8058 one-click unsubscribe headers", () => {
    const url = reengagementUnsubscribeUrl("https://app.test", "tok");
    expect(reengagementHeaders(url)).toEqual({
      "List-Unsubscribe": `<${url}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    });
  });

  it("URL-encodes the token it puts in the unsubscribe link", () => {
    expect(reengagementUnsubscribeUrl("https://app.test", "a b&c")).toContain(
      "token=a%20b%26c"
    );
  });
});

describe("selectReengagementEmail — inactivity threshold", () => {
  it("returns null below the threshold", () => {
    expect(
      selectReengagementEmail(
        candidate({ daysInactive: INACTIVITY_THRESHOLD_DAYS - 1 })
      )
    ).toBeNull();
  });

  it("selects at exactly the threshold", () => {
    expect(
      selectReengagementEmail(
        candidate({ daysInactive: INACTIVITY_THRESHOLD_DAYS })
      )?.kind
    ).toBe(REENGAGEMENT_LEDGER_KINDS.inactive);
  });

  it("returns null for a non-finite inactivity value", () => {
    expect(
      selectReengagementEmail(candidate({ daysInactive: Number.NaN }))
    ).toBeNull();
  });
});

describe("selectReengagementEmail — which template wins", () => {
  it("prefers the course nudge when a course is one lesson from done", () => {
    const selection = selectReengagementEmail(candidate({ nearlyDone }));
    expect(selection?.kind).toBe(REENGAGEMENT_LEDGER_KINDS.courseNudge);
    expect(selection?.kind).toBe("course_nudge");
    expect(selection?.email.subject).toBe("Falta uma lição em Solana 101");
  });

  it("deep-links at the next incomplete lesson in the learner's locale", () => {
    const selection = selectReengagementEmail(candidate({ nearlyDone }));
    expect(selection?.email.text).toContain(
      "https://app.test/pt-BR/courses/solana-101/lessons/deploy"
    );
  });

  it("falls back to the generic nudge when the course is not close enough", () => {
    const selection = selectReengagementEmail(
      candidate({
        nearlyDone: {
          ...nearlyDone,
          lessonsRemaining: COURSE_NUDGE_MAX_REMAINING + 1,
        },
      })
    );
    expect(selection?.kind).toBe(REENGAGEMENT_LEDGER_KINDS.inactive);
    expect(selection?.kind).toBe("reengagement_7d");
    expect(selection?.email.text).toContain("https://app.test/pt-BR/dashboard");
  });

  it("ignores a nonsense remaining-count instead of nudging on it", () => {
    expect(
      selectReengagementEmail(
        candidate({ nearlyDone: { ...nearlyDone, lessonsRemaining: 0 } })
      )?.kind
    ).toBe(REENGAGEMENT_LEDGER_KINDS.inactive);
  });

  it("uses an `en` link path for an unknown locale but never crashes", () => {
    const selection = selectReengagementEmail(candidate({ locale: "de" }));
    expect(selection?.email.text).toContain("https://app.test/en/dashboard");
  });
});

describe("REENGAGEMENT_LEDGER_KINDS", () => {
  it("pins the exact ledger kinds the follow-up migration must allow", () => {
    // These strings go into email_reminder_log.kind's CHECK constraint — the
    // send-pipeline follow-up depends on them not drifting.
    expect(Object.values(REENGAGEMENT_LEDGER_KINDS)).toEqual([
      "reengagement_7d",
      "course_nudge",
    ]);
  });
});
