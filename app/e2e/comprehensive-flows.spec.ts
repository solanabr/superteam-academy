import { test, expect, type Page } from "@playwright/test";
import { Keypair } from "@solana/web3.js";
import nacl from "tweetnacl";
import { createSignInMessage } from "@superteam-academy/auth";

async function expectRouteLoads(page: Page, path: string, expectedUrlPattern: RegExp) {
	const response = await page.goto(path, { waitUntil: "domcontentloaded" });
	expect(response).not.toBeNull();
	expect(response?.status()).toBeLessThan(400);
	await expect(page).toHaveURL(expectedUrlPattern);
	await expect(page.locator("h1").first()).toBeVisible();
}

async function signInWithWallet(requestContext: {
	get: (url: string) => Promise<{ status: () => number; json: () => Promise<unknown> }>;
	post: (
		url: string,
		options?: { data?: unknown }
	) => Promise<{ status: () => number; json: () => Promise<unknown> }>;
}) {
	const nonceRes = await requestContext.get("/api/auth/wallet/nonce");
	expect(nonceRes.status()).toBe(200);

	const nonceBody = (await nonceRes.json()) as { nonce: string; domain: string };
	const wallet = Keypair.generate();
	const message = createSignInMessage(nonceBody.nonce, nonceBody.domain);
	const signatureBytes = nacl.sign.detached(new TextEncoder().encode(message), wallet.secretKey);

	const verifyRes = await requestContext.post("/api/auth/wallet/verify", {
		data: {
			publicKey: wallet.publicKey.toBase58(),
			signature: Buffer.from(signatureBytes).toString("base64"),
			message,
		},
	});
	expect(verifyRes.status()).toBe(200);

	const verifyBody = (await verifyRes.json()) as {
		authenticated?: boolean;
		publicKey?: string;
	};
	expect(verifyBody.authenticated).toBe(true);
	expect(verifyBody.publicKey).toBe(wallet.publicKey.toBase58());
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

	test("authenticated API paths pass auth gate with wallet signature", async ({
		playwright,
		baseURL,
	}) => {
		const authenticatedRequest = await playwright.request.newContext({
			baseURL,
		});

		await signInWithWallet(authenticatedRequest);

		const completeRes = await authenticatedRequest.post("/api/lessons/complete", {
			data: {},
		});
		expect(completeRes.status()).toBe(400);

		const finalizeRes = await authenticatedRequest.post("/api/courses/finalize", {
			data: {},
		});
		expect(finalizeRes.status()).toBe(400);

		const issueRes = await authenticatedRequest.post("/api/credentials/issue", {
			data: {},
		});
		expect(issueRes.status()).toBe(400);

		const claimRes = await authenticatedRequest.post("/api/achievements/claim", {
			data: {},
		});
		expect([400, 422]).toContain(claimRes.status());

		await authenticatedRequest.dispose();
	});
});
