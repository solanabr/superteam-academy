import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Service-role write, no session — never prerender.
export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Flip the token's owner to opt_in=false via the SECURITY DEFINER RPC (service_
 * role). Returns whether a row matched. Idempotent — an already-unsubscribed
 * token still returns true (it matched); an unknown token returns false.
 */
async function unsubscribe(token: string): Promise<boolean> {
  const { data, error } = await createAdminClient().rpc(
    "unsubscribe_by_token",
    {
      p_token: token,
    }
  );
  if (error) {
    console.error(`[email:unsubscribe] rpc failed: ${error.message}`);
    return false;
  }
  return data === true;
}

function confirmationPage(ok: boolean): NextResponse {
  const title = ok ? "You've been unsubscribed" : "Link not recognized";
  const body = ok
    ? "You will no longer receive product-news emails from Superteam Academy. You can re-subscribe anytime from Settings."
    : "This unsubscribe link is invalid or has expired. If you keep receiving emails, update your preferences in Settings.";
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f4f4f5;color:#18181b;">
  <main style="max-width:440px;margin:64px auto;padding:32px;background:#fff;border-radius:12px;">
    <h1 style="font-size:20px;margin:0 0 12px;">${title}</h1>
    <p style="font-size:15px;line-height:1.6;color:#3f3f46;margin:0;">${body}</p>
  </main>
</body></html>`;
  return new NextResponse(html, {
    status: ok ? 200 : 404,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

/** Human-clickable link from the email body. Renders a confirmation page. */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  if (!UUID_RE.test(token)) return confirmationPage(false);
  return confirmationPage(await unsubscribe(token));
}

/**
 * RFC 8058 one-click unsubscribe: mailbox providers POST here (from the
 * `List-Unsubscribe`/`List-Unsubscribe-Post` headers). Token from the query or a
 * form body. Always 200 on a well-formed request so the provider records success.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  let token = new URL(req.url).searchParams.get("token") ?? "";
  if (!token) {
    try {
      const form = await req.formData();
      const v = form.get("token");
      if (typeof v === "string") token = v;
    } catch {
      // no/invalid body — fall through to the token check
    }
  }
  if (!UUID_RE.test(token)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  await unsubscribe(token);
  return NextResponse.json({ ok: true });
}
