export type IdentitySubject =
  | { kind: "wallet"; id: string }
  | { kind: "social"; provider: "google" | "github"; id: string };

export interface IdentityProfile {
  displayName?: string;
  username?: string;
  createdAt: string;
  updatedAt: string;
}

const PROFILE_PREFIX = "academy_identity_profile:";
const SOCIAL_TO_WALLET_PREFIX = "academy_identity_link_social:";
const WALLET_TO_SOCIAL_PREFIX = "academy_identity_link_wallet:";
export const IDENTITY_PROFILE_UPDATED_EVENT = "academy:identity-profile-updated";

function profileKey(subject: IdentitySubject): string {
  if (subject.kind === "wallet") {
    return `${PROFILE_PREFIX}wallet:${subject.id}`;
  }
  return `${PROFILE_PREFIX}social:${subject.provider}:${subject.id}`;
}

function socialLinkKey(subject: Extract<IdentitySubject, { kind: "social" }>): string {
  return `${SOCIAL_TO_WALLET_PREFIX}${subject.provider}:${subject.id}`;
}

function walletLinkKey(subject: Extract<IdentitySubject, { kind: "wallet" }>): string {
  return `${WALLET_TO_SOCIAL_PREFIX}${subject.id}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

export function isProfileComplete(profile: IdentityProfile | null | undefined): boolean {
  if (!profile) return false;
  return Boolean(profile.displayName?.trim() || profile.username?.trim());
}

export function getProfileBySubject(subject: IdentitySubject | null): IdentityProfile | null {
  if (!subject || !canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(profileKey(subject));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as IdentityProfile;
    return {
      displayName: parsed.displayName,
      username: parsed.username,
      createdAt: parsed.createdAt,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}

export function upsertProfile(
  subject: IdentitySubject,
  patch: Partial<Pick<IdentityProfile, "displayName" | "username">>,
): IdentityProfile {
  const existing = getProfileBySubject(subject);
  const timestamp = nowIso();

  const next: IdentityProfile = {
    displayName: patch.displayName?.trim() || existing?.displayName,
    username: patch.username?.trim() || existing?.username,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };

  if (canUseStorage()) {
    localStorage.setItem(profileKey(subject), JSON.stringify(next));
    window.dispatchEvent(new Event(IDENTITY_PROFILE_UPDATED_EVENT));
  }

  return next;
}

export function resolveCurrentSubject(
  session:
    | {
        provider?: string;
        providerAccountId?: string;
      }
    | null
    | undefined,
  walletAddress?: string | null,
): IdentitySubject | null {
  if (
    session?.providerAccountId &&
    (session.provider === "google" || session.provider === "github")
  ) {
    return {
      kind: "social",
      provider: session.provider,
      id: session.providerAccountId,
    };
  }

  if (walletAddress) {
    return {
      kind: "wallet",
      id: walletAddress,
    };
  }

  return null;
}

export function linkSubjects(
  social: Extract<IdentitySubject, { kind: "social" }>,
  wallet: Extract<IdentitySubject, { kind: "wallet" }>,
): void {
  if (!canUseStorage()) return;

  localStorage.setItem(socialLinkKey(social), wallet.id);
  localStorage.setItem(walletLinkKey(wallet), `${social.provider}:${social.id}`);
}

export function getLinkedWalletForSocial(
  social: Extract<IdentitySubject, { kind: "social" }>,
): string | null {
  if (!canUseStorage()) return null;
  return localStorage.getItem(socialLinkKey(social));
}

