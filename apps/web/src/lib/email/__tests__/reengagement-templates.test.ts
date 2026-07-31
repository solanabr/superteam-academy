import { describe, it, expect } from "vitest";
import {
  reengagementNudgeEmail,
  courseNudgeEmail,
  type EmailLocale,
} from "../templates";

// #870 re-engagement template set (uiux-R17). Own file, like the #869 reminder
// template, so the families evolve independently.

const LOCALES: readonly EmailLocale[] = ["en", "pt-BR", "es"];

const UNSUB = "https://app.test/api/email/unsubscribe?token=t&kind=reminders";

const nudgeBase = {
  streakDays: 12,
  dashboardUrl: "https://app.test/pt-BR/dashboard",
  unsubscribeUrl: UNSUB,
};

const courseBase = {
  courseTitle: "Solana 101",
  lessonTitle: "Deploy your first program",
  lessonsRemaining: 1,
  lessonUrl: "https://app.test/en/courses/solana-101/lessons/deploy",
  unsubscribeUrl: UNSUB,
};

describe("reengagementNudgeEmail — three locales", () => {
  it("renders distinct localized copy for every shipped locale", () => {
    const subjects = LOCALES.map(
      (locale) => reengagementNudgeEmail({ ...nudgeBase, locale }).subject
    );
    expect(new Set(subjects).size).toBe(3); // no locale silently falls back
    expect(subjects[0]).toContain("streak");
    expect(subjects[1]).toContain("sequência");
    expect(subjects[2]).toContain("racha");
  });

  it("falls back to English for an unknown or missing locale", () => {
    const en = reengagementNudgeEmail({ ...nudgeBase, locale: "en" });
    expect(reengagementNudgeEmail({ ...nudgeBase, locale: null }).subject).toBe(
      en.subject
    );
    expect(reengagementNudgeEmail({ ...nudgeBase, locale: "de" }).subject).toBe(
      en.subject
    );
  });

  it("carries the unsubscribe link in BOTH the HTML and the text body", () => {
    for (const locale of LOCALES) {
      const r = reengagementNudgeEmail({ ...nudgeBase, locale });
      expect(r.text).toContain(UNSUB);
      // HTML-escaped: the link's `&` becomes `&amp;` in the href.
      expect(r.html).toContain(UNSUB.replace("&", "&amp;"));
      expect(r.html).toContain(nudgeBase.dashboardUrl);
    }
  });

  it("renders the progress-only variant when there is no streak to mention", () => {
    const r = reengagementNudgeEmail({
      ...nudgeBase,
      locale: "en",
      streakDays: 0,
    });
    expect(r.subject).toBe("Your next lesson is right where you left it");
    expect(r.html).toContain("Your progress is saved");
  });

  it("drops a broken streak count rather than rendering it", () => {
    for (const streakDays of [Number.NaN, -3, 1.5, Number.POSITIVE_INFINITY]) {
      const r = reengagementNudgeEmail({
        ...nudgeBase,
        locale: "en",
        streakDays,
      });
      expect(r.subject).toBe("Your next lesson is right where you left it");
      expect(r.subject).not.toMatch(/NaN|Infinity/);
    }
  });

  it("keeps the copy non-punitive — no loss or guilt framing (research rule)", () => {
    const banned = [
      /you lost/i,
      /don't lose/i,
      /you failed/i,
      /perdeu/i,
      /fracass/i,
      /perdiste/i,
    ];
    for (const locale of LOCALES) {
      const r = reengagementNudgeEmail({ ...nudgeBase, locale });
      for (const pattern of banned) {
        expect(r.text).not.toMatch(pattern);
      }
    }
  });
});

describe("courseNudgeEmail — three locales", () => {
  it("renders distinct localized copy for every shipped locale", () => {
    const subjects = LOCALES.map(
      (locale) => courseNudgeEmail({ ...courseBase, locale }).subject
    );
    expect(new Set(subjects).size).toBe(3);
    expect(subjects[0]).toBe("One lesson left in Solana 101");
    expect(subjects[1]).toBe("Falta uma lição em Solana 101");
    expect(subjects[2]).toBe("Te queda una lección en Solana 101");
  });

  it("falls back to English for an unknown or missing locale", () => {
    const en = courseNudgeEmail({ ...courseBase, locale: "en" });
    expect(courseNudgeEmail({ ...courseBase, locale: null }).subject).toBe(
      en.subject
    );
    expect(courseNudgeEmail({ ...courseBase, locale: "fr" }).subject).toBe(
      en.subject
    );
  });

  it("renders the plural variant and the next-lesson note", () => {
    const r = courseNudgeEmail({
      ...courseBase,
      locale: "pt-BR",
      lessonsRemaining: 3,
    });
    expect(r.subject).toBe("Faltam 3 lições em Solana 101");
    expect(r.text).toContain("A seguir: Deploy your first program");
  });

  it("omits the note line when no lesson title is known", () => {
    const r = courseNudgeEmail({
      ...courseBase,
      locale: "en",
      lessonTitle: "",
    });
    expect(r.text).not.toContain("Next up:");
    expect(r.html).toContain(courseBase.lessonUrl);
  });

  it("degrades a broken remaining-count to the singular variant", () => {
    const r = courseNudgeEmail({
      ...courseBase,
      locale: "en",
      lessonsRemaining: Number.NaN,
    });
    expect(r.subject).toBe("One lesson left in Solana 101");
  });

  it("deep-links at the lesson in both bodies", () => {
    for (const locale of LOCALES) {
      const r = courseNudgeEmail({ ...courseBase, locale });
      expect(r.text).toContain(courseBase.lessonUrl);
      expect(r.html).toContain(courseBase.lessonUrl);
      expect(r.text).toContain(UNSUB);
    }
  });
});

describe("courseNudgeEmail — untrusted interpolated fields", () => {
  it("scrubs CR/LF out of the subject so a header line can't be split (#812)", () => {
    const r = courseNudgeEmail({
      ...courseBase,
      locale: "en",
      courseTitle: "Solana 101\r\nBcc: victim@example.com",
    });
    // The injected text survives as inert characters on ONE line — what must
    // never survive is the newline that would start a second header.
    expect(r.subject).not.toMatch(/[\r\n]/);
    expect(r.subject).toBe(
      "One lesson left in Solana 101  Bcc: victim@example.com"
    );
  });

  it("scrubs CR/LF out of the lesson title too", () => {
    const r = courseNudgeEmail({
      ...courseBase,
      locale: "en",
      lessonTitle: "Deploy\r\nX-Injected: 1",
    });
    const noteLine = r.text
      .split("\n")
      .find((l) => l.startsWith("Next up:"))
      ?.trim();
    // CR and LF each become a space, so the note stays a single text line.
    expect(noteLine).toBe("Next up: Deploy  X-Injected: 1");
    expect(r.html).not.toMatch(/Deploy\s*[\r\n]\s*X-Injected/);
  });

  it("escapes markup in the title and in the URLs it interpolates", () => {
    const r = courseNudgeEmail({
      ...courseBase,
      locale: "en",
      courseTitle: "<script>alert(1)</script>",
      lessonUrl: 'https://app.test/"><script>alert(1)</script>',
    });
    expect(r.html).not.toContain("<script>");
  });
});
