import { Page } from "@playwright/test";

const MOCK_WALLET = "7Rq1abcdefghijklmnopqrstuvwxyz1234dK4f";

export { MOCK_WALLET };

export async function mockWalletConnected(page: Page) {
  await page.addInitScript(() => {
    (window as any).__MOCK_WALLET = {
      publicKey: "7Rq1abcdefghijklmnopqrstuvwxyz1234dK4f",
      connected: true,
    };
  });
}

export async function mockWalletDisconnected(page: Page) {
  await page.addInitScript(() => {
    (window as any).__MOCK_WALLET = {
      publicKey: null,
      connected: false,
    };
  });
}

export async function mockApiRoutes(page: Page) {
  // Mock /api/leaderboard
  await page.route("**/api/leaderboard**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          rank: 1,
          wallet: "7Rq1...dK4f",
          displayName: "TestUser",
          xp: 2800,
          level: 5,
          streak: 12,
        },
        {
          rank: 2,
          wallet: "9nQE...GFJk",
          displayName: "Builder",
          xp: 1900,
          level: 4,
          streak: 7,
        },
      ]),
    }),
  );

  // Mock /api/admin/stats
  await page.route("**/api/admin/stats**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        totalCourses: 6,
        activeLearners: 100,
        credentialsIssued: 50,
        totalXpDistributed: 50000,
      }),
    }),
  );

  // Mock /api/community/threads
  await page.route("**/api/community/threads**", (route) => {
    if (route.request().method() === "GET") {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          threads: [
            {
              id: "1",
              title: "How to start with Anchor?",
              body: "I'm new...",
              author_wallet: "7Rq1...dK4f",
              category: "help",
              is_answered: false,
              upvotes: 5,
              reply_count: 3,
              created_at: new Date().toISOString(),
            },
            {
              id: "2",
              title: "My first Solana program!",
              body: "Just deployed...",
              author_wallet: "9nQE...GFJk",
              category: "showcase",
              is_answered: false,
              upvotes: 12,
              reply_count: 7,
              created_at: new Date().toISOString(),
            },
          ],
          total: 2,
        }),
      });
    } else {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: "new-thread" }),
      });
    }
  });

  // Mock /api/complete-lesson
  await page.route("**/api/complete-lesson**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ signature: "mock-sig-123" }),
    }),
  );

  // Mock /api/finalize-course
  await page.route("**/api/finalize-course**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ signature: "mock-finalize-sig" }),
    }),
  );

  // Mock /api/courses/*/finalize
  await page.route("**/api/courses/*/finalize**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ signature: "mock-finalize-sig" }),
    }),
  );
}
