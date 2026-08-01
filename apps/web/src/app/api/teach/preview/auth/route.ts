import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";
import {
  isPreviewConfigured,
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
 * (#828). Rate-limited per client IP: the shared password may be short, so cap
 * guessing even though the gate only protects read-only rendering.
 *
 * FAILS CLOSED when `TEACH_PREVIEW_PASSWORD` is unset — there is no literal
 * default password any more, so an unconfigured deployment disables the preview
 * instead of shipping a guessable gate.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    if (!isPreviewConfigured()) {
      console.error(
        "[teach-preview] TEACH_PREVIEW_PASSWORD is unset — teacher preview is disabled (503). Set it to enable /teach/preview."
      );
      return NextResponse.json(
        { error: "Teacher preview is not configured" },
        { status: 503 }
      );
    }

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
