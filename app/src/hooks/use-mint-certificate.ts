"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { CertificateData } from "@/types/certificate";

function getCertKey(wallet: string, courseSlug: string) {
  return `st-academy:${wallet}:certificate:${courseSlug}`;
}

function getCertListKey(wallet: string) {
  return `st-academy:${wallet}:certificates`;
}

export function useMintCertificate() {
  const { publicKey } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mint = useCallback(
    async (
      courseSlug: string,
      courseTitle: string,
      track?: string,
    ): Promise<CertificateData | null> => {
      const walletAddr = publicKey?.toBase58() ?? "";
      if (!walletAddr) {
        setError("Wallet not connected");
        return null;
      }

      // Check if already minted ON-CHAIN
      const existing = localStorage.getItem(getCertKey(walletAddr, courseSlug));
      if (existing) {
        try {
          const parsed = JSON.parse(existing) as CertificateData;
          if (parsed.isOnChain) return parsed;
        } catch {
          /* continue */
        }
      }

      setLoading(true);
      setError(null);

      let cert: CertificateData;

      try {
        const res = await fetch("/api/mint-certificate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wallet: walletAddr,
            courseSlug,
            courseTitle,
            track,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Mint failed");

        cert = {
          courseSlug,
          courseTitle,
          mintedAt: new Date().toISOString(),
          txSig: data.txSig,
          isOnChain: true,
          track,
        };
      } catch (mintErr) {
        console.error("[mint] cNFT mint failed:", mintErr);
        setError(mintErr instanceof Error ? mintErr.message : String(mintErr));
        cert = {
          courseSlug,
          courseTitle,
          mintedAt: new Date().toISOString(),
          isOnChain: false,
          track,
        };
      }

      // Persist to localStorage
      try {
        localStorage.setItem(
          getCertKey(walletAddr, courseSlug),
          JSON.stringify(cert),
        );
        const listKey = getCertListKey(walletAddr);
        const slugs: string[] = JSON.parse(
          localStorage.getItem(listKey) ?? "[]",
        );
        if (!slugs.includes(courseSlug)) {
          slugs.push(courseSlug);
          localStorage.setItem(listKey, JSON.stringify(slugs));
        }
      } catch {
        /* storage full */
      }

      setLoading(false);
      return cert;
    },
    [publicKey],
  );

  const checkMinted = useCallback(
    (courseSlug: string): boolean => {
      const walletAddr = publicKey?.toBase58() ?? "";
      if (!walletAddr) return false;
      return localStorage.getItem(getCertKey(walletAddr, courseSlug)) !== null;
    },
    [publicKey],
  );

  const getCertificates = useCallback((): CertificateData[] => {
    const walletAddr = publicKey?.toBase58() ?? "";
    if (!walletAddr) return [];

    const certs: CertificateData[] = [];
    try {
      const listKey = getCertListKey(walletAddr);
      const slugs: string[] = JSON.parse(localStorage.getItem(listKey) ?? "[]");
      for (const slug of slugs) {
        const raw = localStorage.getItem(getCertKey(walletAddr, slug));
        if (raw) {
          try {
            certs.push(JSON.parse(raw) as CertificateData);
          } catch {
            /* skip malformed */
          }
        }
      }
    } catch {
      /* */
    }

    return certs;
  }, [publicKey]);

  const getCertificate = useCallback(
    (courseSlug: string): CertificateData | null => {
      const walletAddr = publicKey?.toBase58() ?? "";
      if (!walletAddr) return null;
      try {
        const raw = localStorage.getItem(getCertKey(walletAddr, courseSlug));
        return raw ? (JSON.parse(raw) as CertificateData) : null;
      } catch {
        return null;
      }
    },
    [publicKey],
  );

  return { mint, checkMinted, getCertificates, getCertificate, loading, error };
}
