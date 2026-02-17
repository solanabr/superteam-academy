import { randomUUID } from "crypto";

export type LinkedAccount = {
  id: string;
  email?: string;
  googleId?: string;
  githubId?: string;
  walletAddress?: string;
  username?: string;
};

const store = new Map<string, LinkedAccount>();

// Secondary indexes for lookups
const walletIndex = new Map<string, string>(); // walletAddress -> id
const oauthIndex = new Map<string, string>(); // "provider:providerId" -> id

function oauthKey(provider: string, providerId: string): string {
  return `${provider}:${providerId}`;
}

export function getLinkedAccount(userId: string): LinkedAccount | null {
  return store.get(userId) ?? null;
}

export function findByWallet(walletAddress: string): LinkedAccount | null {
  const id = walletIndex.get(walletAddress);
  if (!id) return null;
  return store.get(id) ?? null;
}

export function findByOAuth(
  provider: string,
  providerId: string,
): LinkedAccount | null {
  const id = oauthIndex.get(oauthKey(provider, providerId));
  if (!id) return null;
  return store.get(id) ?? null;
}

export function linkWallet(
  userId: string,
  walletAddress: string,
): LinkedAccount {
  let account = store.get(userId);
  if (!account) {
    account = { id: userId };
    store.set(userId, account);
  }

  // Remove old wallet index if changing wallet
  if (account.walletAddress && account.walletAddress !== walletAddress) {
    walletIndex.delete(account.walletAddress);
  }

  account.walletAddress = walletAddress;
  walletIndex.set(walletAddress, userId);
  return account;
}

export function linkOAuth(
  userId: string,
  provider: "google" | "github",
  providerId: string,
  email: string,
): LinkedAccount {
  let account = store.get(userId);
  if (!account) {
    account = { id: userId, email };
    store.set(userId, account);
  }

  account.email = email;

  if (provider === "google") {
    account.googleId = providerId;
  } else if (provider === "github") {
    account.githubId = providerId;
  }

  oauthIndex.set(oauthKey(provider, providerId), userId);
  return account;
}

export function findOrCreateByOAuth(
  provider: "google" | "github",
  providerId: string,
  email: string,
): LinkedAccount {
  // Check if this OAuth account already exists
  const existing = findByOAuth(provider, providerId);
  if (existing) {
    existing.email = email;
    return existing;
  }

  // Create new account
  const id = `oauth:${randomUUID()}`;
  const account: LinkedAccount = { id, email };

  if (provider === "google") {
    account.googleId = providerId;
  } else {
    account.githubId = providerId;
  }

  store.set(id, account);
  oauthIndex.set(oauthKey(provider, providerId), id);
  return account;
}
