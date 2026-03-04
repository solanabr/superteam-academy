/**
 * Credential Service - reads Metaplex Core credential assets via Helius DAS.
 *
 * This service mirrors the app hook behavior but remains framework-agnostic.
 */

import { WalletNotConnectedError } from "@/lib/errors";

export interface OnChainCredential {
  id: string;
  learner: string;
  track: string;
  currentLevel: number;
  coursesCompleted: number;
  totalXPEarned: number;
}

export interface DisplayCredential extends OnChainCredential {
  name: string;
  badgeImageUrl: string | null;
  explorerUrl: string;
}

interface CredentialAttribute {
  trait_type?: string;
  value?: string | number;
}

interface DasFile {
  uri: string;
}

interface DasAsset {
  id: string;
  content?: {
    metadata?: {
      name?: string;
      image?: string;
      attributes?: CredentialAttribute[];
    };
    links?: {
      image?: string;
    };
    files?: DasFile[];
  };
  grouping?: Array<{ group_key: string; group_value: string }>;
}

interface DasResponse {
  result?: {
    items?: DasAsset[];
  };
}

const DEFAULT_TRACK_COLLECTION =
  "HgbTmCi4wUWAWLx4LD6zJ2AQdayaCe7mVfhJpGwXfeVX";

function getTrackCollectionAddress(): string {
  const fromEnv = process.env.NEXT_PUBLIC_TRACK_COLLECTION;
  return fromEnv && fromEnv.trim().length > 0
    ? fromEnv.trim()
    : DEFAULT_TRACK_COLLECTION;
}

function getAttributeValue(
  attributes: CredentialAttribute[] | undefined,
  traitType: string,
): string | number | undefined {
  return attributes?.find((attr) => attr.trait_type === traitType)?.value;
}

function toNumber(value: string | number | undefined, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function mapAssetToCredential(asset: DasAsset, owner: string): DisplayCredential {
  const attributes = asset.content?.metadata?.attributes ?? [];

  return {
    id: asset.id,
    learner: owner,
    track: String(getAttributeValue(attributes, "track") ?? "unknown"),
    currentLevel: toNumber(getAttributeValue(attributes, "level"), 0),
    coursesCompleted: toNumber(getAttributeValue(attributes, "courses_completed"), 0),
    totalXPEarned: toNumber(getAttributeValue(attributes, "total_xp"), 0),
    name: asset.content?.metadata?.name ?? "Academy Credential",
    badgeImageUrl:
      asset.content?.links?.image ??
      asset.content?.metadata?.image ??
      asset.content?.files?.[0]?.uri ??
      null,
    explorerUrl: `https://explorer.solana.com/address/${asset.id}?cluster=devnet`,
  };
}

export async function fetchCredentials(
  walletAddress: string,
  rpcUrl: string,
): Promise<DisplayCredential[]> {
  if (!walletAddress) {
    throw new WalletNotConnectedError();
  }

  if (!rpcUrl) {
    return [];
  }

  const body = {
    jsonrpc: "2.0",
    id: "academy-credentials-service",
    method: "getAssetsByOwner",
    params: {
      ownerAddress: walletAddress,
      page: 1,
      limit: 50,
      displayOptions: {
        showCollectionMetadata: true,
        showUnverifiedCollections: true,
        showFungible: false,
        showNativeBalance: false,
      },
    },
  };

  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as DasResponse;
  const collection = getTrackCollectionAddress();

  return (data.result?.items ?? [])
    .filter((asset) =>
      asset.grouping?.some(
        (group) =>
          group.group_key === "collection" && group.group_value === collection,
      ),
    )
    .map((asset) => mapAssetToCredential(asset, walletAddress));
}

export async function fetchCredentialByTrack(
  walletAddress: string,
  track: string,
  rpcUrl: string,
): Promise<DisplayCredential | null> {
  const credentials = await fetchCredentials(walletAddress, rpcUrl);
  return credentials.find((credential) => credential.track === track) ?? null;
}
