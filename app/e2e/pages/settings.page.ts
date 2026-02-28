import type { Locator, Page } from '@playwright/test';
import { ROUTES, type TestLocale } from '../fixtures/test-data';

export class SettingsPage {
  readonly page: Page;

  // Selectors
  readonly pageTitle: Locator;
  readonly profileCard: Locator;
  readonly appearanceCard: Locator;
  readonly themeButtons: Locator;
  readonly languageSelect: Locator;
  readonly displayNameInput: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.pageTitle = page.locator('h1');
    this.profileCard = page.getByText(/profile/i).first();
    this.appearanceCard = page.getByText(/appearance/i).first();

    // Theme buttons are the 3 option cards (Light, Dark, System) with aria-pressed
    this.themeButtons = page.locator('button[aria-pressed]');
    this.languageSelect = page.locator('button[role="combobox"]').first();
    this.displayNameInput = page.locator('#display-name');
    this.saveButton = page.getByRole('button', { name: /^save$/i });
  }

  async navigate(locale?: TestLocale) {
    await this.page.goto(ROUTES.settings(locale));
  }

  /**
   * Click one of the theme option buttons (Light, Dark, System).
   * Uses aria-pressed to identify theme toggle buttons.
   */
  async switchTheme(theme: 'Light' | 'Dark' | 'System') {
    await this.page.getByRole('button', { name: new RegExp(theme, 'i') }).click();
    // Allow next-themes to apply
    await this.page.waitForTimeout(200);
  }

  /**
   * Open the language dropdown and select a locale.
   */
  async switchLanguage(locale: 'English' | 'Português' | 'Español') {
    await this.languageSelect.click();
    await this.page.getByRole('option', { name: locale }).click();
  }

  async getPageTitleText(): Promise<string> {
    return (await this.pageTitle.textContent()) ?? '';
  }
}
