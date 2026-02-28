import { test, expect } from '@playwright/test';
import { LandingPage } from '../pages/landing.page';
import { VIEWPORTS } from '../fixtures/test-data';

test.describe('Responsive Layout', () => {
  test('desktop layout renders header nav links', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    const landing = new LandingPage(page);
    await landing.navigate();

    // Desktop nav should be visible (md:flex)
    const desktopNav = page.locator('nav[aria-label="Main navigation"]');
    await expect(desktopNav).toBeVisible();

    // Mobile menu trigger should be hidden
    const mobileMenuBtn = page.getByLabel('Open navigation menu');
    await expect(mobileMenuBtn).not.toBeVisible();
  });

  test('tablet layout shows appropriate content', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.tablet);
    const landing = new LandingPage(page);
    await landing.navigate();

    // Hero should still be visible at tablet width
    await expect(landing.heroHeading).toBeVisible();

    // Header should be present
    await expect(landing.header).toBeVisible();
  });

  test('mobile layout hides desktop nav and shows mobile trigger', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    const landing = new LandingPage(page);
    await landing.navigate();

    // Desktop nav should be hidden (hidden by default, md:flex)
    const desktopNav = page.locator('nav[aria-label="Main navigation"]');
    await expect(desktopNav).not.toBeVisible();

    // Mobile menu button should be visible
    const mobileMenuBtn = page.getByLabel('Open navigation menu');
    await expect(mobileMenuBtn).toBeVisible();
  });

  test('mobile nav sheet opens and closes', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    const landing = new LandingPage(page);
    await landing.navigate();

    const mobileMenuBtn = page.getByLabel('Open navigation menu');
    await mobileMenuBtn.click();

    // The Sheet should open with mobile navigation links
    const mobileNav = page.locator('nav[aria-label="Mobile navigation"]');
    await expect(mobileNav).toBeVisible();

    // Close by pressing Escape
    await page.keyboard.press('Escape');
    await expect(mobileNav).not.toBeVisible();
  });
});
