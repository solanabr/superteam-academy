import { describe, it, expect } from "vitest";
import { originOf, siteOrigin, siteUrl } from "../site-origin";

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

describe("siteUrl", () => {
  it("joins site paths with exactly one slash", () => {
    expect(siteUrl("/certificates", PROD)).toBe(`${PROD}/certificates`);
    expect(siteUrl("certificates", PROD)).toBe(`${PROD}/certificates`);
  });
});
