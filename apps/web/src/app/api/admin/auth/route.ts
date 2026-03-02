import "server-only";

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
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
      sameSite: "lax",
      maxAge: 86400, // 24h
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
