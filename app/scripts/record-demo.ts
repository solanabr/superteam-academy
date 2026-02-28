/**
 * Automated demo video recorder for Superteam Academy
 * Run: npx ts-node scripts/record-demo.ts
 * Or:  npm run demo:record
 *
 * Requires app running on localhost:3001 (npm run dev)
 * Output: demo-video/superteam-academy-demo.webm (~3-5 min)
 */

import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const OUTPUT_DIR = path.join(process.cwd(), 'demo-video');

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scrollDown(page: Parameters<typeof chromium.launch>[0] extends never ? never : Awaited<ReturnType<ReturnType<typeof chromium.launch>['newPage']>>, amount = 600) {
  await page.evaluate((px) => window.scrollBy({ top: px, behavior: 'smooth' }), amount);
  await sleep(800);
}

async function scrollTo(page: Parameters<typeof chromium.launch>[0] extends never ? never : Awaited<ReturnType<ReturnType<typeof chromium.launch>['newPage']>>, top = 0) {
  await page.evaluate((px) => window.scrollTo({ top: px, behavior: 'smooth' }), top);
  await sleep(600);
}

(async () => {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log('🎬 Starting Superteam Academy demo recording...');
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Output: ${OUTPUT_DIR}/superteam-academy-demo.webm\n`);

  const browser = await chromium.launch({ headless: false });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: OUTPUT_DIR,
      size: { width: 1440, height: 900 },
    },
    colorScheme: 'dark',
  });

  const page = await context.newPage();

  // ── 1. Landing Page ────────────────────────────────────────────────
  console.log('1/10 Landing page...');
  await page.goto(`${BASE_URL}/en`, { waitUntil: 'networkidle' });
  await sleep(2000);
  await scrollDown(page, 400);
  await sleep(1000);
  await scrollDown(page, 500);   // learning tracks
  await sleep(1200);
  await scrollDown(page, 500);   // features
  await sleep(1000);
  await scrollDown(page, 500);   // testimonials
  await sleep(1000);
  await scrollDown(page, 500);   // CTA banner
  await sleep(1000);
  await scrollTo(page, 0);
  await sleep(800);

  // ── 2. Courses Catalog ─────────────────────────────────────────────
  console.log('2/10 Courses catalog...');
  await page.goto(`${BASE_URL}/en/courses`, { waitUntil: 'networkidle' });
  await sleep(1500);
  await scrollDown(page, 400);
  await sleep(800);

  // Search interaction
  const searchInput = page.locator('input[name="q"], input[placeholder*="Search"], input[type="search"]').first();
  if (await searchInput.isVisible()) {
    await searchInput.click();
    await sleep(400);
    await searchInput.type('Anchor', { delay: 80 });
    await sleep(1000);
    await searchInput.clear();
    await sleep(400);
  }

  // Difficulty filter
  const intermediateBtn = page.locator('a, button').filter({ hasText: 'Intermediate' }).first();
  if (await intermediateBtn.isVisible()) {
    await intermediateBtn.click();
    await sleep(1000);
    await page.goBack();
    await sleep(800);
  }

  // ── 3. Course Detail ───────────────────────────────────────────────
  console.log('3/10 Course detail...');
  await page.goto(`${BASE_URL}/en/courses/solana-fundamentals`, { waitUntil: 'networkidle' });
  await sleep(1500);
  await scrollDown(page, 400);
  await sleep(800);

  // Open a module accordion
  const moduleDetail = page.locator('details').first();
  if (await moduleDetail.isVisible()) {
    await moduleDetail.click();
    await sleep(800);
  }
  await scrollDown(page, 400);
  await sleep(1000);
  await scrollTo(page, 0);
  await sleep(500);

  // ── 4. Lesson View ────────────────────────────────────────────────
  console.log('4/10 Lesson view...');
  await page.goto(`${BASE_URL}/en/courses/solana-fundamentals/lessons/solana-fundamentals-l1`, { waitUntil: 'networkidle' });
  await sleep(2000);

  // Scroll lesson content
  await scrollDown(page, 300);
  await sleep(800);

  // Click "Show Hint"
  const hintBtn = page.locator('button').filter({ hasText: /hint/i }).first();
  if (await hintBtn.isVisible()) {
    await hintBtn.click();
    await sleep(1000);
  }

  // Show solution toggle
  const solutionBtn = page.locator('button').filter({ hasText: /solution/i }).first();
  if (await solutionBtn.isVisible()) {
    await solutionBtn.click();
    await sleep(1200);
    await solutionBtn.click();
    await sleep(600);
  }

  // Click "Run Code"
  const runBtn = page.locator('button').filter({ hasText: /run code|mark complete/i }).first();
  if (await runBtn.isVisible()) {
    await runBtn.click();
    await sleep(2000);
  }

  // ── 5. Dashboard ──────────────────────────────────────────────────
  console.log('5/10 Dashboard...');
  await page.goto(`${BASE_URL}/en/dashboard`, { waitUntil: 'networkidle' });
  await sleep(1500);
  await scrollDown(page, 400);
  await sleep(800);
  await scrollDown(page, 500);
  await sleep(800);
  await scrollDown(page, 500);
  await sleep(1000);
  await scrollTo(page, 0);
  await sleep(600);

  // ── 6. Leaderboard ───────────────────────────────────────────────
  console.log('6/10 Leaderboard...');
  await page.goto(`${BASE_URL}/en/leaderboard`, { waitUntil: 'networkidle' });
  await sleep(1500);
  await scrollDown(page, 400);
  await sleep(800);

  // Switch timeframe tabs
  const monthlyTab = page.locator('a').filter({ hasText: /monthly/i }).first();
  if (await monthlyTab.isVisible()) {
    await monthlyTab.click();
    await sleep(1000);
  }
  const weeklyTab = page.locator('a').filter({ hasText: /weekly/i }).first();
  if (await weeklyTab.isVisible()) {
    await weeklyTab.click();
    await sleep(1000);
  }
  const allTimeTab = page.locator('a').filter({ hasText: /all.time/i }).first();
  if (await allTimeTab.isVisible()) {
    await allTimeTab.click();
    await sleep(800);
  }

  // ── 7. Onboarding Quiz ───────────────────────────────────────────
  console.log('7/10 Onboarding quiz...');
  await page.goto(`${BASE_URL}/en/onboarding`, { waitUntil: 'networkidle' });
  await sleep(1500);

  // Start assessment
  const startBtn = page.locator('button').filter({ hasText: /start/i }).first();
  if (await startBtn.isVisible()) {
    await startBtn.click();
    await sleep(800);
  }

  // Answer each question (pick first option)
  for (let step = 0; step < 4; step++) {
    const firstOption = page.locator('button[class*="border"]').first();
    if (await firstOption.isVisible()) {
      await firstOption.click();
      await sleep(600);
    }
    const nextBtn = page.locator('button').filter({ hasText: /next|see results/i }).first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await sleep(800);
    }
  }
  await sleep(1500);

  // ── 8. Settings — Light mode toggle ─────────────────────────────
  console.log('8/10 Settings...');
  await page.goto(`${BASE_URL}/en/settings`, { waitUntil: 'networkidle' });
  await sleep(1500);

  // Switch to Appearance tab
  const appearanceTab = page.locator('button').filter({ hasText: /appearance/i }).first();
  if (await appearanceTab.isVisible()) {
    await appearanceTab.click();
    await sleep(800);
  }

  // Toggle light mode
  const lightBtn = page.locator('button').filter({ hasText: /light/i }).first();
  if (await lightBtn.isVisible()) {
    await lightBtn.click();
    await sleep(1500);
  }

  // Toggle back to dark
  const darkBtn = page.locator('button').filter({ hasText: /dark/i }).first();
  if (await darkBtn.isVisible()) {
    await darkBtn.click();
    await sleep(1000);
  }

  // Switch to Language tab
  const languageTab = page.locator('button').filter({ hasText: /language/i }).first();
  if (await languageTab.isVisible()) {
    await languageTab.click();
    await sleep(800);
  }

  // ── 9. Certificate View ──────────────────────────────────────────
  console.log('9/10 Certificate...');
  await page.goto(`${BASE_URL}/en/certificates/demo-cert-001`, { waitUntil: 'networkidle' });
  await sleep(1500);
  await scrollDown(page, 400);
  await sleep(1000);

  // ── 10. Admin Dashboard + Community ─────────────────────────────
  console.log('10/10 Admin + Community...');
  await page.goto(`${BASE_URL}/en/admin`, { waitUntil: 'networkidle' });
  await sleep(1500);
  await scrollDown(page, 400);
  await sleep(800);
  await scrollDown(page, 500);
  await sleep(800);

  await page.goto(`${BASE_URL}/en/community`, { waitUntil: 'networkidle' });
  await sleep(1500);
  await scrollDown(page, 400);
  await sleep(1000);

  // Back to landing — outro
  console.log('Outro...');
  await page.goto(`${BASE_URL}/en`, { waitUntil: 'networkidle' });
  await sleep(2000);

  // ── Done ──────────────────────────────────────────────────────────
  console.log('\n✅ Recording complete. Saving video...');
  await context.close();
  await browser.close();

  // Find and rename the generated video
  const files = fs.readdirSync(OUTPUT_DIR).filter((f) => f.endsWith('.webm'));
  if (files.length > 0) {
    const latest = files
      .map((f) => ({ name: f, time: fs.statSync(path.join(OUTPUT_DIR, f)).mtime }))
      .sort((a, b) => b.time.getTime() - a.time.getTime())[0];

    const outPath = path.join(OUTPUT_DIR, 'superteam-academy-demo.webm');
    fs.renameSync(path.join(OUTPUT_DIR, latest.name), outPath);
    const stat = fs.statSync(outPath);
    console.log(`\n🎬 Video saved: ${outPath}`);
    console.log(`   Size: ${(stat.size / 1024 / 1024).toFixed(1)} MB`);
    console.log('\n📤 Upload to YouTube/Loom for the hackathon submission.\n');
  }
})();
