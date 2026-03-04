import { NextRequest } from "next/server";
import { get_session } from "@/lib/auth/session";
import { link_wallet } from "@/lib/services/auth-service";
import { link_wallet_body_schema } from "@/lib/validators/auth";
import { json_error, json_ok } from "@/lib/api/response";
import { verify_wallet_signature } from "@/lib/auth/verify-wallet";

const LINK_MESSAGE_PREFIX = "Link wallet to Superteam Academy";

export async function POST(request: NextRequest): Promise<Response> {
  const session = await get_session();
  if (!session) {
    return json_error("Unauthorized", 401);
  }
  const body = await request.json();
  const parsed = link_wallet_body_schema.safeParse(body);
  if (!parsed.success) {
    return json_error("Invalid body", 400);
  }
  const { public_key, message, signature } = parsed.data;
  if (!message.startsWith(LINK_MESSAGE_PREFIX)) {
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
    await link_wallet(session.sub, public_key);
    return json_ok({ ok: true });
  } catch {
    return json_error("Failed to link wallet", 500);
  }
}
