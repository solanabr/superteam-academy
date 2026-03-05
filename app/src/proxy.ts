import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const handleI18n = createMiddleware(routing);

export function proxy(request: NextRequest) {
  try {
    // Cast: monorepo pode ter duas instalações de next (apps/web e root), tipos NextRequest divergem
    return handleI18n(request as never);
  } catch (e) {
    console.error("[proxy]", e);
    const url = new URL(request.url);
    const fallback = new URL(
      `/${routing.defaultLocale}${url.pathname === "/" ? "" : url.pathname}${url.search}`,
      url.origin,
    );
    return NextResponse.redirect(fallback);
  }
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|studio|.*\\..*).*)"],
};
