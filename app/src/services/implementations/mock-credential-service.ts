import type { CredentialService } from "../credential-service";
import type { Credential } from "@/types";

// TODO: Replace with Metaplex Core + Helius DAS API reads
export const mockCredentialService: CredentialService = {
  async getCredentials(_walletAddress) {
    return [] satisfies Credential[];
  },

  async getCredentialByMint(_mintAddress) {
    return null;
  },

  async getCredentialsByUserId(_userId) {
    return [] satisfies Credential[];
  },

  async hasCredential(_walletAddress, _courseId) {
    return false;
  },
};
