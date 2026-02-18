import { test as base, type Page } from "@playwright/test";
import { createHmac } from "crypto";

const JWT_SECRET = "superteam-academy-dev-wallet-secret";
const JWT_ISSUER = "superteam-academy";
const JWT_AUDIENCE = "superteam-frontend";
const COOKIE_NAME = "st_access_token";
const SESSION_TTL_S = 7 * 24 * 60 * 60;

const TEST_WALLET = "11111111111111111111111111111112";
const ADMIN_WALLET = "DwN8jYP5aY6RJYKDkeTFS3Vf6EpZrxPQVm3uzdG8QXRX";

function toBase64Url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function createTestJwt(walletAddress: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    iss: JWT_ISSUER,
    aud: JWT_AUDIENCE,
    sub: `wallet:${walletAddress}`,
    walletAddress,
    iat: now,
    exp: now + SESSION_TTL_S,
  };

  const encodedHeader = toBase64Url(
    Buffer.from(JSON.stringify(header), "utf8"),
  );
  const encodedPayload = toBase64Url(
    Buffer.from(JSON.stringify(payload), "utf8"),
  );
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = toBase64Url(
    createHmac("sha256", JWT_SECRET).update(signingInput).digest(),
  );

  return `${signingInput}.${signature}`;
}

async function setAuthCookie(page: Page, walletAddress: string): Promise<void> {
  const token = createTestJwt(walletAddress);
  await page.context().addCookies([
    {
      name: COOKIE_NAME,
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}

type AuthFixtures = {
  authenticatedPage: Page;
  adminPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    await setAuthCookie(page, TEST_WALLET);
    await use(page);
  },
  adminPage: async ({ page }, use) => {
    await setAuthCookie(page, ADMIN_WALLET);
    await use(page);
  },
});

export { expect } from "@playwright/test";
export { TEST_WALLET, ADMIN_WALLET, createTestJwt, COOKIE_NAME };
