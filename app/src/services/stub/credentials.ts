import type { PublicKey } from '@solana/web3.js';
import type { CredentialService } from '../interfaces';
import type { Credential } from '@/types';

// Stub credentials data
const stubCredentials: Credential[] = [
  {
    id: 'cred-1',
    name: 'Solana Fundamentals Certificate',
    description: 'Successfully completed the Solana Fundamentals course',
    image: '/certificates/solana-fundamentals.png',
    track: 'fundamentals',
    level: 1,
    coursesCompleted: 1,
    xpEarned: 500,
    metadataUri: 'https://arweave.net/stub-metadata-1',
    mint: 'CertSo1ana111111111111111111111111111111111',
    owner: 'StubWa11et1111111111111111111111111111111111',
    verified: true,
    attributes: [
      { trait_type: 'Course', value: 'Solana Fundamentals' },
      { trait_type: 'Level', value: 'Beginner' },
      { trait_type: 'Duration', value: '8 hours' },
      { trait_type: 'Score', value: '95%' },
    ],
    mintedAt: new Date('2024-05-15T10:30:00Z'),
    updatedAt: new Date('2024-05-15T10:30:00Z'),
  },
  {
    id: 'cred-2',
    name: 'DeFi Explorer Certificate',
    description: 'Completed the DeFi Fundamentals track',
    image: '/certificates/defi-explorer.png',
    track: 'defi',
    level: 1,
    coursesCompleted: 1,
    xpEarned: 300,
    metadataUri: 'https://arweave.net/stub-metadata-2',
    mint: 'CertDeFi11111111111111111111111111111111111',
    owner: 'StubWa11et1111111111111111111111111111111111',
    verified: true,
    attributes: [
      { trait_type: 'Course', value: 'DeFi Fundamentals' },
      { trait_type: 'Level', value: 'Intermediate' },
    ],
    mintedAt: new Date('2024-05-10T08:00:00Z'),
    updatedAt: new Date('2024-05-10T08:00:00Z'),
  },
  {
    id: 'cred-3',
    name: 'NFT Builder Certificate',
    description: 'Completed the NFT Development track',
    image: '/certificates/nft-builder.png',
    track: 'nft',
    level: 1,
    coursesCompleted: 1,
    xpEarned: 400,
    metadataUri: 'https://arweave.net/stub-metadata-3',
    mint: 'CertNFT111111111111111111111111111111111111',
    owner: 'StubWa11et1111111111111111111111111111111111',
    verified: true,
    attributes: [
      { trait_type: 'Course', value: 'NFT Development' },
      { trait_type: 'Level', value: 'Intermediate' },
    ],
    mintedAt: new Date('2024-05-20T09:15:00Z'),
    updatedAt: new Date('2024-05-20T09:15:00Z'),
  },
];

// Storage keys
const CREDENTIALS_KEY = 'superteam_academy_credentials';

function getStoredCredentials(): Credential[] {
  if (typeof window === 'undefined') return stubCredentials;
  const stored = localStorage.getItem(CREDENTIALS_KEY);
  if (!stored) {
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(stubCredentials));
    return stubCredentials;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return stubCredentials;
  }
}

function setStoredCredentials(credentials: Credential[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
}

export class StubCredentialService implements CredentialService {
  async getCredentials(_wallet: string | PublicKey): Promise<Credential[]> {
    return getStoredCredentials();
  }

  async getCredential(credentialId: string): Promise<Credential | null> {
    const credentials = getStoredCredentials();
    return credentials.find((c) => c.id === credentialId) ?? null;
  }

  async verifyCredential(
    credentialId: string,
    _wallet: string | PublicKey
  ): Promise<{ isValid: boolean; details?: string }> {
    const credentials = getStoredCredentials();
    const credential = credentials.find((c) => c.id === credentialId);
    if (credential) {
      return { isValid: true, details: `Credential verified: ${credentialId}` };
    }
    return { isValid: false, details: 'Credential not found' };
  }

  async getCredentialMetadata(
    credentialId: string
  ): Promise<{ name: string; image: string; attributes: Record<string, string> }> {
    const credentials = getStoredCredentials();
    const credential = credentials.find((c) => c.id === credentialId);
    if (!credential) {
      return { name: 'Unknown', image: '', attributes: {} };
    }
    const attributes: Record<string, string> = {};
    for (const attr of credential.attributes ?? []) {
      attributes[attr.trait_type] = attr.value;
    }
    return {
      name: credential.name,
      image: credential.image ?? '',
      attributes,
    };
  }
}

export const credentialService = new StubCredentialService();
