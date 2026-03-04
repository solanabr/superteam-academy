import type { CredentialService } from "../interfaces";
import type { Credential } from "@/types";
import { LocalCredentialService } from "../credential.service";

/* eslint-disable @typescript-eslint/no-explicit-any */

const TRACK_MAP: Record<string, { name: string; accent: string }> = {
  "1": { name: "Solana Core", accent: "#34d399" },
  "2": { name: "Anchor Framework", accent: "#eab308" },
  "3": { name: "Program Security", accent: "#ef4444" },
  "4": { name: "DeFi", accent: "#22d3ee" },
  "5": { name: "Testing", accent: "#a78bfa" },
};

/**
 * Devnet credential service — reads Metaplex Core NFTs via Helius DAS API.
 *
 * Credentials are soulbound NFTs (PermanentFreezeDelegate) with attributes:
 * track_id, level, courses_completed, total_xp
 */
export class DevnetCredentialService implements CredentialService {
  private heliusUrl: string;
  private fallback = new LocalCredentialService();

  constructor(heliusUrl: string) {
    this.heliusUrl = heliusUrl;
  }

  async getCredentials(wallet: string): Promise<Credential[]> {
    try {
      const response = await fetch(this.heliusUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "get-credentials",
          method: "getAssetsByOwner",
          params: { ownerAddress: wallet, page: 1, limit: 100 },
        }),
      });
      const data = await response.json();
      if (!data.result?.items) return [];

      return data.result.items
        .filter((item: any) => this.isAcademyCredential(item))
        .map((item: any) => this.mapToCredential(item));
    } catch {
      return [];
    }
  }

  async getCredentialByMint(mintAddress: string): Promise<Credential | null> {
    try {
      const response = await fetch(this.heliusUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "get-asset",
          method: "getAsset",
          params: { id: mintAddress },
        }),
      });
      const data = await response.json();
      if (!data.result || !this.isAcademyCredential(data.result)) return null;
      return this.mapToCredential(data.result);
    } catch {
      return null;
    }
  }

  // Backend-signed — delegate to stub
  async issueCredential(
    wallet: string,
    courseId: string,
    trackId: string,
  ): Promise<{ mintAddress: string; txSignature: string | null }> {
    return this.fallback.issueCredential(wallet, courseId, trackId);
  }

  async upgradeCredential(
    wallet: string,
    mintAddress: string,
    coursesCompleted: number,
    totalXp: number,
  ): Promise<{ txSignature: string | null }> {
    return this.fallback.upgradeCredential(
      wallet,
      mintAddress,
      coursesCompleted,
      totalXp,
    );
  }

  private isAcademyCredential(item: any): boolean {
    const attrs = item.content?.metadata?.attributes;
    if (!Array.isArray(attrs)) return false;
    return attrs.some((a: any) => a.trait_type === "track_id");
  }

  private mapToCredential(item: any): Credential {
    const attrs: any[] = item.content?.metadata?.attributes || [];
    const getAttr = (key: string) =>
      attrs.find((a: any) => a.trait_type === key)?.value;

    const trackId = getAttr("track_id") || "1";
    const track = TRACK_MAP[trackId] || {
      name: `Track ${trackId}`,
      accent: "#34d399",
    };
    const level = getAttr("level") || "Beginner";

    return {
      id: item.id,
      track: track.name,
      level: typeof level === "number" ? `Level ${level}` : level,
      accent: track.accent,
      mintAddress: item.id,
      earnedAt: item.created_at
        ? new Date(item.created_at).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          })
        : new Date().toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          }),
      coursesCompleted: Number(getAttr("courses_completed") || 0),
      totalXp: Number(getAttr("total_xp") || 0),
      metadataUri: item.content?.json_uri,
      collectionAddress: item.grouping?.find(
        (g: any) => g.group_key === "collection",
      )?.group_value,
    };
  }
}
