import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { TOKEN_2022_PROGRAM_ID } from "./pda";
import { calculateXPBalance } from "@/lib/utils/xp";
import { XPBalance } from "@/types";

export async function fetchXpBalance(
  connection: Connection,
  walletAddress: PublicKey,
  xpMintAddress: PublicKey
): Promise<XPBalance> {
  try {
    const xpAta = getAssociatedTokenAddressSync(
      xpMintAddress,
      walletAddress,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    const balance = await connection.getTokenAccountBalance(xpAta);
    const xpAmount = Number(balance.value.amount);
    return calculateXPBalance(xpAmount);
  } catch {
    return calculateXPBalance(0);
  }
}

export async function fetchCredentialsByOwner(
  heliusUrl: string,
  walletAddress: string,
  trackCollectionAddress?: string
) {
  try {
    const response = await fetch(heliusUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "1",
        method: "getAssetsByOwner",
        params: {
          ownerAddress: walletAddress,
          page: 1,
          limit: 100,
        },
      }),
    });

    const data = await response.json();

    if (!data.result?.items) return [];

    const credentials = trackCollectionAddress
      ? data.result.items.filter((item: { grouping?: Array<{ group_key: string; group_value: string }> }) =>
          item.grouping?.find(
            (g: { group_key: string; group_value: string }) =>
              g.group_key === "collection" &&
              g.group_value === trackCollectionAddress
          )
        )
      : data.result.items;

    return credentials.map((cred: { id: string; content?: { metadata?: { name?: string; image?: string; uri?: string; attributes?: Array<{ trait_type: string; value: string }> } }; grouping?: Array<{ group_key: string; group_value: string }> }) => ({
      mintAddress: cred.id,
      name: cred.content?.metadata?.name ?? "Academy Credential",
      imageUri: cred.content?.metadata?.image ?? "",
      metadataUri: cred.content?.metadata?.uri ?? "",
      attributes: cred.content?.metadata?.attributes ?? [],
      collection: cred.grouping?.find(
        (g: { group_key: string; group_value: string }) => g.group_key === "collection"
      )?.group_value,
    }));
  } catch {
    return [];
  }
}
