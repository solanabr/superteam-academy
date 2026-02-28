import Irys from "@irys/sdk";
import { getBackendSigner } from "@/lib/solana/backend-signer";

let irysInstance: InstanceType<typeof Irys> | null = null;

async function getIrys(): Promise<InstanceType<typeof Irys>> {
  if (irysInstance) return irysInstance;

  const keypair = getBackendSigner();
  const network = process.env.IRYS_NETWORK || "devnet";

  irysInstance = new Irys({
    network,
    token: "solana",
    key: keypair.secretKey,
    config: {
      providerUrl:
        process.env.NEXT_PUBLIC_RPC_ENDPOINT || "https://api.devnet.solana.com",
    },
  });

  return irysInstance;
}

export interface UploadResult {
  txId: string;
  url: string;
}

/**
 * Upload a JSON object to Arweave via Irys.
 * Returns the Arweave TX ID and gateway URL.
 */
export async function uploadJson(
  data: unknown,
  tags?: { name: string; value: string }[],
): Promise<UploadResult> {
  const irys = await getIrys();

  const defaultTags = [{ name: "Content-Type", value: "application/json" }];
  const allTags = [...defaultTags, ...(tags ?? [])];

  const receipt = await irys.upload(JSON.stringify(data), { tags: allTags });

  console.log(`[arweave] uploaded ${receipt.id} (${receipt.size} bytes)`);

  return {
    txId: receipt.id,
    url: arweaveUrl(receipt.id),
  };
}

/**
 * Convert a 43-char base64url Arweave TX ID to a 32-byte array
 * for on-chain storage in the `content_tx_id` field.
 */
export function txIdToBytes(txId: string): number[] {
  // Arweave TX IDs are 43-char base64url (256 bits = 32 bytes)
  const base64 = txId.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "="; // 43 chars + 1 pad = 44 (valid base64 for 32 bytes)
  const buf = Buffer.from(padded, "base64");
  return Array.from(buf.subarray(0, 32));
}

/**
 * Convert a 32-byte array back to an Arweave TX ID.
 * Returns null if the bytes are all zeros.
 */
export function bytesToTxId(bytes: number[] | Uint8Array): string | null {
  const arr = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes);
  if (arr.every((b) => b === 0)) return null;
  const base64 = Buffer.from(arr).toString("base64");
  // Remove trailing '=' and convert to base64url
  return base64.replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

/**
 * Returns the Arweave gateway URL for a given TX ID.
 */
export function arweaveUrl(txId: string): string {
  return `https://arweave.net/${txId}`;
}
