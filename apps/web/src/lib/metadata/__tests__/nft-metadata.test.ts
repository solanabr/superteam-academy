import { describe, it, expect } from "vitest";
import { CONTENT_BLOB_BASE_URL } from "@/lib/content/blob-store.mjs";
import type { AchievementDoc, CourseDoc } from "@/lib/content/types";
import {
  achievementMetadata,
  contentImageUrl,
  courseCollectionMetadata,
} from "../nft-metadata";

const ORIGIN = "https://www.st.academy";
const BRAND = `${ORIGIN}/android-chrome-512x512.png`;

const achievement: AchievementDoc = {
  _id: "achievement-first-steps",
  _type: "achievement",
  name: "First Steps",
  description: "Complete your first lesson",
  category: "progress",
  xpReward: 50,
  metadataUri: "https://old-domain.example/api/achievements/metadata?id=x",
};

const course: CourseDoc = {
  _id: "course-solana-speedrun",
  _type: "course",
  slug: { _type: "slug", current: "solana-speedrun" },
  title: "Solana Speedrun",
  description: "Ship a dApp in a weekend.",
  difficulty: "beginner",
  creator: "3WECquwCtcKVRYNWBPFWE28ag3b1CDKchLZPXxifAJzQ",
  thumbnail: `${CONTENT_BLOB_BASE_URL}/content/abc.webp`,
};

describe("achievementMetadata", () => {
  it("builds Metaplex JSON from the content doc", () => {
    expect(achievementMetadata(achievement, ORIGIN)).toEqual({
      name: "First Steps",
      symbol: "STACAD",
      description: "Complete your first lesson",
      image: BRAND,
      external_url: `${ORIGIN}/`,
      attributes: [
        { trait_type: "Type", value: "Achievement" },
        { trait_type: "Category", value: "progress" },
        { trait_type: "XP Reward", value: 50 },
        { trait_type: "Platform", value: "Superteam Academy" },
      ],
      properties: {
        category: "image",
        files: [{ uri: BRAND, type: "image/png" }],
      },
    });
  });

  it("never echoes the content's own metadata URI or host", () => {
    const json = JSON.stringify(achievementMetadata(achievement, ORIGIN));
    expect(json).not.toContain("old-domain.example");
  });

  it("falls back to the id and a generic description when fields are blank", () => {
    const m = achievementMetadata(
      { _id: "achievement-x", _type: "achievement", name: " ", xpReward: 0 },
      ORIGIN
    );
    expect(m.name).toBe("achievement-x");
    expect(m.description).toContain("achievement-x");
    expect(m.attributes.map((a) => a.trait_type)).toEqual(["Type", "Platform"]);
  });
});

describe("courseCollectionMetadata", () => {
  it("builds the collection JSON with the course image and page", () => {
    const m = courseCollectionMetadata(course, ORIGIN);
    expect(m.name).toBe("Solana Speedrun Credentials");
    expect(m.symbol).toBe("STACAD");
    expect(m.description).toBe(
      "Completion credentials for Solana Speedrun on Superteam Academy. Ship a dApp in a weekend."
    );
    expect(m.image).toBe(`${CONTENT_BLOB_BASE_URL}/content/abc.webp`);
    expect(m.properties.files).toEqual([
      { uri: `${CONTENT_BLOB_BASE_URL}/content/abc.webp`, type: "image/webp" },
    ]);
    expect(m.external_url).toBe(`${ORIGIN}/courses/solana-speedrun`);
    expect(m.attributes).toContainEqual({
      trait_type: "Difficulty",
      value: "beginner",
    });
  });

  it("leaves out the creator wallet", () => {
    const json = JSON.stringify(courseCollectionMetadata(course, ORIGIN));
    expect(json).not.toContain(course.creator as string);
  });
});

describe("contentImageUrl", () => {
  it("keeps images on the content blob store", () => {
    const url = `${CONTENT_BLOB_BASE_URL}/content/x.jpg`;
    expect(contentImageUrl(url, ORIGIN)).toBe(url);
  });

  it("falls back to the brand mark for any other host or a missing image", () => {
    expect(contentImageUrl("https://evil.example/x.png", ORIGIN)).toBe(BRAND);
    expect(
      contentImageUrl(`${CONTENT_BLOB_BASE_URL}.evil.example/x.png`, ORIGIN)
    ).toBe(BRAND);
    expect(contentImageUrl(undefined, ORIGIN)).toBe(BRAND);
    expect(contentImageUrl(42, ORIGIN)).toBe(BRAND);
  });
});
