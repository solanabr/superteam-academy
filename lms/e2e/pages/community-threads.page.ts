import type { Page, Locator } from "@playwright/test";
import { localePath } from "../helpers/locale";

export class CommunityThreadsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly newThreadButton: Locator;
  readonly threadCards: Locator;
  readonly filterTabs: Locator;
  readonly tabAll: Locator;
  readonly tabDiscussion: Locator;
  readonly tabQuestion: Locator;
  readonly sortSelect: Locator;

  // Dialog elements
  readonly titleInput: Locator;
  readonly bodyTextarea: Locator;
  readonly typeSelect: Locator;
  readonly tagsInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { level: 1 });
    this.newThreadButton = page.getByTestId("new-thread-button");
    this.threadCards = page.getByTestId("thread-card");
    this.filterTabs = page.getByTestId("thread-filter-tabs");
    this.tabAll = page.getByTestId("tab-all");
    this.tabDiscussion = page.getByTestId("tab-discussion");
    this.tabQuestion = page.getByTestId("tab-question");
    this.sortSelect = page.locator("select, [role=combobox]").last();

    // Dialog
    this.titleInput = page.getByPlaceholder(/title/i);
    this.bodyTextarea = page.getByPlaceholder(/body|content|describe/i);
    this.typeSelect = page.getByTestId("thread-type-select");
    this.tagsInput = page.getByPlaceholder(/tag/i);
    this.submitButton = page.getByTestId("create-thread-submit");
  }

  async goto(locale?: string) {
    await this.page.goto(localePath("/community/threads", locale));
  }

  async openCreateDialog() {
    await this.newThreadButton.click();
  }

  async fillThread(title: string, body: string, type?: "discussion" | "question", tags?: string) {
    await this.titleInput.fill(title);
    await this.bodyTextarea.fill(body);
    if (type) {
      await this.typeSelect.click();
      await this.page.getByRole("option", { name: new RegExp(type, "i") }).click();
    }
    if (tags) {
      await this.tagsInput.fill(tags);
    }
  }

  async submitThread() {
    await this.submitButton.click();
  }
}
