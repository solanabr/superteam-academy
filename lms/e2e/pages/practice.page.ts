import type { Page, Locator } from "@playwright/test";
import { localePath } from "../helpers/locale";

export class PracticePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly challengeTable: Locator;
  readonly challengeRows: Locator;
  readonly searchInput: Locator;
  readonly progressBar: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { level: 1 });
    this.challengeTable = page.locator("table");
    this.challengeRows = page.locator("tbody tr");
    this.searchInput = page.getByPlaceholder(/search/i);
    // Progress bar: the outer container with h-2 + rounded-full
    this.progressBar = page.locator(".h-2.rounded-full").first();
  }

  async goto(locale?: string) {
    await this.page.goto(localePath("/practice", locale));
  }
}
