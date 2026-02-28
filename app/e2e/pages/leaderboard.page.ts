import type { Locator, Page } from '@playwright/test';
import { ROUTES, type TestLocale } from '../fixtures/test-data';

export class LeaderboardPage {
  readonly page: Page;

  // Selectors
  readonly pageTitle: Locator;
  readonly podium: Locator;
  readonly table: Locator;
  readonly timeFilterButtons: Locator;
  readonly refreshButton: Locator;
  readonly yourRank: Locator;

  constructor(page: Page) {
    this.page = page;

    this.pageTitle = page.locator('h1');
    // PodiumTop3 renders a section or div with the top 3 entries
    this.podium = page.getByText(/rank|#1|#2|#3/i).first();
    // LeaderboardTable renders entries after the podium
    this.table = page.locator('table, [role="table"]').first();
    this.timeFilterButtons = page.getByRole('tab');
    this.refreshButton = page.getByRole('button', { name: /refresh/i });
    this.yourRank = page.getByText(/your rank/i);
  }

  async navigate(locale?: TestLocale) {
    await this.page.goto(ROUTES.leaderboard(locale));
  }

  getPodium(): Locator {
    return this.podium;
  }

  getTable(): Locator {
    return this.table;
  }

  async switchTimeFilter(filter: 'Weekly' | 'Monthly' | 'All Time') {
    await this.page.getByRole('tab', { name: new RegExp(filter, 'i') }).click();
    await this.page.waitForTimeout(300);
  }

  async getPageTitleText(): Promise<string> {
    return (await this.pageTitle.textContent()) ?? '';
  }
}
