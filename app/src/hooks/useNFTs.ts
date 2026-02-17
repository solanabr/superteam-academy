"use client";

import { useState, useEffect, useCallback } from "react";

export interface BlockchainCertificate {
  mintAddress: string;
  name: string;
  symbol: string;
  image: string | null;
  metadataUri: string | null;
  isCompressed: boolean;
  createdAt: string | null;
}

interface UseNFTsResult {
  certificates: BlockchainCertificate[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useNFTs(walletAddress: string | undefined): UseNFTsResult {
  const [certificates, setCertificates] = useState<BlockchainCertificate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNFTs = useCallback(async () => {
    if (!walletAddress) {
      setCertificates([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/nfts/${walletAddress}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to fetch NFTs");
      }
      const data = await res.json();
      setCertificates(data.certificates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setCertificates([]);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchNFTs();
  }, [fetchNFTs]);

  return { certificates, isLoading, error, refetch: fetchNFTs };
}
