import { randomUUID } from 'node:crypto';
import { hashPassword, verifyPassword } from '@/lib/auth/server-password';
import { getFirebaseAdminDb, isFirebaseAdminConfigured } from '@/lib/firebase/admin';
import {
  AuthProvider,
  AuthSessionUser,
  AuthStoreAccount,
  AuthStoreUser,
  OAuthProfile
} from '@/lib/auth/server-types';

const USERS_COLLECTION = 'auth_users';
const ACCOUNTS_COLLECTION = 'auth_accounts';

interface FirestoreAuthUser extends AuthStoreUser {
  emailLower: string;
  walletAddressLower?: string;
}

interface FirestoreAuthAccount extends AuthStoreAccount {
  providerAccountIdLower: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeUsername(value: string): string {
  const safe = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return safe.length > 0 ? safe : `user-${randomUUID().slice(0, 8)}`;
}

function preferredUsername(input: { name: string; email: string; wallet?: string }): string {
  if (input.wallet) {
    return normalizeUsername(`sol-${input.wallet.slice(0, 8)}`);
  }

  const emailPrefix = input.email.split('@')[0];
  if (emailPrefix && emailPrefix.length > 0) {
    return normalizeUsername(emailPrefix);
  }

  return normalizeUsername(input.name);
}

function compactEmailForWallet(walletAddress: string): string {
  return `${walletAddress.toLowerCase()}@wallet.local`;
}

function normalizeAuthKey(provider: AuthProvider, providerAccountId: string): string {
  const source = `${provider}:${providerAccountId.toLowerCase()}`;
  return Buffer.from(source, 'utf-8').toString('base64url');
}

function toStoredUser(user: AuthStoreUser): FirestoreAuthUser {
  return {
    ...user,
    emailLower: user.email.toLowerCase(),
    walletAddressLower: user.walletAddress?.toLowerCase()
  };
}

function toAuthUser(user: FirestoreAuthUser): AuthStoreUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    passwordHash: user.passwordHash,
    image: user.image,
    walletAddress: user.walletAddress,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function toStoredAccount(account: AuthStoreAccount): FirestoreAuthAccount {
  return {
    ...account,
    providerAccountIdLower: account.providerAccountId.toLowerCase()
  };
}

function toAuthAccount(account: FirestoreAuthAccount): AuthStoreAccount {
  return {
    id: account.id,
    userId: account.userId,
    provider: account.provider,
    providerAccountId: account.providerAccountId,
    createdAt: account.createdAt
  };
}

async function readUserById(userId: string): Promise<AuthStoreUser | null> {
  const db = getFirebaseAdminDb();
  if (!db) {
    return null;
  }

  const doc = await db.collection(USERS_COLLECTION).doc(userId).get();
  if (!doc.exists) {
    return null;
  }

  return toAuthUser(doc.data() as FirestoreAuthUser);
}

async function readAccount(
  provider: AuthProvider,
  providerAccountId: string
): Promise<AuthStoreAccount | null> {
  const db = getFirebaseAdminDb();
  if (!db) {
    return null;
  }

  const key = normalizeAuthKey(provider, providerAccountId);
  const doc = await db.collection(ACCOUNTS_COLLECTION).doc(key).get();
  if (!doc.exists) {
    return null;
  }

  return toAuthAccount(doc.data() as FirestoreAuthAccount);
}

async function readUserByEmail(email: string): Promise<AuthStoreUser | null> {
  const db = getFirebaseAdminDb();
  if (!db) {
    return null;
  }

  const snapshot = await db
    .collection(USERS_COLLECTION)
    .where('emailLower', '==', email.toLowerCase())
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return toAuthUser(snapshot.docs[0].data() as FirestoreAuthUser);
}

async function readUserByWallet(walletAddress: string): Promise<AuthStoreUser | null> {
  const db = getFirebaseAdminDb();
  if (!db) {
    return null;
  }

  const snapshot = await db
    .collection(USERS_COLLECTION)
    .where('walletAddressLower', '==', walletAddress.toLowerCase())
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return toAuthUser(snapshot.docs[0].data() as FirestoreAuthUser);
}

async function writeUser(user: AuthStoreUser): Promise<void> {
  const db = getFirebaseAdminDb();
  if (!db) {
    throw new Error('FIREBASE_ADMIN_NOT_CONFIGURED');
  }

  await db.collection(USERS_COLLECTION).doc(user.id).set(toStoredUser(user), {
    merge: true
  });
}

async function ensureAccountLink(
  userId: string,
  provider: AuthProvider,
  providerAccountId: string
): Promise<void> {
  const db = getFirebaseAdminDb();
  if (!db) {
    throw new Error('FIREBASE_ADMIN_NOT_CONFIGURED');
  }

  const key = normalizeAuthKey(provider, providerAccountId);
  const ref = db.collection(ACCOUNTS_COLLECTION).doc(key);
  const now = nowIso();

  await db.runTransaction(async (tx) => {
    const existing = await tx.get(ref);
    if (existing.exists) {
      const account = existing.data() as FirestoreAuthAccount;
      if (account.userId !== userId) {
        throw new Error('ACCOUNT_ALREADY_LINKED');
      }
      return;
    }

    const account: AuthStoreAccount = {
      id: key,
      userId,
      provider,
      providerAccountId,
      createdAt: now
    };
    tx.set(ref, toStoredAccount(account));
  });
}

async function providersForUser(userId: string): Promise<AuthProvider[]> {
  const db = getFirebaseAdminDb();
  if (!db) {
    return [];
  }

  const snapshot = await db
    .collection(ACCOUNTS_COLLECTION)
    .where('userId', '==', userId)
    .get();

  const providers = new Set<AuthProvider>();
  snapshot.docs.forEach((doc) => {
    const account = doc.data() as FirestoreAuthAccount;
    providers.add(account.provider);
  });

  return [...providers];
}

async function toSessionUser(user: AuthStoreUser): Promise<AuthSessionUser> {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    image: user.image,
    walletAddress: user.walletAddress,
    providers: await providersForUser(user.id)
  };
}

