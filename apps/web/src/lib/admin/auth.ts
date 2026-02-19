import "server-only";
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

  if (!expected || token !== expected) {
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
