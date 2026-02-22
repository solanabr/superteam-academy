import type { CredentialService, Credential } from "./interfaces";

// --- Mock Implementation ---

class MockCredentialService implements CredentialService {
  async getCredentials(_walletAddress: string): Promise<Credential[]> {
    return [];
  }

  async getCredentialByTrack(
    _walletAddress: string,
    _trackId: number,
  ): Promise<Credential | null> {
    return null;
  }
}

// --- Helius DAS Implementation ---

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

      // Filter for Superteam Academy credentials (Metaplex Core assets with our collection)
      const credentials: Credential[] = [];
      for (const item of items) {
        const cred = this.parseCredential(item, walletAddress);
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

  private parseCredential(
    asset: Record<string, unknown>,
    walletAddress: string,
  ): Credential | null {
    const content = asset.content as Record<string, unknown> | undefined;
    if (!content) return null;

    const metadata = content.metadata as Record<string, unknown> | undefined;
    if (!metadata) return null;

    // Check if this is a Superteam Academy credential
    const name = (metadata.name as string) ?? "";
    if (!name.includes("Track") && !name.includes("Credential")) return null;

    const attributes = (metadata.attributes as Array<{ trait_type: string; value: string }>) ?? [];
    const trackIdAttr = attributes.find((a) => a.trait_type === "track_id");
    const levelAttr = attributes.find((a) => a.trait_type === "level");

    if (!trackIdAttr) return null;

    const trackNameAttr = attributes.find((a) => a.trait_type === "track_name");

    return {
      id: asset.id as string,
      trackId: parseInt(trackIdAttr.value, 10),
      trackName: trackNameAttr?.value ?? `Track ${trackIdAttr.value}`,
      level: (levelAttr?.value as Credential["level"]) ?? "bronze",
      issuedAt: (asset.created_at as string) ?? new Date().toISOString(),
      walletAddress,
      mintAddress: asset.id as string,
    };
  }
}

// --- Singleton with fallback ---

function createService(): CredentialService {
  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
  if (rpcUrl && rpcUrl.includes("helius")) {
    return new HeliusCredentialService(rpcUrl);
  }
  return new MockCredentialService();
}

export const credentialService: CredentialService = createService();
