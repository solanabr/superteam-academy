import { describe, it, expect } from "vitest";
import { MANAGED_TYPES } from "../types";
import {
  BlastRadiusError,
  ContentValidationError,
} from "@/lib/content/compile/types";
import { BlockedCommitError } from "@/lib/github/types";

describe("content-sync types", () => {
  it("lists exactly the six managed document types", () => {
    expect([...MANAGED_TYPES].sort()).toEqual(
      [
        "achievement",
        "course",
        "instructor",
        "learningPath",
        "lesson",
        "quest",
      ].sort()
    );
  });

  it("error classes carry a stable name and message", () => {
    expect(new BlockedCommitError("abc").name).toBe("BlockedCommitError");
    expect(new BlastRadiusError(30, 100).message).toContain("30");
    expect(new ContentValidationError(["bad"]).issues).toEqual(["bad"]);
  });
});
