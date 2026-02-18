import { test, expect } from "@playwright/test";
import { createTestJwt, COOKIE_NAME, ADMIN_WALLET } from "./fixtures/auth";

const TEST_WALLET = "11111111111111111111111111111112";

test.describe("API: /api/auth/me", () => {
  test("returns unauthenticated without cookie", async ({ request }) => {
    const res = await request.get("/api/auth/me");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.authenticated).toBe(false);
    expect(body.user).toBeNull();
  });

  test("returns authenticated with valid cookie", async ({ request }) => {
    const token = createTestJwt(TEST_WALLET);
    const res = await request.get("/api/auth/me", {
      headers: { Cookie: `${COOKIE_NAME}=${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.authenticated).toBe(true);
    expect(body.user).toBeTruthy();
    expect(body.user.walletAddress).toBe(TEST_WALLET);
  });
});

test.describe("API: /api/courses", () => {
  test("returns 401 without auth", async ({ request }) => {
    const res = await request.get("/api/courses");
    expect(res.status()).toBe(401);
  });

  test("returns JSON array with auth", async ({ request }) => {
    const token = createTestJwt(TEST_WALLET);
    const res = await request.get("/api/courses", {
      headers: { Cookie: `${COOKIE_NAME}=${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("courses");
    expect(Array.isArray(body.courses)).toBe(true);
    expect(body).toHaveProperty("total");
  });

  test("supports pagination params", async ({ request }) => {
    const token = createTestJwt(TEST_WALLET);
    const res = await request.get("/api/courses?offset=0&limit=2", {
      headers: { Cookie: `${COOKIE_NAME}=${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.courses.length).toBeLessThanOrEqual(2);
    expect(typeof body.hasMore).toBe("boolean");
  });
});

test.describe("API: /api/leaderboard", () => {
  test("returns JSON with entries", async ({ request }) => {
    const res = await request.get("/api/leaderboard");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("entries");
    expect(Array.isArray(body.entries)).toBe(true);
  });
});

test.describe("API: /api/academy/status", () => {
  test("returns program status", async ({ request }) => {
    const res = await request.get("/api/academy/status");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("ok");
    expect(body).toHaveProperty("cluster");
    expect(body).toHaveProperty("programId");
  });
});

test.describe("API: /api/identity/me", () => {
  test("returns unauthenticated without cookie", async ({ request }) => {
    const res = await request.get("/api/identity/me");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.authenticated).toBe(false);
  });

  test("returns identity with valid cookie", async ({ request }) => {
    const token = createTestJwt(TEST_WALLET);
    const res = await request.get("/api/identity/me", {
      headers: { Cookie: `${COOKIE_NAME}=${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.authenticated).toBe(true);
  });
});

test.describe("API: Admin routes", () => {
  test("/api/admin/analytics returns 401 without admin cookie", async ({
    request,
  }) => {
    const res = await request.get("/api/admin/analytics");
    expect(res.status()).toBe(401);
  });

  test("/api/admin/analytics returns 401 with non-admin cookie", async ({
    request,
  }) => {
    const token = createTestJwt(TEST_WALLET);
    const res = await request.get("/api/admin/analytics", {
      headers: { Cookie: `${COOKIE_NAME}=${token}` },
    });
    expect(res.status()).toBe(401);
  });

  test("/api/admin/analytics returns 200 with admin cookie", async ({
    request,
  }) => {
    const token = createTestJwt(ADMIN_WALLET);
    const res = await request.get("/api/admin/analytics", {
      headers: { Cookie: `${COOKIE_NAME}=${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("totalLearners");
    expect(body).toHaveProperty("totalCourses");
  });

  test("/api/admin/users returns 401 without admin cookie", async ({
    request,
  }) => {
    const res = await request.get("/api/admin/users");
    expect(res.status()).toBe(401);
  });
});
