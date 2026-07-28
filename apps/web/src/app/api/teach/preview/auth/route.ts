import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";
import {
  isValidPreviewPassword,
  isValidPreviewSession,
  setPreviewSessionCookie,
  TEACH_PREVIEW_COOKIE,
} from "@/lib/teach/preview-auth";

export const dynamic = "force-dynamic";

/** Reports whether the caller already holds a live preview session. */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const cookie = req.cookies.get(TEACH_PREVIEW_COOKIE)?.value;
  return NextResponse.json({ authenticated: isValidPreviewSession(cookie) });
}

/**
 * Exchanges the shared preview password for an HMAC-signed session cookie
 * (#828). Rate-limited per client IP: the interim password is short, so cap
 * guessing even though the gate only protects read-only rendering.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const ip = getClientIp(req.headers);
    if (
      await isRateLimited("teach-preview-auth", ip, {
        maxTokens: 10,
        refillIntervalMs: 60_000,
      })
    ) {
      return NextResponse.json(
        { error: "Too many attempts. Try again shortly." },
        { status: 429 }
      );
    }

    const body = (await req.json()) as { password?: unknown };
    if (!isValidPreviewPassword(body.password)) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    return setPreviewSessionCookie(NextResponse.json({ ok: true }));
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
