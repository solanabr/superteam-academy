import { test, expect } from "@playwright/test";

// Spec 3 — Unsubscribe (SKIPPED until the email feature lands: David's #769).
//
// The issue scopes this spec now but ships it disabled until there is a route to
// exercise. Authored against the contract so enabling it is a one-line change
// (remove `.skip`) plus confirming the final route path:
//   • GET with a bad/forged token → the failure page (never a silent success).
//   • POST is ALWAYS 200 (list-unsubscribe one-click must not leak validity or
//     let a prefetch/scanner error out) — the token is validated on GET.
//
// When #769 merges: set UNSUBSCRIBE_PATH to the real route, drop `.skip`, and
// adjust the failure-page assertion to match the shipped copy/testid.
const UNSUBSCRIBE_PATH = "/en/unsubscribe"; // TODO(#769): confirm final path.

test.describe.skip("unsubscribe (pending email feature #769)", () => {
  test("GET with a bad token shows the failure page", async ({ page }) => {
    const res = await page.goto(`${UNSUBSCRIBE_PATH}?token=not-a-real-token`);
    // The page renders (200) but communicates failure — it does not 500 or
    // silently claim success.
    expect(res?.status()).toBe(200);
    await expect(
      page.getByRole("heading", {
        name: /couldn.t unsubscribe|invalid|expired/i,
      })
    ).toBeVisible();
  });

  test("POST is always 200 regardless of token validity", async ({
    request,
  }) => {
    const res = await request.post(`${UNSUBSCRIBE_PATH}`, {
      form: { token: "not-a-real-token" },
    });
    expect(res.status()).toBe(200);
  });
});
