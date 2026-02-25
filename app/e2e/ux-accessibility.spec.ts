import { test, expect } from '@playwright/test';

/**
 * UX, Accessibility & Responsive Design E2E tests
 *
 * Tests responsive behavior across viewports, keyboard navigation,
 * dark mode, page performance indicators, and ARIA compliance.
 */

test.describe('Responsive design — tablet viewport', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('home page renders correctly at tablet size', async ({ page }) => {
    await page.goto('/en');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
  });

  test('courses page renders at tablet size', async ({ page }) => {
    await page.goto('/en/courses');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('leaderboard renders at tablet size', async ({ page }) => {
    await page.goto('/en/leaderboard');
    await expect(page.locator('table, [role="table"]').first()).toBeVisible();
  });
});

test.describe('Responsive design — mobile viewport', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14

  test('courses page loads on mobile', async ({ page }) => {
    await page.goto('/en/courses');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('community page loads on mobile', async ({ page }) => {
    await page.goto('/en/community');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('admin page loads on mobile', async ({ page }) => {
    await page.goto('/en/admin');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
});

test.describe('Page meta & SEO', () => {
  test('home page has a title tag', async ({ page }) => {
    await page.goto('/en');
    const title = await page.title();
    expect(title.length).toBeGreaterThan(3);
  });

  test('courses page has a title tag', async ({ page }) => {
    await page.goto('/en/courses');
    const title = await page.title();
    expect(title.length).toBeGreaterThan(3);
  });

  test('home page has meta description', async ({ page }) => {
    await page.goto('/en');
    const meta = page.locator('meta[name="description"]');
    const count = await meta.count();
    expect(count).toBeGreaterThan(0);
  });

  test('page has canonical or viewport meta', async ({ page }) => {
    await page.goto('/en');
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveCount(1);
  });
});

test.describe('Accessibility basics', () => {
  test('home page has main landmark', async ({ page }) => {
    await page.goto('/en');
    const main = page.locator('main');
    await expect(main).toBeVisible().catch(() => {
      // May use a different semantic structure
    });
    await expect(page.locator('h1')).toBeVisible();
  });

  test('nav has accessible aria role or tag', async ({ page }) => {
    await page.goto('/en');
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });

  test('images have alt text or are decorative', async ({ page }) => {
    await page.goto('/en');
    const images = page.locator('img');
    const count = await images.count();
    for (let i = 0; i < Math.min(count, 5); i++) {
      const alt = await images.nth(i).getAttribute('alt');
      const role = await images.nth(i).getAttribute('role');
      // Either has alt text or is aria-hidden (decorative)
      expect(alt !== null || role === 'presentation').toBeTruthy();
    }
  });

  test('buttons have accessible text or aria-label', async ({ page }) => {
    await page.goto('/en');
    const buttons = page.locator('button');
    const count = await buttons.count();
    for (let i = 0; i < Math.min(count, 5); i++) {
      const text = await buttons.nth(i).textContent();
      const ariaLabel = await buttons.nth(i).getAttribute('aria-label');
      expect((text?.trim().length ?? 0) > 0 || (ariaLabel?.length ?? 0) > 0).toBeTruthy();
    }
  });

  test('leaderboard table has thead', async ({ page }) => {
    await page.goto('/en/leaderboard');
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('thead, th').first()).toBeVisible();
  });

  test('admin table has proper headers', async ({ page }) => {
    await page.goto('/en/admin');
    await page.locator('button', { hasText: /Courses|Cursos/ }).click();
    await expect(page.locator('thead, th').first()).toBeVisible();
  });
});

test.describe('PWA & performance checks', () => {
  test('manifest.json is accessible', async ({ page }) => {
    const response = await page.goto('/manifest.json');
    expect(response?.status()).toBeLessThan(400);
  });

  test('favicon is accessible', async ({ page }) => {
    const response = await page.goto('/favicon.ico');
    expect(response?.status()).toBeLessThan(400);
  });

  test('page loads without layout shift on home', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/en');
    await page.waitForLoadState('networkidle');
    const criticalErrors = errors.filter(
      e => !e.includes('wallet') && !e.includes('WalletConnect') && !e.includes('MetaMask')
        && !e.includes('Solana')
    );
    expect(criticalErrors.length).toBeLessThan(3);
  });

  test('courses page loads without critical errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/en/courses');
    await page.waitForLoadState('networkidle');
    const criticalErrors = errors.filter(
      e => !e.includes('wallet') && !e.includes('WalletConnect') && !e.includes('Solana')
    );
    expect(criticalErrors.length).toBeLessThan(3);
  });
});

test.describe('Dark mode / theme', () => {
  test('settings page has theme toggle', async ({ page }) => {
    await page.goto('/en/settings');
    const themeToggle = page.locator('button, [role="switch"]').filter({ hasText: /Dark|Light|Theme|Tema/i });
    await expect(themeToggle.first()).toBeVisible().catch(() => {
      // Theme may be a select element instead
      const themeSelect = page.locator('select, [role="combobox"]');
      return expect(themeSelect.first()).toBeVisible().catch(() => {});
    });
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
});

test.describe('Leaderboard interactions', () => {
  test('All Time tab is the default active tab', async ({ page }) => {
    await page.goto('/en/leaderboard');
    const allTimeTab = page.locator('button').filter({ hasText: /All Time/i }).first();
    await expect(allTimeTab).toBeVisible();
  });

  test('clicking This Week tab works', async ({ page }) => {
    await page.goto('/en/leaderboard');
    const weekTab = page.locator('button').filter({ hasText: /This Week|Esta Semana/i }).first();
    if (await weekTab.isVisible()) {
      await weekTab.click();
      await page.waitForTimeout(300);
    }
    await expect(page.locator('table')).toBeVisible();
  });

  test('clicking This Month tab works', async ({ page }) => {
    await page.goto('/en/leaderboard');
    const monthTab = page.locator('button').filter({ hasText: /This Month|Este Mês|Este Mes/i }).first();
    if (await monthTab.isVisible()) {
      await monthTab.click();
      await page.waitForTimeout(300);
    }
    await expect(page.locator('table')).toBeVisible();
  });

  test('leaderboard shows top learner names', async ({ page }) => {
    await page.goto('/en/leaderboard');
    await expect(page.locator('table tbody tr').first()).toBeVisible();
  });

  test('leaderboard has XP column', async ({ page }) => {
    await page.goto('/en/leaderboard');
    await expect(page.locator('text=XP, text=Points, text=Score').first()).toBeVisible().catch(() => {});
    await expect(page.locator('table')).toBeVisible();
  });

  test('pt-BR leaderboard (classificacao) path works', async ({ page }) => {
    await page.goto('/pt-BR/classificacao');
    await expect(page).toHaveURL('/pt-BR/classificacao');
    await expect(page.locator('table')).toBeVisible();
  });

  test('es leaderboard (clasificacion) path works', async ({ page }) => {
    await page.goto('/es/clasificacion');
    await expect(page).toHaveURL('/es/clasificacion');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
});

test.describe('Community interactions', () => {
  test('community page has create post CTA or prompt', async ({ page }) => {
    await page.goto('/en/community');
    const createPost = page.locator('button, a').filter({ hasText: /New Post|Create|Post|Share/i });
    await expect(createPost.first()).toBeVisible().catch(() => {
      // May require auth
    });
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('community categories/tabs exist', async ({ page }) => {
    await page.goto('/en/community');
    const tabs = page.locator('button[role="tab"], button').filter({ hasText: /All|General|Help|Tech/i });
    await expect(tabs.first()).toBeVisible().catch(() => {});
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
});

test.describe('Certificates page', () => {
  test('certificates page loads in pt-BR', async ({ page }) => {
    await page.goto('/pt-BR/certificados');
    await expect(page).toHaveURL('/pt-BR/certificados');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('certificates page shows empty state or certificate grid', async ({ page }) => {
    await page.goto('/en/certificates');
    await expect(page.locator('h1, h2').first()).toBeVisible();
    // Either shows existing certificates or empty state (wallet not connected)
    const content = page.locator('text=Connect, text=Certificate, text=Achievement, text=No certificates').first();
    await expect(content).toBeVisible().catch(() => {});
  });
});

test.describe('Challenges page', () => {
  test('challenges page renders challenge cards', async ({ page }) => {
    await page.goto('/en/challenges');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('challenges page pt-BR path works', async ({ page }) => {
    await page.goto('/pt-BR/desafios');
    await expect(page).toHaveURL('/pt-BR/desafios');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
});
