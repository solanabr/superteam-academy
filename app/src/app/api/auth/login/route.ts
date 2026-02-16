import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  const form = await request.formData();
  const name = String(form.get("name") ?? "").trim();

  if (!name) {
    return NextResponse.redirect(new URL("/login?error=missing", request.url));
  }

  const res = NextResponse.redirect(new URL("/me", request.url));
  res.cookies.set({
    name: COOKIE_NAME,
    value: encodeURIComponent(JSON.stringify({ name })),
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return res;
}
