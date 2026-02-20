import type { Credential } from "@/types";

export interface CredentialService {
  getCredentials(walletAddress: string): Promise<Credential[]>;
  getCredentialByMint(mintAddress: string): Promise<Credential | null>;
  getCredentialsByUserId(userId: string): Promise<Credential[]>;
  hasCredential(walletAddress: string, courseId: string): Promise<boolean>;
}
