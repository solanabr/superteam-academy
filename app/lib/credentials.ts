import { HELIUS_URL } from "./constants";

export interface CredentialAsset {
  id: string;
  content: {
    metadata: {
      name: string;
      attributes?: { trait_type: string; value: string }[];
    };
    json_uri: string;
  };
  grouping: { group_key: string; group_value: string }[];
}

export async function getCredentialsByOwner(
  owner: string,
  trackCollection?: string
): Promise<CredentialAsset[]> {
  const res = await fetch(HELIUS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "credentials",
      method: "getAssetsByOwner",
      params: { ownerAddress: owner, page: 1, limit: 100 },
    }),
  });
  const data = await res.json();
  const items: CredentialAsset[] = data.result?.items ?? [];

  return items.filter((item) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isCoreAsset = (item as any).interface === "MplCoreAsset";
    if (!isCoreAsset) return false;
    if (!trackCollection) return true;
    return item.grouping?.some(
      (g) => g.group_key === "collection" && g.group_value === trackCollection
    );
  });
}
