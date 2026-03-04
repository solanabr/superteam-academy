import { NextRequest } from "next/server";
import { login_or_register_by_wallet } from "@/lib/services/auth-service";
import { login_wallet_body_schema } from "@/lib/validators/auth";
import { json_error, json_ok, set_session_cookie } from "@/lib/api/response";
import { verify_wallet_signature } from "@/lib/auth/verify-wallet";

const LOGIN_MESSAGE_PREFIX = "Login to Superteam Academy";

export async function POST(request: NextRequest): Promise<Response> {
  const body = await request.json();
  const parsed = login_wallet_body_schema.safeParse(body);
  if (!parsed.success) {
    return json_error("Invalid body", 400);
  }
  const { public_key, message, signature } = parsed.data;
  if (!message.startsWith(LOGIN_MESSAGE_PREFIX)) {
    return json_error("Invalid message", 400);
  }
  const valid = await verify_wallet_signature({
    public_key,
    message,
    signature_base64: signature,
  });
  if (!valid) {
    return json_error("Invalid signature", 401);
  }
  try {
    const { token } = await login_or_register_by_wallet({
      public_key,
      message,
      signature,
    });
    const response = json_ok({ ok: true });
    set_session_cookie(response, token);
    return response;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Login failed";
    if (msg === "Account disabled") return json_error(msg, 403);
    return json_error("Login failed", 500);
  }
}
