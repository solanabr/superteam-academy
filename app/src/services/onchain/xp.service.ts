import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import type { XpService } from "../interfaces";
import { deriveLevel } from "@/types";
import { TOKEN_2022_PROGRAM_ID } from "@/lib/solana/constants";

/**
 * Devnet XP service — reads Token-2022 ATA balance on-chain.
 *
 * XP is a soulbound Token-2022 token (NonTransferable + PermanentDelegate).
 * A learner's XP balance = their token account balance.
 */
export class DevnetXpService implements XpService {
  private connection: Connection;
  private xpMint: PublicKey;

  constructor(connection: Connection, xpMint: PublicKey) {
    this.connection = connection;
    this.xpMint = xpMint;
  }

  async getBalance(wallet: string): Promise<number> {
    try {
      const walletPubkey = new PublicKey(wallet);
      const xpAta = getAssociatedTokenAddressSync(
        this.xpMint,
        walletPubkey,
        false,
        TOKEN_2022_PROGRAM_ID,
      );
      const balance = await this.connection.getTokenAccountBalance(xpAta);
      return Number(balance.value.amount);
    } catch {
      // ATA doesn't exist (new user) or RPC error → 0
      return 0;
    }
  }

  async getLevel(wallet: string): Promise<number> {
    const balance = await this.getBalance(wallet);
    return deriveLevel(balance);
  }
}
