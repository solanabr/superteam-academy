import "server-only";

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { isRateLimited } from "@/lib/rate-limit";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Brute-force protection: throttle admin-login attempts per client IP. The
    // admin secret gates authority-signed on-chain writes, so cap guessing.
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    if (
      await isRateLimited("admin-auth", ip, {
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
    const { password } = body;

    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const secretBuffer = Buffer.from(
      typeof password === "string" ? password : ""
    );
    const adminSecretBuffer = Buffer.from(adminSecret);
    if (
      typeof password !== "string" ||
      secretBuffer.length !== adminSecretBuffer.length ||
      !crypto.timingSafeEqual(secretBuffer, adminSecretBuffer)
    ) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const timestamp = Date.now().toString();
    const signature = crypto
      .createHmac("sha256", adminSecret)
      .update(timestamp)
      .digest("hex");
    const cookieValue = `${timestamp}.${signature}`;

    const response = NextResponse.json({ ok: true });
    response.cookies.set("admin_session", cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      // Strict: the admin console has no cross-site entry flow, so the cookie
      // never needs to ride a cross-site navigation. This blocks the cookie
      // from being attached to attacker-initiated cross-site requests (CSRF),
      // which matter here because admin POSTs trigger authority-signed on-chain writes.
      sameSite: "strict",
      maxAge: 86400, // 24h
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
