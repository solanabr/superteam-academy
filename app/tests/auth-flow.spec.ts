// tests/app.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Superteam Academy E2E', () => {

  test('has title and opens sign in modal', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');

    // Проверяем логотип
    await expect(page.locator('header').getByText('Superteam Academy')).toBeVisible();

    // Проверяем наличие и клик по кнопке Sign In
    const signInButton = page.getByRole('button', { name: 'Sign In' });
    await expect(signInButton).toBeVisible();
    await signInButton.click();

    // Проверяем модалку
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    
    // Проверяем кнопку GitHub внутри модалки
    const githubButton = dialog.getByRole('button', { name: /GitHub/i });
    await expect(githubButton).toBeVisible();
  });

  test('can switch languages', async ({ page }) => {
    // Идем на английскую версию
    await page.goto('http://localhost:3000/en');
    await page.waitForLoadState('networkidle');
    
    // Ищем кнопку переключения языка
    // У нас это Select, поэтому мы ищем по role='combobox'
    const langSelect = page.getByRole('combobox');
    await expect(langSelect).toBeVisible();
    
    // Кликаем, чтобы открыть дропдаун
    await langSelect.click();
    
    // Выбираем испанский
    const spanishOption = page.getByRole('option', { name: 'Español' });
    await spanishOption.click();

    // Проверяем, что URL изменился на /es
    await expect(page).toHaveURL(/.*\/es/);
    
    // Проверяем, что текст на кнопке "Courses" перевелся на испанский ("Cursos" или как у тебя в es.json)
    // Убедись, что в messages/es.json "Courses" переведено как "Cursos"
    await expect(page.locator('nav').getByText(/Cursos/i)).toBeVisible();
  });

  test('can navigate to courses and see search input', async ({ page }) => {
    await page.goto('http://localhost:3000/en/courses');
    await page.waitForLoadState('networkidle');

    // Проверяем наличие заголовка страницы курсов
    await expect(page.getByRole('heading', { name: 'Explore Courses' })).toBeVisible();

    // Проверяем наличие поля поиска
    const searchInput = page.getByPlaceholder('Search courses...');
    await expect(searchInput).toBeVisible();
    
    // Пишем текст в поиск
    await searchInput.fill('rust');
    await expect(searchInput).toHaveValue('rust');
  });

});