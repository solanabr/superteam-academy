import { PrivyClient } from "@privy-io/server-auth";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID!;
const appSecret = process.env.PRIVY_APP_SECRET!;
const privy = new PrivyClient(appId, appSecret);

/**
 * Resolves the current user from Privy auth cookies.
 * Checks `privy-id-token` (identity token, requires dashboard config) first,
 * then falls back to `privy-access-token` (synced from client via PrivyTokenSync).
 * Upserts a DB user keyed by `privyId`, syncing wallet/email from linked accounts.
 * Returns the DB user ID, or null if not authenticated.
 */
export async function resolveUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const idToken = cookieStore.get("privy-id-token")?.value;
  const accessToken = cookieStore.get("privy-access-token")?.value;

  if (!idToken && !accessToken) {
    return null;
  }

  try {
    if (idToken) {
      // Identity token — contains user data inline (preferred)
      const privyUser = await privy.getUser({ idToken });
      return upsertUser(privyUser);
    }

    // Access token fallback — verify locally, then fetch user data
    const { userId: privyDid } = await privy.verifyAuthToken(accessToken!);

    // Check if user already exists — skip Privy API call if so
    const existing = await prisma.user.findUnique({
      where: { privyId: privyDid },
      select: { id: true },
    });
    if (existing) return existing.id;

    // First-time auth — need linked accounts to create/claim user
    // This calls the Privy API and requires a valid PRIVY_APP_SECRET
    try {
      const privyUser = await privy.getUser(privyDid);
      return upsertUser(privyUser);
    } catch (apiErr: unknown) {
      const errObj = apiErr as Record<string, unknown>;
      console.warn(
        "[resolveUserId] privy.getUser() failed for DID:",
        privyDid,
        "\n  message:",
        errObj?.message ?? apiErr,
        "\n  status:",
        errObj?.status ?? errObj?.statusCode ?? "N/A",
        "\n  body:",
        errObj?.body ?? errObj?.response ?? "N/A",
      );
      const user = await prisma.user.upsert({
        where: { privyId: privyDid },
        create: { privyId: privyDid, name: "Learner" },
        update: {},
        select: { id: true },
      });
      return user.id;
    }
  } catch (err) {
    console.error("[resolveUserId] failed:", err);
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function upsertUser(privyUser: any): Promise<string> {
  const walletAccount = privyUser.linkedAccounts.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (a: any) =>
      a.type === "wallet" && "chainType" in a && a.chainType === "solana",
  );
  const googleAccount = privyUser.linkedAccounts.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (a: any) => a.type === "google_oauth",
  );

  const walletAddress: string | null = walletAccount?.address ?? null;
  const email: string | null = googleAccount?.email ?? null;
  const displayName: string =
    googleAccount?.name ??
    (walletAddress ? walletAddress.slice(0, 8) + "\u2026" : "Anonymous");

  // Find by privyId first
  let user = await prisma.user.findUnique({
    where: { privyId: privyUser.id },
    select: { id: true },
  });

  if (!user && walletAddress) {
    // Claim an existing seed/unclaimed user by wallet
    user = await prisma.user.findUnique({
      where: { wallet: walletAddress },
      select: { id: true },
    });
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { privyId: privyUser.id, email: email ?? undefined },
      });
    }
  }

  if (!user) {
    user = await prisma.user.create({
      data: {
        privyId: privyUser.id,
        wallet: walletAddress,
        email,
        name: displayName,
      },
      select: { id: true },
    });
  } else {
    // Before updating wallet, check if another user owns it
    if (walletAddress) {
      const walletOwner = await prisma.user.findUnique({
        where: { wallet: walletAddress },
        select: { id: true },
      });
      if (walletOwner && walletOwner.id !== user.id) {
        // Another row (seed user) owns this wallet — merge into that row
        // Transfer privyId to the wallet owner, delete the duplicate
        await prisma.user.update({
          where: { id: walletOwner.id },
          data: {
            privyId: privyUser.id,
            email: email ?? undefined,
            name: displayName ?? undefined,
          },
        });
        await prisma.user.delete({ where: { id: user.id } });
        return walletOwner.id;
      }
    }

    // No conflict — safe to update
    await prisma.user.update({
      where: { id: user.id },
      data: {
        wallet: walletAddress ?? undefined,
        email: email ?? undefined,
        name: displayName ?? undefined,
      },
    });
  }

  return user.id;
}
