type AuthUserLike = {
  id: string;
  email?: string | null;
};

export async function syncAuthIdentity(params: {
  authUser: AuthUserLike;
  walletAddress?: string | null;
  profileName?: string;
  authMethod?: "supabase" | "wallet";
}) {
  const { authUser, walletAddress, profileName, authMethod } = params;
  await fetch("/api/auth/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      authUserId: authUser.id,
      email: authUser.email ?? null,
      walletAddress: walletAddress ?? null,
      profileName: profileName ?? null,
      authMethod: authMethod ?? "supabase",
    }),
  });
}
