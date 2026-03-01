"use client";

import { useQuery } from "@tanstack/react-query";

export interface CredentialCollectionListItem {
  trackId: number;
  collectionAddress: string;
  name: string | null;
  imageUrl: string | null;
  metadataUri: string | null;
}

export function useCredentialCollectionsList() {
  return useQuery({
    queryKey: ["credential-collections-list"],
    queryFn: async (): Promise<CredentialCollectionListItem[]> => {
      const r = await fetch("/api/credential-collections", { cache: "no-store" });
      const data = (await r.json()) as { list?: CredentialCollectionListItem[] };
      return data.list ?? [];
    },
  });
}

/** Map trackId -> collection imageUrl for CredentialImage fallback */
export function useTrackImageMap(): Record<number, string> {
  const { data: list } = useCredentialCollectionsList();
  if (!list?.length) return {};
  const map: Record<number, string> = {};
  for (const row of list) {
    if (row.imageUrl) map[row.trackId] = row.imageUrl;
  }
  return map;
}
