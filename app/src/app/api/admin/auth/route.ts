import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "admin-session";
const JWT_EXPIRY = "24h";

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET not configured");
  return new TextEncoder().encode(secret);
}

/** POST — login with password, set httpOnly JWT cookie */
export async function POST(req: Request) {
  try {
    const { password } = (await req.json()) as { password?: string };
    if (!password) {
      return NextResponse.json(
        { error: "Password required" },
        { status: 400 },
      );
    }

    const hash = process.env.ADMIN_PASSWORD_HASH;
    if (!hash) {
      return NextResponse.json(
        { error: "Admin auth not configured" },
        { status: 500 },
      );
    }

    const valid = await compare(password, hash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 },
      );
    }

    const token = await new SignJWT({ role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRY)
      .sign(getSecret());

    const res = NextResponse.json({ authenticated: true });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24h
    });
    return res;
  } catch (err) {
    console.error("Admin auth POST error:", err);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 },
    );
  }
}

/** GET — check if current session is valid */
export async function GET(req: Request) {
  try {
    const cookie = parseCookie(req.headers.get("cookie") ?? "", COOKIE_NAME);
    if (!cookie) {
      return NextResponse.json({ authenticated: false });
    }

    await jwtVerify(cookie, getSecret());
    return NextResponse.json({ authenticated: true });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}

/** DELETE — logout, clear cookie */
export async function DELETE() {
  const res = NextResponse.json({ authenticated: false });
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}

function parseCookie(header: string, name: string): string | null {
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
