import type {
  CredentialService,
  Credential,
  CredentialIssuanceResult,
} from "./interfaces";

/** Parse level value from NFT attribute. Handles both numeric ("1") and legacy label ("bronze") formats. */
function parseLevelValue(val: string): number {
  const num = parseInt(val, 10);
  if (!isNaN(num)) return num;
  const labelMap: Record<string, number> = { bronze: 1, silver: 2, gold: 3 };
  return labelMap[val.toLowerCase()] ?? 0;
}

// --- Helius DAS Implementation ---

/** Known collection addresses for our tracks, loaded lazily. */
let knownCollections: Set<string> | null = null;

async function loadKnownCollections(): Promise<Set<string>> {
  if (knownCollections) return knownCollections;
  try {
    const res = await fetch("/api/tracks");
    if (res.ok) {
      const tracks = await res.json();
      knownCollections = new Set(
        (tracks as { collectionAddress?: string }[])
          .map((t) => t.collectionAddress)
          .filter(Boolean) as string[],
      );
      return knownCollections;
    }
  } catch {
    // ignore
  }
  knownCollections = new Set();
  return knownCollections;
}

class HeliusCredentialService implements CredentialService {
  private rpcUrl: string;

  constructor(rpcUrl: string) {
    this.rpcUrl = rpcUrl;
  }

  async getCredentials(walletAddress: string): Promise<Credential[]> {
    try {
      const response = await fetch(this.rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "get-assets",
          method: "getAssetsByOwner",
          params: {
            ownerAddress: walletAddress,
            page: 1,
            limit: 100,
          },
        }),
      });

      const json = await response.json();
      const items = json?.result?.items ?? [];

      const collections = await loadKnownCollections();

      const credentials: Credential[] = [];
      for (const item of items) {
        const cred = this.parseCredential(item, walletAddress, collections);
        if (cred) credentials.push(cred);
      }

      return credentials;
    } catch {
      return [];
    }
  }

  async getCredentialByTrack(
    walletAddress: string,
    trackId: number,
  ): Promise<Credential | null> {
    const credentials = await this.getCredentials(walletAddress);
    return credentials.find((c) => c.trackId === trackId) ?? null;
  }

  async collectCredential(params: {
    courseId: string;
    learnerWallet: string;
  }): Promise<CredentialIssuanceResult> {
    const res = await fetch("/api/credentials/collect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      return { confirmed: false, signature: undefined, credentialAsset: undefined };
    }

    const data = await res.json();
    return {
      confirmed: true,
      signature: data.signature,
      credentialAsset: data.credentialAsset,
    };
  }

  private parseCredential(
    asset: Record<string, unknown>,
    walletAddress: string,
    collections: Set<string>,
  ): Credential | null {
    // Filter by collection address (grouping)
    const grouping = asset.grouping as
      | Array<{ group_key: string; group_value: string }>
      | undefined;

    if (grouping && collections.size > 0) {
      const collectionGroup = grouping.find(
        (g) => g.group_key === "collection",
      );
      if (!collectionGroup || !collections.has(collectionGroup.group_value)) {
        return null;
      }
    } else {
      // Fallback: check name
      const content = asset.content as Record<string, unknown> | undefined;
      const metadata = content?.metadata as
        | Record<string, unknown>
        | undefined;
      const name = (metadata?.name as string) ?? "";
      if (!name.includes("Track") && !name.includes("Credential")) return null;
    }

    const content = asset.content as Record<string, unknown> | undefined;
    if (!content) return null;

    // Try JSON metadata attributes first, fallback to on-chain plugin attributes
    const metadata = content.metadata as Record<string, unknown> | undefined;
    const jsonAttrs =
      (metadata?.attributes as Array<{ trait_type: string; value: string }>) ??
      [];
    const plugins = asset.plugins as Record<string, unknown> | undefined;
    const pluginAttrList = (plugins?.attributes as { data?: { attribute_list?: Array<{ key: string; value: string }> } })?.data?.attribute_list ?? [];
    const attributes = jsonAttrs.length > 0
      ? jsonAttrs
      : pluginAttrList.map((a) => ({ trait_type: a.key, value: a.value }));

    const trackIdAttr = attributes.find((a) => a.trait_type === "track_id");
    if (!trackIdAttr) return null;

    const trackNameAttr = attributes.find(
      (a) => a.trait_type === "track_name",
    );
    const levelAttr = attributes.find((a) => a.trait_type === "level");
    const coursesCompletedAttr = attributes.find(
      (a) => a.trait_type === "courses_completed",
    );
    const totalXpAttr = attributes.find((a) => a.trait_type === "total_xp");
    const completedCourseIdsAttr = attributes.find(
      (a) => a.trait_type === "completed_course_ids",
    );

    // Parse completedCourseIds from attribute or fall back to metadata URI query param
    let completedCourseIds: string[] | undefined;
    if (completedCourseIdsAttr) {
      completedCourseIds = completedCourseIdsAttr.value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else {
      const jsonUri = content.json_uri as string | undefined;
      if (jsonUri) {
        try {
          const uriParam = new URL(jsonUri).searchParams.get("completedCourseIds");
          if (uriParam) {
            completedCourseIds = uriParam.split(",").map((s) => s.trim()).filter(Boolean);
          }
        } catch { /* invalid URI, skip */ }
      }
    }

    const explorerUrl = `https://explorer.solana.com/address/${asset.id as string}?cluster=devnet`;

    // Get image URL
    const links = content.links as Record<string, unknown> | undefined;
    const imageUrl = (links?.image as string) ?? undefined;

    return {
      id: asset.id as string,
      trackId: parseInt(trackIdAttr.value, 10),
      trackName: trackNameAttr?.value ?? `Track ${trackIdAttr.value}`,
      level: levelAttr ? parseLevelValue(levelAttr.value) : 0,
      issuedAt: (asset.created_at as string) ?? new Date().toISOString(),
      walletAddress,
      mintAddress: asset.id as string,
      coursesCompleted: coursesCompletedAttr
        ? parseInt(coursesCompletedAttr.value, 10)
        : undefined,
      totalXp: totalXpAttr ? parseInt(totalXpAttr.value, 10) : undefined,
      completedCourseIds,
      imageUrl: imageUrl ?? undefined,
      explorerUrl,
    };
  }
}

// --- Singleton ---

function createService(): CredentialService {
  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
  if (!rpcUrl) {
    throw new Error("NEXT_PUBLIC_SOLANA_RPC_URL is required for credential service");
  }
  return new HeliusCredentialService(rpcUrl);
}

export const credentialService: CredentialService = createService();
