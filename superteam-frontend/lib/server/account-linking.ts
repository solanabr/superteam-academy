import { randomUUID } from "crypto";
import { getDb } from "./mongodb";

export type LinkedAccount = {
  id: string;
  email?: string;
  googleId?: string;
  githubId?: string;
  walletAddress?: string;
  username?: string;
};

export async function getLinkedAccount(
  userId: string,
): Promise<LinkedAccount | null> {
  const db = await getDb();
  const doc = await db.collection("linked_accounts").findOne({ id: userId });
  if (!doc) return null;
  const { _id, ...account } = doc;
  return account as unknown as LinkedAccount;
}

export async function findByWallet(
  walletAddress: string,
): Promise<LinkedAccount | null> {
  const db = await getDb();
  const doc = await db.collection("linked_accounts").findOne({ walletAddress });
  if (!doc) return null;
  const { _id, ...account } = doc;
  return account as unknown as LinkedAccount;
}

export async function findByOAuth(
  provider: string,
  providerId: string,
): Promise<LinkedAccount | null> {
  const field = provider === "google" ? "googleId" : "githubId";
  const db = await getDb();
  const doc = await db
    .collection("linked_accounts")
    .findOne({ [field]: providerId });
  if (!doc) return null;
  const { _id, ...account } = doc;
  return account as unknown as LinkedAccount;
}

export async function linkWallet(
  userId: string,
  walletAddress: string,
): Promise<LinkedAccount> {
  const db = await getDb();
  const result = await db
    .collection("linked_accounts")
    .findOneAndUpdate(
      { id: userId },
      { $set: { walletAddress } },
      { upsert: true, returnDocument: "after" },
    );
  const { _id, ...account } = result!;
  return account as unknown as LinkedAccount;
}

export async function linkOAuth(
  userId: string,
  provider: "google" | "github",
  providerId: string,
  email: string,
): Promise<LinkedAccount> {
  const field = provider === "google" ? "googleId" : "githubId";
  const db = await getDb();
  const result = await db
    .collection("linked_accounts")
    .findOneAndUpdate(
      { id: userId },
      { $set: { email, [field]: providerId } },
      { upsert: true, returnDocument: "after" },
    );
  const { _id, ...account } = result!;
  return account as unknown as LinkedAccount;
}

export type LinkedAccountStatus = {
  google: boolean;
  github: boolean;
  email?: string;
};

export async function getLinkedStatusForWallet(
  walletAddress: string,
): Promise<LinkedAccountStatus> {
  const account = await findByWallet(walletAddress);
  if (!account) {
    return { google: false, github: false };
  }
  return {
    google: !!account.googleId,
    github: !!account.githubId,
    email: account.email,
  };
}

export async function findOrCreateByOAuth(
  provider: "google" | "github",
  providerId: string,
  email: string,
): Promise<LinkedAccount> {
  const existing = await findByOAuth(provider, providerId);
  if (existing) {
    if (existing.email !== email) {
      const db = await getDb();
      await db
        .collection("linked_accounts")
        .updateOne({ id: existing.id }, { $set: { email } });
      existing.email = email;
    }
    return existing;
  }

  const id = `oauth:${randomUUID()}`;
  const field = provider === "google" ? "googleId" : "githubId";
  const account: LinkedAccount = { id, email, [field]: providerId };
  const db = await getDb();
  await db.collection("linked_accounts").insertOne({ ...account });
  return account;
}
