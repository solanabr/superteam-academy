# E2E Testing Plan

## Overview

End-to-end testing using Playwright to cover critical user flows.

## Test Structure

```
tests/
├── e2e/
│   ├── auth.spec.ts
│   ├── courses.spec.ts
│   ├── lessons.spec.ts
│   ├── gamification.spec.ts
│   ├── profile.spec.ts
│   └── admin.spec.ts
├── fixtures/
│   └── test-data.ts
└── playwright.config.ts
```

## Test Cases

### 1. Authentication Tests

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('Welcome');
  });
  
  test('should login with wallet', async ({ page }) => {
    // Mock wallet connection
    await page.goto('/login');
    await page.click('[data-testid="wallet-connect"]');
    // ... wallet connection flow
    await expect(page).toHaveURL('/dashboard');
  });
  
  test('should login with Google', async ({ page }) => {
    await page.goto('/login');
    await page.click('[data-testid="google-login"]');
    // ... OAuth flow mock
    await expect(page).toHaveURL('/dashboard');
  });
  
  test('should link additional auth methods', async ({ page }) => {
    // Login first
    await page.goto('/settings');
    await page.click('[data-testid="link-github"]');
    // ... linking flow
    await expect(page.locator('[data-testid="github-linked"]')).toBeVisible();
  });
  
  test('should logout', async ({ page }) => {
    // Login first
    await page.goto('/settings');
    await page.click('[data-testid="logout"]');
    await expect(page).toHaveURL('/login');
  });
});
```

### 2. Course Tests

```typescript
// tests/e2e/courses.spec.ts
test.describe('Courses', () => {
  test('should display course catalog', async ({ page }) => {
    await page.goto('/courses');
    await expect(page.locator('.course-card')).toHaveCountGreaterThan(0);
  });
  
  test('should filter courses by difficulty', async ({ page }) => {
    await page.goto('/courses');
    await page.click('[data-testid="filter-difficulty-easy"]');
    await expect(page.locator('.course-card .difficulty')).toContainText('Easy');
  });
  
  test('should search courses', async ({ page }) => {
    await page.goto('/courses');
    await page.fill('[data-testid="search-input"]', 'Anchor');
    await expect(page.locator('.course-card')).toHaveCountGreaterThan(0);
  });
  
  test('should show course detail', async ({ page }) => {
    await page.goto('/courses/anchor-basics');
    await expect(page.locator('h1')).toContainText('Anchor');
    await expect(page.locator('.module-list')).toBeVisible();
  });
  
  test('should enroll in course', async ({ page }) => {
    // Login first
    await page.goto('/courses/anchor-basics');
    await page.click('[data-testid="enroll-button"]');
    await expect(page.locator('[data-testid="enrolled-badge"]')).toBeVisible();
  });
});
```

### 3. Lesson Tests

```typescript
// tests/e2e/lessons.spec.ts
test.describe('Lessons', () => {
  test.beforeEach(async ({ page }) => {
    // Login and enroll in course
  });
  
  test('should display lesson content', async ({ page }) => {
    await page.goto('/courses/anchor-basics/lessons/intro');
    await expect(page.locator('.lesson-content')).toBeVisible();
  });
  
  test('should save code in editor', async ({ page }) => {
    await page.goto('/courses/anchor-basics/lessons/challenge-1');
    await page.fill('.monaco-editor textarea', 'fn main() {}');
    await page.waitForTimeout(3000); // Wait for auto-save
    await page.reload();
    await expect(page.locator('.monaco-editor')).toContainText('fn main()');
  });
  
  test('should complete lesson', async ({ page }) => {
    await page.goto('/courses/anchor-basics/lessons/challenge-1');
    // Fill in correct code
    await page.fill('.monaco-editor textarea', 'correct solution');
    await page.click('[data-testid="run-tests"]');
    await expect(page.locator('.test-results')).toContainText('All tests passed');
    await expect(page.locator('[data-testid="complete-button"]')).toBeEnabled();
  });
  
  test('should navigate between lessons', async ({ page }) => {
    await page.goto('/courses/anchor-basics/lessons/1');
    await page.click('[data-testid="next-lesson"]');
    await expect(page).toHaveURL('/courses/anchor-basics/lessons/2');
  });
});
```

### 4. Gamification Tests

```typescript
// tests/e2e/gamification.spec.ts
test.describe('Gamification', () => {
  test('should display XP balance', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="xp-balance"]')).toBeVisible();
  });
  
  test('should show level progress', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="level-badge"]')).toBeVisible();
    await expect(page.locator('[data-testid="xp-progress"]')).toBeVisible();
  });
  
  test('should track streak', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="streak-display"]')).toBeVisible();
  });
  
  test('should display achievements', async ({ page }) => {
    await page.goto('/achievements');
    await expect(page.locator('.achievement-badge')).toHaveCountGreaterThan(0);
  });
  
  test('should show leaderboard', async ({ page }) => {
    await page.goto('/leaderboard');
    await expect(page.locator('.leaderboard-table')).toBeVisible();
    await expect(page.locator('.rank-entry')).toHaveCountGreaterThan(0);
  });
});
```

### 5. Profile Tests

```typescript
// tests/e2e/profile.spec.ts
test.describe('Profile', () => {
  test('should display user profile', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.locator('.profile-header')).toBeVisible();
    await expect(page.locator('.skill-chart')).toBeVisible();
  });
  
  test('should edit profile', async ({ page }) => {
    await page.goto('/settings');
    await page.fill('[data-testid="name-input"]', 'New Name');
    await page.click('[data-testid="save-profile"]');
    await page.goto('/profile');
    await expect(page.locator('.profile-name')).toContainText('New Name');
  });
  
  test('should display credentials', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.locator('.credential-card')).toBeVisible();
  });
  
  test('should toggle profile visibility', async ({ page }) => {
    await page.goto('/settings');
    await page.click('[data-testid="visibility-toggle"]');
    await expect(page.locator('[data-testid="visibility-status"]')).toContainText('Private');
  });
});
```

### 6. i18n Tests

```typescript
// tests/e2e/i18n.spec.ts
test.describe('Internationalization', () => {
  test('should switch to Portuguese', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-testid="lang-pt-BR"]');
    await expect(page.locator('nav')).toContainText('Cursos');
  });
  
  test('should switch to Spanish', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-testid="lang-es"]');
    await expect(page.locator('nav')).toContainText('Cursos');
  });
  
  test('should persist language preference', async ({ page }) => {
    await page.goto('/pt-BR');
    await page.goto('/');
    await expect(page).toHaveURL('/pt-BR');
  });
});
```

## Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Test Scripts

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report"
  }
}
```

## CI Integration

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```
