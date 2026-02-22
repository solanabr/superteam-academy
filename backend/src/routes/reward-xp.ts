import { Hono } from "hono";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { program, backendSigner, XP_MINT, TOKEN_2022_PROGRAM_ID } from "../lib/program.js";
import { getConfigPDA, getMinterRolePDA } from "../lib/pda.js";
import { getOrCreateATA } from "../lib/ata.js";
import { authMiddleware } from "../middleware/auth.js";
import type { RewardXpRequest } from "../types.js";

const app = new Hono();

app.post("/", authMiddleware, async (c) => {
  const body = await c.req.json<RewardXpRequest>();
  const { recipientWallet, amount, memo } = body;

  if (!recipientWallet || !amount || !memo) {
    return c.json({ error: "Missing required fields: recipientWallet, amount, memo" }, 400);
  }

  const recipient = new PublicKey(recipientWallet);
  const [configPDA] = getConfigPDA();
  const [minterRolePDA] = getMinterRolePDA(backendSigner.publicKey);

  const [recipientATA, createAtaIx] = await getOrCreateATA(XP_MINT, recipient, backendSigner.publicKey);

  const builder = program.methods
    .rewardXp(new BN(amount), memo)
    .accountsStrict({
      config: configPDA,
      minterRole: minterRolePDA,
      xpMint: XP_MINT,
      recipientTokenAccount: recipientATA,
      minter: backendSigner.publicKey,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    })
    .signers([backendSigner]);

  if (createAtaIx) {
    builder.preInstructions([createAtaIx]);
  }

  const signature = await builder.rpc();

  return c.json({
    success: true,
    signature,
  });
});

export default app;
