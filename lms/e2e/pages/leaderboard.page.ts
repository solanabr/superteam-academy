import type { Page, Locator } from "@playwright/test";
import { localePath } from "../helpers/locale";

export class LeaderboardPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly entries: Locator;
  readonly timeframeTabs: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { level: 1 });
    this.entries = page.locator("[class*=card]");
    this.timeframeTabs = page.locator("button").filter({ hasText: /week|month|all/i });
    this.emptyState = page.getByText(/no ranking/i);
  }

  async goto(locale?: string) {
    await this.page.goto(localePath("/leaderboard", locale));
  }
}
