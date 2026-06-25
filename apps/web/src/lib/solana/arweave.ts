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
 * If `ARWEAVE_UPLOADER_SECRET` is absent OR malformed,
 * `uploadCertificateMetadata` returns `null` so the caller can fall back to the
 * app-served metadata URL. Mint must keep working before Arweave is provisioned
 * — this never hard-crashes (a misconfigured secret degrades gracefully, it
 * does not 500 the mint or leave an orphaned `nft_metadata` row).
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

/**
 * Loads the Solana keypair that funds Irys uploads.
 *
 * Returns `null` for BOTH the absent and the malformed case, and NEVER throws.
 * The only caller (`uploadCertificateMetadata`) treats `null` as "fall back to
 * the app-served metadata URL", so neither state may escape as an exception:
 *   - absent    → supported pre-Arweave-setup state
 *   - malformed → a misconfiguration (not JSON, or not a 64-byte secret key).
 *     We log it loudly (`console.error`) but still degrade gracefully rather
 *     than letting the throw propagate to the mint route, which would 500 the
 *     mint AND orphan the already-inserted `nft_metadata` row.
 */
function getUploaderKeypair(): Keypair | null {
  const secret = process.env.ARWEAVE_UPLOADER_SECRET;
  if (!secret) return null;

  try {
    const parsed: unknown = JSON.parse(secret);
    if (!Array.isArray(parsed) || parsed.length !== 64) {
      throw new Error("must be a 64-element JSON array of secret-key bytes");
    }
    return Keypair.fromSecretKey(Uint8Array.from(parsed as number[]));
  } catch (err) {
    console.error(
      "[arweave] ARWEAVE_UPLOADER_SECRET is set but malformed — credential " +
        "metadata will fall back to the app-served URL " +
        "(/api/certificates/metadata) instead of Arweave. Fix the secret (a " +
        "64-element JSON array of Solana secret-key bytes) before mainnet.",
      err instanceof Error ? err.message : String(err)
    );
    return null;
  }
}

/**
 * Uploads credential metadata JSON to Arweave via Irys and returns the
 * permanent gateway URL (e.g. `https://arweave.net/<txid>`).
 *
 * Returns `null` when `ARWEAVE_UPLOADER_SECRET` is unset or malformed, OR the
 * upload fails — signalling the caller to fall back to the app-served metadata
 * URL. NEVER throws: pinning is best-effort, so a misconfigured secret, a
 * transient Irys outage, or an unfunded wallet does not block minting (and does
 * not leave an orphaned `nft_metadata` row from a half-completed mint).
 */
export async function uploadCertificateMetadata(
  metadata: Record<string, unknown>
): Promise<string | null> {
  // `getUploaderKeypair` already logs the malformed case. A missing keypair
  // here means either unset or malformed; in both cases the caller falls back
  // to the app-served URL. (Serverless cold starts reset module state, so we do
  // not deduplicate this warning — it is cheap and useful on each invocation.)
  const keypair = getUploaderKeypair();
  if (!keypair) {
    if (!process.env.ARWEAVE_UPLOADER_SECRET) {
      console.warn(
        "[arweave] ARWEAVE_UPLOADER_SECRET not set — credential metadata will " +
          "be served from the app (/api/certificates/metadata) instead of " +
          "Arweave. Issued credentials will NOT resolve if the app is offline. " +
          "Set ARWEAVE_UPLOADER_SECRET (a funded Irys/Solana keypair) before mainnet."
      );
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
