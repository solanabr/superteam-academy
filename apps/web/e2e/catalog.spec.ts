import { test, expect } from "@playwright/test";
import {
  ACTIVE_COURSE_SLUGS,
  DEACTIVATED_COURSE_SLUG,
} from "./harness/fixtures.mjs";

// Spec 2 — Catalog gate (#711 regression, permanent).
//
// Anonymous `/en/courses` must render EXACTLY the active-course set. The gate
// (lib/content/deployments.isSynced) is fed by the mock's fixed
// `public_onchain_deployments` fixture: one course synced+active, one
// synced+is_active:false. This spec is the standing proof that a DEACTIVATED
// course can never leak back into the catalog — the shape of the #711 bug.
//
// No auth: this path needs none, which is why the issue says it can ship alone.

test.describe("catalog gate", () => {
  test("anonymous catalog renders only active courses; a deactivated course is absent", async ({
    page,
  }) => {
    await page.goto("/en/courses");

    // Prove the catalog rendered WITH data first, so the absence assertion below
    // can never pass trivially on an empty/failed page. Each active course's card
    // links to /<locale>/courses/<slug>.
    for (const slug of ACTIVE_COURSE_SLUGS) {
      await expect(
        page.locator(`a[href$="/courses/${slug}"]`).first(),
        `active course "${slug}" should be listed`
      ).toBeVisible();
    }

    // The #711 assertion: the deactivated course is nowhere in the catalog —
    // neither a visible card nor a stray link.
    await expect(
      page.locator(`a[href$="/courses/${DEACTIVATED_COURSE_SLUG}"]`),
      `deactivated course "${DEACTIVATED_COURSE_SLUG}" must NOT be listed`
    ).toHaveCount(0);
  });
});
