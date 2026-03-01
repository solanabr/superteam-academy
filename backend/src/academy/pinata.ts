const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_GATEWAY = process.env.PINATA_GATEWAY?.trim();
const PINATA_JSON_URL = "https://api.pinata.cloud/pinning/pinJSONToIPFS";
const PINATA_FILE_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";
const GATEWAY_BASE = PINATA_GATEWAY
  ? `https://${PINATA_GATEWAY.replace(/^https?:\/\//, "").replace(/\/ipfs\/?$/, "")}/ipfs`
  : "https://gateway.pinata.cloud/ipfs";

export async function uploadImageToPinata(
  fileBuffer: Buffer,
  fileName: string
): Promise<string | null> {
  if (!PINATA_JWT?.trim()) return null;
  try {
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(fileBuffer)]), fileName);
    form.append("pinataMetadata", JSON.stringify({ name: fileName }));
    form.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));
    const res = await fetch(PINATA_FILE_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${PINATA_JWT}` },
      body: form,
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("Pinata pinFileToIPFS failed:", res.status, text);
      return null;
    }
    const data = (await res.json()) as { IpfsHash?: string };
    const cid = data.IpfsHash;
    if (!cid) return null;
    return `${GATEWAY_BASE}/${cid}`;
  } catch (err) {
    console.error("Pinata image upload error:", err);
    return null;
  }
}

export async function uploadCredentialMetadataToPinata(
  pinataContent: Record<string, unknown>,
  metadataName: string
): Promise<string | null> {
  if (!PINATA_JWT?.trim()) return null;

  try {
    const body = {
      pinataContent,
      pinataMetadata: { name: metadataName },
      pinataOptions: { cidVersion: 1 },
    };
    const res = await fetch(PINATA_JSON_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("Pinata pinJSONToIPFS failed:", res.status, text);
      return null;
    }
    const data = (await res.json()) as { IpfsHash?: string };
    const cid = data.IpfsHash;
    if (!cid) return null;
    return `${GATEWAY_BASE}/${cid}`;
  } catch (err) {
    console.error("Pinata upload error:", err);
    return null;
  }
}
