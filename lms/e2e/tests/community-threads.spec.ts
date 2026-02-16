import { test, expect } from "../fixtures/base";
import { CommunityThreadsPage } from "../pages/community-threads.page";

const MOCK_THREADS = [
  {
    _id: "t1",
    author: "wallet1",
    authorName: "Alice",
    title: "How to stake SOL?",
    body: "I want to learn staking",
    type: "question",
    tags: ["staking"],
    views: 42,
    upvotes: [],
    isPinned: false,
    isSolved: false,
    replyCount: 3,
    txHash: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "t2",
    author: "wallet2",
    authorName: "Bob",
    title: "Welcome to the community!",
    body: "Let us discuss Solana dev",
    type: "discussion",
    tags: ["general"],
    views: 100,
    upvotes: ["wallet1"],
    isPinned: true,
    isSolved: false,
    replyCount: 10,
    txHash: "abc123def456",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

test.describe("Community threads listing", () => {
  test("renders thread list", async ({ page, communityApi }) => {
    await communityApi.threads(MOCK_THREADS, 2);
    await communityApi.stats();

    const threads = new CommunityThreadsPage(page);
    await threads.goto();

    await expect(threads.heading).toBeVisible();
    await expect(page.getByText("How to stake SOL?")).toBeVisible();
    await expect(page.getByText("Welcome to the community!")).toBeVisible();
  });

  test("filter tabs are visible", async ({ page, communityApi }) => {
    await communityApi.threads(MOCK_THREADS, 2);
    await communityApi.stats();

    const threads = new CommunityThreadsPage(page);
    await threads.goto();

    await expect(threads.tabAll).toBeVisible();
    await expect(threads.tabDiscussion).toBeVisible();
    await expect(threads.tabQuestion).toBeVisible();
  });

  test("clicking discussion tab refetches with type filter", async ({ page, communityApi }) => {
    await communityApi.threads(MOCK_THREADS, 2);
    await communityApi.stats();

    const threads = new CommunityThreadsPage(page);
    await threads.goto();

    const requestPromise = page.waitForRequest((req) =>
      req.url().includes("type=discussion"),
    );
    await threads.tabDiscussion.click();
    const req = await requestPromise;
    expect(req.url()).toContain("type=discussion");
  });

  test("clicking question tab filters by questions", async ({ page, communityApi }) => {
    await communityApi.threads(MOCK_THREADS, 2);
    await communityApi.stats();

    const threads = new CommunityThreadsPage(page);
    await threads.goto();

    const requestPromise = page.waitForRequest((req) =>
      req.url().includes("type=question"),
    );
    await threads.tabQuestion.click();
    const req = await requestPromise;
    expect(req.url()).toContain("type=question");
  });

  test("shows empty state when no threads", async ({ page, communityApi }) => {
    await communityApi.threads([], 0);
    await communityApi.stats();

    const threads = new CommunityThreadsPage(page);
    await threads.goto();

    await expect(page.getByText(/no thread/i)).toBeVisible();
  });

  test("pagination controls appear for multiple pages", async ({ page }) => {
    await page.route("**/api/community/threads?*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          threads: MOCK_THREADS,
          total: 60,
          page: 1,
          totalPages: 3,
        }),
      }),
    );
    await page.route("**/api/community/points*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ communityPoints: 0, endorsementCount: 0 }),
      }),
    );

    const threads = new CommunityThreadsPage(page);
    await threads.goto();

    await expect(page.getByText("1 / 3")).toBeVisible();
  });
});
