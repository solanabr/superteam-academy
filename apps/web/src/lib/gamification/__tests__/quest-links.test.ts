import { describe, it, expect } from "vitest";
import type { QuestType } from "@superteam-lms/types";
import { questHref } from "../quest-links";

describe("questHref (#572 review quest deep-link)", () => {
  it("deep-links the review quest to the locale-prefixed /review surface", () => {
    expect(questHref("review", "en")).toBe("/en/review");
    expect(questHref("review", "pt-BR")).toBe("/pt-BR/review");
    expect(questHref("review", "es")).toBe("/es/review");
  });

  it("returns null for quest kinds with no destination surface", () => {
    const noSurface: QuestType[] = [
      "lesson",
      "lesson_batch",
      "challenge",
      "login_streak",
      "module",
    ];
    for (const type of noSurface) {
      expect(questHref(type, "en")).toBeNull();
    }
  });
});
