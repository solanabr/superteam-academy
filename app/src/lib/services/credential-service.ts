import { mockCredentials } from "@/lib/data/mock-courses";
import type { Credential } from "@/types";

export interface CredentialService {
  getCredentialsByWallet(walletAddress: string): Promise<Credential[]>;
  issueCredential(courseId: string, walletAddress: string): Promise<Credential>;
}

class LocalCredentialService implements CredentialService {
  async getCredentialsByWallet(walletAddress: string): Promise<Credential[]> {
    void walletAddress;
    return mockCredentials;
  }

  async issueCredential(courseId: string, walletAddress: string): Promise<Credential> {
    return {
      id: `cred-${courseId}-${Date.now()}`,
      courseId,
      title: `Credential for ${courseId}`,
      issuedAt: new Date().toISOString(),
      issuer: "Superteam Academy",
      imageUri:
        "https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&w=600&q=80",
      txSignature: `mock-${walletAddress}-${Date.now()}`,
    };
  }
}

export const credentialService: CredentialService = new LocalCredentialService();
