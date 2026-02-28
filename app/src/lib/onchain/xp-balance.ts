/**
 * Read a learner's XP soulbound token balance from chain.
 * XP is a Token-2022 NonTransferable mint whose address is stored in the Config PDA.
 */

import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { TOKEN_2022_PROGRAM_ID } from "./constants";
import { getConfigPda } from "./pda";
import { deserializeConfig } from "./deserializers";

interface ParsedTokenInfo {
  owner?: string;
  tokenAmount?: { amount?: string };
}

/** Fetch the XP mint address from the on-chain Config PDA. Returns null if program not initialized. */
export async function getXpMintFromChain(
  connection: Connection,
): Promise<PublicKey | null> {
  const [configPda] = getConfigPda();
  const info = await connection.getAccountInfo(configPda);
  if (!info) return null;
  return deserializeConfig(info.data as Buffer).xpMint;
}

/**
 * Fetch all XP token holders sorted by balance descending.
 * Returns empty array if the program is not initialized or on any error.
 */
export async function getXpLeaderboard(
  connection: Connection,
): Promise<Array<{ owner: string; balance: number }>> {
  try {
    const xpMint = await getXpMintFromChain(connection);
    if (!xpMint) return [];

    const accounts = await connection.getParsedProgramAccounts(
      TOKEN_2022_PROGRAM_ID,
      {
        filters: [{ memcmp: { offset: 0, bytes: xpMint.toBase58() } }],
      },
    );

    return accounts
      .map((a) => {
        const parsed = (
          a.account.data as { parsed?: { info?: ParsedTokenInfo } }
        ).parsed;
        return {
          owner: parsed?.info?.owner ?? "",
          balance: Number(parsed?.info?.tokenAmount?.amount ?? 0),
        };
      })
      .filter((h) => h.owner && h.balance > 0)
      .sort((a, b) => b.balance - a.balance);
  } catch {
    return [];
  }
}

/**
 * Return the raw XP token balance for a wallet.
 * Returns 0 if the wallet has no XP ATA or the program is not initialized.
 * Level formula: Math.floor(Math.sqrt(xp / 100))
 */
export async function getOnChainXpBalance(
  walletAddress: string,
  connection: Connection,
): Promise<number> {
  try {
    const xpMint = await getXpMintFromChain(connection);
    if (!xpMint) return 0;

    const ata = getAssociatedTokenAddressSync(
      xpMint,
      new PublicKey(walletAddress),
      false,
      TOKEN_2022_PROGRAM_ID,
    );

    const balance = await connection.getTokenAccountBalance(ata);
    return Number(balance.value.amount);
  } catch {
    return 0;
  }
}
