import { describe, it, expect } from "vitest";
import {
  achievementMetadataUri,
  courseCollectionMetadataUri,
  credentialMetadataUri,
  originOf,
  siteOrigin,
  siteUrl,
} from "../site-origin";

const PROD = "https://www.st.academy";

describe("originOf", () => {
  it("keeps only the origin of an https URL", () => {
    expect(originOf("https://www.st.academy")).toBe(PROD);
    expect(originOf("https://www.st.academy/")).toBe(PROD);
    expect(originOf("https://www.st.academy/en/courses?x=1")).toBe(PROD);
    expect(originOf("HTTPS://WWW.ST.ACADEMY")).toBe(PROD);
  });

  it("allows plain http only on loopback", () => {
    expect(originOf("http://localhost:3000")).toBe("http://localhost:3000");
    expect(originOf("http://127.0.0.1:3000/")).toBe("http://127.0.0.1:3000");
    expect(() => originOf("http://www.st.academy")).toThrow(/https/);
  });

  it("refuses non-http schemes and non-URLs", () => {
    expect(() => originOf("ftp://www.st.academy")).toThrow();
    expect(() => originOf("/certificates")).toThrow();
    expect(() => originOf("")).toThrow();
  });
});

describe("siteOrigin", () => {
  it("comes from NEXT_PUBLIC_APP_URL", () => {
    // vitest.setup.ts sets the local dev origin.
    expect(siteOrigin()).toBe("http://localhost:3000");
  });
});

describe("metadata URIs", () => {
  it("are built on the given origin with a stable path", () => {
    expect(achievementMetadataUri("achievement-first-steps", PROD)).toBe(
      "https://www.st.academy/api/achievements/metadata/achievement-first-steps"
    );
    expect(courseCollectionMetadataUri("course-solana-speedrun", PROD)).toBe(
      "https://www.st.academy/api/certificates/metadata/course-solana-speedrun"
    );
    expect(
      credentialMetadataUri("5b0e5c7e-1f2a-4c3d-9e8f-0a1b2c3d4e5f", PROD)
    ).toBe(
      "https://www.st.academy/api/certificates/metadata?id=5b0e5c7e-1f2a-4c3d-9e8f-0a1b2c3d4e5f"
    );
  });

  it("default to the canonical origin, never one passed in by content", () => {
    expect(achievementMetadataUri("achievement-x")).toBe(
      "http://localhost:3000/api/achievements/metadata/achievement-x"
    );
    expect(courseCollectionMetadataUri("course-x")).toBe(
      "http://localhost:3000/api/certificates/metadata/course-x"
    );
  });

  it("escape an id rather than letting it change the path", () => {
    expect(achievementMetadataUri("a/../b?c", PROD)).toBe(
      "https://www.st.academy/api/achievements/metadata/a%2F..%2Fb%3Fc"
    );
  });

  it("joins site paths with exactly one slash", () => {
    expect(siteUrl("/certificates", PROD)).toBe(`${PROD}/certificates`);
    expect(siteUrl("certificates", PROD)).toBe(`${PROD}/certificates`);
  });
});
