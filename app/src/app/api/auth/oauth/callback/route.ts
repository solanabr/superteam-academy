import { NextRequest, NextResponse } from "next/server";
import { create_user_and_session } from "@/lib/services/auth-service";
import { set_session_cookie } from "@/lib/api/response";
import { find_user_by_email } from "@/lib/services/auth-service";
import { db } from "@/lib/db";
import { oauth_accounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

type StatePayload = { provider: string; n: number; redirect_to?: string };

async function get_google_email(code: string, redirect_uri: string): Promise<string | null> {
  const client_id = process.env.GOOGLE_CLIENT_ID ?? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const client_secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!client_id || !client_secret) return null;
  const token_res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id,
      client_secret,
      redirect_uri,
      grant_type: "authorization_code",
    }),
  });
  if (!token_res.ok) return null;
  const tokens = (await token_res.json()) as { access_token?: string };
  if (!tokens.access_token) return null;
  const user_res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!user_res.ok) return null;
  const user = (await user_res.json()) as { email?: string };
  return user.email ?? null;
}

async function get_github_email(code: string, redirect_uri: string): Promise<string | null> {
  const client_id = process.env.GITHUB_CLIENT_ID ?? process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
  const client_secret = process.env.GITHUB_CLIENT_SECRET;
  if (!client_id || !client_secret) return null;
  const token_res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      client_id,
      client_secret,
      redirect_uri,
    }),
  });
  if (!token_res.ok) return null;
  const tokens = (await token_res.json()) as { access_token?: string };
  if (!tokens.access_token) return null;
  const user_res = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!user_res.ok) return null;
  const user = (await user_res.json()) as { email?: string; login?: string };
  if (user.email) return user.email;
  const emails_res = await fetch("https://api.github.com/user/emails", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!emails_res.ok) return null;
  const emails = (await emails_res.json()) as Array<{ email: string; primary?: boolean }>;
  const primary = emails.find((e) => e.primary);
  return primary?.email ?? emails[0]?.email ?? null;
}

export async function GET(request: NextRequest): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return Response.redirect(`${BASE_URL}/login?error=oauth_denied`);
  }
  if (!code || !state) {
    return Response.redirect(`${BASE_URL}/login?error=oauth_missing`);
  }

  let state_payload: StatePayload;
  try {
    state_payload = JSON.parse(Buffer.from(state, "base64url").toString()) as StatePayload;
  } catch {
    return Response.redirect(`${BASE_URL}/login?error=oauth_invalid_state`);
  }

  const provider = state_payload.provider;
  const redirect_to = state_payload.redirect_to ?? "/dashboard";
  const redirect_uri = `${BASE_URL}/api/auth/oauth/callback`;

  let email: string | null = null;
  if (provider === "google") {
    email = await get_google_email(code, redirect_uri);
  } else if (provider === "github") {
    email = await get_github_email(code, redirect_uri);
  }

  if (!email) {
    return Response.redirect(`${BASE_URL}/login?error=oauth_no_email`);
  }

  const existing = await find_user_by_email(email);
  if (existing?.deleted_at) {
    return Response.redirect(`${BASE_URL}/login?error=account_disabled`);
  }

  const { token, user_id } = await create_user_and_session(email, existing?.name ?? null);
  const provider_account_id = `${provider}:${email}`;
  const [existing_oauth] = await db
    .select()
    .from(oauth_accounts)
    .where(eq(oauth_accounts.provider_account_id, provider_account_id))
    .limit(1);
  if (!existing_oauth) {
    await db.insert(oauth_accounts).values({
      user_id,
      provider,
      provider_account_id,
    });
  }

  const response = NextResponse.redirect(`${BASE_URL}${redirect_to}`);
  set_session_cookie(response, token);
  return response;
}
