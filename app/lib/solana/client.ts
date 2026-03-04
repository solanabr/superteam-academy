import { Connection, PublicKey } from '@solana/web3.js';

const RPC_URL = process.env.NEXT_PUBLIC_HELIUS_RPC || 'https://api.devnet.solana.com';
const DAS_API_URL = RPC_URL.replace('api.devnet', 'api.devnet');

export const connection = new Connection(RPC_URL, 'confirmed');

export const XP_MINT_DEVNET = 'DpSmA2DT5jCqKfJ3QxqKfJ3QxqKfJ3QxqKfJ3Qxq'; // Placeholder - replace with real XP mint
export const CREDENTIAL_MINT_DEVNET = 'Acpy8uLgPBh4JXxqKfJ3QxqKfJ3QxqKfJ3QxqKfJ'; // Placeholder for credential NFTs
export const PROGRAM_ID = 'Acpy8uLgPBh4JXxqKfJ3QxqKfJ3QxqKfJ3QxqKfJ';

interface HeliusDASResponse {
  result: Array<{
    interface: string;
    id: string;
    content: {
      json_uri?: string;
      metadata?: {
        name?: string;
        description?: string;
      };
    };
    authorities: Array<{ address: string; scopes: string[] }>;
    compression?: {
      compressed: boolean;
    };
  }>;
}

