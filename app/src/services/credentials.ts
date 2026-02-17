import type { CredentialService, Credential } from "./interfaces";

const MOCK_CREDENTIALS: Credential[] = [];

export class StubCredentialService implements CredentialService {
  async getCredentials(_walletAddress: string): Promise<Credential[]> {
    return MOCK_CREDENTIALS;
  }

  async getCredentialByTrack(
    _walletAddress: string,
    _trackId: number,
  ): Promise<Credential | null> {
    return null;
  }
}

export const credentialService = new StubCredentialService();
