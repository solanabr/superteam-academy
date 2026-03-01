// tests/auth-flow.spec.ts
import { test, expect } from '@playwright/test';

test('has title and opens sign in modal', async ({ page }) => {
  // 1. Открываем страницу
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');

  // 2. Проверяем редирект на локаль (например, /en)
  await expect(page).toHaveURL(/.*\/en.*/);

  // 3. Проверяем логотип в шапке
  await expect(page.locator('header').getByText('Superteam Academy')).toBeVisible();

  // 4. Находим кнопку "Sign In"
  const signInButton = page.getByRole('button', { name: 'Sign In' });
  await expect(signInButton).toBeVisible();

  // 5. КЛИКАЕМ на кнопку "Sign In"
  await signInButton.click();

  // 6. Проверяем, что открылось диалоговое окно (модалка)
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  // 7. Проверяем, что внутри модалки есть кнопка GitHub
  // (В headless-браузере тестировать кошельки сложно, так как нет расширения Phantom, 
  // поэтому мы проверяем наличие кнопки GitHub как гарантию того, что модалка отрендерилась)
  const githubButton = dialog.getByRole('button', { name: /GitHub/i });
  await expect(githubButton).toBeVisible();

  console.log('✅ Тест прошёл успешно');
});