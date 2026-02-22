import type { Page, Locator } from "@playwright/test";
import { localePath } from "../helpers/locale";

export class ThreadDetailPage {
  readonly page: Page;
  readonly title: Locator;
  readonly body: Locator;
  readonly backLink: Locator;
  readonly replyCards: Locator;
  readonly replyTextarea: Locator;
  readonly replyButton: Locator;
  readonly upvoteButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.getByRole("heading", { level: 1 });
    this.body = page.locator("[class*=whitespace-pre-wrap]").first();
    this.backLink = page.getByRole("link", { name: /back/i });
    this.replyCards = page
      .locator("[class*=card]")
      .filter({ hasNot: page.locator("textarea") });
    this.replyTextarea = page.getByPlaceholder(/reply/i);
    this.replyButton = page.getByRole("button", { name: /post|reply|send/i });
    this.upvoteButton = page
      .locator("button")
      .filter({ has: page.locator("svg") })
      .first();
  }

  async goto(threadId: string, locale?: string) {
    await this.page.goto(localePath(`/community/threads/${threadId}`, locale));
  }
}
