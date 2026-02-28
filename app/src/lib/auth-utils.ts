import { PrivyClient } from "@privy-io/server-auth";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!,
);

/**
 * Resolves the current user from the Privy `privy-id-token` cookie.
 * Upserts a DB user keyed by `privyId`, syncing wallet/email from linked accounts.
 * Returns the DB user ID, or null if not authenticated.
 */
export async function resolveUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const idToken = cookieStore.get("privy-id-token")?.value;
  if (!idToken) return null;

  try {
    const privyUser = await privy.getUser({ idToken });

    const walletAccount = privyUser.linkedAccounts.find(
      (a): a is Extract<typeof a, { type: "wallet" }> =>
        a.type === "wallet" && "chainType" in a && a.chainType === "solana",
    );
    const googleAccount = privyUser.linkedAccounts.find(
      (a): a is Extract<typeof a, { type: "google_oauth" }> =>
        a.type === "google_oauth",
    );

    const walletAddress = walletAccount?.address ?? null;
    const email = googleAccount?.email ?? null;
    const displayName =
      googleAccount?.name ??
      (walletAddress ? walletAddress.slice(0, 8) + "\u2026" : "Anonymous");

    const user = await prisma.user.upsert({
      where: { privyId: privyUser.id },
      create: {
        privyId: privyUser.id,
        wallet: walletAddress,
        email,
        name: displayName,
      },
      update: {
        wallet: walletAddress ?? undefined,
        email: email ?? undefined,
      },
      select: { id: true },
    });

    return user.id;
  } catch {
    return null;
  }
}
