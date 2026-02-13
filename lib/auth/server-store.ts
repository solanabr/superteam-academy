import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { hashPassword, verifyPassword } from '@/lib/auth/server-password';
import {
  firestoreFindOrCreateWalletUser,
  firestoreGetSessionUserById,
  firestoreLinkWalletToUser,
  firestoreSignInWithCredentials,
  firestoreUpsertOAuthUser,
  isFirestoreAuthStoreEnabled
} from '@/lib/auth/server-store-firestore';
import {
  AuthProvider,
  AuthSessionUser,
  AuthStoreAccount,
  AuthStoreData,
  AuthStoreUser,
  OAuthProfile
} from '@/lib/auth/server-types';

const DEFAULT_LOCAL_STORE_PATH = join(process.cwd(), '.auth', 'store.json');
const DEFAULT_VERCEL_STORE_PATH = '/tmp/superteam-auth-store.json';

function resolveStorePath(): string {
  const configured = process.env.AUTH_STORE_PATH?.trim();
  if (configured && configured.length > 0) {
    return isAbsolute(configured) ? configured : join(process.cwd(), configured);
  }

  if (process.env.VERCEL === '1' || process.env.VERCEL === 'true') {
    return DEFAULT_VERCEL_STORE_PATH;
  }

  return DEFAULT_LOCAL_STORE_PATH;
}

const STORE_PATH = resolveStorePath();

function emptyStore(): AuthStoreData {
  return {
    users: [],
    accounts: []
  };
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

async function ensureStoreFile(): Promise<void> {
  const dir = dirname(STORE_PATH);
  await mkdir(dir, { recursive: true });

  try {
    await readFile(STORE_PATH, 'utf-8');
  } catch {
    await writeFile(STORE_PATH, JSON.stringify(emptyStore(), null, 2), 'utf-8');
  }
}

async function readStore(): Promise<AuthStoreData> {
  await ensureStoreFile();
  try {
    const raw = await readFile(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<AuthStoreData>;
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      accounts: Array.isArray(parsed.accounts) ? parsed.accounts : []
    };
  } catch {
    return emptyStore();
  }
}

async function writeStore(store: AuthStoreData): Promise<void> {
  await ensureStoreFile();
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
}

function providersForUser(store: AuthStoreData, userId: string): AuthProvider[] {
  return [
    ...new Set(
      store.accounts
        .filter((account) => account.userId === userId)
        .map((account) => account.provider)
    )
  ];
}

function toSessionUser(store: AuthStoreData, user: AuthStoreUser): AuthSessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    image: user.image,
    walletAddress: user.walletAddress,
    providers: providersForUser(store, user.id)
  };
}

function findAccount(
  store: AuthStoreData,
  provider: AuthProvider,
  providerAccountId: string
): AuthStoreAccount | undefined {
  return store.accounts.find(
    (account) =>
      account.provider === provider &&
      account.providerAccountId.toLowerCase() === providerAccountId.toLowerCase()
  );
}

function userById(store: AuthStoreData, userId: string): AuthStoreUser | undefined {
  return store.users.find((user) => user.id === userId);
}

function userByEmail(store: AuthStoreData, email: string): AuthStoreUser | undefined {
  return store.users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

function ensureAccountLink(
  store: AuthStoreData,
  userId: string,
  provider: AuthProvider,
  providerAccountId: string
): void {
  const existing = findAccount(store, provider, providerAccountId);
  if (existing) {
    if (existing.userId !== userId) {
      throw new Error('ACCOUNT_ALREADY_LINKED');
    }
    return;
  }

  store.accounts.push({
    id: randomUUID(),
    userId,
    provider,
    providerAccountId,
    createdAt: nowIso()
  });
}

export async function getSessionUserById(userId: string): Promise<AuthSessionUser | null> {
  if (isFirestoreAuthStoreEnabled()) {
    return firestoreGetSessionUserById(userId);
  }

  const store = await readStore();
  const user = userById(store, userId);
  if (!user) {
    return null;
  }

  return toSessionUser(store, user);
}

export async function upsertOAuthUser(
  profile: OAuthProfile,
  options?: { linkToUserId?: string }
): Promise<AuthSessionUser> {
  if (isFirestoreAuthStoreEnabled()) {
    return firestoreUpsertOAuthUser(profile, options);
  }

  const store = await readStore();
  const now = nowIso();
  const linkedAccount = findAccount(store, profile.provider, profile.providerAccountId);
  let user: AuthStoreUser | undefined;

  if (options?.linkToUserId) {
    user = userById(store, options.linkToUserId);
    if (!user) {
      throw new Error('LINK_USER_NOT_FOUND');
    }
  } else if (linkedAccount) {
    user = userById(store, linkedAccount.userId);
  }

  if (!user) {
    user = userByEmail(store, profile.email);
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
    store.users.push(user);
  } else {
    user.name = profile.name || user.name;
    user.email = profile.email || user.email;
    user.image = profile.image || user.image;
    user.updatedAt = now;
  }

  ensureAccountLink(store, user.id, profile.provider, profile.providerAccountId);
  await writeStore(store);
  return toSessionUser(store, user);
}

export async function findOrCreateWalletUser(input: {
  walletAddress: string;
  name?: string;
  email?: string;
  username?: string;
  password?: string;
}): Promise<AuthSessionUser> {
  if (isFirestoreAuthStoreEnabled()) {
    return firestoreFindOrCreateWalletUser(input);
  }

  const store = await readStore();
  const now = nowIso();
  const linkedAccount = findAccount(store, 'wallet', input.walletAddress);
  let user: AuthStoreUser | undefined;

  if (linkedAccount) {
    user = userById(store, linkedAccount.userId);
  }

  if (!user) {
    user = store.users.find(
      (item) =>
        item.walletAddress?.toLowerCase() === input.walletAddress.toLowerCase()
    );
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
    store.users.push(user);
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

  ensureAccountLink(store, user.id, 'wallet', input.walletAddress);
  if (user.passwordHash) {
    ensureAccountLink(store, user.id, 'credentials', user.email);
  }
  await writeStore(store);
  return toSessionUser(store, user);
}

export async function linkWalletToUser(
  userId: string,
  walletAddress: string
): Promise<AuthSessionUser> {
  if (isFirestoreAuthStoreEnabled()) {
    return firestoreLinkWalletToUser(userId, walletAddress);
  }

  const store = await readStore();
  const user = userById(store, userId);
  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  const existing = findAccount(store, 'wallet', walletAddress);
  if (existing && existing.userId !== userId) {
    throw new Error('WALLET_ALREADY_LINKED');
  }

  user.walletAddress = walletAddress;
  user.updatedAt = nowIso();
  ensureAccountLink(store, userId, 'wallet', walletAddress);
  await writeStore(store);
  return toSessionUser(store, user);
}

export async function signInWithCredentials(input: {
  email: string;
  password: string;
}): Promise<AuthSessionUser> {
  if (isFirestoreAuthStoreEnabled()) {
    return firestoreSignInWithCredentials(input);
  }

  const store = await readStore();
  const email = input.email.trim().toLowerCase();
  const password = input.password.trim();

  if (!email || !password) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const user = userByEmail(store, email);
  if (!user || !user.passwordHash) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new Error('INVALID_CREDENTIALS');
  }

  ensureAccountLink(store, user.id, 'credentials', user.email);
  user.updatedAt = nowIso();
  await writeStore(store);
  return toSessionUser(store, user);
}
