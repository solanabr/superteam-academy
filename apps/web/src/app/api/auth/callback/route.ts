import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { generateWalletName } from "@/lib/utils/generate-wallet-name";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";
import type { Database } from "@/lib/supabase/types";

function sanitizeRedirect(raw: string, fallback: string): string {
  try {
    const decoded = decodeURIComponent(raw);
    // Must start with single slash, no protocol-relative URLs
    if (!decoded.startsWith("/") || decoded.startsWith("//")) return fallback;
    // No backslashes (bypass for host-relative URLs on Windows)
    if (decoded.includes("\\")) return fallback;
    // No colons (prevents javascript: or data: schemes)
    if (decoded.includes(":")) return fallback;
    // Verify it resolves to same origin
    const url = new URL(decoded, "http://localhost");
    if (url.hostname !== "localhost") return fallback;
    return decoded;
  } catch {
    return fallback;
  }
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  const next = sanitizeRedirect(
    requestUrl.searchParams.get("next") ?? "/en/dashboard",
    "/en/dashboard"
  );

  // Extract locale from the `next` parameter (e.g. "/pt-BR/dashboard" → "pt-BR")
  const localeMatch = next.match(/^\/([a-z]{2}(?:-[A-Z]{2})?)\//);
  const locale = localeMatch ? localeMatch[1] : "en";

  try {
    if (!code) {
      console.error("[auth/callback] Missing authorization code");
      return NextResponse.redirect(
        `${origin}/${locale}?error=auth&reason=missing_code`
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      console.error("[auth/callback] Missing Supabase environment variables");
      return NextResponse.json(
        { error: "Server misconfigured" },
        { status: 500 }
      );
    }

    // Create the redirect response FIRST so we can set cookies on it
    const response = NextResponse.redirect(`${origin}${next}`);

    const supabase = createServerClient<Database>(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[]
        ) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const { data: sessionData, error } =
      await supabase.auth.exchangeCodeForSession(code);

    if (error || !sessionData?.session) {
      console.error(
        "[auth/callback] Code exchange failed:",
        error?.message ?? "no session returned"
      );
      return NextResponse.redirect(
        `${origin}/${locale}?error=auth&reason=exchange_failed`
      );
    }

    // For new users, replace the placeholder username with a fun generated name
    const userId = sessionData.session.user.id;
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", userId)
      .single();

    if (profile?.username?.startsWith("user_")) {
      for (let attempt = 0; attempt < 5; attempt++) {
        const name = generateWalletName();
        const { error: nameError } = await supabase
          .from("profiles")
          .update({ username: name })
          .eq("id", userId);
        if (!nameError) break;
      }
    }

    // Refresh the Google avatar URL on every login. Google CDN URLs rotate, so
    // the URL stored at signup can go stale. Only overwrite if the user hasn't
    // set a custom uploaded avatar (Supabase Storage URLs contain the project host).
    const freshGoogleAvatar = sessionData.session.user.user_metadata
      ?.avatar_url as string | undefined;

    if (freshGoogleAvatar) {
      const storageHost = new URL(url).host;
      const storedAvatar = profile?.avatar_url ?? null;
      const isCustomUpload =
        storedAvatar !== null && storedAvatar.includes(storageHost);

      if (!isCustomUpload) {
        await supabase
          .from("profiles")
          .update({ avatar_url: freshGoogleAvatar })
          .eq("id", userId);
      }
    }

    return response;
  } catch (err: unknown) {
    logError({
      errorId: ERROR_IDS.OAUTH_CALLBACK_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
      context: { route: "/api/auth/callback" },
    });
    return NextResponse.redirect(
      `${origin}/${locale}?error=auth&reason=server_error`
    );
  }
}
