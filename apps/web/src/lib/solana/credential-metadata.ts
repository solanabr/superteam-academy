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
    // Drop a whole code point, not a UTF-16 code unit — slicing a code unit
    // would orphan a surrogate half and emit a U+FFFD replacement char.
    name = Array.from(name).slice(0, -1).join("");
  }
  return name;
}
