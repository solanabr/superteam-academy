/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await page.goto('http://localhost:3000/en/courses/solana-mock-test/lessons/0', {
    waitUntil: 'networkidle',
  });

  const overflow = await page.evaluate(() => ({
    htmlScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    viewportWidth: window.innerWidth,
    hasOverflow:
      document.documentElement.scrollWidth > window.innerWidth ||
      document.body.scrollWidth > window.innerWidth,
  }));

  console.log(JSON.stringify(overflow));
  await browser.close();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
