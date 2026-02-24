import { Connection, PublicKey } from "@solana/web3.js";
import type { ConfirmedSignatureInfo } from "@solana/web3.js";
import { XP_MINT, PROGRAM_ID } from "@/lib/solana/on-chain";

// Label stored in course_pda when the XP mint is not tied to a specific course
// (e.g. reward_xp, award_achievement instructions).
export const NON_COURSE_XP_LABEL = "XP/Achievement Award";

// --- Types ---

export interface XpMintRecord {
  walletAddress: string;
  amount: number;
  coursePda: string;
  signature: string;
  timestamp: number;
}

interface HeliusTokenBalanceChange {
  mint: string;
  rawTokenAmount: { tokenAmount: string; decimals: number };
  userAccount: string;
}

interface HeliusEnhancedTransaction {
  signature: string;
  timestamp: number;
  type: string;
  accountData: Array<{
    account: string;
    tokenBalanceChanges: HeliusTokenBalanceChange[];
  }>;
  instructions: Array<{
    programId: string;
    accounts: string[];
    data: string;
    innerInstructions: Array<{
      programId: string;
      accounts: string[];
      data: string;
    }>;
  }>;
}

export interface OnChainSyncService {
  syncXpTransactions(lastSignature?: string): Promise<{
    records: XpMintRecord[];
    latestSignature: string | null;
  }>;
}

// XP mint address for identifying course-related instructions.
// In complete_lesson/finalize_course, the account layout is:
//   [config, course, enrollment, learner, xp_mint, ...]
// So accounts[1] = course PDA and accounts[4] = XP mint.
// For reward_xp/award_achievement, accounts[4] is NOT XP mint,
// so we use this to distinguish course-related XP from other XP.

class HeliusSyncService implements OnChainSyncService {
  private connection: Connection;
  private apiKey: string;

  constructor(rpcUrl: string, apiKey: string) {
    this.connection = new Connection(rpcUrl, "confirmed");
    this.apiKey = apiKey;
  }

  async syncXpTransactions(lastSignature?: string): Promise<{
    records: XpMintRecord[];
    latestSignature: string | null;
  }> {
    const allRecords: XpMintRecord[] = [];
    let cursor: string | undefined;
    let latestSignature: string | null = null;

    while (true) {
      const sigInfos: ConfirmedSignatureInfo[] =
        await this.connection.getSignaturesForAddress(
          XP_MINT,
          {
            before: cursor,
            until: lastSignature || undefined,
            limit: 1000,
          },
        );

      if (sigInfos.length === 0) break;

      if (!latestSignature) {
        latestSignature = sigInfos[0].signature;
      }

      const signatures = sigInfos.map((s) => s.signature);
      const txs = await this.fetchEnhancedTransactions(signatures);

      for (const tx of txs) {
        const records = this.parseTransaction(tx);
        allRecords.push(...records);
      }

      if (sigInfos.length < 1000) break;
      cursor = sigInfos[sigInfos.length - 1].signature;
    }

    return { records: allRecords, latestSignature };
  }

  private async fetchEnhancedTransactions(
    signatures: string[],
  ): Promise<HeliusEnhancedTransaction[]> {
    if (signatures.length === 0) return [];

    const results: HeliusEnhancedTransaction[] = [];
    const CHUNK_SIZE = 100;
    const THROTTLE_MS = 1000;

    const isDevnet = this.connection.rpcEndpoint.includes("devnet");
    const baseUrl = isDevnet
      ? "api-devnet.helius.xyz"
      : "api.helius.xyz";

    for (let i = 0; i < signatures.length; i += CHUNK_SIZE) {
      const chunk = signatures.slice(i, i + CHUNK_SIZE);
      const url = `https://${baseUrl}/v0/transactions?api-key=${this.apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions: chunk }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Helius REST API ${response.status}: ${errorText}`);
      }

      const data: HeliusEnhancedTransaction[] = await response.json();
      results.push(...data);

      if (i + CHUNK_SIZE < signatures.length) {
        await new Promise((resolve) => setTimeout(resolve, THROTTLE_MS));
      }
    }

    return results;
  }

  private parseTransaction(tx: HeliusEnhancedTransaction): XpMintRecord[] {
    const xpMint = XP_MINT.toBase58();
    const progId = PROGRAM_ID.toBase58();
    const records: XpMintRecord[] = [];

    // Extract course PDA only from complete_lesson/finalize_course instructions.
    // These have accounts layout: [config, course, enrollment, learner, xp_mint, ...]
    // We identify them by checking accounts[4] === XP_MINT.
    // For reward_xp/award_achievement, store a static label instead.
    let coursePda: string = NON_COURSE_XP_LABEL;
    for (const inst of tx.instructions) {
      if (inst.programId === progId && inst.accounts.length >= 5 && inst.accounts[4] === xpMint) {
        coursePda = inst.accounts[1];
        break;
      }
    }

    // Extract XP amounts from tokenBalanceChanges
    for (const account of tx.accountData) {
      for (const change of account.tokenBalanceChanges) {
        if (change.mint !== xpMint) continue;

        const rawAmount = parseFloat(change.rawTokenAmount.tokenAmount);
        const decimals = change.rawTokenAmount.decimals;
        const amount = rawAmount / Math.pow(10, decimals);

        if (amount > 0) {
          records.push({
            walletAddress: change.userAccount,
            amount,
            coursePda,
            signature: tx.signature,
            timestamp: tx.timestamp,
          });
        }
      }
    }

    // Deduplicate by wallet+amount within the same transaction
    const seen = new Set<string>();
    return records.filter((r) => {
      const key = `${r.walletAddress}-${r.amount}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

// Singleton
let syncServiceInstance: OnChainSyncService | null = null;

export function getSyncService(): OnChainSyncService {
  if (syncServiceInstance) return syncServiceInstance;

  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
  const apiKey = process.env.HELIUS_API_KEY;

  if (!rpcUrl) throw new Error("NEXT_PUBLIC_SOLANA_RPC_URL not configured");
  if (!apiKey) throw new Error("HELIUS_API_KEY not configured");

  syncServiceInstance = new HeliusSyncService(rpcUrl, apiKey);
  return syncServiceInstance;
}
