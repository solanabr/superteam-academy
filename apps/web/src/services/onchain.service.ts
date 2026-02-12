/**
 * On-Chain Integration Service
 *
 * Reads on-chain data from Solana devnet.
 * Currently uses mock/stub data. Comments indicate where real API calls would go.
 */

export interface OnChainCredential {
  mint: string;
  name: string;
  description: string;
  imageUri: string;
  metadataUri: string;
  ownerWallet: string;
  treeAddress: string;
  verified: boolean;
  tokenStandard: string;
  attributes: Record<string, string | number>;
  issuedAt: string;
}

export interface VerificationResult {
  verified: boolean;
  mint: string;
  owner: string;
  treeAddress: string;
  leafIndex: number;
  proof: string[];
  timestamp: string;
}

export interface LeaderboardEntryOnChain {
  wallet: string;
  xpBalance: number;
  displayName: string;
}

export interface OnChainService {
  getXPBalance(wallet: string): Promise<number>;
  getCredentials(wallet: string): Promise<OnChainCredential[]>;
  getCredentialByMint(mint: string): Promise<OnChainCredential | null>;
  getLeaderboard(limit: number): Promise<LeaderboardEntryOnChain[]>;
  verifyCredential(mint: string): Promise<VerificationResult>;
}

// ============================================================
// Mock Implementation
// ============================================================

const MOCK_CREDENTIALS: OnChainCredential[] = [
  {
    mint: '7nYkBVMqPi9T5XzE2QrR1xK3bGp8wFhN4mJcLs3xPq9',
    name: 'Solana Fundamentals Certificate',
    description: 'Awarded for completing the Solana Fundamentals course on Superteam Academy.',
    imageUri: 'https://arweave.net/img-solana-fundamentals',
    metadataUri: 'https://arweave.net/abc123-solana-fundamentals',
    ownerWallet: '7nYkBVMqPi9T5XzE2QrR1xK3bGp8wFhN4mJcLs3xPq9',
    treeAddress: 'BPFLoader2111111111111111111111111111111111',
    verified: true,
    tokenStandard: 'cNFT (Metaplex Bubblegum)',
    attributes: { track: 'Solana Fundamentals', level: 'Beginner', xpEarned: 2400, completionDate: '2024-02-01' },
    issuedAt: '2024-02-01T00:00:00Z',
  },
  {
    mint: '9mBcR4kLpN7tYxD6wQsA2vF8eGh3jUiM5oKnZr7yRwX',
    name: 'Anchor Development Certificate',
    description: 'Awarded for completing the Anchor Program Development course.',
    imageUri: 'https://arweave.net/img-anchor-dev',
    metadataUri: 'https://arweave.net/def456-anchor-development',
    ownerWallet: '9mBcR4kLpN7tYxD6wQsA2vF8eGh3jUiM5oKnZr7yRwX',
    treeAddress: 'BPFLoader2111111111111111111111111111111111',
    verified: true,
    tokenStandard: 'cNFT (Metaplex Bubblegum)',
    attributes: { track: 'Anchor Development', level: 'Intermediate', xpEarned: 3600, completionDate: '2024-02-07' },
    issuedAt: '2024-02-07T00:00:00Z',
  },
];

const MOCK_XP_BALANCES: Record<string, number> = {
  '7nYkBVMqPi9T5XzE2QrR1xK3bGp8wFhN4mJcLs3xPq9': 8750,
  '9mBcR4kLpN7tYxD6wQsA2vF8eGh3jUiM5oKnZr7yRwX': 12400,
};

export const onChainService: OnChainService = {
  /**
   * Read XP balance (Token-2022 soulbound token)
   *
   * Real implementation would:
   * - Use @solana/web3.js Connection to devnet
   * - Call getTokenAccountsByOwner with the XP mint address
   * - Parse Token-2022 account data to get balance
   * - Token uses transfer hook to enforce soulbound (non-transferable)
   */
  async getXPBalance(wallet: string): Promise<number> {
    await delay(200);
    return MOCK_XP_BALANCES[wallet] ?? 0;
  },

  /**
   * Read credentials (cNFTs via Helius DAS API)
   *
   * Real implementation would:
   * - POST to Helius DAS API: https://devnet.helius-rpc.com/?api-key=XXX
   * - Method: "getAssetsByOwner"
   * - Filter by collection/creator to only get Superteam Academy cNFTs
   * - Parse DAS response into Credential objects
   */
  async getCredentials(wallet: string): Promise<OnChainCredential[]> {
    await delay(300);
    return MOCK_CREDENTIALS.filter((c) => c.ownerWallet === wallet);
  },

  /**
   * Get credential by mint address
   *
   * Real implementation would:
   * - POST to Helius DAS API with method "getAsset"
   * - Pass mint as the asset ID
   */
  async getCredentialByMint(mint: string): Promise<OnChainCredential | null> {
    await delay(200);
    return MOCK_CREDENTIALS.find((c) => c.mint === mint) ?? null;
  },

  /**
   * Get leaderboard by indexing XP token balances
   *
   * Real implementation would:
   * - Use Helius DAS "getTokenAccounts" or custom indexer
   * - Query all holders of the XP Token-2022 mint
   * - Sort by balance descending
   * - Cross-reference with user profiles for display names
   */
  async getLeaderboard(limit: number): Promise<LeaderboardEntryOnChain[]> {
    await delay(400);
    const entries: LeaderboardEntryOnChain[] = [
      { wallet: '9mBc...7yRw', xpBalance: 12400, displayName: 'Marina Alves' },
      { wallet: '7nYk...3xPq', xpBalance: 8750, displayName: 'Carlos Silva' },
      { wallet: '4xPq...wQxY', xpBalance: 5300, displayName: 'Fernanda Lima' },
      { wallet: '3bKn...mTrS', xpBalance: 2100, displayName: 'Roberto Nunes' },
    ];
    return entries.slice(0, limit);
  },

  /**
   * Verify credential on-chain
   *
   * Real implementation would:
   * - Use Helius DAS API "getAssetProof" to get Merkle proof
   * - Verify the proof against the Bubblegum tree
   * - Check ownership hasn't been transferred
   * - Validate metadata matches expected values
   */
  async verifyCredential(mint: string): Promise<VerificationResult> {
    await delay(500);
    const cred = MOCK_CREDENTIALS.find((c) => c.mint === mint);
    return {
      verified: cred?.verified ?? false,
      mint,
      owner: cred?.ownerWallet ?? '',
      treeAddress: cred?.treeAddress ?? '',
      leafIndex: 42,
      proof: [
        'Hk2E8...proof1',
        '9xMn3...proof2',
        'bTqR7...proof3',
      ],
      timestamp: new Date().toISOString(),
    };
  },
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
