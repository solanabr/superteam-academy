import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  getWalletSessionCookieName,
  verifyAccessToken,
} from "@/lib/server/wallet-auth";
import { getNextAuthSession } from "@/lib/server/next-auth-session";

export type AuthenticatedUser = {
  id: string;
  walletAddress: string;
  username: string;
};

function buildUsername(walletAddress: string): string {
  return `user_${walletAddress.slice(0, 6).toLowerCase()}`;
}

function buildUsernameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "user";
  return `user_${local.slice(0, 12).toLowerCase()}`;
}

async function getWalletUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(getWalletSessionCookieName())?.value;
  const payload = await verifyAccessToken(token);
  if (!payload) return null;

  return {
    id: payload.sub,
    walletAddress: payload.walletAddress,
    username: buildUsername(payload.walletAddress),
  };
}

async function getOAuthUser(): Promise<AuthenticatedUser | null> {
  const session = await getNextAuthSession();
  if (!session?.user) return null;

  const user = session.user;
  const walletAddress = (user as any).walletAddress ?? "";
  const username = user.name
    ? `user_${user.name.replace(/\s+/g, "").slice(0, 12).toLowerCase()}`
    : user.email
      ? buildUsernameFromEmail(user.email)
      : "user_oauth";

  return {
    id: user.id ?? `oauth:${user.email ?? "unknown"}`,
    walletAddress,
    username,
  };
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  // Wallet JWT takes priority
  const walletUser = await getWalletUser();
  if (walletUser) return walletUser;

  // Fall back to NextAuth OAuth session
  return getOAuthUser();
}

export async function requireAuthenticatedUser(
  redirectTo = "/",
): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect(redirectTo);
  }
  return user;
}
