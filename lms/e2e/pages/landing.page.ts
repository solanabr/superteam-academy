import type { Page, Locator } from "@playwright/test";

export class LandingPage {
  readonly page: Page;
  readonly hero: Locator;
  readonly ctaButton: Locator;
  readonly navLinks: Locator;
  readonly featureCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.hero = page.locator("section").first();
    this.ctaButton = page
      .getByRole("link", { name: /courses|start|explore/i })
      .first();
    this.navLinks = page.locator("nav a, nav button");
    this.featureCards = page.locator("[class*=card]");
  }

  async goto(locale?: string) {
    const path = locale && locale !== "en" ? `/${locale}` : "/";
    await this.page.goto(path);
  }
}
