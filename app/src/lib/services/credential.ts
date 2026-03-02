import type { CredentialData } from "./types";

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface ICredentialService {
  getCredentials(wallet: string): Promise<CredentialData[]>;
  getCredential(address: string): Promise<CredentialData | null>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(): Promise<void> {
  return delay(300 + Math.random() * 500);
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_CREDENTIALS: CredentialData[] = [
  {
    address: "CREDmock1111111111111111111111111111111111111",
    name: "Superteam Academy — Solana Developer Track (Level 1)",
    uri: "https://arweave.net/mock-credential-solana-track-level-1",
    trackId: 1,
    level: 1,
    coursesCompleted: 1,
    totalXp: 1200,
    image: "https://arweave.net/mock-credential-solana-track-level-1-image",
  },
];

// ---------------------------------------------------------------------------
// Stub implementation
// ---------------------------------------------------------------------------

export class StubCredentialService implements ICredentialService {
  async getCredentials(_wallet: string): Promise<CredentialData[]> {
    await randomDelay();
    return MOCK_CREDENTIALS;
  }

  async getCredential(address: string): Promise<CredentialData | null> {
    await randomDelay();
    return MOCK_CREDENTIALS.find((c) => c.address === address) ?? null;
  }
}
