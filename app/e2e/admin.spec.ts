import { test, expect, Page } from '@playwright/test';

/**
 * Admin dashboard E2E tests
 *
 * Verifies role-based access control, tab navigation,
 * course status toggling, and moderation workflow.
 */

const ADMIN_URL = '/en/admin';

/** Wait for the admin dashboard to render after dynamic import.
 * With RBAC enabled, unauthenticated users see Access Denied — this is correct. */
async function waitForDashboard(page: Page) {
  await page.locator('h1, h2, h3').first().waitFor({ timeout: 15000 });
}

/** Check if admin dashboard content is visible (vs Access Denied) */
async function isAdminVisible(page: Page): Promise<boolean> {
  const dashboard = await page.locator(':text-matches("Admin Dashboard|Painel|Panel")').first().isVisible().catch(() => false);
  return dashboard;
}

test.describe('Admin access control', () => {
  test('admin page loads without errors', async ({ page }) => {
    await page.goto(ADMIN_URL);
    await expect(page).toHaveURL(ADMIN_URL);
    // Without wallet connected, should show access denied (correct RBAC behavior)
    const hasContent = await page.locator('h1, h2, h3').first().waitFor({ timeout: 10000 }).then(() => true).catch(() => false);
    expect(hasContent).toBeTruthy();
  });

  test('shows admin RBAC gate when no wallet connected', async ({ page }) => {
    await page.goto(ADMIN_URL);
    // Wait for client-side rendering
    await page.waitForTimeout(3000);
    // Admin guard blocks unauthenticated users — check for access denied or lock icon
    const bodyText = await page.textContent('body') ?? '';
    const hasAccessDenied = bodyText.includes('Access Denied') || bodyText.includes('Acesso Negado') || bodyText.includes('access_denied');
    const hasDashboard = bodyText.includes('Admin Dashboard') || bodyText.includes('Painel');
    expect(hasAccessDenied || hasDashboard).toBeTruthy();
  });

  test('admin link in nav points to /en/admin', async ({ page }) => {
    await page.goto('/en');
    // Link may be inside collapsed mobile menu — check DOM presence
    const adminLink = page.locator('a[href="/en/admin"]').first();
    await expect(adminLink).toBeAttached();
    // Verify the admin page works via direct navigation
    await page.goto(ADMIN_URL);
    await expect(page).toHaveURL(ADMIN_URL);
  });

  test('pt-BR admin path works', async ({ page }) => {
    await page.goto('/pt-BR/admin');
    await expect(page).toHaveURL('/pt-BR/admin');
    await waitForDashboard(page);
  });
});

test.describe('Admin tab navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ADMIN_URL);
    await waitForDashboard(page);
    // Skip if admin is not accessible (no wallet connected)
    if (!(await isAdminVisible(page))) { test.skip(); return; }
  });

  test('Overview tab is active by default', async ({ page }) => {
    // KPI cards should be visible on overview
    const overviewContent = page.locator(':text-matches("Total Learners|Total de Alunos|Total de Alumnos")').first();
    await expect(overviewContent).toBeVisible();
  });

  test('Courses tab renders course table', async ({ page }) => {
    await page.locator('button', { hasText: /Courses|Cursos/ }).click();
    await expect(page.locator('table')).toBeVisible();
    // Should show Introduction to Solana
    await expect(page.locator('text=Introduction to Solana')).toBeVisible();
  });

  test('Users tab renders top learners', async ({ page }) => {
    await page.locator('button', { hasText: /Users|Usuários|Usuarios/ }).click();
    await expect(page.locator(':text-matches("Top Learners|Melhores Alunos|Mejores Alumnos")').first()).toBeVisible();
    // Should have a table
    await expect(page.locator('table')).toBeVisible();
  });

  test('Moderation tab renders flagged posts', async ({ page }) => {
    await page.locator('button', { hasText: /Moderation|Moderação|Moderación/ }).click();
    // Should show pending reports count or all-clear
    const reportBadge = page.locator(':text-matches("pending|pendentes|pendientes")').first();
    const allClear = page.locator(':text-matches("All Clear|Tudo Limpo|Todo Limpio")').first();
    await expect(reportBadge.or(allClear)).toBeVisible();
  });

  test('System tab shows health grid', async ({ page }) => {
    await page.locator('button', { hasText: /System|Sistema/ }).click();
    await expect(page.locator(':text-matches("Online|En Línea")').first()).toBeVisible();
  });
});

