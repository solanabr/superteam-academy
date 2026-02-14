import { Connection, PublicKey } from "@solana/web3.js";
import { getSolanaEndpoint } from "@/lib/solana/wallet";

type XPBalanceResult = {
  wallet: string;
  mint: string;
  amount: number;
};

export async function getXPBalance(walletAddress: string): Promise<XPBalanceResult> {
  const mint = process.env.NEXT_PUBLIC_XP_MINT_ADDRESS;
  if (!mint) {
    return {
      wallet: walletAddress,
      mint: "",
      amount: 0
    };
  }

  const connection = new Connection(getSolanaEndpoint(), "confirmed");
  const owner = new PublicKey(walletAddress);
  const mintKey = new PublicKey(mint);

  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(owner, { mint: mintKey });
  const amount = tokenAccounts.value.reduce((sum, account) => {
    const tokenAmount = account.account.data.parsed.info.tokenAmount.uiAmount ?? 0;
    return sum + tokenAmount;
  }, 0);

  return {
    wallet: walletAddress,
    mint,
    amount
  };
}
