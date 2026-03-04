import { NextResponse } from "next/server";

const LOCALES = ["en", "pt-br", "es"];

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { locale?: string };
  const locale = body.locale && LOCALES.includes(body.locale) ? body.locale : "en";

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: "NEXT_LOCALE",
    value: locale,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}
