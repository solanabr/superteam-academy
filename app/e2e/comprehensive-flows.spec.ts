import { test, expect, type Page } from "@playwright/test";

async function expectRouteLoads(page: Page, path: string, expectedUrlPattern: RegExp) {
	const response = await page.goto(path, { waitUntil: "domcontentloaded" });
	expect(response).not.toBeNull();
	expect(response?.status()).toBeLessThan(400);
	await expect(page).toHaveURL(expectedUrlPattern);
	await expect(page.locator("h1").first()).toBeVisible();
}

test.describe("Superteam Academy route modernization", () => {
	test("loads localized core routes", async ({ page }) => {
		await expectRouteLoads(page, "/en", /\/en$/);
		await expectRouteLoads(page, "/en/courses", /\/en\/courses$/);
		await expectRouteLoads(page, "/en/leaderboard", /\/en\/leaderboard$/);
		await expectRouteLoads(page, "/en/settings", /\/en\/settings$/);
		await expectRouteLoads(page, "/en/dashboard", /\/en\/dashboard$/);
		await expectRouteLoads(page, "/en/profile", /\/en\/profile$/);
	});

	test("opens a course detail from catalog", async ({ page }) => {
		await page.goto("/en/courses", { waitUntil: "domcontentloaded" });
		const courseLink = page
			.locator('a[href^="/en/courses/"]')
			.filter({ hasNotText: "courses" })
			.first();
		await expect(courseLink).toBeVisible();
		await courseLink.click();
		await expect(page).toHaveURL(/\/en\/courses\/[\w-]+$/);
		await expect(page.locator("h1").first()).toBeVisible();
	});

	test("loads canonical lesson route", async ({ page }) => {
		const response = await page.goto("/en/courses/solana-intro/lessons/1-1", {
			waitUntil: "domcontentloaded",
		});
		expect(response).not.toBeNull();
		expect(response?.status()).toBeLessThan(400);
		await expect(page).toHaveURL(/\/en\/courses\/solana-intro\/lessons\/1-1$/);
		await expect(page.getByRole("tab", { name: /content|conteúdo/i })).toBeVisible();
	});

	test("redirects legacy learn route to canonical lessons route", async ({ page }) => {
		const response = await page.goto("/en/courses/solana-intro/learn?lesson=1-1", {
			waitUntil: "domcontentloaded",
		});
		expect(response).not.toBeNull();
		await expect(page).toHaveURL(/\/en\/courses\/solana-intro\/lessons\/1-1$/);
	});

	test("loads challenge route under course namespace", async ({ page }) => {
		const response = await page.goto("/en/courses/solana-intro/challenges/1-1", {
			waitUntil: "domcontentloaded",
		});
		expect(response).not.toBeNull();
		expect(response?.status()).toBeLessThan(400);
		await expect(page).toHaveURL(/\/en\/courses\/solana-intro\/challenges\/1-1$/);
		await expect(page.locator("h1").first()).toBeVisible();
	});

	test("leaderboard filters update URL query params", async ({ page }) => {
		await page.goto("/en/leaderboard", { waitUntil: "domcontentloaded" });

		await page.getByPlaceholder("Search learners...").fill("1111");

		await page.locator("button").filter({ hasText: "All Time" }).first().click();
		await page.getByRole("option", { name: "This Week" }).click();

		await expect(page).toHaveURL(/time=weekly/);
		await expect(page).toHaveURL(/q=1111/);
	});

	test("covers learner journey surfaces and learning API contracts", async ({ page }) => {
		await page.goto("/en/courses/solana-intro", { waitUntil: "domcontentloaded" });
		await expect(page.locator("h1").first()).toBeVisible();
		await expect(page.getByText(/enrollment|enrolment/i).first()).toBeVisible();

		await page.goto("/en/courses/solana-intro/lessons/1-1", { waitUntil: "domcontentloaded" });
		await expect(page).toHaveURL(/\/en\/courses\/solana-intro\/lessons\/1-1$/);
		await expect(page.getByRole("tab", { name: /content|conteúdo/i })).toBeVisible();
		await expect(page.getByRole("button", { name: /mark complete/i })).toBeVisible();

		await page.goto("/en/courses/solana-intro/challenges/1-1", {
			waitUntil: "domcontentloaded",
		});
		await expect(page).toHaveURL(/\/en\/courses\/solana-intro\/challenges\/1-1$/);
		await expect(page.getByRole("button", { name: /run tests/i })).toBeVisible();
		await expect(page.getByRole("button", { name: /submit/i })).toBeVisible();

		const completeRes = await page.request.post("/api/lessons/complete", {
			data: {},
		});
		expect([400, 401]).toContain(completeRes.status());

		const finalizeRes = await page.request.post("/api/courses/finalize", {
			data: {},
		});
		expect([400, 401]).toContain(finalizeRes.status());

		const issueCredentialRes = await page.request.post("/api/credentials/issue", {
			data: {},
		});
		expect([400, 401]).toContain(issueCredentialRes.status());

		await page.goto("/en/certificates", { waitUntil: "domcontentloaded" });
		await expect(page.locator("h1").first()).toBeVisible();
	});
});
