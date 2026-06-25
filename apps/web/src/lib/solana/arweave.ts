/**
 * Permanent metadata storage on Arweave via Irys (Bundlr).
 *
 * Credential metadata that backs a Metaplex Core asset URI must outlive the
 * app: if the frontend is ever offline, an issued credential still has to
 * resolve. Serving it from `/api/certificates/metadata` couples the on-chain
 * asset to app uptime. Uploading the JSON to Arweave and pointing the asset
 * URI at the immutable gateway URL removes that coupling.
 *
 * Uploads go through the UMI Irys uploader (already in the dependency tree via
 * `@metaplex-foundation/umi`). Irys settles the data on Arweave and returns a
 * permanent gateway URL.
 *
 * Funding model: Irys here is funded with a **Solana keypair** (Irys's Solana
 * currency), NOT a raw Arweave JWK. The keypair is read from
 * `ARWEAVE_UPLOADER_SECRET` (64-element JSON array of secret-key bytes — same
 * shape as `BACKEND_SIGNER_SECRET`). The human funds that wallet:
 *   - devnet  → free, but data is NOT permanent (Irys devnet prunes after ~60d)
 *   - mainnet → permanent, paid in SOL from the uploader wallet's Irys balance
 *
 * If `ARWEAVE_UPLOADER_SECRET` is absent, `uploadCertificateMetadata` returns
 * `null` so the caller can fall back to the app-served metadata URL. Mint must
 * keep working before Arweave is provisioned — this never hard-crashes.
 *
 * This module MUST ONLY be imported from API routes (server-side).
 */
import "server-only";

import { Keypair } from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { keypairIdentity } from "@metaplex-foundation/umi";
import { fromWeb3JsKeypair } from "@metaplex-foundation/umi-web3js-adapters";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { serverEnv } from "@/lib/env.server";

// Irys node URLs. Devnet uploads are free (funded with devnet SOL) but are
// pruned after ~60 days — only mainnet gives true permanence.
const IRYS_MAINNET_NODE = "https://uploader.irys.xyz";
const IRYS_DEVNET_NODE = "https://devnet.irys.xyz";

let _uploaderMissingWarned = false;

/**
 * Loads the Solana keypair that funds Irys uploads, or `null` if unset.
 * A malformed value throws (a misconfigured secret should fail loudly), but an
 * absent value is a supported state (pre-Arweave-setup fallback).
 */
function getUploaderKeypair(): Keypair | null {
  const secret = process.env.ARWEAVE_UPLOADER_SECRET;
  if (!secret) return null;

  const parsed: unknown = JSON.parse(secret);
  if (!Array.isArray(parsed) || parsed.length !== 64) {
    throw new Error("ARWEAVE_UPLOADER_SECRET must be a 64-element JSON array");
  }
  return Keypair.fromSecretKey(Uint8Array.from(parsed as number[]));
}

/**
 * Uploads credential metadata JSON to Arweave via Irys and returns the
 * permanent gateway URL (e.g. `https://arweave.net/<txid>`).
 *
 * Returns `null` when `ARWEAVE_UPLOADER_SECRET` is unset OR the upload fails,
 * signalling the caller to fall back to the app-served metadata URL. Never
 * throws on upload failure — pinning is best-effort so a transient Irys outage
 * (or an unfunded wallet) does not block minting.
 */
export async function uploadCertificateMetadata(
  metadata: Record<string, unknown>
): Promise<string | null> {
  const keypair = getUploaderKeypair();
  if (!keypair) {
    if (!_uploaderMissingWarned) {
      console.warn(
        "[arweave] ARWEAVE_UPLOADER_SECRET not set — credential metadata will " +
          "be served from the app (/api/certificates/metadata) instead of " +
          "Arweave. Issued credentials will NOT resolve if the app is offline. " +
          "Set ARWEAVE_UPLOADER_SECRET (a funded Irys/Solana keypair) before mainnet."
      );
      _uploaderMissingWarned = true;
    }
    return null;
  }

  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet";
  const irysNode =
    network === "mainnet-beta" ? IRYS_MAINNET_NODE : IRYS_DEVNET_NODE;

  try {
    const umi = createUmi(serverEnv.SOLANA_RPC_URL)
      .use(keypairIdentity(fromWeb3JsKeypair(keypair)))
      .use(irysUploader({ address: irysNode }));

    // uploadJson serializes the object, uploads it, and returns the permanent
    // gateway URL for the resulting Arweave transaction.
    const uri = await umi.uploader.uploadJson(metadata);
    return uri;
  } catch (err) {
    console.error(
      "[arweave] Irys upload failed — falling back to app-served metadata.",
      err instanceof Error ? err.message : String(err)
    );
    return null;
  }
}
