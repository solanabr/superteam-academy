import { describe, it, expect } from "vitest";
import { newCourseAnnouncementEmail } from "../templates";

describe("newCourseAnnouncementEmail", () => {
  const rendered = newCourseAnnouncementEmail({
    courseTitle: "Building Your First Program",
    courseUrl: "https://app.test/en/courses/building-first-program",
    unsubscribeUrl: "https://app.test/api/email/unsubscribe?token=abc",
  });

  it("embeds the unsubscribe link in BOTH html and text (compliance)", () => {
    expect(rendered.html).toContain(
      "https://app.test/api/email/unsubscribe?token=abc"
    );
    expect(rendered.text).toContain(
      "https://app.test/api/email/unsubscribe?token=abc"
    );
    expect(rendered.text.toLowerCase()).toContain("unsubscribe");
  });

  it("includes the course link and title", () => {
    expect(rendered.html).toContain(
      "https://app.test/en/courses/building-first-program"
    );
    expect(rendered.subject).toContain("Building Your First Program");
  });

  it("HTML-escapes an injected course title", () => {
    const r = newCourseAnnouncementEmail({
      courseTitle: "<script>alert(1)</script>",
      courseUrl: "https://x/c",
      unsubscribeUrl: "https://x/u",
    });
    expect(r.html).not.toContain("<script>alert(1)</script>");
    expect(r.html).toContain("&lt;script&gt;");
  });
});
