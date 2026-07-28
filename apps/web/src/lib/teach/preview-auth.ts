import "server-only";
import crypto from "crypto";
import { NextResponse } from "next/server";

/**
 * Password gate for the teacher course-preview page (#828).
 *
 * Deliberately SEPARATE from `lib/admin/auth.ts`: the admin secret authorizes
 * authority-signed on-chain writes, while this gates a read-only renderer. They
 * use different cookie names and different secrets, so a preview session can
 * never satisfy `requireAdminAuth` (and vice versa).
 */

export class TeachPreviewAuthError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "TeachPreviewAuthError";
  }
}

export const TEACH_PREVIEW_COOKIE = "teach_preview_session";
export const TEACH_PREVIEW_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Interim shared password. `TEACH_PREVIEW_PASSWORD` overrides it; the default
 * is intentionally trivial because this gate protects unpublished course drafts
 * (already destined to be public), never funds, secrets, or writes. Swap the
 * env var before this is useful to anyone outside the team.
 */
const DEFAULT_PASSWORD = "123";

export function getPreviewPassword(): string {
  const configured = process.env.TEACH_PREVIEW_PASSWORD;
  return configured && configured.length > 0 ? configured : DEFAULT_PASSWORD;
}

/**
 * The HMAC key for session cookies. Prefers a real server secret so cookies
 * can't be forged by anyone who guesses the (weak, shared) password; falls back
 * to the password itself when no secret is configured, which still binds the
 * cookie to the current password.
 */
function sessionSecret(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.ADMIN_SECRET ??
    getPreviewPassword()
  );
}

/** Length-safe constant-time compare (timingSafeEqual throws on length drift). */
function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export function isValidPreviewPassword(candidate: unknown): boolean {
  if (typeof candidate !== "string") return false;
  return safeEqual(candidate, getPreviewPassword());
}

export function mintPreviewSession(): string {
  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac("sha256", sessionSecret())
    .update(timestamp)
    .digest("hex");
  return `${timestamp}.${signature}`;
}

export function isValidPreviewSession(
  cookieValue: string | undefined
): boolean {
  if (!cookieValue) return false;
  const dot = cookieValue.indexOf(".");
  if (dot <= 0) return false;

  const timestamp = cookieValue.slice(0, dot);
  const signature = cookieValue.slice(dot + 1);
  const expected = crypto
    .createHmac("sha256", sessionSecret())
    .update(timestamp)
    .digest("hex");

  if (!safeEqual(signature, expected)) return false;

  const age = Date.now() - Number(timestamp);
  return !Number.isNaN(age) && age >= 0 && age <= TEACH_PREVIEW_MAX_AGE_MS;
}

function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.get("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() !== name) continue;
    try {
      return decodeURIComponent(part.slice(eq + 1).trim());
    } catch {
      // Malformed percent-encoding: treat as absent so callers 401 cleanly.
      return undefined;
    }
  }
  return undefined;
}

/** Throws {@link TeachPreviewAuthError} unless the request carries a live session. */
export function requirePreviewAuth(req: Request): void {
  if (!isValidPreviewSession(readCookie(req, TEACH_PREVIEW_COOKIE))) {
    throw new TeachPreviewAuthError();
  }
}

export function previewUnauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function setPreviewSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(TEACH_PREVIEW_COOKIE, mintPreviewSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: TEACH_PREVIEW_MAX_AGE_MS / 1000,
    path: "/",
  });
  return response;
}
