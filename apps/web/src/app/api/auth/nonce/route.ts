import { NextRequest, NextResponse } from "next/server";
import { generateNonce } from "@/lib/solana/wallet-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";

const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_PENDING_PER_IP = 10;

export async function GET(request: NextRequest) {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const host = request.headers.get("host");
    if (!host) {
      return NextResponse.json(
        { error: "Missing host header" },
        { status: 400 }
      );
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    const supabaseAdmin = createAdminClient();

    // Rate limit: max pending nonces per IP in the TTL window
    const { count, error: countError } = await supabaseAdmin
      .from("siws_nonces")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")
      .eq("ip_address", ip)
      .gte("created_at", new Date(Date.now() - NONCE_TTL_MS).toISOString());

    if (countError) {
      console.error("[SIWS] Rate limit check error:", countError.message);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    if ((count ?? 0) >= MAX_PENDING_PER_IP) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const nonce = generateNonce();

    const { error: insertError } = await supabaseAdmin
      .from("siws_nonces")
      .insert({ nonce, status: "pending", ip_address: ip });

    if (insertError) {
      console.error("[SIWS] Nonce insert error:", insertError.message);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    // Background cleanup: expired pending (>5 min) and old consumed (>1 hour)
    supabaseAdmin
      .from("siws_nonces")
      .delete()
      .eq("status", "pending")
      .lt("created_at", new Date(Date.now() - NONCE_TTL_MS).toISOString())
      .then(() => {});

    supabaseAdmin
      .from("siws_nonces")
      .delete()
      .eq("status", "consumed")
      .lt("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .then(() => {});

    return NextResponse.json({
      nonce,
      domain: host,
      expiresAt: new Date(Date.now() + NONCE_TTL_MS).toISOString(),
    });
  } catch (err: unknown) {
    logError({
      errorId: ERROR_IDS.WALLET_AUTH_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
      context: { route: "/api/auth/nonce" },
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
