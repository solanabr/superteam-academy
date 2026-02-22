import type { SupabaseClient } from "@supabase/supabase-js";

interface OAuthUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface OAuthAccount {
  provider: string;
  providerAccountId: string;
  type?: string;
  access_token?: string | null;
  refresh_token?: string | null;
  expires_at?: number | null;
  token_type?: string | null;
  scope?: string | null;
  id_token?: string | null;
}

interface ResolveResult {
  profileId: string;
  linkedAccounts: string[];
  walletAddress?: string;
  /** Canonical profile display fields (from DB, not the new provider). */
  name?: string;
  email?: string;
  image?: string;
  /**
   * True when the sign-in resolved to a *different* profile than the one
   * currently signed in (existingUserId). Happens when a wallet or OAuth
   * account that is already linked to profile B is used by a session
   * currently running as profile A — the session switches to profile B.
   * The JWT callback uses this to set a one-shot notification token field.
   */
  profileSwitched?: boolean;
}

/** Generate a URL-safe username from a display name or email. */
function generateUsername(name?: string | null, email?: string | null): string {
  let base = "";
  if (name) {
    base = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9_-]/g, "");
  } else if (email) {
    base = email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "");
  }
  if (base.length < 3) base = "learner";
  base = base.slice(0, 20);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

/**
 * Resolve an OAuth/Credentials sign-in to a profile UUID.
 *
 * Flow:
 *  1. Is this provider+account already linked? → use that profile
 *  2. Is the user already signed in (existingUserId)? → link to existing profile
 *  3. Is there a profile with the same email? → link to it
 *  4. Create a brand-new profile + user_stats
 */
export async function resolveUserOnSignIn(
  db: SupabaseClient,
  existingUserId: string | undefined,
  user: OAuthUser,
  account: OAuthAccount,
  options?: { preferredTheme?: string; preferredLanguage?: string },
): Promise<ResolveResult> {
  // 1. Check accounts table
  const { data: linked } = await db
    .from("accounts")
    .select("user_id")
    .eq("provider", account.provider)
    .eq("provider_account_id", account.providerAccountId)
    .single();

  if (linked) {
    const result = await buildResult(db, linked.user_id);
    // Detect profile switch: the account is linked to a *different* user than
    // the one currently signed in. The JWT callback will surface this to the client.
    if (existingUserId && linked.user_id !== existingUserId) {
      result.profileSwitched = true;
    }
    return result;
  }

  // 2. User already signed in → link to existing profile
  if (existingUserId) {
    await insertAccount(db, existingUserId, account);
    // When linking an OAuth provider, upgrade empty profile fields
    await upgradeProfileFields(db, existingUserId, user);
    return await buildResult(db, existingUserId);
  }

  // 3. Find by email
  if (user.email) {
    const { data: byEmail } = await db
      .from("profiles")
      .select("id")
      .eq("email", user.email)
      .single();

    if (byEmail) {
      await insertAccount(db, byEmail.id, account);
      await upgradeProfileFields(db, byEmail.id, user);
      return await buildResult(db, byEmail.id);
    }
  }

  // 4. Create new profile
  const username = generateUsername(user.name, user.email);
  const { data: newProfile, error: profileError } = await db
    .from("profiles")
    .insert({
      display_name: user.name ?? "New Learner",
      email: user.email ?? "",
      avatar_url: user.image ?? "",
      username,
      preferred_theme: options?.preferredTheme ?? "brasil",
      preferred_language: options?.preferredLanguage ?? "en",
    })
    .select("id")
    .single();

  if (profileError || !newProfile) {
    throw new Error(`Failed to create profile: ${profileError?.message}`);
  }

  const profileId = newProfile.id as string;

  // Create user_stats
  await db
    .from("user_stats")
    .insert({ user_id: profileId })
    .then(({ error }) => {
      if (error && error.code !== "23505")
        console.error("Failed to seed user_stats:", error);
    });

  // Link account
  await insertAccount(db, profileId, account);

  return await buildResult(db, profileId);
}

/**
 * Fill in empty/wallet-derived profile fields with richer data from an
 * OAuth provider (e.g. Google name, avatar, email).
 */
async function upgradeProfileFields(
  db: SupabaseClient,
  profileId: string,
  user: OAuthUser,
) {
  const { data: current } = await db
    .from("profiles")
    .select("display_name, email, avatar_url")
    .eq("id", profileId)
    .single();

  if (!current) return;

  const updates: Record<string, string> = {};

  // Upgrade display_name if it's empty or looks like a wallet abbreviation
  if (
    user.name &&
    (!current.display_name ||
      current.display_name === "New Learner" ||
      /^[A-Za-z0-9]{4}\.\.\.[A-Za-z0-9]{4}$/.test(current.display_name))
  ) {
    updates.display_name = user.name;
  }

  // Upgrade email if empty
  if (user.email && !current.email) {
    updates.email = user.email;
  }

  // Upgrade avatar if empty
  if (user.image && !current.avatar_url) {
    updates.avatar_url = user.image;
  }

  if (Object.keys(updates).length > 0) {
    await db.from("profiles").update(updates).eq("id", profileId);
  }
}

async function insertAccount(
  db: SupabaseClient,
  userId: string,
  account: OAuthAccount,
) {
  const { error } = await db.from("accounts").insert({
    user_id: userId,
    provider: account.provider,
    provider_account_id: account.providerAccountId,
    type: account.type ?? "oauth",
    access_token: account.access_token ?? null,
    refresh_token: account.refresh_token ?? null,
    expires_at: account.expires_at ?? null,
    token_type: account.token_type ?? null,
    scope: account.scope ?? null,
    id_token: account.id_token ?? null,
  });
  // 23505 = unique violation (already linked)
  if (error && error.code !== "23505") {
    console.error("Failed to link account:", error);
  }
}

async function buildResult(
  db: SupabaseClient,
  profileId: string,
): Promise<ResolveResult> {
  const [accountsRes, profileRes] = await Promise.all([
    db.from("accounts").select("provider").eq("user_id", profileId),
    db
      .from("profiles")
      .select("wallet_address, display_name, email, avatar_url")
      .eq("id", profileId)
      .single(),
  ]);

  return {
    profileId,
    linkedAccounts: accountsRes.data?.map((a) => a.provider) ?? [],
    walletAddress: profileRes.data?.wallet_address ?? undefined,
    name: profileRes.data?.display_name ?? undefined,
    email: profileRes.data?.email ?? undefined,
    image: profileRes.data?.avatar_url ?? undefined,
  };
}
