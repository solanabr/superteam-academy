import { test, expect } from '@playwright/test';
import { LandingPage } from '../pages/landing.page';
import { I18N, ROUTES } from '../fixtures/test-data';

test.describe('Internationalization (i18n)', () => {
  test('default locale is English', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.navigate('en');

    await expect(page).toHaveURL(/\/en/);
    await expect(landing.heroHeading).toContainText(I18N.en.heroTitle);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('Portuguese locale renders translated content', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.navigate('pt');

    await expect(page).toHaveURL(/\/pt/);
    await expect(landing.heroHeading).toContainText(I18N.pt.heroTitle);
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt');
  });

  test('Spanish locale renders translated content', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.navigate('es');

    await expect(page).toHaveURL(/\/es/);
    await expect(landing.heroHeading).toContainText(I18N.es.heroTitle);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  });

  test('locale prefix updates in URL for each locale', async ({ page }) => {
    // English
    await page.goto(ROUTES.courses('en'));
    await expect(page).toHaveURL(/\/en\/courses/);

    // Portuguese
    await page.goto(ROUTES.courses('pt'));
    await expect(page).toHaveURL(/\/pt\/courses/);

    // Spanish
    await page.goto(ROUTES.courses('es'));
    await expect(page).toHaveURL(/\/es\/courses/);
  });
});
