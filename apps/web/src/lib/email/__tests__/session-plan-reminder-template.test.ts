import { describe, it, expect } from "vitest";
import { sessionPlanReminderEmail, type EmailLocale } from "../templates";

// #869 session-plan reminder template. Kept in its own file (the marketing
// templates have theirs) so the two template families evolve independently.

const base = {
  planTime: "19:00",
  dashboardUrl: "https://app.test/pt-BR/dashboard",
  unsubscribeUrl:
    "https://app.test/api/email/unsubscribe?token=t&kind=reminders",
};

const LOCALES: readonly EmailLocale[] = ["en", "pt-BR", "es"];

describe("sessionPlanReminderEmail — three locales", () => {
  it("renders distinct localized copy for every shipped locale", () => {
    const subjects = LOCALES.map(
      (locale) => sessionPlanReminderEmail({ ...base, locale }).subject
    );
    expect(new Set(subjects).size).toBe(3); // no locale silently falls back
    expect(subjects[0]).toContain("Your next lesson");
    expect(subjects[1]).toContain("próxima lição");
    expect(subjects[2]).toContain("próxima lección");
  });

  it("falls back to English for an unknown or missing locale", () => {
    const en = sessionPlanReminderEmail({ ...base, locale: "en" });
    expect(sessionPlanReminderEmail({ ...base, locale: null }).subject).toBe(
      en.subject
    );
    expect(sessionPlanReminderEmail({ ...base, locale: "de" }).subject).toBe(
      en.subject
    );
  });

  it("carries the unsubscribe link in BOTH the HTML and the text body", () => {
    for (const locale of LOCALES) {
      const r = sessionPlanReminderEmail({ ...base, locale });
      expect(r.text).toContain(base.unsubscribeUrl);
      // HTML-escaped: the link's `&` becomes `&amp;` in the href.
      expect(r.html).toContain(base.unsubscribeUrl.replace("&", "&amp;"));
      expect(r.html).toContain(base.dashboardUrl);
    }
  });

  it("puts the committed time in the subject when one is stored", () => {
    expect(
      sessionPlanReminderEmail({ ...base, locale: "en" }).subject
    ).toContain("19:00");
  });
});

describe("sessionPlanReminderEmail — untrusted plan time", () => {
  // `plan_time` comes from profiles.prefs, which learners write themselves.
  it("scrubs CR/LF so a header line can never be split (#812)", () => {
    const r = sessionPlanReminderEmail({
      ...base,
      locale: "en",
      planTime: "19:00\r\nBcc: victim@example.com",
    });
    expect(r.subject).not.toMatch(/[\r\n]/);
    expect(r.subject).not.toContain("Bcc:");
  });

  it("drops a malformed time rather than rendering it", () => {
    const r = sessionPlanReminderEmail({
      ...base,
      locale: "en",
      planTime: "<script>alert(1)</script>",
    });
    expect(r.subject).toBe("Your next lesson is planned for today");
    expect(r.html).not.toContain("<script>");
  });

  it("renders the no-time variant when the plan stored none", () => {
    const r = sessionPlanReminderEmail({
      ...base,
      locale: "pt-BR",
      planTime: "",
    });
    expect(r.subject).toBe("Sua próxima lição está marcada para hoje");
  });

  it("escapes the URLs it interpolates", () => {
    const r = sessionPlanReminderEmail({
      ...base,
      locale: "en",
      dashboardUrl: 'https://app.test/"><script>alert(1)</script>',
    });
    expect(r.html).not.toContain("<script>");
  });
});
