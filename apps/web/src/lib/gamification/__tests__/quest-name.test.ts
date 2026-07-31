import { describe, it, expect } from "vitest";
import { questDisplayName } from "../quest-name";

// The Realtime channel only ever sees `daily_quest:<questId>`, so the toast's
// fallback naming has to be readable on its own. Shared with the dashboard
// activity feed so a quest is never spelled two ways in one session.
describe("questDisplayName", () => {
  it("strips the id prefix and title-cases the rest", () => {
    expect(questDisplayName("quest-complete-lesson")).toBe("Complete Lesson");
  });

  it("handles underscores and mixed separators", () => {
    expect(questDisplayName("quest-login_streak")).toBe("Login Streak");
  });

  it("leaves an unprefixed id readable", () => {
    expect(questDisplayName("review-five-items")).toBe("Review Five Items");
  });

  it("is total — an empty or odd id never throws", () => {
    expect(questDisplayName("")).toBe("");
    expect(questDisplayName("quest-")).toBe("");
  });
});
