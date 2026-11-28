// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  clearDraft,
  draftKey,
  restoreDraft,
  saveDraft,
} from "@/lib/editor/draft-storage";

const LESSON = "lesson-a";
const SCOPE = "block-1";
const USER = "11111111-1111-4111-8111-111111111111";
const LEGACY = `superteam-lms-code-${LESSON}::${SCOPE}`;

describe("clearDraft", () => {
  beforeEach(() => localStorage.clear());

  it("leaves a signed-in user nothing to take over after a reset", () => {
    saveDraft(LESSON, SCOPE, USER, "mine");
    localStorage.setItem(draftKey(LESSON, SCOPE, null), "signed-out draft");
    localStorage.setItem(LEGACY, "old draft");

    clearDraft(LESSON, SCOPE, USER);

    expect(restoreDraft(LESSON, SCOPE, USER)).toBeNull();
    expect(localStorage.getItem(draftKey(LESSON, SCOPE, null))).toBeNull();
    expect(localStorage.getItem(LEGACY)).toBeNull();
  });

  it("removes only the signed-out draft for a signed-out visitor", () => {
    saveDraft(LESSON, SCOPE, null, "signed-out draft");
    saveDraft(LESSON, SCOPE, USER, "a user's draft");

    clearDraft(LESSON, SCOPE, null);

    expect(restoreDraft(LESSON, SCOPE, null)).toBeNull();
    expect(localStorage.getItem(draftKey(LESSON, SCOPE, USER))).toBe(
      "a user's draft"
    );
  });

  it("does not touch another lesson part", () => {
    saveDraft(LESSON, "block-2", USER, "other part");
    saveDraft(LESSON, SCOPE, USER, "mine");

    clearDraft(LESSON, SCOPE, USER);

    expect(restoreDraft(LESSON, "block-2", USER)).toBe("other part");
  });
});
