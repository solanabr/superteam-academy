import { Credential } from "@/domain/models";
import { OnchainIdentityService } from "./contracts";

const DEVNET_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const XP_MINT =
  process.env.NEXT_PUBLIC_XP_MINT ?? "xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3";

async function rpc<T>(method: string, params: unknown[]) {
  const response = await fetch(DEVNET_RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "academy-app",
      method,
      params,
    }),
    cache: "no-store",
  });

  const data = (await response.json()) as { error?: { message: string }; result?: T };
  if (data.error) {
    throw new Error(data.error.message);
  }
  return data.result as T;
}

export const onchainIdentityService: OnchainIdentityService = {
  async getXPBalance(wallet) {
    const tokenAccounts = await rpc<{
      value: { pubkey: string }[];
    }>("getTokenAccountsByOwner", [
      wallet,
      { mint: XP_MINT },
      { encoding: "jsonParsed", commitment: "confirmed" },
    ]);

    const first = tokenAccounts.value[0];
    if (!first) {
      return 0;
    }

    const balance = await rpc<{
      value: { amount: string };
    }>("getTokenAccountBalance", [first.pubkey, { commitment: "confirmed" }]);

    return Number(balance.value.amount);
  },

  async getCredentials(wallet) {
    const response = await fetch(`/api/credentials?wallet=${encodeURIComponent(wallet)}`, {
      method: "GET",
      cache: "no-store",
    });
    if (!response.ok) {
      return [];
    }
    return (await response.json()) as Credential[];
  },

  async verifyCredential(mintAddress) {
    const account = await rpc<{ value: unknown }>("getAccountInfo", [
      mintAddress,
      { encoding: "jsonParsed", commitment: "confirmed" },
    ]);
    return Boolean(account.value);
  },

  async enroll(_courseId, wallet) {
    // Lesson completion/finalization are backend-signed and intentionally stubbed for now.
    // For enrollment this app returns a placeholder tx hash until wallet adapter signing is wired.
    return `pending-signature-${wallet.slice(0, 6)}`;
  },
};
