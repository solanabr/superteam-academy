/**
 * @deprecated This module is replaced by POST /api/credentials/issue.
 * The new flow uses the on-chain issueCredential instruction (Metaplex Core)
 * instead of client-side mpl-token-metadata minting.
 * Remove this file after the on-chain credential flow is verified.
 */

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createNft,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import { generateSigner, percentAmount } from "@metaplex-foundation/umi";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import {
  clusterApiUrl,
  PublicKey,
  type Transaction,
  type VersionedTransaction,
} from "@solana/web3.js";

export interface CertificateMetadata {
  courseId: string;
  courseName: string;
  recipientName: string;
  completionDate: string;
  imageUrl: string;
}

export interface MintResult {
  mintAddress: string;
  signature: string;
  metadataUri: string;
}

export type MintError =
  | { type: "INSUFFICIENT_SOL"; message: string }
  | { type: "USER_REJECTED"; message: string }
  | { type: "NETWORK_ERROR"; message: string }
  | { type: "UNKNOWN"; message: string };

type WalletAdapterLike = {
  publicKey: PublicKey | null;
  signMessage?: (message: Uint8Array) => Promise<Uint8Array>;
  signTransaction?: <T extends Transaction | VersionedTransaction>(
    transaction: T
  ) => Promise<T>;
  signAllTransactions?: <T extends Transaction | VersionedTransaction>(
    transactions: T[]
  ) => Promise<T[]>;
};

function createMetadataJson(
  metadata: CertificateMetadata,
  recipientWallet: string
): Record<string, unknown> {
  return {
    name: `Superteam LMS: ${metadata.courseName}`,
    symbol: "STLMS",
    description: `Certificate of completion for ${metadata.courseName}, awarded to ${metadata.recipientName}.`,
    image: metadata.imageUrl || "",
    attributes: [
      { trait_type: "Course", value: metadata.courseName },
      { trait_type: "Completion Date", value: metadata.completionDate },
      { trait_type: "Recipient", value: metadata.recipientName },
      { trait_type: "Platform", value: "Superteam LMS" },
    ],
    properties: {
      category: "certificate",
      creators: [],
    },
    external_url: `https://superteam-lms.vercel.app/certificates`,
    seller_fee_basis_points: 0,
    recipient_wallet: recipientWallet,
  };
}

function getExplorerUrl(address: string, network: string): string {
  const base = "https://explorer.solana.com";
  const cluster = network === "mainnet-beta" ? "" : `?cluster=${network}`;
  return `${base}/address/${address}${cluster}`;
}

export async function mintCertificateNFT(params: {
  wallet: WalletAdapterLike;
  metadataUri: string;
  nftName: string;
}): Promise<MintResult> {
  const { wallet, metadataUri, nftName } = params;

  if (!wallet.publicKey) {
    const error: MintError = {
      type: "UNKNOWN",
      message: "Wallet not connected.",
    };
    throw error;
  }

  const endpoint =
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? clusterApiUrl("devnet");

  // Create UMI instance with Metaplex Token Metadata plugin
  const umi = createUmi(endpoint)
    .use(mplTokenMetadata())
    .use(walletAdapterIdentity(wallet));

  // Check wallet balance — minting requires ~0.015 SOL for rent + fees
  const balance = await umi.rpc.getBalance(umi.identity.publicKey);
  const requiredLamports = BigInt(15_000_000); // ~0.015 SOL

  if (balance.basisPoints < requiredLamports) {
    const solBalance = Number(balance.basisPoints) / 1e9;
    const error: MintError = {
      type: "INSUFFICIENT_SOL",
      message: `Insufficient SOL. Need at least 0.015 SOL, have ${solBalance.toFixed(4)} SOL.`,
    };
    throw error;
  }

  try {
    const mint = generateSigner(umi);

    const result = await createNft(umi, {
      mint,
      name: nftName.length > 32 ? nftName.slice(0, 32) : nftName,
      symbol: "STLMS",
      uri: metadataUri,
      sellerFeeBasisPoints: percentAmount(0),
    }).sendAndConfirm(umi);

    const signature = Buffer.from(result.signature).toString("base64");

    return {
      mintAddress: mint.publicKey.toString(),
      signature,
      metadataUri,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";

    if (
      message.includes("User rejected") ||
      message.includes("rejected the request")
    ) {
      const error: MintError = {
        type: "USER_REJECTED",
        message: "Transaction was rejected by the user.",
      };
      throw error;
    }

    if (
      message.includes("network") ||
      message.includes("timeout") ||
      message.includes("fetch") ||
      message.includes("503") ||
      message.includes("429")
    ) {
      const error: MintError = {
        type: "NETWORK_ERROR",
        message: `Network error: ${message}`,
      };
      throw error;
    }

    const error: MintError = {
      type: "UNKNOWN",
      message,
    };
    throw error;
  }
}

export { getExplorerUrl, createMetadataJson };
