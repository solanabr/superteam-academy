import type { Page, Route } from "@playwright/test";

type Handler = (route: Route) => Promise<void> | void;

/** Intercept community API calls and respond with mock data. */
export function mockCommunityApi(page: Page) {
  return {
    /** Mock GET /api/community/threads */
    async threads(threads: object[] = [], total = 0) {
      await page.route("**/api/community/threads?*", (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            threads,
            total,
            page: 1,
            totalPages: Math.ceil(total / 20) || 1,
          }),
        }),
      );
    },

    /** Mock POST /api/community/threads */
    async createThread(response?: object) {
      await page.route("**/api/community/threads", (route) => {
        if (route.request().method() !== "POST") return route.fallback();
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(
            response ?? {
              ok: true,
              txSignature: null,
              thread: { _id: "mock-id", title: "mock", type: "discussion" },
            },
          ),
        });
      });
    },

    /** Mock GET /api/community/threads/:id */
    async threadDetail(thread: object) {
      await page.route("**/api/community/threads/*", (route) => {
        if (route.request().method() !== "GET") return route.fallback();
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(thread),
        });
      });
    },

    /** Mock GET /api/community/replies */
    async replies(replies: object[] = []) {
      await page.route("**/api/community/replies*", (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(replies),
        }),
      );
    },

    /** Mock GET /api/community/points */
    async stats(stats?: object) {
      await page.route("**/api/community/points*", (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(
            stats ?? { communityPoints: 100, endorsementCount: 5 },
          ),
        }),
      );
    },
  };
}

/** Intercept learning API calls and respond with mock data. */
export function mockLearningApi(page: Page) {
  return {
    async courses(courses: object[] = []) {
      await page.route("**/api/learning/courses", (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(courses),
        }),
      );
    },

    async progress(progress: object[] = []) {
      await page.route("**/api/learning/progress?*", (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(progress),
        }),
      );
    },

    async leaderboard(entries: object[] = []) {
      await page.route("**/api/learning/leaderboard*", (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(entries),
        }),
      );
    },

    async xp(xp = 0) {
      await page.route("**/api/learning/xp*", (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(xp),
        }),
      );
    },

    async practice(data?: object) {
      await page.route("**/api/learning/practice?*", (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(
            data ?? {
              completed: [],
              txHashes: {},
              claimedMilestones: [],
              milestoneTxHashes: {},
            },
          ),
        }),
      );
    },
  };
}
