export type OAuthProvider = 'google' | 'github';
export type AuthProvider = OAuthProvider | 'wallet' | 'credentials';

export interface AuthStoreUser {
  id: string;
  name: string;
  email: string;
  username: string;
  passwordHash?: string;
  image?: string;
  walletAddress?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthStoreAccount {
  id: string;
  userId: string;
  provider: AuthProvider;
  providerAccountId: string;
  createdAt: string;
}

export interface AuthStoreData {
  users: AuthStoreUser[];
  accounts: AuthStoreAccount[];
}

export interface AuthSessionUser {
  id: string;
  name: string;
  email: string;
  username: string;
  image?: string;
  walletAddress?: string;
  providers: AuthProvider[];
}

export interface OAuthProfile {
  provider: OAuthProvider;
  providerAccountId: string;
  name: string;
  email: string;
  image?: string;
}
