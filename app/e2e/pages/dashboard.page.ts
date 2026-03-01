import type { Locator, Page } from '@playwright/test';
import { ROUTES, type TestLocale } from '../fixtures/test-data';

export class DashboardPage {
  readonly page: Page;

  // Selectors
  readonly welcomeBanner: Locator;
  readonly quickStats: Locator;
  readonly continueLearning: Locator;
  readonly activityHeatmap: Locator;
  readonly recentAchievements: Locator;
  readonly credentialGallery: Locator;
  readonly recommendedCourses: Locator;

  constructor(page: Page) {
    this.page = page;

    // These selectors target the component wrappers rendered by the dashboard page.
    // We use text-based or structural selectors since the components
    // don't all have explicit data-testid attributes yet.
    this.welcomeBanner = page.locator('[class*="flex"][class*="flex-col"]').first();
    this.quickStats = page.getByText(/xp|level|streak/i).first();
    this.continueLearning = page.getByText(/continue learning/i);
    this.activityHeatmap = page.getByText(/activity/i);
    this.recentAchievements = page.getByText(/recent achievements/i);
    this.credentialGallery = page.getByText(/credentials/i).first();
    this.recommendedCourses = page.getByText(/recommended/i);
  }

  async navigate(locale?: TestLocale) {
    await this.page.goto(ROUTES.dashboard(locale));
  }

  getWelcomeBanner(): Locator {
    return this.welcomeBanner;
  }

  getStatsCards(): Locator {
    return this.quickStats;
  }

  getContinueLearning(): Locator {
    return this.continueLearning;
  }

  getActivityHeatmap(): Locator {
    return this.activityHeatmap;
  }
}
