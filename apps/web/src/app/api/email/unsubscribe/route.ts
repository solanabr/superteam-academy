import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Service-role write, no session — never prerender.
export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Which consent the link revokes (#869). Consent is purpose-bound: a learner who
 * stops the study reminders has NOT asked to stop product news, and vice versa,
 * so each kind maps to its own RPC touching only its own columns. Absent/unknown
 * `kind` means marketing — every link minted before #869 carried no kind.
 */
type UnsubscribeKind = "marketing" | "reminders";

function parseKind(raw: string | null): UnsubscribeKind {
  return raw === "reminders" ? "reminders" : "marketing";
}

/**
 * Clear the token owner's consent for `kind` via the SECURITY DEFINER RPC
 * (service_role). Returns whether a row matched. Idempotent — an already-
 * unsubscribed token still returns true (it matched); an unknown token returns
 * false.
 */
async function unsubscribe(
  token: string,
  kind: UnsubscribeKind
): Promise<boolean> {
  const fn =
    kind === "reminders"
      ? "unsubscribe_reminders_by_token"
      : "unsubscribe_by_token";
  const { data, error } = await createAdminClient().rpc(fn, {
    p_token: token,
  });
  if (error) {
    console.error(`[email:unsubscribe] ${fn} failed: ${error.message}`);
    return false;
  }
  return data === true;
}

function confirmationPage(ok: boolean, kind: UnsubscribeKind): NextResponse {
  const title = ok ? "You've been unsubscribed" : "Link not recognized";
  const successBody =
    kind === "reminders"
      ? "You will no longer receive study-plan reminders from Superteam Academy. Your product-news preference is unchanged — both can be managed in Settings."
      : "You will no longer receive product-news emails from Superteam Academy. You can re-subscribe anytime from Settings.";
  const body = ok
    ? successBody
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
  const params = new URL(req.url).searchParams;
  const token = params.get("token") ?? "";
  const kind = parseKind(params.get("kind"));
  if (!UUID_RE.test(token)) return confirmationPage(false, kind);
  return confirmationPage(await unsubscribe(token, kind), kind);
}

/**
 * RFC 8058 one-click unsubscribe: mailbox providers POST here (from the
 * `List-Unsubscribe`/`List-Unsubscribe-Post` headers). Token from the query or a
 * form body. Always 200 on a well-formed request so the provider records success.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const params = new URL(req.url).searchParams;
  let token = params.get("token") ?? "";
  let kindRaw = params.get("kind");
  if (!token) {
    try {
      const form = await req.formData();
      const v = form.get("token");
      if (typeof v === "string") token = v;
      const k = form.get("kind");
      if (!kindRaw && typeof k === "string") kindRaw = k;
    } catch {
      // no/invalid body — fall through to the token check
    }
  }
  if (!UUID_RE.test(token)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  await unsubscribe(token, parseKind(kindRaw));
  return NextResponse.json({ ok: true });
}
