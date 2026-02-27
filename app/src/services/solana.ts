
import { Connection, PublicKey, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplBubblegum } from '@metaplex-foundation/mpl-bubblegum';
import { publicKey as umiPublicKey } from '@metaplex-foundation/umi';
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';

// Real Devnet Assets
export const XP_TOKEN_MINT = new PublicKey(process.env.NEXT_PUBLIC_XP_MINT_ADDRESS || "xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3"); 
export const CREDENTIAL_TREE_ADDRESS = umiPublicKey(process.env.NEXT_PUBLIC_CREDENTIAL_TREE_ADDRESS || "45n28QSmaWaAtUDVYPsTensja45tg1KSG3E5Y3szKNgd"); 
export const COLLECTION_MINT = umiPublicKey(process.env.NEXT_PUBLIC_COLLECTION_MINT || "2TTHTuH5Tva2Z7tnNcGaDfCQcnEzFkAUoPbp8eGvkVHB"); 

const getRpcEndpoint = () => {
    const envRpc = process.env.NEXT_PUBLIC_HELIUS_RPC;
    if (envRpc && !envRpc.includes('your-api-key') && !envRpc.includes('mock')) {
        return envRpc;
    }
    return clusterApiUrl('devnet');
};

const RPC_ENDPOINT = getRpcEndpoint();

class SolanaServiceImpl {
  private _connection: Connection | null = null;
  private _umi: ReturnType<typeof createUmi> | null = null;

  get connection() {
    if (!this._connection) {
       this._connection = new Connection(RPC_ENDPOINT, 'confirmed');
    }
    return this._connection;
  }

  get umi() {
    if (!this._umi) {
       this._umi = createUmi(RPC_ENDPOINT).use(mplBubblegum());
    }
    return this._umi;
  }

  async getBalance(walletAddress: string): Promise<number> {
    try {
      const balance = await this.connection.getBalance(new PublicKey(walletAddress));
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error("Error fetching SOL balance:", error);
      return 0;
    }
  }

  async getXPBalance(walletAddress: string): Promise<number> {
    try {
      const ownerPubkey = new PublicKey(walletAddress);
      const mintStr = XP_TOKEN_MINT.toBase58();

      // Try standard SPL Token program first (filter by mint)
      const stdAccounts = await this.connection.getParsedTokenAccountsByOwner(
        ownerPubkey,
        { mint: XP_TOKEN_MINT }
      );
      if (stdAccounts.value.length > 0) {
        return stdAccounts.value[0]?.account.data.parsed.info.tokenAmount.uiAmount || 0;
      }

      // Fallback: Try Token-2022 program
      const t22Accounts = await this.connection.getParsedTokenAccountsByOwner(
        ownerPubkey,
        { programId: TOKEN_2022_PROGRAM_ID }
      );
      const t22Account = t22Accounts.value.find(
        (acc) => acc.account.data.parsed.info.mint === mintStr
      );
      return t22Account?.account.data.parsed.info.tokenAmount.uiAmount || 0;
    } catch (error) {
      console.error("Error fetching XP balance:", error);
      return 0;
    }
  }

  async mintCredential(walletAddress: string, courseTitle: string, courseSlug: string): Promise<string | null> {
    console.log(`Minting credential for ${courseTitle} to ${walletAddress}...`);
    
    try {
        const res = await fetch('/api/solana/mint-cnft', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress, courseTitle, courseSlug })
        });
        
        const data = await res.json();
        if (data.signature) {
            return data.signature;
        }
    } catch (e) {
        console.error("Failed to mint credential:", e);
    }
    return null;
  }
}

export const SolanaService = new SolanaServiceImpl();
