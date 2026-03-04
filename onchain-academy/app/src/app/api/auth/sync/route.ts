import { NextRequest, NextResponse } from "next/server";
import { supabaseRest } from "@/lib/backend/server-supabase";

type UserRow = {
  learner_id: string;
  display_name: string | null;
  email: string | null;
  wallet_address: string | null;
  auth_method: string;
  updated_at?: string | null;
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    authUserId?: string;
    email?: string | null;
    walletAddress?: string | null;
    profileName?: string | null;
    authMethod?: string;
  };

  if (!body.authUserId) {
    return NextResponse.json({ ok: false, error: "authUserId is required" }, { status: 400 });
  }

  // Always anchor learner identity to Supabase user id.
  // Wallet/email are linked attributes, not primary identity keys.
  const learnerId = body.authUserId;
  // Keep display_name aligned with username concept (profileName), not email-derived aliases.
  const displayName = body.profileName?.trim() || null;

  if (!supabaseRest.hasConfig()) {
    return NextResponse.json({
      ok: true,
      learnerId,
      mode: "local-fallback",
    });
  }

  const existingRows = await supabaseRest.select<UserRow>({
    table: "academy_users",
    select: "learner_id,display_name,email,wallet_address,auth_method,updated_at",
    filters: { learner_id: `eq.${learnerId}` },
    limit: 1,
  });
  const existing = existingRows?.[0];
  const nextWallet = body.walletAddress ?? existing?.wallet_address ?? null;
  const nextDisplayName = displayName ?? existing?.display_name ?? null;
  const nextAuthMethod = body.authMethod ?? existing?.auth_method ?? "supabase";

  await supabaseRest.upsert<UserRow>(
    "academy_users",
    {
      learner_id: learnerId,
      display_name: nextDisplayName,
      email: body.email ?? null,
      wallet_address: nextWallet,
      auth_method: nextAuthMethod,
      updated_at: new Date().toISOString(),
    },
    "learner_id",
  );

  await supabaseRest.upsert(
    "academy_linked_accounts",
    {
      learner_id: learnerId,
      provider: body.authMethod ?? "supabase",
      provider_user_id: body.authUserId,
      wallet_address: body.walletAddress ?? null,
      metadata: {
        email: body.email ?? null,
      },
      linked_at: new Date().toISOString(),
    },
    "provider,provider_user_id",
  );

  return NextResponse.json({
    ok: true,
    learnerId,
  });
}
