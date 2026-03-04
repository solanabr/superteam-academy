export interface PublicProfileSnapshot {
  username: string;
  wallet: string;
  displayName: string;
  bio: string;
  twitter: string;
  github: string;
  website: string;
  updatedAt: string;
}

export interface EditablePublicProfileInput {
  displayName: string;
  bio: string;
  twitter: string;
  github: string;
  website: string;
  isPublic: boolean;
}

const PUBLIC_PROFILE_PREFIX = "academy_public_profile:";
const PUBLIC_PROFILE_WALLET_INDEX_PREFIX = "academy_public_profile_wallet:";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function normalizeUsername(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function getDefaultUsername(displayName: string, wallet: string): string {
  const base = normalizeUsername(displayName);
  if (base.length >= 3) return base.slice(0, 32);
  const walletFallback = wallet.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `wallet-${walletFallback.slice(0, 8)}`;
}

function profileKey(username: string): string {
  return `${PUBLIC_PROFILE_PREFIX}${username}`;
}

function walletIndexKey(wallet: string): string {
  return `${PUBLIC_PROFILE_WALLET_INDEX_PREFIX}${wallet}`;
}

function parseSnapshot(raw: string | null): PublicProfileSnapshot | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PublicProfileSnapshot;
    if (!parsed || typeof parsed !== "object") return null;
    if (
      typeof parsed.username !== "string" ||
      typeof parsed.wallet !== "string" ||
      typeof parsed.displayName !== "string" ||
      typeof parsed.bio !== "string" ||
      typeof parsed.twitter !== "string" ||
      typeof parsed.github !== "string" ||
      typeof parsed.website !== "string" ||
      typeof parsed.updatedAt !== "string"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function removeWalletPublicProfile(wallet: string) {
  const previousUsername = localStorage.getItem(walletIndexKey(wallet));
  if (previousUsername) {
    localStorage.removeItem(profileKey(previousUsername));
    localStorage.removeItem(walletIndexKey(wallet));
  }
}

export function publishPublicProfile(
  wallet: string,
  profile: EditablePublicProfileInput,
): string | null {
  if (!isBrowser()) return null;
  if (!wallet) return null;

  if (!profile.isPublic) {
    removeWalletPublicProfile(wallet);
    return null;
  }

  const username = getDefaultUsername(profile.displayName, wallet);
  const previousUsername = localStorage.getItem(walletIndexKey(wallet));
  if (previousUsername && previousUsername !== username) {
    localStorage.removeItem(profileKey(previousUsername));
  }

  const snapshot: PublicProfileSnapshot = {
    username,
    wallet,
    displayName: profile.displayName.trim() || wallet.slice(0, 8),
    bio: profile.bio.trim(),
    twitter: profile.twitter.trim().replace(/^@/, ""),
    github: profile.github.trim(),
    website: profile.website.trim(),
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(profileKey(username), JSON.stringify(snapshot));
  localStorage.setItem(walletIndexKey(wallet), username);
  return username;
}

export function getPublicProfileByUsername(
  username: string,
): PublicProfileSnapshot | null {
  if (!isBrowser()) return null;
  const normalized = normalizeUsername(username);
  if (!normalized) return null;
  return parseSnapshot(localStorage.getItem(profileKey(normalized)));
}

export function getPublicProfileUsernameByWallet(wallet: string): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(walletIndexKey(wallet));
}

