import "server-only";

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as { password?: unknown };
    const { password } = body;

    const secretBuffer = Buffer.from(
      typeof password === "string" ? password : ""
    );
    const adminSecretBuffer = Buffer.from(process.env.ADMIN_SECRET ?? "");
    if (
      typeof password !== "string" ||
      secretBuffer.length !== adminSecretBuffer.length ||
      !crypto.timingSafeEqual(secretBuffer, adminSecretBuffer)
    ) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set("admin_session", "1", {
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
