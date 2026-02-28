import { PublicKey, type Connection } from "@solana/web3.js";
import type { Credential, Track } from "./types";
import {
  HELIUS_RPC_URL,
  CREDENTIAL_COLLECTION,
  TRACK_TYPES,
  SOLANA_NETWORK,
} from "@/lib/constants";
import { courses } from "./courses";
import { getReadonlyProgram, getAccounts } from "@/lib/solana/program";
import { findEnrollmentPDA } from "@/lib/solana/pda";

/**
 * Query credentials via Helius DAS API (Metaplex Core assets).
 *
 * Our credentials are created via Metaplex Core CreateV2CpiBuilder with
 * PermanentFreezeDelegate (soulbound). They appear as regular Metaplex Core
 * assets owned by the learner, filterable by collection.
 */
export async function getCredentialsByOwner(
  walletAddress: string,
): Promise<Credential[]> {
  if (!HELIUS_RPC_URL || !walletAddress) return [];

  // Use the /api/rpc proxy on the client (HELIUS_API_KEY is server-only)
  const rpcUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/rpc`
      : HELIUS_RPC_URL;

  try {
    const response = await fetch(rpcUrl, {
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
          displayOptions: { showCollectionMetadata: true },
        },
      }),
    });

    const data = await response.json();
    const items = data.result?.items;
    if (!Array.isArray(items) || items.length === 0) return [];

    return items
      .filter((item: Record<string, unknown>) => {
        // Filter by collection address if configured, otherwise by interface
        const grouping = item.grouping as
          | Array<{ group_key: string; group_value: string }>
          | undefined;

        if (CREDENTIAL_COLLECTION) {
          return grouping?.some(
            (g) =>
              g.group_key === "collection" &&
              g.group_value === CREDENTIAL_COLLECTION,
          );
        }

        // Fallback: accept Metaplex Core assets with frozen status (soulbound)
        const frozen = item.frozen as boolean | undefined;
        const iface = item.interface as string | undefined;
        return frozen === true || iface === "MplCoreAsset";
      })
      .map((item: Record<string, unknown>): Credential => {
        const content = item.content as Record<string, unknown> | undefined;
        const metadata = content?.metadata as
          | Record<string, unknown>
          | undefined;
        const links = content?.links as Record<string, unknown> | undefined;
        const jsonUri = content?.json_uri as string | undefined;
        const name = (metadata?.name as string) ?? "";

        const attributes = (metadata?.attributes ?? []) as Array<{
          trait_type: string;
          value: string;
        }>;
        const trackAttr = attributes
          .find((a) => a.trait_type === "Track")
          ?.value?.toLowerCase();
        const track: Track = TRACK_TYPES.includes(trackAttr as Track)
          ? (trackAttr as Track)
          : inferTrackFromName(name);

        const createdAt = (item as Record<string, unknown>).created_at as
          | string
          | undefined;

        return {
          id: item.id as string,
          mint: item.id as string,
          track,
          level: Number(
            attributes.find((a) => a.trait_type === "Level")?.value ?? 1,
          ),
          coursesCompleted: Number(
            attributes.find((a) => a.trait_type === "courses_completed")
              ?.value ?? 1,
          ),
          xpEarned: Number(
            attributes.find((a) => a.trait_type === "total_xp")?.value ?? 0,
          ),
          imageUrl: (links?.image as string) ?? "",
          metadataUri: jsonUri ?? "",
          issuedAt: createdAt ?? new Date().toISOString(),
          explorerUrl: `https://explorer.solana.com/address/${item.id}${SOLANA_NETWORK === "devnet" ? "?cluster=devnet" : ""}`,
          credentialAddress: item.id as string,
        };
      });
  } catch (error) {
    console.error("[credentials] Helius DAS API unavailable:", error);
  }

  return [];
}

/** Infer track from credential name pattern "Track N Level M" */
function inferTrackFromName(name: string): Track {
  const lower = name.toLowerCase();
  for (const t of TRACK_TYPES) {
    if (lower.includes(t)) return t;
  }
  return "rust";
}

/**
 * Derive credentials from on-chain enrollment PDAs.
 * This serves as a reliable fallback when Helius DAS is unavailable or slow to index.
 * If an enrollment has `completedAt` set, the course was completed.
 * If it also has a non-default `credentialAsset`, a credential NFT was issued.
 */
export async function getCredentialsFromEnrollments(
  wallet: PublicKey,
  connection: Connection,
): Promise<Credential[]> {
  const program = getReadonlyProgram(connection);
  const credentials: Credential[] = [];

  const results = await Promise.allSettled(
    courses.map(async (course) => {
      const [pda] = findEnrollmentPDA(course.id, wallet);
      const account = await getAccounts(program).enrollment.fetch(pda);
      return { course, account };
    }),
  );

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    const { course, account } = result.value;
    if (!account.completedAt) continue;

    const credentialAsset = account.credentialAsset as PublicKey | null;
    const hasCredential =
      credentialAsset && !credentialAsset.equals(PublicKey.default);

    // Use credential NFT address if issued, otherwise the enrollment PDA itself
    const [enrollmentPDA] = findEnrollmentPDA(course.id, wallet);
    const onchainAddress = hasCredential
      ? credentialAsset.toBase58()
      : enrollmentPDA.toBase58();
    const assetId = hasCredential
      ? credentialAsset.toBase58()
      : `enrollment-${course.id}`;
    const cluster = SOLANA_NETWORK === "devnet" ? "?cluster=devnet" : "";

    credentials.push({
      id: assetId,
      mint: onchainAddress,
      track: course.track,
      level: 1,
      coursesCompleted: 1,
      xpEarned: course.xpReward,
      imageUrl: "",
      metadataUri: "",
      issuedAt: new Date(account.completedAt.toNumber() * 1000).toISOString(),
      explorerUrl: `https://explorer.solana.com/address/${onchainAddress}${cluster}`,
    });
  }

  return credentials;
}
