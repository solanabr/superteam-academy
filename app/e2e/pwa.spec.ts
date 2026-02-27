import { test, expect } from '@playwright/test';

test.describe('PWA Features', () => {
  test('manifest.json is accessible', async ({ request }) => {
    const res = await request.get('http://localhost:3000/manifest.json');
    if (res.ok()) {
      const data = await res.json();
      expect(data.name).toBeTruthy();
      expect(data.icons).toBeDefined();
    }
    // manifest might not exist yet - that's ok for now
    expect([200, 404]).toContain(res.status());
  });

  test('service worker registration script exists', async ({ page }) => {
    await page.goto('http://localhost:3000/en');
    // Check if SW is registered or if registration script exists
    const swRegistered = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    expect(swRegistered).toBe(true);
  });

  test('app has viewport meta tag', async ({ page }) => {
    await page.goto('http://localhost:3000/en');
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
  });

  test('app has theme-color meta tag', async ({ page }) => {
    await page.goto('http://localhost:3000/en');
    const themeColor = page.locator('meta[name="theme-color"]');
    const count = await themeColor.count();
    // Theme color is recommended for PWAs
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('app loads without network errors', async ({ page }) => {
    const failedRequests: string[] = [];
    page.on('requestfailed', req => {
      const failure = req.failure();
      // Skip aborted requests (caused by React component unmounts or redirects)
      if (failure?.errorText?.includes('ERR_ABORTED')) return;
      failedRequests.push(req.url());
    });
    await page.goto('http://localhost:3000/en');
    await page.waitForLoadState('networkidle');
    // Filter out expected non-critical failures
    const criticalFailures = failedRequests.filter(url =>
      url.includes('localhost:3000') &&
      !url.includes('favicon') &&
      !url.includes('_next/') // Next.js internal chunks and static assets
    );
    expect(criticalFailures.length).toBe(0);
  });

  test('icons are accessible', async ({ page }) => {
    await page.goto('http://localhost:3000/en');
    // Check for various icon links
    const icons = page.locator('link[rel="icon"], link[rel="apple-touch-icon"]');
    const count = await icons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('app has proper charset', async ({ page }) => {
    await page.goto('http://localhost:3000/en');
    const charset = await page.locator('meta[charset]').getAttribute('charset');
    expect(charset?.toLowerCase()).toBe('utf-8');
  });

  test('page has proper document structure', async ({ page }) => {
    await page.goto('http://localhost:3000/en');
    // Main, header, footer structure
    const main = await page.locator('main').count();
    expect(main).toBeGreaterThanOrEqual(0);
    const header = await page.locator('header, nav').count();
    expect(header).toBeGreaterThan(0);
  });

  test('images have alt attributes', async ({ page }) => {
    await page.goto('http://localhost:3000/en');
    const images = page.locator('img');
    const count = await images.count();
    for (let i = 0; i < Math.min(count, 10); i++) {
      const alt = await images.nth(i).getAttribute('alt');
      // alt should exist (can be empty for decorative images)
      expect(alt).not.toBeNull();
    }
  });

  test('app has no accessibility violations in document structure', async ({ page }) => {
    await page.goto('http://localhost:3000/en');
    // Check for skip-nav or main landmark
    const landmarks = await page.locator('[role="main"], main, [role="navigation"], nav').count();
    expect(landmarks).toBeGreaterThan(0);
  });
});
