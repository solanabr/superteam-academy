import "server-only";
import crypto from "crypto";
import { NextResponse } from "next/server";

export class AdminAuthError extends Error {
  constructor() {
    super("Unauthorized");
  }
}

/**
 * Validates the Authorization: Bearer {ADMIN_SECRET} header.
 * Throws AdminAuthError if the token is missing or doesn't match ADMIN_SECRET.
 */
export function requireAdminAuth(req: Request): void {
  const token = req.headers.get("authorization")?.replace("Bearer ", "").trim();
  const expected = process.env.ADMIN_SECRET;

  const tokenBuf = Buffer.from(token ?? "");
  const expectedBuf = Buffer.from(expected ?? "");
  if (
    !expected ||
    tokenBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(tokenBuf, expectedBuf)
  ) {
    throw new AdminAuthError();
  }
}

/**
 * Returns a 401 NextResponse for use in catch blocks.
 *
 * Usage:
 *   try { requireAdminAuth(req) } catch (e) {
 *     if (e instanceof AdminAuthError) return adminUnauthorizedResponse();
 *     throw e;
 *   }
 */
export function adminUnauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

const ADMIN_SESSION_MAX_AGE_MS = 86400 * 1000; // 24h

export function isValidAdminSession(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;

  const dotIndex = cookieValue.indexOf(".");
  if (dotIndex === -1) return false;

  const timestamp = cookieValue.slice(0, dotIndex);
  const signature = cookieValue.slice(dotIndex + 1);

  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(timestamp)
    .digest("hex");

  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return false;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return false;

  const age = Date.now() - Number(timestamp);
  if (Number.isNaN(age) || age < 0 || age > ADMIN_SESSION_MAX_AGE_MS)
    return false;

  return true;
}
