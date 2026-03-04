import { NextRequest, NextResponse } from "next/server";
import { supabaseRest } from "@/lib/backend/server-supabase";
import { ensureUser } from "@/lib/backend/server-utils";

type UserRow = {
  learner_id: string;
  display_name: string | null;
  email: string | null;
  wallet_address: string | null;
  auth_method: string | null;
  updated_at: string | null;
};

type ProfileRow = {
  learner_id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  country: string | null;
  role: string | null;
  updated_at: string | null;
};

function isLikelySolanaWallet(value: string | null | undefined) {
  if (!value) return false;
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
}

function toProfile(
  learnerId: string,
  user?: UserRow | null,
  profile?: ProfileRow | null,
) {
  const username = profile?.username ?? "";
  const displayName = username || user?.display_name || "";
  const walletAddress = isLikelySolanaWallet(user?.wallet_address) ? user?.wallet_address ?? null : null;
  // Profile completion now only requires a username.
  const isComplete = Boolean(username.trim());
  return {
    learnerId,
    displayName,
    email: user?.email ?? null,
    walletAddress,
    username,
    avatarUrl: profile?.avatar_url ?? "",
    bio: profile?.bio ?? "",
    country: profile?.country ?? "",
    role: profile?.role ?? "",
    isComplete,
    updatedAt: profile?.updated_at ?? user?.updated_at ?? new Date().toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const learnerId = request.nextUrl.searchParams.get("learnerId");
  if (!learnerId) {
    return NextResponse.json({ error: "learnerId is required" }, { status: 400 });
  }

  if (!supabaseRest.hasConfig()) {
    return NextResponse.json(
      toProfile(learnerId, {
        learner_id: learnerId,
        display_name: "",
        email: null,
        wallet_address: null,
        auth_method: "supabase",
        updated_at: new Date().toISOString(),
      }, null),
    );
  }

  const userRows = await supabaseRest.select<UserRow>({
    table: "academy_users",
    select: "learner_id,display_name,email,wallet_address,auth_method,updated_at",
    filters: { learner_id: `eq.${learnerId}` },
    limit: 1,
  });
  const profileRows = await supabaseRest.select<ProfileRow>({
    table: "academy_user_profiles",
    select: "learner_id,username,avatar_url,bio,country,role,updated_at",
    filters: { learner_id: `eq.${learnerId}` },
    limit: 1,
  });

  return NextResponse.json(toProfile(learnerId, userRows?.[0], profileRows?.[0]));
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    learnerId?: string;
    displayName?: string;
    email?: string | null;
    walletAddress?: string | null;
    username?: string;
    avatarUrl?: string;
    bio?: string;
    country?: string;
    role?: string;
  };
  if (!body.learnerId) {
    return NextResponse.json({ ok: false, error: "learnerId is required" }, { status: 400 });
  }

  if (!supabaseRest.hasConfig()) {
    return NextResponse.json({
      ok: true,
      profile: toProfile(
        body.learnerId,
        {
          learner_id: body.learnerId,
          display_name: body.displayName ?? body.username ?? "",
          email: body.email ?? null,
          wallet_address: body.walletAddress ?? null,
          auth_method: body.walletAddress ? "wallet" : "supabase",
          updated_at: new Date().toISOString(),
        },
        {
          learner_id: body.learnerId,
          username: body.username ?? null,
          avatar_url: body.avatarUrl ?? null,
          bio: body.bio ?? null,
          country: body.country ?? null,
          role: body.role ?? null,
          updated_at: new Date().toISOString(),
        },
      ),
    });
  }

  await ensureUser(body.learnerId);

  const displayName = body.username ?? body.displayName ?? "";
  const existingUserRows = await supabaseRest.select<UserRow>({
    table: "academy_users",
    select: "learner_id,display_name,email,wallet_address,auth_method,updated_at",
    filters: { learner_id: `eq.${body.learnerId}` },
    limit: 1,
  });
  const existingUser = existingUserRows?.[0];
  const nextWalletAddress = body.walletAddress ?? existingUser?.wallet_address ?? null;
  const nextAuthMethod =
    nextWalletAddress && isLikelySolanaWallet(nextWalletAddress)
      ? "wallet"
      : (existingUser?.auth_method ?? "supabase");
  const userRows = await supabaseRest.upsert<UserRow>(
    "academy_users",
    {
      learner_id: body.learnerId,
      display_name: displayName || null,
      email: body.email ?? null,
      wallet_address: nextWalletAddress,
      auth_method: nextAuthMethod,
      updated_at: new Date().toISOString(),
    },
    "learner_id",
  );

  await supabaseRest.upsert<ProfileRow>(
    "academy_user_profiles",
    {
      learner_id: body.learnerId,
      username: body.username?.trim() || null,
      avatar_url: body.avatarUrl?.trim() || null,
      bio: body.bio?.trim() || null,
      country: body.country?.trim() || null,
      role: body.role?.trim() || null,
      updated_at: new Date().toISOString(),
    },
    "learner_id",
  );

  const profileRows = await supabaseRest.select<ProfileRow>({
    table: "academy_user_profiles",
    select: "learner_id,username,avatar_url,bio,country,role,updated_at",
    filters: { learner_id: `eq.${body.learnerId}` },
    limit: 1,
  });
  const freshUserRows = await supabaseRest.select<UserRow>({
    table: "academy_users",
    select: "learner_id,display_name,email,wallet_address,auth_method,updated_at",
    filters: { learner_id: `eq.${body.learnerId}` },
    limit: 1,
  });

  return NextResponse.json({
    ok: true,
    profile: toProfile(body.learnerId, freshUserRows?.[0] ?? userRows?.[0], profileRows?.[0]),
  });
}
