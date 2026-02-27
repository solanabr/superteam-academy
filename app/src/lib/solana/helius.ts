const HELIUS_RPC = process.env.NEXT_PUBLIC_HELIUS_RPC || 'https://mainnet.helius-rpc.com/?api-key=mock';

export interface Asset {
  id: string;
  content: {
    json_uri: string;
    files: { uri: string; mime: string }[];
    metadata: {
      name: string;
      symbol: string;
      description: string;
    };
  };
  compression: {
    compressed: boolean;
  };
}

export const HeliusService = {
  getAssetsByOwner: async (ownerAddress: string): Promise<Asset[]> => {
      // Mock if no key or dev environment
     if (HELIUS_RPC.includes('mock')) {
         return [
             {
                 id: 'mock-asset',
                 content: {
                     json_uri: '',
                     files: [{ uri: 'https://arweave.net/placeholder', mime: 'image/png' }],
                     metadata: {
                         name: 'Superteam Certificate',
                         symbol: 'CERT',
                         description: 'Completed Solana Fundamentals'
                     }
                 },
                 compression: {
                     compressed: true
                 }
             }
         ];
     }
    
    try {
        const response = await fetch(HELIUS_RPC, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'my-id',
                method: 'getAssetsByOwner',
                params: {
                    ownerAddress,
                    page: 1,
                    limit: 100
                },
            }),
        });
        const { result } = await response.json();
        return result.items || [];
    } catch (e) {
        console.error('Error fetching assets:', e);
        return [];
    }
  }
};
