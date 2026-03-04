"use client";

import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { getStubCredential } from "@/lib/stubStorage";

/** Track collection address on devnet — Metaplex Core collection asset */
export const TRACK_COLLECTION = "HgbTmCi4wUWAWLx4LD6zJ2AQdayaCe7mVfhJpGwXfeVX";

export interface CredentialAttribute {
  trait_type: string;
  value: string | number;
}

export interface Credential {
  id: string;
  name: string;
  image: string | null;
  attributes: CredentialAttribute[];
  explorerUrl: string;
  isStub: boolean;
}

interface DasFile {
  uri: string;
  cdn_uri?: string;
  mime?: string;
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
    total?: number;
  };
  error?: { message: string };
}

async function fetchCredentials(
  owner: string,
  rpcUrl: string,
): Promise<Credential[]> {
  const body = {
    jsonrpc: "2.0",
    id: "academy-credentials",
    method: "getAssetsByOwner",
    params: {
      ownerAddress: owner,
      page: 1,
      limit: 10,
      displayOptions: {
        showCollectionMetadata: true,
        showUnverifiedCollections: true, // required on devnet — Core assets may be unverified
        showFungible: false, // exclude Token-2022 XP token from results
        showNativeBalance: false,
      },
    },
  };

  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) return [];

  const json = (await res.json()) as DasResponse;
  const items = json.result?.items ?? [];

  return items
    .filter((asset) =>
      asset.grouping?.some(
        (g) =>
          g.group_key === "collection" && g.group_value === TRACK_COLLECTION,
      ),
    )
    .map((asset) => ({
      id: asset.id,
      name: asset.content?.metadata?.name ?? "Academy Credential",
      // Image priority: links.image → metadata.image → files[0].uri
      image:
        asset.content?.links?.image ??
        asset.content?.metadata?.image ??
        asset.content?.files?.[0]?.uri ??
        null,
      attributes: asset.content?.metadata?.attributes ?? [],
      explorerUrl: `https://explorer.solana.com/address/${asset.id}?cluster=devnet`,
      isStub: false,
    }));
}

function buildStubCredential(
  _wallet: string,
  courseId: string,
  credentialId: string,
): Credential {
  return {
    id: credentialId,
    name: `${courseId} Credential`,
    image: null,
    attributes: [
      { trait_type: "track", value: courseId },
      { trait_type: "source", value: "stub" },
    ],
    explorerUrl: "#",
    isStub: true,
  };
}

export function useCredentials(courseId?: string) {
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58() ?? null;
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL ?? "";

  return useQuery<Credential[]>({
    queryKey: ["credentials", wallet],
    queryFn: async () => {
      if (!wallet) return [];

      // Fetch on-chain credentials via Helius DAS
      const onchain = rpcUrl ? await fetchCredentials(wallet, rpcUrl) : [];

      // In stub mode, supplement with local credentials if no on-chain match
      const stubCreds: Credential[] = [];
      if (courseId) {
        const localId = getStubCredential(wallet, courseId);
        if (localId && !onchain.some((c) => c.id === localId)) {
          stubCreds.push(buildStubCredential(wallet, courseId, localId));
        }
      } else {
        // Profile page: scan localStorage for any stub credentials
        if (typeof window !== "undefined") {
          const prefix = `academy:stub:devnet:${wallet}:`;
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(prefix) && key.endsWith(":credential")) {
              const id = localStorage.getItem(key);
              const cId = key.slice(prefix.length).replace(/:credential$/, "");
              if (id && !onchain.some((c) => c.id === id)) {
                stubCreds.push(buildStubCredential(wallet, cId, id));
              }
            }
          }
        }
      }

      return [...onchain, ...stubCreds];
    },
    staleTime: 60 * 1000,
    enabled: !!wallet,
  });
}
