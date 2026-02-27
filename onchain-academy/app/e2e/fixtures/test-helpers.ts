import { Page } from "@playwright/test";

export async function gotoWithLocale(page: Page, path: string, locale = "en") {
  await page.goto(`/${locale}${path}`);
}

export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState("networkidle");
}

export function shortenWallet(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}
