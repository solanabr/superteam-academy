/**
 * AuthService
 *
 * Clean interface for authentication that supports both wallet-based auth
 * and social auth (Google/GitHub).
 *
 * Current implementation: localStorage-backed linking model.
 */

export interface WalletAuthInfo {
  type: "wallet";
  publicKey: string;
  displayName: string | null;
}

export interface SocialAuthInfo {
  type: "google" | "github";
  uid: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export type AuthInfo = WalletAuthInfo | SocialAuthInfo;

export interface LinkedAccount {
  wallet?: string;
  google?: { uid: string; email: string };
  github?: { uid: string; username: string };
}

export interface IAuthService {
  getCurrentUser(): AuthInfo | null;
  getLinkedAccounts(wallet: string): Promise<LinkedAccount>;
  linkWallet(wallet: string): Promise<void>;
  linkSocialAccount(wallet: string, social: SocialAuthInfo): Promise<LinkedAccount>;
  unlinkSocialAccount(
    wallet: string,
    provider: SocialAuthInfo["type"],
  ): Promise<LinkedAccount>;
  isWalletLinkedForSocial(wallet: string, social: SocialAuthInfo): Promise<boolean>;
}

class StubAuthService implements IAuthService {
  private key(wallet: string) {
    return `academy_linked_${wallet}`;
  }

  private legacyKey(wallet: string) {
    return `academy_linked_${wallet.slice(0, 8)}`;
  }

  private read(wallet: string): LinkedAccount {
    if (typeof window === "undefined") return { wallet };

    const raw =
      localStorage.getItem(this.key(wallet)) ??
      localStorage.getItem(this.legacyKey(wallet));
    const stored: Partial<LinkedAccount> = raw ? JSON.parse(raw) : {};
    return { wallet, ...stored };
  }

  private write(wallet: string, payload: LinkedAccount): void {
    if (typeof window === "undefined") return;
    const serialized = JSON.stringify(payload);
    localStorage.setItem(this.key(wallet), serialized);
    // Mirror legacy key for backward compatibility with previous local sessions.
    localStorage.setItem(this.legacyKey(wallet), serialized);
  }

  getCurrentUser(): AuthInfo | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("academy_auth_user");
    return raw ? JSON.parse(raw) : null;
  }

  async getLinkedAccounts(wallet: string): Promise<LinkedAccount> {
    return this.read(wallet);
  }

  async linkWallet(wallet: string): Promise<void> {
    const existing = await this.getLinkedAccounts(wallet);
    this.write(wallet, { ...existing, wallet });
  }

  async linkSocialAccount(
    wallet: string,
    social: SocialAuthInfo,
  ): Promise<LinkedAccount> {
    const existing = await this.getLinkedAccounts(wallet);
    const next: LinkedAccount = { ...existing, wallet };

    if (social.type === "google") {
      next.google = { uid: social.uid, email: social.email };
    } else {
      next.github = {
        uid: social.uid,
        username:
          social.email.split("@")[0] || social.displayName || "github-user",
      };
    }

    this.write(wallet, next);
    return next;
  }

  async unlinkSocialAccount(
    wallet: string,
    provider: SocialAuthInfo["type"],
  ): Promise<LinkedAccount> {
    const existing = await this.getLinkedAccounts(wallet);
    const next: LinkedAccount = { ...existing };

    if (provider === "google") {
      delete next.google;
    } else {
      delete next.github;
    }

    this.write(wallet, next);
    return next;
  }

  async isWalletLinkedForSocial(
    wallet: string,
    social: SocialAuthInfo,
  ): Promise<boolean> {
    const linked = await this.getLinkedAccounts(wallet);
    if (social.type === "google") {
      return linked.google?.uid === social.uid;
    }
    return linked.github?.uid === social.uid;
  }
}

let _authService: IAuthService | null = null;
export function getAuthService(): IAuthService {
  if (!_authService) {
    _authService = new StubAuthService();
  }
  return _authService;
}

