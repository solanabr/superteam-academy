import { test, expect } from "../fixtures/base";
import { ThreadDetailPage } from "../pages/thread-detail.page";

const MOCK_THREAD = {
  _id: "thread-123",
  author: "wallet1",
  authorName: "Alice",
  title: "How to build a token?",
  body: "I want to create a custom SPL token on Solana. What are the steps?",
  type: "question",
  tags: ["token", "spl"],
  views: 55,
  upvotes: ["wallet2"],
  isPinned: false,
  isSolved: false,
  solvedReplyId: null,
  replyCount: 2,
  txHash: "sig123abc",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const MOCK_REPLIES = [
  {
    _id: "r1",
    threadId: "thread-123",
    author: "wallet2",
    authorName: "Bob",
    body: "Use the spl-token CLI or @solana/spl-token SDK.",
    upvotes: ["wallet1"],
    txHash: "replysig1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "r2",
    threadId: "thread-123",
    author: "wallet3",
    authorName: "Charlie",
    body: "Check out the Solana Cookbook for examples.",
    upvotes: [],
    txHash: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

test.describe("Thread detail page", () => {
  test.beforeEach(async ({ communityApi }) => {
    await communityApi.threadDetail(MOCK_THREAD);
    await communityApi.replies(MOCK_REPLIES);
  });

  test("renders thread title and body", async ({ page }) => {
    const detail = new ThreadDetailPage(page);
    await detail.goto("thread-123");
    await page.waitForLoadState("domcontentloaded");

    await expect(detail.title).toContainText("How to build a token?");
    await expect(detail.body).toContainText("custom SPL token");
  });

  test("renders replies", async ({ page }) => {
    const detail = new ThreadDetailPage(page);
    await detail.goto("thread-123");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByText("Use the spl-token CLI")).toBeVisible();
    await expect(page.getByText("Check out the Solana Cookbook")).toBeVisible();
  });

  test("shows reply count", async ({ page }) => {
    const detail = new ThreadDetailPage(page);
    await detail.goto("thread-123");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByText(/\(2\)/)).toBeVisible();
  });

  test("back link navigates to threads list", async ({ page }) => {
    const detail = new ThreadDetailPage(page);
    await detail.goto("thread-123");
    await page.waitForLoadState("domcontentloaded");

    await expect(detail.backLink).toBeVisible();
    const href = await detail.backLink.getAttribute("href");
    expect(href).toContain("/community/threads");
  });

  test("shows thread not found for missing thread", async ({ page }) => {
    // Override the thread mock to return null
    await page.route("**/api/community/threads/*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(null),
      }),
    );

    const detail = new ThreadDetailPage(page);
    await detail.goto("nonexistent");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByText(/not found/i)).toBeVisible();
  });
});