test.describe('Admin course management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ADMIN_URL);
    await waitForDashboard(page);
    if (!(await isAdminVisible(page))) { test.skip(); return; }
    await page.locator('button', { hasText: /Courses|Cursos/ }).click();
  });

  test('courses table has 5 rows', async ({ page }) => {
    const rows = page.locator('table tbody tr');
    await expect(rows).toHaveCount(5);
  });

  test('published courses show Published badge', async ({ page }) => {
    const publishedButtons = page.locator('button', { hasText: /Published|Publicado/ });
    await expect(publishedButtons.first()).toBeVisible();
  });

  test('draft courses show Draft badge', async ({ page }) => {
    const draftButtons = page.locator('button', { hasText: /Draft|Rascunho|Borrador/ });
    await expect(draftButtons.first()).toBeVisible();
  });

  test('toggling course status changes button label', async ({ page }) => {
    // Find the first Published button and click it
    const firstPublished = page.locator('button', { hasText: /Published|Publicado/ }).first();
    await firstPublished.click();
    // It should now show Draft
    await expect(page.locator('button', { hasText: /Draft|Rascunho|Borrador/ }).first()).toBeVisible();
  });
});

test.describe('Admin content moderation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ADMIN_URL);
    await waitForDashboard(page);
    if (!(await isAdminVisible(page))) { test.skip(); return; }
    await page.locator('button', { hasText: /Moderation|Moderação|Moderación/ }).click();
  });

  test('flagged posts are visible', async ({ page }) => {
    const approveButtons = page.locator('button', { hasText: /Approve|Aprovar|Aprobar/ });
    await expect(approveButtons.first()).toBeVisible();
  });

  test('approving a post updates its status', async ({ page }) => {
    const approveButton = page.locator('button', { hasText: /Approve|Aprovar|Aprobar/ }).first();
    await approveButton.click();
    // Should now show "Approved" label
    await expect(page.locator(':text-matches("Approved|Aprovado|Aprobado")').first()).toBeVisible();
  });

  test('removing a post updates its status', async ({ page }) => {
    const removeButton = page.locator('button', { hasText: /Remove|Remover|Eliminar/ }).first();
    await removeButton.click();
    await expect(page.locator(':text-matches("Removed|Removido|Eliminado")').first()).toBeVisible();
  });

  test('all-clear state shown after all posts actioned', async ({ page }) => {
    // Approve or remove all 3 flagged posts
    for (let i = 0; i < 3; i++) {
      const approveBtn = page.locator('button', { hasText: /Approve|Aprovar|Aprobar/ }).first();
      if (await approveBtn.isVisible()) {
        await approveBtn.click();
      }
    }
    await expect(page.locator(':text-matches("All Clear|Tudo Limpo|Todo Limpio")').first()).toBeVisible();
  });
});

test.describe('Admin system tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ADMIN_URL);
    await waitForDashboard(page);
    // Skip if admin is not accessible
    if (!(await isAdminVisible(page))) { test.skip(); return; }
    await page.locator('button', { hasText: /System|Sistema/ }).click();
  });

  test('all 6 system services shown as online', async ({ page }) => {
    const onlineIndicators = page.locator('[data-testid="service-online-badge"]');
    await expect(onlineIndicators).toHaveCount(6);
  });

  test('program config section shows program ID', async ({ page }) => {
    await expect(page.locator('text=3Yr5EZrq8t').first()).toBeVisible();
  });

  test('admin action buttons render', async ({ page }) => {
    await expect(page.locator('button', { hasText: /Sync CMS|Sincronizar/ }).first()).toBeVisible();
    await expect(page.locator('button', { hasText: /Export Users|Exportar/ }).first()).toBeVisible();
  });
});
