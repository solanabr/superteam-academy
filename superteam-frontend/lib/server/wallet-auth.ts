import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const NONCE_TTL_MS = 5 * 60 * 1000;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const COOKIE_NAME = "st_access_token";
const NONCE_COOKIE_NAME = "st_wallet_nonce_challenge";
const DEV_WALLET_AUTH_SECRET = "superteam-academy-dev-wallet-secret";
const JWT_ISSUER = "superteam-academy";
const JWT_AUDIENCE = "superteam-frontend";

export type WalletJwtPayload = {
  sub: string;
  walletAddress: string;
};

const jwtSecret = DEV_WALLET_AUTH_SECRET;

function toBase64Url(input: Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(input: string): Buffer {
  const padded = input
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(input.length / 4) * 4, "=");
  return Buffer.from(padded, "base64");
}

function signJwtPart(data: string): string {
  return toBase64Url(createHmac("sha256", jwtSecret).update(data).digest());
}

export function getWalletSessionCookieName(): string {
  return COOKIE_NAME;
}

export function getWalletNonceCookieName(): string {
  return NONCE_COOKIE_NAME;
}

export function createNonce(): string {
  return toBase64Url(randomBytes(24));
}

export function buildWalletSignInMessage(
  address: string,
  nonce: string,
): string {
  const issuedAt = new Date().toISOString();
  const expirationTime = new Date(Date.now() + NONCE_TTL_MS).toISOString();
  return [
    "Sign in to Superteam Academy",
    `Address: ${address}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
    `Expiration Time: ${expirationTime}`,
  ].join("\n");
}

export function extractNonceFromMessage(message: string): string | null {
  const match = message.match(/Nonce:\s*(.+)/i);
  if (!match) return null;
  const nonce = match[1].trim();
  return nonce.length > 0 ? nonce : null;
}

export function extractAddressFromMessage(message: string): string | null {
  const match = message.match(/Address:\s*(.+)/i);
  if (!match) return null;
  const address = match[1].trim();
  return address.length > 0 ? address : null;
}

export function createNonceChallengeToken(
  address: string,
  nonce: string,
): string {
  const payload = {
    address,
    nonce,
    exp: Date.now() + NONCE_TTL_MS,
  };
  const encodedPayload = toBase64Url(
    Buffer.from(JSON.stringify(payload), "utf8"),
  );
  const signature = signJwtPart(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyNonceChallengeToken(
  token: string | undefined,
  address: string,
  nonce: string,
): boolean {
  if (!token) return false;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return false;

  const expectedSignature = signJwtPart(encodedPayload);
  const expectedBuffer = Buffer.from(expectedSignature);
  const actualBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== actualBuffer.length) return false;
  if (!timingSafeEqual(expectedBuffer, actualBuffer)) return false;

  try {
    const payload = JSON.parse(
      fromBase64Url(encodedPayload).toString("utf8"),
    ) as {
      address?: string;
      nonce?: string;
      exp?: number;
    };
    if (payload.address !== address) return false;
    if (payload.nonce !== nonce) return false;
    if (typeof payload.exp !== "number" || payload.exp < Date.now())
      return false;
    return true;
  } catch {
    return false;
  }
}

export async function createAccessTokenForWallet(
  userId: string,
  walletAddress: string,
): Promise<string> {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const expSeconds = nowSeconds + Math.floor(SESSION_TTL_MS / 1000);

  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const payload = {
    iss: JWT_ISSUER,
    aud: JWT_AUDIENCE,
    sub: userId,
    walletAddress,
    iat: nowSeconds,
    exp: expSeconds,
  };

  const encodedHeader = toBase64Url(
    Buffer.from(JSON.stringify(header), "utf8"),
  );
  const encodedPayload = toBase64Url(
    Buffer.from(JSON.stringify(payload), "utf8"),
  );
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = signJwtPart(signingInput);

  return `${signingInput}.${signature}`;
}

export async function verifyAccessToken(
  token: string | undefined,
): Promise<WalletJwtPayload | null> {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    if (!encodedHeader || !encodedPayload || !signature) return null;

    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = signJwtPart(signingInput);
    const expectedBuffer = Buffer.from(expectedSignature);
    const actualBuffer = Buffer.from(signature);
    if (expectedBuffer.length !== actualBuffer.length) return null;
    if (!timingSafeEqual(expectedBuffer, actualBuffer)) return null;

    const header = JSON.parse(
      fromBase64Url(encodedHeader).toString("utf8"),
    ) as { alg?: string; typ?: string };
    if (header.alg !== "HS256" || header.typ !== "JWT") {
      return null;
    }

    const payload = JSON.parse(
      fromBase64Url(encodedPayload).toString("utf8"),
    ) as {
      iss?: string;
      aud?: string;
      sub?: string;
      walletAddress?: string;
      exp?: number;
    };

    if (payload.iss !== JWT_ISSUER || payload.aud !== JWT_AUDIENCE) {
      return null;
    }
    if (
      typeof payload.exp !== "number" ||
      payload.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    if (
      typeof payload.sub !== "string" ||
      typeof payload.walletAddress !== "string"
    ) {
      return null;
    }

    return {
      sub: payload.sub,
      walletAddress: payload.walletAddress,
    };
  } catch {
    return null;
  }
}

export function getNonceExpiryIso(): string {
  return new Date(Date.now() + NONCE_TTL_MS).toISOString();
}
