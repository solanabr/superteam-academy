import { test, expect } from '@playwright/test';
import { LandingPage } from '../pages/landing.page';
import { ROUTES } from '../fixtures/test-data';

test.describe('Accessibility', () => {
  test('landing page has proper ARIA landmarks', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.navigate();

    // Header landmark
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Main navigation has aria-label
    const mainNav = page.locator('nav[aria-label="Main navigation"]');
    await expect(mainNav).toBeVisible();

    // Footer has role="contentinfo" and aria-label
    const footer = page.locator('footer[role="contentinfo"]');
    await expect(footer).toBeVisible();
    await expect(footer).toHaveAttribute('aria-label', 'Site footer');

    // Hero section has aria-labelledby
    const heroSection = page.locator('section[aria-labelledby="hero-heading"]');
    await expect(heroSection).toBeVisible();

    // The heading referenced by aria-labelledby exists
    const heroHeading = page.locator('#hero-heading');
    await expect(heroHeading).toBeVisible();
  });

  test('interactive elements are keyboard focusable', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.navigate();

    // Tab to the first focusable element — should land on the logo link
    await page.keyboard.press('Tab');
    const firstFocused = page.locator(':focus');
    await expect(firstFocused).toBeVisible();

    // Continue tabbing — should reach navigation links
    await page.keyboard.press('Tab');
    const secondFocused = page.locator(':focus');
    await expect(secondFocused).toBeVisible();

    // Verify that focused elements are actually interactive
    const tag = await secondFocused.evaluate((el) => el.tagName.toLowerCase());
    expect(['a', 'button', 'input', 'select', 'textarea']).toContain(tag);
  });

  test('tab navigation moves through main content', async ({ page }) => {
    await page.goto(ROUTES.settings());

    // Settings page has multiple interactive elements:
    // display name input, save button, theme toggles, language select

    const interactiveElements: string[] = [];

    // Tab through several elements and collect their roles/tags
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const focused = page.locator(':focus');
      const isVisible = await focused.isVisible().catch(() => false);

      if (isVisible) {
        const tag = await focused.evaluate((el) => el.tagName.toLowerCase());
        interactiveElements.push(tag);
      }
    }

    // Should have encountered multiple focusable interactive elements
    expect(interactiveElements.length).toBeGreaterThan(2);

    // All focused elements should be proper interactive tags
    const validTags = ['a', 'button', 'input', 'select', 'textarea'];
    for (const tag of interactiveElements) {
      expect(validTags).toContain(tag);
    }
  });
});
