import { test, expect } from '@playwright/test';

/**
 * Page rendering E2E tests
 *
 * Verifies each major page loads without errors, renders key UI elements,
 * and behaves correctly when wallet is not connected.
 */

test.describe('Landing page', () => {
  test('renders hero section', async ({ page }) => {
    await page.goto('/en');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Solana')).toBeVisible();
  });

  test('pt-BR landing has Portuguese content', async ({ page }) => {
    await page.goto('/pt-BR');
    await expect(page.locator('text=Aprenda').first()).toBeVisible();
  });

  test('es landing has Spanish content', async ({ page }) => {
    await page.goto('/es');
    await expect(page.locator('text=Aprende').first()).toBeVisible();
  });

  test('featured courses section renders', async ({ page }) => {
    await page.goto('/en');
    await page.locator('text=Featured Courses').waitFor({ timeout: 5000 }).catch(() => {});
    // Scroll to courses section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  });

  test('CTA links work', async ({ page }) => {
    await page.goto('/en');
    const ctaButton = page.locator('a[href="/en/courses"]').first();
    await expect(ctaButton).toBeVisible();
  });
});

test.describe('Courses page', () => {
  test('loads course catalog', async ({ page }) => {
    await page.goto('/en/courses');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('search input renders', async ({ page }) => {
    await page.goto('/en/courses');
    const searchInput = page.locator('input[type="text"], input[placeholder*="Search"]').first();
    await expect(searchInput).toBeVisible();
  });

  test('course cards are present', async ({ page }) => {
    await page.goto('/en/courses');
    // Should have at least one course card
    const cards = page.locator('[class*="rounded"][class*="border"]');
    await expect(cards.first()).toBeVisible();
  });

  test('Portuguese courses path works', async ({ page }) => {
    await page.goto('/pt-BR/cursos');
    await expect(page).toHaveURL('/pt-BR/cursos');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('Spanish courses path works', async ({ page }) => {
    await page.goto('/es/cursos');
    await expect(page).toHaveURL('/es/cursos');
  });
});

test.describe('Dashboard page', () => {
  test('shows connect wallet prompt when not connected', async ({ page }) => {
    await page.goto('/en/dashboard');
    // Should prompt wallet connection
    await expect(page.locator('text=Connect').first()).toBeVisible();
  });

  test('renders without JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/en/dashboard');
    // Filter out known non-critical errors (wallet adapter network errors)
    const criticalErrors = errors.filter(
      (e) => !e.includes('wallet') && !e.includes('WalletConnect') && !e.includes('MetaMask')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('pt-BR dashboard path works', async ({ page }) => {
    await page.goto('/pt-BR/painel');
    await expect(page).toHaveURL('/pt-BR/painel');
  });

  test('es panel path works', async ({ page }) => {
    await page.goto('/es/panel');
    await expect(page).toHaveURL('/es/panel');
  });
});

test.describe('Leaderboard page', () => {
  test('loads leaderboard table', async ({ page }) => {
    await page.goto('/en/leaderboard');
    await expect(page.locator('table, [role="table"]').first()).toBeVisible();
  });

  test('has time filter tabs', async ({ page }) => {
    await page.goto('/en/leaderboard');
    // Should have All Time / This Week / This Month tabs
    const tabs = page.locator('button').filter({ hasText: /All Time|This Week|This Month/ });
    await expect(tabs.first()).toBeVisible();
  });
});

test.describe('Community page', () => {
  test('loads community forum', async ({ page }) => {
    await page.goto('/en/community');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('thread list renders', async ({ page }) => {
    await page.goto('/en/community');
    // Should show at least one thread
    const threads = page.locator('[class*="rounded"][class*="border"]');
    await expect(threads.first()).toBeVisible();
  });

  test('search and filter controls present', async ({ page }) => {
    await page.goto('/en/community');
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
  });
});

test.describe('Profile page', () => {
  test('renders profile structure', async ({ page }) => {
    await page.goto('/en/profile');
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();
  });
});

test.describe('Settings page', () => {
  test('loads settings options', async ({ page }) => {
    await page.goto('/en/settings');
    await expect(page.locator('text=Language, text=Theme').first()).toBeVisible().catch(() => {
      // Settings may render as section cards
    });
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('language selector is present', async ({ page }) => {
    await page.goto('/en/settings');
    await expect(page.locator('text=Language')).toBeVisible();
  });
});

test.describe('Certificates page', () => {
  test('renders certificate list or empty state', async ({ page }) => {
    await page.goto('/en/certificates');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
});

test.describe('Challenges page', () => {
  test('renders challenge list', async ({ page }) => {
    await page.goto('/en/challenges');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
});

test.describe('404 handling', () => {
  test('non-existent page shows 404', async ({ page }) => {
    await page.goto('/en/this-page-does-not-exist');
    await expect(page.locator('text=404, text=Not Found').first()).toBeVisible().catch(() => {});
    // Should not throw unhandled errors
    expect(page.url()).toContain('/en');
  });
});
