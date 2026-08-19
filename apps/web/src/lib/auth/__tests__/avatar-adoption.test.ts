import { describe, it, expect } from "vitest";
import { shouldAdoptAvatar } from "../avatar-adoption";

const PHOTO = "https://lh3.googleusercontent.com/a/photo";

describe("shouldAdoptAvatar", () => {
  it("adopts when no avatar is stored and a candidate exists", () => {
    expect(shouldAdoptAvatar(null, PHOTO)).toBe(true);
  });

  it("never overwrites a stored avatar — even with the identical URL (no-op case, #1070)", () => {
    expect(shouldAdoptAvatar(PHOTO, PHOTO)).toBe(false);
  });

  it("never overwrites a stored avatar with a different provider's photo", () => {
    expect(
      shouldAdoptAvatar("https://avatars.githubusercontent.com/u/1?v=4", PHOTO)
    ).toBe(false);
  });

  it("does not adopt a null candidate", () => {
    expect(shouldAdoptAvatar(null, null)).toBe(false);
  });

  it("does not adopt an undefined candidate", () => {
    expect(shouldAdoptAvatar(null, undefined)).toBe(false);
  });

  it("does not adopt an empty-string candidate", () => {
    expect(shouldAdoptAvatar(null, "")).toBe(false);
  });

  it("treats an empty-string stored value as an existing avatar (no overwrite)", () => {
    expect(shouldAdoptAvatar("", PHOTO)).toBe(false);
  });
});
