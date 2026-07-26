/**
 * Credential metadata helpers (LX-E5).
 *
 * #497 stamps the live on-chain `Course.version` into the credential NFT
 * metadata at mint time as the "Course Version" attribute
 * (app/api/certificates/mint/route.ts). It is NOT a `certificates` table
 * column — the only place it lives off-chain is the metadata JSON (Arweave
 * gateway URL or the app-served /api/certificates/metadata fallback), so the
 * verify page reads it back from the credential's `metadata_uri`.
 *
 * Credentials minted before #497 have no such attribute; every reader here is
 * absent-safe and resolves to `null` rather than throwing.
 */

const COURSE_VERSION_TRAIT = "Course Version";

interface MetadataAttribute {
  trait_type: string;
  value: unknown;
}

function isMetadataAttribute(entry: unknown): entry is MetadataAttribute {
  return (
    typeof entry === "object" &&
    entry !== null &&
    "trait_type" in entry &&
    typeof (entry as { trait_type: unknown }).trait_type === "string"
  );
}

/**
 * Extracts the stamped course version from credential metadata JSON.
 * Returns `null` for pre-#497 credentials or malformed metadata.
 */
export function extractCourseVersion(metadata: unknown): number | null {
  if (typeof metadata !== "object" || metadata === null) return null;
  const { attributes } = metadata as { attributes?: unknown };
  if (!Array.isArray(attributes)) return null;

  const attribute = attributes
    .filter(isMetadataAttribute)
    .find((entry) => entry.trait_type === COURSE_VERSION_TRAIT);
  if (!attribute) return null;

  const { value } = attribute;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  // Defensive: tolerate a stringified number in externally pinned JSON.
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  return null;
}

/**
 * Fetches the credential metadata JSON and extracts the course version.
 * Best-effort by design: any network/CORS/parse failure yields `null` so the
 * verify page simply omits the row (absent-safe for legacy credentials and
 * unreachable gateways alike).
 */
export async function fetchCourseVersion(
  metadataUri: string
): Promise<number | null> {
  if (!metadataUri) return null;
  try {
    // Bounded so a slow Arweave gateway can only delay the page, not hang it.
    const signal =
      typeof AbortSignal.timeout === "function"
        ? AbortSignal.timeout(5_000)
        : undefined;
    const response = await fetch(metadataUri, { signal });
    if (!response.ok) return null;
    const metadata: unknown = await response.json();
    return extractCourseVersion(metadata);
  } catch {
    return null;
  }
}