async function heliusDASRequest(method: string, params: unknown[]): Promise<unknown> {
  const response = await fetch(`${RPC_URL}?api-key=${process.env.HELIUS_API_KEY || ''}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: '1',
      method,
      params,
    }),
  });
  const data = await response.json();
  return data.result || [];
}

export async function getCompressedNftsByOwner(walletAddress: string): Promise<HeliusDASResponse['result']> {
  try {
    const wallet = new PublicKey(walletAddress);
    const result = await heliusDASRequest('getAssetsByOwner', [
      {
        ownerAddress: wallet.toBase58(),
        page: 1,
        limit: 100,
      },
    ]);
    return result as HeliusDASResponse['result'];
  } catch (error) {
    console.error('Error fetching compressed NFTs:', error);
    return [];
  }
}

export async function getTokenBalance(walletAddress: string, mintAddress: string): Promise<number> {
  try {
    const wallet = new PublicKey(walletAddress);
    const mint = new PublicKey(mintAddress);
    
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet, { mint });
    
    if (tokenAccounts.value.length === 0) {
      return 0;
    }
    
    const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
    return typeof balance === 'number' ? balance : parseFloat(balance) || 0;
  } catch (error) {
    console.error('Error fetching token balance:', error);
    return 0;
  }
}

export async function getXpBalance(walletAddress: string): Promise<number> {
  return getTokenBalance(walletAddress, XP_MINT_DEVNET);
}

export async function getAllTokenBalances(walletAddress: string): Promise<Array<{ mint: string; balance: number }>> {
  try {
    const wallet = new PublicKey(walletAddress);
    
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet, { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') });
    
    return tokenAccounts.value.map((account) => ({
      mint: account.account.data.parsed.info.mint,
      balance: account.account.data.parsed.info.tokenAmount.uiAmountNumber ?? 0,
    }));
  } catch (error) {
    console.error('Error fetching all token balances:', error);
    return [];
  }
}

export interface NFTData {
  mint: string;
  name: string;
  description?: string;
  imageUri?: string;
  collection?: string;
  attributes?: Record<string, string>;
}

export async function getNFTsByOwner(walletAddress: string): Promise<NFTData[]> {
  try {
    const wallet = new PublicKey(walletAddress);
    
    // First try Helius DAS API for compressed NFTs
    const compressedNfts = await getCompressedNftsByOwner(walletAddress);
    
    if (compressedNfts.length > 0) {
      const nfts: NFTData[] = [];
      for (const nft of compressedNfts) {
        if (nft.interface === 'V1_NFT' || nft.interface === 'V2_NFT') {
          nfts.push({
            mint: nft.id,
            name: nft.content?.metadata?.name || 'Unnamed NFT',
            description: nft.content?.metadata?.description,
          });
        }
      }
      return nfts;
    }
    
    // Fallback to regular token accounts
    const response = await connection.getTokenAccountsByOwner(wallet, {
      programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
    });
    
    const nfts: NFTData[] = [];
    
    for (const account of response.value) {
      const accountData = account.account.data as { parsed?: { info?: { tokenAmount?: { amount?: string } } } };
      if (accountData.parsed?.info?.tokenAmount?.amount === '1') {
        nfts.push({
          mint: account.pubkey.toString(),
          name: 'Credential NFT',
        });
      }
    }
    
    return nfts;
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    return [];
  }
}

export async function getCredentialNfts(walletAddress: string): Promise<NFTData[]> {
  const allNfts = await getNFTsByOwner(walletAddress);
  // Filter for credential NFTs (could check collection or metadata)
  return allNfts.filter(nft => 
    nft.name.toLowerCase().includes('credential') || 
    nft.name.toLowerCase().includes('certificate') ||
    nft.name.toLowerCase().includes('badge')
  );
}

export async function getMultipleTokenBalances(mintAddress: string, walletAddresses: string[]): Promise<Array<{ wallet: string; balance: number }>> {
  const results: Array<{ wallet: string; balance: number }> = [];
  
  for (const walletAddress of walletAddresses) {
    const balance = await getTokenBalance(walletAddress, mintAddress);
    results.push({ wallet: walletAddress, balance });
  }
  
  return results;
}

const TRACK_NAMES: Record<string, string> = {
  'solana-fundamentals': 'Solana Fundamentals',
  'anchor-development': 'Anchor Development',
  'token-engineering': 'Token Engineering',
  'defi-composability': 'DeFi Composability',
  'nft-marketplace': 'NFT Marketplace',
  'solana-mobile': 'Solana Mobile',
};

export function getTrackName(slug: string): string {
  return TRACK_NAMES[slug] || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export async function getLeaderboardData(): Promise<Array<{ wallet: string; xp: number }>> {
  // Try to fetch real data from chain
  try {
    const knownAddresses = [
      '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
      '3Kh9sFe4G8XTdEq3X9AwCPYz8W7GzD5Rp4tN2kVL8mQ',
      '5ygM2xNDfQvVGnR7D1fCqXrU3NbWEKz9TqkL6RyJ2tPw',
      '4FbQnDR8yJ7pGkW6T2xEMvL9dZ3CsN5HqA7uXjKf8mRe',
      '8rJ6YkQz2TpWxN4C3mDfR7gL5vHsB9E1aKuXwZj6tMn3',
      '2mXfH5vNqB8dK3LwJ6rGcT9Y7sZpE4A1hWxUkQ5jRt8n',
      '6tR9CpWmX3kG7vN8dL2qHjY5sZxE1bA4fKuJwQ6nMr3T',
      '1nK8JhWx5tR4cP9mQ3dG7vL6bZ2sY8eA5fXuNrTj4Mq7',
      'BvR3Kp8mN6dW2tJ5xQ9gH7cL4sZ1yE8aF3uXwMj6Tr5n',
    ];
    
    const balances = await getMultipleTokenBalances(XP_MINT_DEVNET, knownAddresses);
    
    if (balances.some(b => b.balance > 0)) {
      return balances
        .map(b => ({ wallet: b.wallet, xp: b.balance }))
        .sort((a, b) => b.xp - a.xp);
    }
  } catch (error) {
    console.error('Error fetching leaderboard from chain:', error);
  }
  
  // Fallback to mock data with deterministic values
  const mockXp = [8500, 7200, 6400, 5600, 4800, 4200, 3100, 2400, 1800, 1200];
  const mockWallets = [
    '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    '3Kh9sFe4G8XTdEq3X9AwCPYz8W7GzD5Rp4tN2kVL8mQ',
    '5ygM2xNDfQvVGnR7D1fCqXrU3NbWEKz9TqkL6RyJ2tPw',
    '4FbQnDR8yJ7pGkW6T2xEMvL9dZ3CsN5HqA7uXjKf8mRe',
    '8rJ6YkQz2TpWxN4C3mDfR7gL5vHsB9E1aKuXwZj6tMn3',
    '2mXfH5vNqB8dK3LwJ6rGcT9Y7sZpE4A1hWxUkQ5jRt8n',
    '6tR9CpWmX3kG7vN8dL2qHjY5sZxE1bA4fKuJwQ6nMr3T',
    '1nK8JhWx5tR4cP9mQ3dG7vL6bZ2sY8eA5fXuNrTj4Mq7',
    'BvR3Kp8mN6dW2tJ5xQ9gH7cL4sZ1yE8aF3uXwMj6Tr5n',
  ];
  
  return mockWallets.map((wallet, i) => ({ wallet, xp: mockXp[i] }));
}
