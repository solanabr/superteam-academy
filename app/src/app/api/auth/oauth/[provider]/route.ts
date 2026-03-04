import { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PROVIDERS = ["google", "github"] as const;
type Provider = (typeof PROVIDERS)[number];

function is_provider(s: string): s is Provider {
  return PROVIDERS.includes(s as Provider);
}

function get_redirect_uri(request: NextRequest): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/api/auth/oauth/callback`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
): Promise<NextResponse> {
  const { provider } = await params;
  if (!is_provider(provider)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  const redirect_uri = get_redirect_uri(request);
  const redirect_to = request.nextUrl.searchParams.get("redirect_to") ?? "/dashboard";
  const state = Buffer.from(JSON.stringify({ provider, n: Date.now(), redirect_to })).toString("base64url");

  if (provider === "google") {
    const client_id = process.env.GOOGLE_CLIENT_ID ?? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!client_id) {
      return NextResponse.redirect(new URL("/login?error=oauth_not_configured", request.url));
    }
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", client_id);
    url.searchParams.set("redirect_uri", redirect_uri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("state", state);
    return NextResponse.redirect(url.toString());
  }

  if (provider === "github") {
    const client_id = process.env.GITHUB_CLIENT_ID ?? process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    if (!client_id) {
      return NextResponse.redirect(new URL("/login?error=oauth_not_configured", request.url));
    }
    const url = new URL("https://github.com/login/oauth/authorize");
    url.searchParams.set("client_id", client_id);
    url.searchParams.set("redirect_uri", redirect_uri);
    url.searchParams.set("scope", "user:email");
    url.searchParams.set("state", state);
    return NextResponse.redirect(url.toString());
  }

  return NextResponse.redirect(new URL("/login", request.url));
}
