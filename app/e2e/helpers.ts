import { Page } from "@playwright/test";

/**
 * Dismiss the onboarding modal by setting localStorage before navigation.
 * The OnboardingModal checks localStorage("onboarding-completed") on mount.
 * Call this once per page context before navigating.
 */
export async function dismissOnboarding(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("onboarding-completed", "true");
  });
}
