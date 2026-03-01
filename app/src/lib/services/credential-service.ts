import { CredentialNFT } from "@/types/academy";
import { getRpcUrl } from "@/lib/solana/connection";

export async function fetchCredentials(walletAddress: string): Promise<CredentialNFT[]> {
  // In production: use Helius DAS getAssetsByOwner filtered by track collections
  // For demo: return empty array (user hasn't earned credentials yet)
  
  const rpcUrl = getRpcUrl();
  
  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "credentials",
        method: "getAssetsByOwner",
        params: {
          ownerAddress: walletAddress,
          page: 1,
          limit: 50,
        },
      }),
    });

    const data = await response.json();
    if (!data.result?.items) return [];

    // Filter for academy credential NFTs (by authority or collection)
    const credentials: CredentialNFT[] = data.result.items
      .filter((item: any) => {
        // Check if this is a Superteam Academy credential
        const attrs = item.content?.metadata?.attributes;
        return attrs?.some((a: any) => a.trait_type === "track_id");
      })
      .map((item: any) => {
        const attrs = item.content?.metadata?.attributes || [];
        const getAttr = (key: string) => attrs.find((a: any) => a.trait_type === key)?.value;
        
        return {
          address: item.id,
          name: item.content?.metadata?.name || "Academy Credential",
          imageUri: item.content?.links?.image || "",
          trackId: Number(getAttr("track_id")) || 0,
          coursesCompleted: Number(getAttr("courses_completed")) || 0,
          totalXp: Number(getAttr("total_xp")) || 0,
        };
      });

    return credentials;
  } catch (error) {
    console.error("Failed to fetch credentials:", error);
    return [];
  }
}

// Stub for achievement queries
export async function fetchAchievements(walletAddress: string) {
  // In production: query AchievementType and AchievementReceipt PDAs
  return [];
}
