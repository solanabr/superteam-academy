import { Router, Request, Response } from "express";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import {
  getProgram,
  getXpMint,
  getAchievementCollection,
  TOKEN_2022_PROGRAM_ID,
  MPL_CORE_PROGRAM_ID,
} from "../program";
import {
  findConfigPDA,
  findAchievementTypePDA,
  findAchievementReceiptPDA,
  findMinterRolePDA,
} from "../pda";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { Transaction } from "@solana/web3.js";

const router = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function ensureAta(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  connection: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payer: any,
  owner: PublicKey,
  mint: PublicKey
): Promise<PublicKey> {
  const ata = getAssociatedTokenAddressSync(mint, owner, false, TOKEN_2022_PROGRAM_ID);
  const info = await connection.getAccountInfo(ata);
  if (info) return ata;

  const ix = createAssociatedTokenAccountInstruction(payer.publicKey, ata, owner, mint, TOKEN_2022_PROGRAM_ID);
  const tx = new Transaction().add(ix);
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = payer.publicKey;
  tx.sign(payer);
  const sig = await connection.sendRawTransaction(tx.serialize());
  await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
  return ata;
}

// ─── Shared award logic ───────────────────────────────────────────────────────

export interface AwardResult {
  awarded: boolean;
  signature?: string;
  asset?: string;
  error?: string;
}

/**
 * Try to award an achievement to a recipient.
 * - Returns { awarded: false } silently if: collection not configured, receipt already exists.
 * - Returns { awarded: false, error } if the transaction fails unexpectedly.
 */
export async function tryAwardAchievement(
  achievementId: string,
  recipientWallet: string
): Promise<AwardResult> {
  let recipient: PublicKey;
  try {
    recipient = new PublicKey(recipientWallet);
  } catch {
    return { awarded: false, error: "Invalid recipient pubkey" };
  }

  const collection = getAchievementCollection(achievementId);
  if (!collection) return { awarded: false };

  try {
    const { program, backendKeypair, connection } = getProgram();
    const xpMint = getXpMint();

    const [configPda] = findConfigPDA();
    const [achievementTypePda] = findAchievementTypePDA(achievementId);
    const [achievementReceiptPda] = findAchievementReceiptPDA(achievementId, recipient);
    const [minterRolePda] = findMinterRolePDA(backendKeypair.publicKey);

    // Skip if already awarded (receipt PDA exists — no wasted SOL on failed tx)
    const receiptInfo = await connection.getAccountInfo(achievementReceiptPda);
    if (receiptInfo) return { awarded: false };

    const recipientTokenAccount = await ensureAta(connection, backendKeypair, recipient, xpMint);
    const assetKp = Keypair.generate();

    const signature = await program.methods
      .awardAchievement()
      .accountsPartial({
        config: configPda,
        achievementType: achievementTypePda,
        achievementReceipt: achievementReceiptPda,
        minterRole: minterRolePda,
        asset: assetKp.publicKey,
        collection,
        recipient,
        recipientTokenAccount,
        xpMint,
        payer: backendKeypair.publicKey,
        minter: backendKeypair.publicKey,
        mplCoreProgram: MPL_CORE_PROGRAM_ID,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([backendKeypair, assetKp])
      .rpc();

    return { awarded: true, signature, asset: assetKp.publicKey.toBase58() };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[achievements] tryAwardAchievement(${achievementId}) failed:`, msg);
    return { awarded: false, error: msg };
  }
}

// ─── POST /achievements/award ─────────────────────────────────────────────────

interface AwardBody {
  achievementId: string;
  recipientWallet: string;
}

router.post(
  "/award",
  async (req: Request<object, object, AwardBody>, res: Response) => {
    const { achievementId, recipientWallet } = req.body;

    if (!achievementId || !recipientWallet) {
      res.status(400).json({ error: "Missing achievementId or recipientWallet" });
      return;
    }

    const result = await tryAwardAchievement(achievementId, recipientWallet);

    if (!result.awarded && result.error) {
      res.status(500).json(result);
      return;
    }

    res.json({ success: true, ...result });
  }
);

export default router;
