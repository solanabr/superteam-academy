/**
 * Credential metadata helpers (pure — safe to unit test and reuse).
 */

/**
 * Build the on-chain credential name for a course, capped to 32 UTF-8 bytes
 * (the Metaplex Core name limit). Truncates by character until the encoded
 * byte length fits, so multi-byte course titles never overflow the field.
 */
export function capCredentialName(courseName: string): string {
  let name = `Superteam Academy: ${courseName}`;
  const encoder = new TextEncoder();
  while (encoder.encode(name).length > 32) {
    name = name.slice(0, -1);
  }
  return name;
}
