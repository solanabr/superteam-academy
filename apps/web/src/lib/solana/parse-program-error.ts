import type { Idl } from "@coral-xyz/anchor";

export interface ProgramError {
  code: number;
  name: string;
  msg: string;
}

/**
 * Extract a custom Anchor error code from transaction logs.
 * Anchor custom errors appear as:
 *   "Program <id> failed: custom program error: 0x1770"
 * where 0x1770 = 6000.
 */
export function extractCustomErrorCode(logs: string[]): number | null {
  for (const log of logs) {
    const match = log.match(/custom program error: 0x([0-9a-fA-F]+)/);
    if (match && match[1]) {
      return parseInt(match[1], 16);
    }
  }
  return null;
}

/**
 * Resolve an Anchor error code against an IDL's errors array.
 *
 * - code >= 6000: program-specific error, index = code - 6000
 * - code < 6000: Anchor framework error (not in IDL)
 * - index out of bounds: unknown program error
 */
export function resolveIdlError(code: number, idl: Idl): ProgramError | null {
  if (code < 6000) {
    return {
      code,
      name: "AnchorError",
      msg: `Anchor framework error (code ${code})`,
    };
  }

  const errors = (
    idl as { errors?: { code: number; name: string; msg?: string }[] }
  ).errors;
  if (!errors) {
    return {
      code,
      name: "UnknownError",
      msg: `Unknown program error (code ${code})`,
    };
  }

  const err = errors.find((e) => e.code === code);
  if (!err) {
    return {
      code,
      name: "UnknownError",
      msg: `Unknown program error (code ${code})`,
    };
  }
  return {
    code: err.code,
    name: err.name,
    msg: err.msg ?? err.name,
  };
}
