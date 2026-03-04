import { NextRequest } from "next/server";
import { and, desc, eq, gt } from "drizzle-orm";
import { require_auth } from "@/lib/api/guard";
import { api_error, api_success } from "@/lib/api/response";
import { db } from "@/lib/db";
import { achievement_awards, oauth_accounts, user_streaks, users, wallets, xp_snapshots } from "@/lib/db/schema";
import { fetch_credential_nfts, get_xp_balance } from "@/lib/services/blockchain-service";

export async function GET(): Promise<Response> {
  const result = await require_auth();
  if (result.response) return result.response;
  const { session } = result;

  const [userRow] = await db
    .select({ name: users.name, image_url: users.image_url })
    .from(users)
    .where(eq(users.id, session.sub))
    .limit(1);

  const oauthRows = await db
    .select({ provider: oauth_accounts.provider })
    .from(oauth_accounts)
    .where(eq(oauth_accounts.user_id, session.sub));

  const [wallet] = await db
    .select()
    .from(wallets)
    .where(eq(wallets.user_id, session.sub))
    .limit(1);

  const wallet_public_key = wallet?.public_key ?? null;
  const xp = wallet_public_key ? await get_xp_balance(wallet_public_key) : null;

  const [streak] = await db
    .select()
    .from(user_streaks)
    .where(eq(user_streaks.user_id, session.sub))
    .limit(1);

  const achievement_rows =
    wallet_public_key === null
      ? []
      : await db
          .select({
            id: achievement_awards.id,
          })
          .from(achievement_awards)
          .where(eq(achievement_awards.user_id, session.sub));

  const achievement_count = achievement_rows.length;

  let leaderboard_rank: number | null = null;

  if (xp && xp.total_xp > 0 && wallet_public_key) {
    const latest_snapshot = await db
      .select()
      .from(xp_snapshots)
      .where(eq(xp_snapshots.wallet_public_key, wallet_public_key))
      .orderBy(desc(xp_snapshots.snapshot_at))
      .limit(1);

    if (latest_snapshot.length > 0) {
      const user_total_xp = latest_snapshot[0]?.total_xp ?? 0;

      const higher_rows = await db
        .select({
          id: xp_snapshots.id,
        })
        .from(xp_snapshots)
        .where(and(eq(xp_snapshots.wallet_public_key, wallet_public_key), gt(xp_snapshots.total_xp, user_total_xp)));

      leaderboard_rank = higher_rows.length + 1;
    }
  }

  const credentials = wallet_public_key ? await fetch_credential_nfts(wallet_public_key) : [];

  return api_success(
    {
      user_id: session.sub,
      email: session.email,
      name: userRow?.name ?? null,
      image_url: userRow?.image_url ?? null,
      role: session.role,
      wallet_public_key,
      linked_connections: oauthRows.map((r) => ({ provider: r.provider })),
      xp: xp ?? { total_xp: 0, level: 0 },
      streak: streak
        ? {
            current_streak_days: streak.current_streak_days,
            longest_streak_days: streak.longest_streak_days,
            last_activity_at: streak.last_activity_at,
          }
        : {
            current_streak_days: 0,
            longest_streak_days: 0,
            last_activity_at: null,
          },
      achievement_count,
      leaderboard_rank,
      credentials,
    },
    "Profile fetched",
    200,
  );
}

export async function PATCH(request: NextRequest): Promise<Response> {
  const result = await require_auth();
  if (result.response) return result.response;
  const body = await request.json();
  const { patch_profile_body_schema } = await import("@/lib/validators/user");
  const parsed = patch_profile_body_schema.safeParse(body);
  if (!parsed.success) return api_error("Invalid body", 400);
  const { name, image_url } = parsed.data;
  await db
    .update(users)
    .set({
      ...(name !== undefined && { name }),
      ...(image_url !== undefined && { image_url }),
      updated_at: new Date(),
    })
    .where(eq(users.id, result.session.sub));
  return api_success({ ok: true }, "Profile updated", 200);
}
