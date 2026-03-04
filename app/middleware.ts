import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LOCALES } from "@/lib/i18n";

export function middleware(request: NextRequest) {
  if (request.cookies.get("NEXT_LOCALE")) {
    return NextResponse.next();
  }

  const accepted = request.headers.get("accept-language")?.toLowerCase() ?? "en";
  const detected = LOCALES.find((locale) => accepted.includes(locale)) ?? "en";

  const response = NextResponse.next();
  response.cookies.set("NEXT_LOCALE", detected, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
