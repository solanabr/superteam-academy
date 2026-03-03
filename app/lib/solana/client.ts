import { Connection, PublicKey } from '@solana/web3.js';

const RPC_URL = process.env.NEXT_PUBLIC_HELIUS_RPC || 'https://api.devnet.solana.com';

export const connection = new Connection(RPC_URL, 'confirmed');

export const XP_MINT_DEVNET = 'DpSmA2DT5jCqKfJ3QxqKfJ3QxqKfJ3QxqKfJ3Qxq'; // Placeholder - replace with real XP mint
export const PROGRAM_ID = 'Acpy8uLgPBh4JXxqKfJ3QxqKfJ3QxqKfJ3QxqKfJ'; // Placeholder - replace with real program

export async function getTokenBalance(walletAddress: string, mintAddress: string): Promise<number> {
  try {
    const wallet = new PublicKey(walletAddress);
    const mint = new PublicKey(mintAddress);
    
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet, { mint });
    
    if (tokenAccounts.value.length === 0) {
      return 0;
    }
    
    const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
    return typeof balance === 'number' ? balance : 0;
  } catch (error) {
    console.error('Error fetching token balance:', error);
    return 0;
  }
}

export async function getAllTokenBalances(walletAddress: string): Promise<Array<{ mint: string; balance: number }>> {
  try {
    const wallet = new PublicKey(walletAddress);
    
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet, { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') });
    
    return tokenAccounts.value.map((account) => ({
      mint: account.account.data.parsed.info.mint,
      balance: account.account.data.parsed.info.tokenAmount.uiAmount,
    }));
  } catch (error) {
    console.error('Error fetching all token balances:', error);
    return [];
  }
}

export async function getNFTsByOwner(walletAddress: string): Promise<Array<{ mint: string; name: string; uri: string }>> {
  try {
    const wallet = new PublicKey(walletAddress);
    
    const response = await connection.getTokenAccountsByOwner(wallet, {
      programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
    });
    
    const nfts: Array<{ mint: string; name: string; uri: string }> = [];
    
    for (const account of response.value) {
      const accountData = account.account.data as { parsed?: { info?: { tokenAmount?: { amount?: string } } } };
      if (accountData.parsed?.info?.tokenAmount?.amount === '1') {
        nfts.push({
          mint: account.pubkey.toString(),
          name: 'Credential NFT',
          uri: '',
        });
      }
    }
    
    return nfts;
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    return [];
  }
}

export async function getMultipleTokenBalances(mintAddress: string, walletAddresses: string[]): Promise<Array<{ wallet: string; balance: number }>> {
  const results: Array<{ wallet: string; balance: number }> = [];
  
  for (const walletAddress of walletAddresses) {
    const balance = await getTokenBalance(walletAddress, mintAddress);
    results.push({ wallet: walletAddress, balance });
  }
  
  return results;
}

export async function getLeaderboardData(): Promise<Array<{ wallet: string; xp: number }>> {
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
  
  const results: Array<{ wallet: string; xp: number }> = [];
  
  for (const wallet of mockWallets) {
    results.push({ wallet, xp: Math.floor(Math.random() * 10000) });
  }
  
  return results.sort((a, b) => b.xp - a.xp);
}
