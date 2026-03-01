import type { Locator, Page } from '@playwright/test';
import { ROUTES, type TestLocale } from '../fixtures/test-data';

export class CoursesPage {
  readonly page: Page;

  // Selectors
  readonly pageTitle: Locator;
  readonly searchInput: Locator;
  readonly courseGrid: Locator;
  readonly courseCards: Locator;
  readonly filterSidebar: Locator;
  readonly mobileFilterButton: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;

    this.pageTitle = page.locator('h1');
    this.searchInput = page.getByPlaceholder(/search courses/i);
    this.courseGrid = page.locator('[class*="grid"]').first();
    this.courseCards = page.locator('a[href*="/courses/"]');
    this.filterSidebar = page.locator('.hidden.lg\\:flex').first();
    this.mobileFilterButton = page.getByLabel(/filter/i);
    this.emptyState = page.getByText(/no courses found/i);
  }

  async navigate(locale?: TestLocale) {
    await this.page.goto(ROUTES.courses(locale));
  }

  async searchCourse(query: string) {
    await this.searchInput.fill(query);
    // Allow debounce/filter to apply
    await this.page.waitForTimeout(300);
  }

  getGridCards(): Locator {
    return this.courseCards;
  }

  async clickCourseCard(index: number = 0) {
    await this.courseCards.nth(index).click();
  }

  async getPageTitleText(): Promise<string> {
    return (await this.pageTitle.textContent()) ?? '';
  }

  /**
   * Click a difficulty filter option in the sidebar.
   * Matches buttons/labels containing the difficulty text.
   */
  async selectDifficultyFilter(difficulty: 'Beginner' | 'Intermediate' | 'Advanced') {
    await this.page.getByRole('button', { name: new RegExp(difficulty, 'i') }).click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Click a track filter option in the sidebar.
   */
  async selectTrackFilter(track: string) {
    await this.page.getByRole('button', { name: new RegExp(track, 'i') }).click();
    await this.page.waitForTimeout(300);
  }
}
