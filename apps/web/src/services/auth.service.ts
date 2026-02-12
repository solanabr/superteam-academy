import type { User, UserRole } from '@/types';

export interface AuthService {
  /** Get current authenticated user */
  getCurrentUser(): Promise<User | null>;

  /** Sign in with wallet signature */
  signInWithWallet(walletAddress: string, signature: Uint8Array, message: string): Promise<User>;

  /** Link an additional provider to the current account */
  linkAccount(provider: 'google' | 'github' | 'wallet', credentials: Record<string, string>): Promise<void>;

  /** Update user role (admin only) */
  updateUserRole(userId: string, role: UserRole): Promise<void>;

  /** Get user by ID */
  getUserById(userId: string): Promise<User | null>;

  /** Sign out */
  signOut(): Promise<void>;
}
