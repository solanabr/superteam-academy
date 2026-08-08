import { describe, it, expect } from "vitest";
import {
  profileDisplayName,
  type PublicProfile,
} from "@/lib/profiles/public-profile";

function profile(over: Partial<PublicProfile> = {}): PublicProfile {
  return {
    username: "brave-anchor-9000",
    displayName: null,
    verified: false,
    avatarUrl: null,
    bio: null,
    socialLinks: null,
    ...over,
  };
}

describe("profileDisplayName (#997)", () => {
  it("falls back to the generated username when no editorial name is set", () => {
    expect(profileDisplayName(profile())).toBe("brave-anchor-9000");
  });

  it("prefers the admin-set display name", () => {
    expect(profileDisplayName(profile({ displayName: "Ana Souza" }))).toBe(
      "Ana Souza"
    );
  });

  // An admin clearing the field to "" or " " must fall back, not render a
  // course as authored by nobody.
  it("treats blank and whitespace-only names as unset", () => {
    expect(profileDisplayName(profile({ displayName: "" }))).toBe(
      "brave-anchor-9000"
    );
    expect(profileDisplayName(profile({ displayName: "   " }))).toBe(
      "brave-anchor-9000"
    );
  });

  it("trims surrounding whitespace", () => {
    expect(profileDisplayName(profile({ displayName: "  Ana Souza  " }))).toBe(
      "Ana Souza"
    );
  });
});
