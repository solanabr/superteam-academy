import type { Page, Locator } from "@playwright/test";
import { localePath } from "../helpers/locale";

export class CoursesPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly courseCards: Locator;
  readonly searchInput: Locator;
  readonly difficultyBadges: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { level: 1 });
    this.courseCards = page.locator("[class*=card]");
    this.searchInput = page.getByPlaceholder(/search/i);
    this.difficultyBadges = page.locator("[class*=badge]");
  }

  async goto(locale?: string) {
    await this.page.goto(localePath("/courses", locale));
  }
}
