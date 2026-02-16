import { test, expect } from "../fixtures/base";
import { CommunityThreadsPage } from "../pages/community-threads.page";
import { injectMockWallet } from "../fixtures/wallet-mock";

test.describe("Thread creation", () => {
  test.beforeEach(async ({ page, communityApi }) => {
    // Inject wallet mock BEFORE any navigation
    await injectMockWallet(page);
    await communityApi.threads([], 0);
    await communityApi.stats();
  });

  test("discussion creation sends correct POST body", async ({ page, communityApi }) => {
    await communityApi.createThread({
      ok: true,
      txSignature: null,
      thread: { _id: "new-1", title: "Test Discussion", type: "discussion" },
    });

    const threads = new CommunityThreadsPage(page);
    await threads.goto();
    await page.waitForLoadState("domcontentloaded");

    // Wait for the button to be enabled (wallet auto-connect)
    await expect(threads.newThreadButton).toBeEnabled({ timeout: 15_000 });
    await threads.openCreateDialog();

    await threads.fillThread("Test Discussion", "Discussion body content");

    const requestPromise = page.waitForRequest((req) => {
      if (req.url().includes("/api/community/threads") && req.method() === "POST") {
        const body = req.postDataJSON();
        return body.title === "Test Discussion";
      }
      return false;
    });

    await threads.submitThread();
    const req = await requestPromise;
    const body = req.postDataJSON();
    expect(body.type).toBe("discussion");
    expect(body.title).toBe("Test Discussion");
    expect(body.body).toBe("Discussion body content");
  });

  test("question creation sends type=question in POST body (regression)", async ({
    page,
    communityApi,
  }) => {
    await communityApi.createThread({
      ok: true,
      txSignature: null,
      thread: { _id: "new-2", title: "My Question", type: "question" },
    });

    const threads = new CommunityThreadsPage(page);
    await threads.goto();
    await page.waitForLoadState("domcontentloaded");

    await expect(threads.newThreadButton).toBeEnabled({ timeout: 15_000 });
    await threads.openCreateDialog();

    await threads.fillThread("My Question", "How does this work?", "question");

    const requestPromise = page.waitForRequest((req) => {
      if (req.url().includes("/api/community/threads") && req.method() === "POST") {
        const body = req.postDataJSON();
        return body.type === "question";
      }
      return false;
    });

    await threads.submitThread();
    const req = await requestPromise;
    const body = req.postDataJSON();
    expect(body.type).toBe("question");
    expect(body.title).toBe("My Question");
  });

  test("submit button is disabled when title or body is empty", async ({ page }) => {
    const threads = new CommunityThreadsPage(page);
    await threads.goto();
    await page.waitForLoadState("domcontentloaded");

    await expect(threads.newThreadButton).toBeEnabled({ timeout: 15_000 });
    await threads.openCreateDialog();

    // Both empty → disabled
    await expect(threads.submitButton).toBeDisabled();

    // Title only → still disabled
    await threads.titleInput.fill("Title only");
    await expect(threads.submitButton).toBeDisabled();

    // Body only → still disabled
    await threads.titleInput.clear();
    await threads.bodyTextarea.fill("Body only");
    await expect(threads.submitButton).toBeDisabled();

    // Both filled → enabled
    await threads.titleInput.fill("Both filled");
    await expect(threads.submitButton).toBeEnabled();
  });

  test("shows success toast after creation", async ({ page, communityApi }) => {
    await communityApi.createThread({
      ok: true,
      txSignature: "abc123sig456",
      thread: { _id: "new-3", title: "Toast Test", type: "discussion" },
    });

    const threads = new CommunityThreadsPage(page);
    await threads.goto();
    await page.waitForLoadState("domcontentloaded");

    await expect(threads.newThreadButton).toBeEnabled({ timeout: 15_000 });
    await threads.openCreateDialog();
    await threads.fillThread("Toast Test", "Body for toast");
    await threads.submitThread();

    // Toast should appear with tx signature excerpt
    await expect(page.getByText(/abc123si/)).toBeVisible({ timeout: 10_000 });
  });

  test("shows error toast on API failure", async ({ page }) => {
    // Override the createThread mock with an error response
    await page.route("**/api/community/threads", (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      return route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Database connection failed" }),
      });
    });

    const threads = new CommunityThreadsPage(page);
    await threads.goto();
    await page.waitForLoadState("domcontentloaded");

    await expect(threads.newThreadButton).toBeEnabled({ timeout: 15_000 });
    await threads.openCreateDialog();
    await threads.fillThread("Fail Test", "This should fail");
    await threads.submitThread();

    // Error toast should surface the API error message
    await expect(page.getByText(/Database connection failed/i)).toBeVisible({ timeout: 10_000 });
  });
});
