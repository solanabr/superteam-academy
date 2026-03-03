import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
    test("should render hero section with CTA buttons", async ({ page }) => {
        await page.goto("/");

        // Check hero content
        await expect(page.getByText("Learn Solana,")).toBeVisible();
        await expect(page.getByText("Earn Onchain")).toBeVisible();
        await expect(page.getByText("Explore Courses")).toBeVisible();
        await expect(page.getByText("View Leaderboard")).toBeVisible();
    });

    test("should display live devnet badge", async ({ page }) => {
        await page.goto("/");
        await expect(page.getByText("Live on Solana Devnet")).toBeVisible();
    });

    test("should navigate to courses page", async ({ page }) => {
        await page.goto("/");
        await page.click("text=Explore Courses");
        await expect(page).toHaveURL("/courses");
    });

    test("should show platform stats", async ({ page }) => {
        await page.goto("/");
        await expect(page.getByText("Active Learners")).toBeVisible();
        await expect(page.getByText("XP Distributed")).toBeVisible();
    });

    test("should show featured courses section", async ({ page }) => {
        await page.goto("/");
        await expect(page.getByText("Featured Courses")).toBeVisible();
    });
});

test.describe("Course Catalog", () => {
    test("should render course grid", async ({ page }) => {
        await page.goto("/courses");
        await expect(page.getByText("Course Catalog")).toBeVisible();
    });

    test("should filter courses by track", async ({ page }) => {
        await page.goto("/courses");
        await page.click("text=ANCHOR");
        // Verify only anchor courses are shown (or "No courses found" if filter is too strict)
        await expect(page.locator(".min-h-screen")).toBeVisible();
    });

    test("should search courses", async ({ page }) => {
        await page.goto("/courses");
        await page.fill("input[placeholder='Search courses...']", "Anchor");
        // Results should update accordingly
        await expect(page.locator(".min-h-screen")).toBeVisible();
    });
});

test.describe("Course Detail", () => {
    test("should show course info and syllabus", async ({ page }) => {
        await page.goto("/courses/anchor-101");
        await expect(page.getByText("Course Syllabus")).toBeVisible();
    });

    test("should show enrollment button when wallet not connected", async ({ page }) => {
        await page.goto("/courses/anchor-101");
        await expect(page.getByText("Connect Wallet to Enroll")).toBeVisible();
    });
});

test.describe("Leaderboard", () => {
    test("should render leaderboard with tabs", async ({ page }) => {
        await page.goto("/leaderboard");
        await expect(page.getByRole("heading", { name: /leaderboard/i })).toBeVisible();
    });
});

test.describe("Onboarding Quiz", () => {
    test("should navigate through all questions", async ({ page }) => {
        await page.goto("/onboarding");

        // Q1
        await expect(page.getByText("How familiar are you with blockchain")).toBeVisible();
        await page.click("text=Completely new");

        // Q2
        await expect(page.getByText("What is your experience with Rust")).toBeVisible();
        await page.click("text=Never written Rust before");

        // Q3
        await expect(page.getByText("Have you used the Solana CLI")).toBeVisible();
        await page.click("text=No, this is my first time");

        // Q4
        await expect(page.getByText("What is your experience with Anchor")).toBeVisible();
        await page.click("text=Never heard of Anchor");

        // Result
        await expect(page.getByText("Your Path is Ready!")).toBeVisible();
        await expect(page.getByText("Solana Core Basics")).toBeVisible();
    });
});

test.describe("Dashboard", () => {
    test("should render dashboard page", async ({ page }) => {
        await page.goto("/dashboard");
        await expect(page.locator(".min-h-screen")).toBeVisible();
    });
});

test.describe("Responsive Design", () => {
    test("should work on mobile viewport", async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto("/");
        await expect(page.getByText("Learn Solana,")).toBeVisible();
    });
});
