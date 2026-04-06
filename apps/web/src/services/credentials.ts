import type { WalletAddress, CredentialSummary } from "./models";

export interface CredentialsService {
  getCredentialsByOwner(wallet: WalletAddress): Promise<CredentialSummary[]>;
  verifyCredential(assetId: string): Promise<boolean>;
}

class StubCredentialsService implements CredentialsService {
  async getCredentialsByOwner(): Promise<CredentialSummary[]> {
    return [];
  }

  async verifyCredential(): Promise<boolean> {
    return true;
  }
}

export const credentialsService: CredentialsService =
  new StubCredentialsService();

