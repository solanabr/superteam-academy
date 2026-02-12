"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import {
  CheckCircle,
  ArrowCounterClockwise,
  Wallet,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  mintCertificateNFT,
  getExplorerUrl,
  createMetadataJson,
  type CertificateMetadata,
  type MintResult,
  type MintError,
} from "@/lib/solana/mint-certificate";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { trackEvent, captureError } from "@/lib/analytics";

type MintState =
  | { status: "idle" }
  | { status: "minting" }
  | { status: "success"; result: MintResult }
  | { status: "error"; error: MintError };

interface MintButtonProps {
  metadata: CertificateMetadata;
  alreadyMinted?: boolean;
  onSuccess?: (result: MintResult) => void;
  className?: string;
}

export function MintButton({
  metadata,
  alreadyMinted = false,
  onSuccess,
  className,
}: MintButtonProps) {
  const t = useTranslations("certificates");
  const tAuth = useTranslations("auth");
  const wallet = useWallet();
  const { setVisible: openWalletModal } = useWalletModal();
  const [state, setState] = useState<MintState>({ status: "idle" });

  async function handleMint() {
    if (!wallet.publicKey || !wallet.signTransaction) return;

    setState({ status: "minting" });

    try {
      // 1. Build the full Metaplex-spec metadata JSON
      const recipientWallet = wallet.publicKey.toBase58();
      const metadataJson = createMetadataJson(metadata, recipientWallet);

      // 2. Store in nft_metadata table so the URI stays short (<200 bytes)
      const supabase = createClient();
      const { data: row, error: dbError } = await supabase
        .from("nft_metadata")
        .insert({ data: metadataJson })
        .select("id")
        .single();

      if (dbError || !row) {
        throw {
          type: "UNKNOWN",
          message: dbError?.message ?? "Failed to store metadata",
        } as MintError;
      }

      // 3. Build short URI that fits Metaplex's 200-byte limit
      const origin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const metadataUri = `${origin}/api/certificates/metadata?id=${row.id}`;

      // 4. Mint the NFT
      const nftName = `STLMS: ${metadata.courseName}`;
      const result = await mintCertificateNFT({
        wallet: {
          publicKey: wallet.publicKey,
          signTransaction: wallet.signTransaction,
          signAllTransactions: wallet.signAllTransactions ?? undefined,
          signMessage: wallet.signMessage ?? undefined,
        },
        metadataUri,
        nftName,
      });

      setState({ status: "success", result });
      trackEvent("certificate_minted", {
        courseId: metadata.courseId,
        courseName: metadata.courseName,
        mintAddress: result.mintAddress,
      });
      onSuccess?.(result);
    } catch (err: unknown) {
      const mintError = err as MintError;
      const resolvedError = mintError.type
        ? mintError
        : {
            type: "UNKNOWN" as const,
            message: err instanceof Error ? err.message : t("unknownError"),
          };
      setState({ status: "error", error: resolvedError });
      trackEvent("certificate_mint_failed", {
        courseId: metadata.courseId,
        errorType: resolvedError.type,
      });
      if (err instanceof Error) {
        captureError(err, { courseId: metadata.courseId });
      }
    }
  }

  if (alreadyMinted) {
    return (
      <Button variant="secondary" disabled className={cn("gap-2", className)}>
        <CheckCircle size={16} weight="duotone" aria-hidden="true" />
        {t("mintSuccess")}
      </Button>
    );
  }

  if (state.status === "minting") {
    return (
      <Button variant="push" disabled className={cn("gap-2", className)}>
        <div
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
        {t("minting")}
      </Button>
    );
  }

  if (state.status === "success") {
    const explorerUrl = getExplorerUrl(state.result.mintAddress, "devnet");
    return (
      <div className="space-y-2">
        <Button variant="secondary" disabled className={cn("gap-2", className)}>
          <CheckCircle size={16} weight="duotone" aria-hidden="true" />
          {t("mintSuccess")}
        </Button>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-text-3 transition-colors hover:text-text"
        >
          {t("viewOnExplorer")} &rarr;
        </a>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="space-y-2">
        <p className="text-sm text-danger">{state.error.message}</p>
        <Button
          variant="outline"
          onClick={handleMint}
          className={cn("gap-2", className)}
        >
          <ArrowCounterClockwise
            size={16}
            weight="duotone"
            aria-hidden="true"
          />
          {t("mintCertificate")}
        </Button>
      </div>
    );
  }

  // Wallet not connected — prompt user to connect
  if (!wallet.publicKey) {
    return (
      <Button
        variant="push"
        onClick={() => openWalletModal(true)}
        className={cn("gap-2", className)}
      >
        <Wallet size={16} weight="duotone" aria-hidden="true" />
        {tAuth("connectWallet")}
      </Button>
    );
  }

  return (
    <Button
      variant="push"
      onClick={handleMint}
      className={cn("gap-2", className)}
    >
      {t("mintCertificate")}
    </Button>
  );
}