export function isFirestoreAuthStoreEnabled(): boolean {
  return isFirebaseAdminConfigured() && getFirebaseAdminDb() !== null;
}

export async function firestoreGetSessionUserById(userId: string): Promise<AuthSessionUser | null> {
  const user = await readUserById(userId);
  if (!user) {
    return null;
  }

  return toSessionUser(user);
}

export async function firestoreUpsertOAuthUser(
  profile: OAuthProfile,
  options?: { linkToUserId?: string }
): Promise<AuthSessionUser> {
  const now = nowIso();
  const linkedAccount = await readAccount(profile.provider, profile.providerAccountId);
  let user: AuthStoreUser | null = null;

  if (options?.linkToUserId) {
    user = await readUserById(options.linkToUserId);
    if (!user) {
      throw new Error('LINK_USER_NOT_FOUND');
    }
  } else if (linkedAccount) {
    user = await readUserById(linkedAccount.userId);
  }

  if (!user) {
    user = await readUserByEmail(profile.email);
  }

  if (!user) {
    user = {
      id: randomUUID(),
      name: profile.name,
      email: profile.email,
      username: preferredUsername({ name: profile.name, email: profile.email }),
      image: profile.image,
      createdAt: now,
      updatedAt: now
    };
  } else {
    user.name = profile.name || user.name;
    user.email = profile.email || user.email;
    user.image = profile.image || user.image;
    user.updatedAt = now;
  }

  await writeUser(user);
  await ensureAccountLink(user.id, profile.provider, profile.providerAccountId);
  return toSessionUser(user);
}

export async function firestoreFindOrCreateWalletUser(input: {
  walletAddress: string;
  name?: string;
  email?: string;
  username?: string;
  password?: string;
}): Promise<AuthSessionUser> {
  const now = nowIso();
  const linkedAccount = await readAccount('wallet', input.walletAddress);
  let user: AuthStoreUser | null = null;

  if (linkedAccount) {
    user = await readUserById(linkedAccount.userId);
  }

  if (!user) {
    user = await readUserByWallet(input.walletAddress);
  }

  if (!user) {
    const generatedName = input.name?.trim() || `Wallet ${input.walletAddress.slice(0, 6)}`;
    const generatedEmail = input.email?.trim() || compactEmailForWallet(input.walletAddress);
    const generatedUsername =
      input.username?.trim() ||
      preferredUsername({
        name: generatedName,
        email: generatedEmail,
        wallet: input.walletAddress
      });

    user = {
      id: randomUUID(),
      name: generatedName,
      email: generatedEmail,
      username: normalizeUsername(generatedUsername),
      passwordHash:
        input.password && input.password.trim().length > 0
          ? await hashPassword(input.password.trim())
          : undefined,
      walletAddress: input.walletAddress,
      createdAt: now,
      updatedAt: now
    };
  } else {
    user.walletAddress = input.walletAddress;
    user.updatedAt = now;

    if (input.name && input.name.trim().length > 0) {
      user.name = input.name.trim();
    }
    if (input.email && input.email.trim().length > 0) {
      user.email = input.email.trim();
    }
    if (input.username && input.username.trim().length > 0) {
      user.username = normalizeUsername(input.username);
    }
    if (input.password && input.password.trim().length > 0) {
      user.passwordHash = await hashPassword(input.password.trim());
    }
  }

  await writeUser(user);
  await ensureAccountLink(user.id, 'wallet', input.walletAddress);
  if (user.passwordHash) {
    await ensureAccountLink(user.id, 'credentials', user.email);
  }

  return toSessionUser(user);
}

export async function firestoreLinkWalletToUser(
  userId: string,
  walletAddress: string
): Promise<AuthSessionUser> {
  const user = await readUserById(userId);
  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  const existing = await readAccount('wallet', walletAddress);
  if (existing && existing.userId !== userId) {
    throw new Error('WALLET_ALREADY_LINKED');
  }

  user.walletAddress = walletAddress;
  user.updatedAt = nowIso();
  await writeUser(user);
  await ensureAccountLink(userId, 'wallet', walletAddress);
  return toSessionUser(user);
}

export async function firestoreSignInWithCredentials(input: {
  email: string;
  password: string;
}): Promise<AuthSessionUser> {
  const email = input.email.trim().toLowerCase();
  const password = input.password.trim();

  if (!email || !password) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const user = await readUserByEmail(email);
  if (!user || !user.passwordHash) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new Error('INVALID_CREDENTIALS');
  }

  await ensureAccountLink(user.id, 'credentials', user.email);
  user.updatedAt = nowIso();
  await writeUser(user);
  return toSessionUser(user);
}
