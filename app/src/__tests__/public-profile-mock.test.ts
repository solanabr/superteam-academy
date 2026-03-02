import { describe, it, expect } from "vitest";

/**
 * Tests verifying that public profile page uses mock data instead of real DB data.
 * This documents a feature gap — /profile/[username] should query the database.
 */

describe("public profile — mock data verification", () => {
  it("MOCK_PUBLIC_PROFILES is used instead of database queries", async () => {
    const mod = await import("@/components/profile/public-profile-client");

    // The component exports MOCK_PUBLIC_PROFILES directly
    expect(mod.MOCK_PUBLIC_PROFILES).toBeDefined();
    expect(typeof mod.MOCK_PUBLIC_PROFILES).toBe("object");

    // Only hardcoded usernames work
    const knownUsernames = Object.keys(mod.MOCK_PUBLIC_PROFILES);
    expect(knownUsernames.length).toBeGreaterThan(0);
    expect(knownUsernames).toContain("soldev-eth");
    expect(knownUsernames).toContain("anchor-pro");
  });

  it("generateStaticParams only generates from mock profiles, not DB users", async () => {
    // From profile/[username]/page.tsx:
    // export async function generateStaticParams() {
    //   return Object.keys(MOCK_PUBLIC_PROFILES).map(username => ({ username }));
    // }
    //
    // This means only hardcoded mock usernames get static pages.
    // Real users registered via auth won't have public profile pages.
    const mod = await import("@/components/profile/public-profile-client");
    const usernames = Object.keys(mod.MOCK_PUBLIC_PROFILES);

    // These are the ONLY usernames that will work as /profile/[username]
    // Real DB users cannot be found at this route
    expect(usernames.length).toBeLessThan(10); // only a handful of mocks
  });
});

describe("reviews section — localStorage persistence", () => {
  it("documents that reviews are only stored in localStorage", () => {
    // From reviews-section.tsx:
    // const REVIEWS_KEY_PREFIX = "sta_reviews:";
    // function loadReviews(courseSlug: string): Review[] {
    //   if (typeof window === "undefined") return SEED_REVIEWS;
    //
    // Reviews are seeded from SEED_REVIEWS (4 hardcoded reviews)
    // and user-submitted reviews go to localStorage only.
    //
    // This means:
    // 1. Reviews are lost when user clears browser data
    // 2. Reviews are not shared between users
    // 3. Each user sees their own reviews + the 4 seed reviews
    expect(true).toBe(true);
  });
});

describe("discussion section — localStorage persistence", () => {
  it("documents that discussions are only stored in localStorage", () => {
    // From discussion-utils.ts:
    // Comments are stored in localStorage via loadComments/saveComments.
    // This means comment threads are not shared between users.
    // Each user sees only their own comments + seed comments.
    expect(true).toBe(true);
  });
});

describe("data export — localStorage only", () => {
  it("documents that data export only exports localStorage, not DB data", () => {
    // From privacy-tab.tsx lines 137-143:
    // const data: Record<string, unknown> = {};
    // for (let i = 0; i < localStorage.length; i++) {
    //   const key = localStorage.key(i);
    //   if (key?.startsWith("sta")) { ... }
    // }
    //
    // This only exports localStorage keys prefixed with "sta".
    // Does NOT export:
    // - User profile data from database
    // - XP history, achievements, credentials from database
    // - Enrollment records from database
    // - Course completion records from database
    expect(true).toBe(true);
  });
});

describe("account deletion — localStorage only", () => {
  it("documents that account deletion only clears localStorage", () => {
    // From privacy-tab.tsx lines 19-26:
    // const keysToRemove: string[] = [];
    // for (let i = 0; i < localStorage.length; i++) {
    //   const key = localStorage.key(i);
    //   if (key?.startsWith("sta")) keysToRemove.push(key);
    // }
    // keysToRemove.forEach(key => localStorage.removeItem(key));
    //
    // This does NOT:
    // - Delete the User record from the database
    // - Revoke the NextAuth session via API
    // - Delete enrollments, XP events, or achievements from DB
    expect(true).toBe(true);
  });
});
