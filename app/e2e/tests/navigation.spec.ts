import { test, expect } from '@playwright/test';
import { LandingPage } from '../pages/landing.page';
import { ROUTES, I18N } from '../fixtures/test-data';

test.describe('Navigation', () => {
  test('landing page loads with hero content', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.navigate();

    await expect(landing.heroHeading).toBeVisible();
    await expect(landing.heroHeading).toContainText(I18N.en.heroTitle);
    await expect(landing.heroCta).toBeVisible();
  });

  test('navigate from landing to courses via CTA', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.navigate();

    await landing.navigateToCourses();
    await expect(page).toHaveURL(/\/en\/courses/);
    await expect(page.locator('h1')).toContainText(I18N.en.catalogTitle);
  });

  test('navigate to dashboard', async ({ page }) => {
    await page.goto(ROUTES.dashboard());
    await expect(page).toHaveURL(/\/en\/dashboard/);
    // Dashboard should render without crashing
    await expect(page.locator('main')).toBeVisible();
  });

  test('navigate to leaderboard', async ({ page }) => {
    await page.goto(ROUTES.leaderboard());
    await expect(page).toHaveURL(/\/en\/leaderboard/);
    await expect(page.locator('h1')).toContainText(I18N.en.leaderboardTitle);
  });

  test('navigate to settings', async ({ page }) => {
    await page.goto(ROUTES.settings());
    await expect(page).toHaveURL(/\/en\/settings/);
    await expect(page.locator('h1')).toContainText(I18N.en.settingsTitle);
  });

  test('header nav links are present on desktop', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.navigate();

    const navTexts = await landing.getHeaderNavTexts();

    expect(navTexts).toContain(I18N.en.navCourses);
    expect(navTexts).toContain(I18N.en.navLeaderboard);
    expect(navTexts).toContain(I18N.en.navCommunity);
  });

  test('footer links are present', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.navigate();

    await expect(landing.footer).toBeVisible();

    // Platform section links
    const footerLinks = landing.footerPlatformLinks;
    const count = await footerLinks.count();
    expect(count).toBeGreaterThan(0);

    // Verify at least one known link exists
    await expect(landing.footer.getByText('Courses')).toBeVisible();
  });
});
